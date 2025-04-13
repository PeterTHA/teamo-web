import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcrypt';
import { z } from 'zod';
import { decryptToObject } from '@/lib/crypto';

// ขั้นตอนการตรวจสอบข้อมูลที่ส่งมา
const registerSchema = z.object({
  name: z.string().min(2, { message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร' }),
  email: z.string().email({ message: 'อีเมลไม่ถูกต้อง' }),
  password: z.string().min(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }),
  inviteCode: z.string().optional(),
  inviteToken: z.string().optional(),
});

interface InvitationToken {
  id: string;
  email: string;
  workspaceId: string;
  timestamp: number;
}

/**
 * POST /api/auth/register
 * การลงทะเบียนผู้ใช้ใหม่
 */
export async function POST(req: NextRequest) {
  try {
    // รับข้อมูลจาก request
    const body = await req.json();
    
    // ตรวจสอบข้อมูลด้วย zod
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errorMessage = result.error.errors.map(e => e.message).join(', ');
      return NextResponse.json({ message: `ข้อมูลไม่ถูกต้อง: ${errorMessage}` }, { status: 400 });
    }
    
    const { name, email, password, inviteCode, inviteToken } = result.data;
    
    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json({ message: 'อีเมลนี้มีในระบบแล้ว กรุณาใช้อีเมลอื่น' }, { status: 400 });
    }
    
    // ตรวจสอบคำเชิญถ้ามี inviteToken
    if (inviteToken) {
      try {
        // ถอดรหัส token
        const invitationData = await decryptToObject<InvitationToken>(inviteToken);
        
        // ตรวจสอบว่าอีเมลตรงกับในคำเชิญหรือไม่
        if (invitationData.email !== email) {
          return NextResponse.json(
            { message: 'อีเมลที่ลงทะเบียนไม่ตรงกับอีเมลในคำเชิญ' },
            { status: 400 }
          );
        }
        
        // ตรวจสอบว่า token หมดอายุหรือไม่ (1 ชั่วโมง)
        const tokenAge = Date.now() - invitationData.timestamp;
        if (tokenAge > 60 * 60 * 1000) {
          return NextResponse.json(
            { message: 'คำเชิญหมดอายุแล้ว กรุณาขอคำเชิญใหม่' },
            { status: 400 }
          );
        }
        
        // ค้นหาคำเชิญจากฐานข้อมูล
        const invitation = await prisma.invitation.findFirst({
          where: {
            id: invitationData.id,
            email: invitationData.email,
            status: 'PENDING',
            expiresAt: {
              gt: new Date(),
            },
          },
        });
        
        if (!invitation) {
          return NextResponse.json(
            { message: 'ไม่พบคำเชิญที่ยังไม่หมดอายุ' },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error('Error verifying invitation token:', error);
        return NextResponse.json(
          { message: 'คำเชิญไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' },
          { status: 400 }
        );
      }
    }
    
    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await hash(password, 10);
    
    // สร้างผู้ใช้ใหม่
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',  // ค่าเริ่มต้นเป็น USER
        status: 'ACTIVE',
      },
    });
    
    // ถ้ามี inviteToken ให้ดำเนินการเกี่ยวกับคำเชิญ
    if (inviteToken) {
      try {
        const invitationData = await decryptToObject<InvitationToken>(inviteToken);
        
        // อัปเดตสถานะคำเชิญ
        await prisma.invitation.update({
          where: { id: invitationData.id },
          data: { status: 'ACCEPTED' }
        });
        
        // เพิ่มผู้ใช้เป็นสมาชิกของ workspace
        await prisma.workspaceMember.create({
          data: {
            workspaceId: invitationData.workspaceId,
            userId: newUser.id,
            role: 'MEMBER',
            status: 'ACTIVE',
          },
        });
        
        // บันทึกกิจกรรม
        await prisma.activityLog.create({
          data: {
            userId: newUser.id,
            action: 'REGISTER_FROM_INVITATION',
            entity: 'USER',
            entityId: newUser.id,
            details: JSON.stringify({
              invitationId: invitationData.id,
              email: email,
              workspaceId: invitationData.workspaceId,
            }),
          }
        });
      } catch (error) {
        console.error('Error processing invitation after registration:', error);
        // ไม่คืนค่า error เพราะการลงทะเบียนสำเร็จแล้ว
      }
    } else {
      // บันทึกกิจกรรมการลงทะเบียนปกติ
      await prisma.activityLog.create({
        data: {
          userId: newUser.id,
          action: 'REGISTER',
          entity: 'USER',
          entityId: newUser.id,
          details: JSON.stringify({
            email: email,
          }),
        }
      });
    }
    
    // คืนค่าผลลัพธ์
    return NextResponse.json({ 
      message: 'ลงทะเบียนสำเร็จ',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน' }, { status: 500 });
  }
} 