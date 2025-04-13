import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

/**
 * API สำหรับยอมรับคำเชิญ
 */
export async function POST(req: NextRequest) {
  try {
    // ดึงข้อมูลจาก request body
    const body = await req.json();
    const { token, email, password } = body;
    
    if (!token) {
      return NextResponse.json(
        { error: "กรุณาระบุโทเค็น" },
        { status: 400 }
      );
    }
    
    // ถอดรหัสโทเค็น
    let tokenData;
    try {
      const decryptedToken = await decrypt(token);
      tokenData = JSON.parse(decryptedToken);
    } catch (error) {
      console.error("Error decrypting token:", error);
      return NextResponse.json(
        { error: "โทเค็นไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    
    if (!tokenData?.id || !tokenData?.email) {
      return NextResponse.json(
        { error: "ข้อมูลในโทเค็นไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    
    // ตรวจสอบคำเชิญ
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: tokenData.id,
        email: tokenData.email,
        status: "PENDING",
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });
    
    if (!invitation) {
      return NextResponse.json(
        { error: "ไม่พบคำเชิญที่รอการยืนยัน" },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าคำเชิญหมดอายุหรือไม่
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "คำเชิญหมดอายุแล้ว" },
        { status: 400 }
      );
    }
    
    // ดึงข้อมูลผู้ใช้จากอีเมล
    const user = await prisma.user.findFirst({
      where: { email: tokenData.email.toLowerCase() }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้ที่ตรงกับอีเมลในคำเชิญ" },
        { status: 404 }
      );
    }
    
    // ดำเนินการตามประเภทของคำเชิญ
    switch (invitation.type) {
      case 'EMPLOYEE': {
        // อัปเดตสถานะคำเชิญ
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' }
        });
        
        // ดึงข้อมูลพนักงานจาก data ที่บันทึกไว้
        const invitationData = invitation.data ? JSON.parse(invitation.data) : {};
        
        if (invitationData.employeeId) {
          // อัปเดตสถานะพนักงานเป็น ACTIVE
          await prisma.employee.update({
            where: { id: invitationData.employeeId },
            data: { status: 'ACTIVE' }
          });
        }
        
        // เพิ่มผู้ใช้เป็นสมาชิกของ workspace
        await prisma.workspaceMember.upsert({
          where: {
            workspaceId_userId: {
              workspaceId: invitation.workspaceId,
              userId: user.id,
            },
          },
          update: {
            status: 'ACTIVE',
          },
          create: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
            role: 'MEMBER',
            status: 'ACTIVE',
            invitedBy: null,
          },
        });
        
        break;
      }
      
      case 'EMPLOYEE_NEW': {
        // อัปเดตสถานะคำเชิญ
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' }
        });
        
        // ดึงข้อมูลพนักงานจาก data ที่บันทึกไว้
        const invitationData = invitation.data ? JSON.parse(invitation.data) : {};
        
        if (invitationData.employeeId) {
          // อัปเดตข้อมูลพนักงานให้เชื่อมกับผู้ใช้และเปลี่ยนสถานะเป็น ACTIVE
          await prisma.employee.update({
            where: { id: invitationData.employeeId },
            data: { 
              userId: user.id,
              status: 'ACTIVE'
            }
          });
        }
        
        // อัปเดตสถานะผู้ใช้เป็น ACTIVE
        if (invitationData.userId) {
          await prisma.user.update({
            where: { id: invitationData.userId },
            data: { status: 'ACTIVE' }
          });
        } else {
          // กรณีไม่มี userId ในข้อมูลเชิญ แต่มี user.id
          await prisma.user.update({
            where: { id: user.id },
            data: { status: 'ACTIVE' }
          });
        }
        
        // เพิ่มผู้ใช้เป็นสมาชิกของ workspace
        await prisma.workspaceMember.upsert({
          where: {
            workspaceId_userId: {
              workspaceId: invitation.workspaceId,
              userId: user.id,
            },
          },
          update: {
            status: 'ACTIVE',
          },
          create: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
            role: 'MEMBER',
            status: 'ACTIVE',
            invitedBy: null,
          },
        });
        
        break;
      }
      
      case 'WORKSPACE': {
        // อัปเดตสถานะคำเชิญ
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' }
        });
        
        // เพิ่มผู้ใช้เป็นสมาชิกของ workspace
        await prisma.workspaceMember.upsert({
          where: {
            workspaceId_userId: {
              workspaceId: invitation.workspaceId,
              userId: user.id,
            },
          },
          update: {
            status: 'ACTIVE',
          },
          create: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
            role: 'MEMBER',
            status: 'ACTIVE',
            invitedBy: null,
          },
        });
        
        break;
      }
      
      default: {
        return NextResponse.json(
          { error: "ประเภทคำเชิญไม่ถูกต้อง" },
          { status: 400 }
        );
      }
    }
    
    // ส่งข้อมูลกลับ
    return NextResponse.json({
      success: true,
      message: "ยอมรับคำเชิญสำเร็จ",
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace?.name,
      workspaceSlug: invitation.workspace?.slug,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการยอมรับคำเชิญ" },
      { status: 500 }
    );
  }
} 