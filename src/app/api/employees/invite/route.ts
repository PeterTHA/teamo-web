import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { generateInviteCode, generateTemporaryPassword, sendEmployeeAccountEmail, sendInvitationEmail } from "@/lib/email";
import { hash } from "bcrypt";
import { createSecureURL } from "@/lib/crypto";

/**
 * POST /api/employees/invite
 * เชิญพนักงานเข้าร่วม workspace โดยส่งอีเมลเชิญที่มีรหัสเชิญ
 */
export async function POST(req: NextRequest) {
  try {
    // ตรวจสอบว่าผู้ใช้ลงชื่อเข้าใช้หรือไม่
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาลงชื่อเข้าใช้ก่อน" },
        { status: 401 }
      );
    }
    
    // ดึงข้อมูลจาก request body
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      workspaceSlug = "demo-corp", // ค่าเริ่มต้น
      hireDate,
      employeeCode
    } = body;
    
    // ตรวจสอบข้อมูลขั้นต่ำ
    if (!firstName || !lastName || !email || !position || !department) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }
    
    // ค้นหา workspace จาก slug
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: "ไม่พบ workspace ที่ระบุ" },
        { status: 404 }
      );
    }
    
    // ค้นหาตำแหน่งงาน
    const positionRecord = await prisma.position.findFirst({
      where: {
        workspaceId: workspace.id,
        OR: [
          { name: position },
          { code: position }
        ]
      }
    });
    
    if (!positionRecord) {
      return NextResponse.json(
        { error: "ไม่พบตำแหน่งงานที่ระบุ" },
        { status: 404 }
      );
    }
    
    // ค้นหาแผนก
    const departmentRecord = await prisma.department.findFirst({
      where: {
        workspaceId: workspace.id,
        OR: [
          { name: department },
          { code: department }
        ]
      }
    });
    
    if (!departmentRecord) {
      return NextResponse.json(
        { error: "ไม่พบแผนกที่ระบุ" },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    // สร้างรหัสเชิญสำหรับส่งอีเมล
    const inviteCode = generateInviteCode();
    const hashedInviteCode = await hash(inviteCode, 10);
    
    // สร้างวันที่จ้างงาน
    const parsedHireDate = hireDate ? new Date(hireDate) : new Date();
    
    // ดำเนินการตามกรณี
    if (existingUser) {
      // กรณีมีผู้ใช้อยู่แล้ว ให้ตรวจสอบว่าเป็นพนักงานใน workspace นี้หรือไม่
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          userId: existingUser.id,
          workspaceId: workspace.id
        }
      });
      
      if (existingEmployee) {
        return NextResponse.json(
          { error: "พนักงานนี้เป็นสมาชิกของ workspace นี้อยู่แล้ว" },
          { status: 400 }
        );
      }
      
      // สร้างพนักงานใหม่และเชื่อมกับผู้ใช้ที่มีอยู่
      const newEmployee = await prisma.employee.create({
        data: {
          workspaceId: workspace.id,
          userId: existingUser.id,
          employeeCode,
          firstName,
          lastName,
          email,
          phone,
          hireDate: parsedHireDate,
          positionId: positionRecord.id,
          departmentId: departmentRecord.id,
          status: "PENDING"  // พนักงานที่รอการยืนยัน
        }
      });
      
      // สร้างข้อมูลเชิญ
      await prisma.invitation.create({
        data: {
          workspaceId: workspace.id,
          email,
          code: hashedInviteCode,
          type: "EMPLOYEE",
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // หมดอายุใน 7 วัน
          data: JSON.stringify({
            employeeId: newEmployee.id,
            userId: existingUser.id
          })
        }
      });
      
      // สร้าง URL เข้ารหัสสำหรับส่งในอีเมล
      const secureInviteURL = await createSecureURL('/invite', {
        code: inviteCode,
        email: email,
        token: inviteCode // เพิ่ม token เพื่อใช้ในการยืนยันเพิ่มเติม
      });
      
      // ส่งอีเมลเชิญ
      await sendInvitationEmail({
        to: email,
        name: `${firstName} ${lastName}`,
        workspace: workspace.name,
        inviteCode
      });
      
      return NextResponse.json({
        success: true,
        message: "เชิญพนักงานเข้าร่วม workspace สำเร็จ",
        employee: newEmployee
      });
      
    } else {
      // กรณีไม่มีผู้ใช้ ให้สร้างผู้ใช้ใหม่พร้อมรหัสผ่านชั่วคราว
      // สร้างรหัสผ่านชั่วคราว
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await hash(temporaryPassword, 10);
      
      // สร้างผู้ใช้ใหม่สถานะ PENDING
      const newUser = await prisma.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
          status: "PENDING",  // ผู้ใช้ที่รอการยืนยัน
        }
      });
      
      // สร้างพนักงานใหม่ที่เชื่อมโยงกับผู้ใช้ที่สร้างใหม่
      const newEmployee = await prisma.employee.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
          employeeCode,
          firstName,
          lastName,
          email,
          phone,
          hireDate: parsedHireDate,
          positionId: positionRecord.id,
          departmentId: departmentRecord.id,
          status: "PENDING"  // พนักงานที่รอการยืนยัน
        }
      });
      
      // สร้างข้อมูลเชิญ
      await prisma.invitation.create({
        data: {
          workspaceId: workspace.id,
          email,
          code: hashedInviteCode,
          type: "EMPLOYEE_NEW",
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // หมดอายุใน 7 วัน
          data: JSON.stringify({
            employeeId: newEmployee.id,
            userId: newUser.id
          })
        }
      });
      
      // สร้าง URL เข้ารหัสสำหรับส่งในอีเมล
      const secureInviteURL = await createSecureURL('/invite', {
        code: inviteCode,
        email: email,
        token: inviteCode // เพิ่ม token เพื่อใช้ในการยืนยันเพิ่มเติม
      });
      
      // ส่งอีเมลข้อมูลบัญชีพนักงานพร้อมรหัสผ่านชั่วคราว
      await sendEmployeeAccountEmail({
        to: email,
        firstName,
        lastName,
        workspace: workspace.name,
        inviteCode,
        temporaryPassword
      });
      
      return NextResponse.json({
        success: true,
        message: "เพิ่มพนักงานใหม่และเชิญเข้าร่วม workspace สำเร็จ",
        employee: newEmployee
      });
    }
  } catch (error) {
    console.error("Error inviting employee:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเชิญพนักงาน" },
      { status: 500 }
    );
  }
} 