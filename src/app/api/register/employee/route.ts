import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decryptToObject } from "@/lib/crypto";
import bcrypt from "bcrypt";

/**
 * API สำหรับลงทะเบียนพนักงานใหม่
 */
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ content-type
    const contentType = request.headers.get("content-type");
    if (contentType !== "application/json") {
      return NextResponse.json(
        { error: "Content-Type ต้องเป็น application/json" },
        { status: 400 }
      );
    }

    // ดึงข้อมูลจาก request body
    const body = await request.json();
    const {
      token,
      email,
      workspaceId,
      firstName,
      lastName,
      positionId,
      departmentId,
      phone,
      password,
    } = body;

    if (!workspaceId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    // ถอดรหัส token เพื่อตรวจสอบความถูกต้อง
    try {
      let tokenData;
      if (token) {
        tokenData = await decryptToObject(token);
        
        // ตรวจสอบความถูกต้องของ token
        if (tokenData.email !== email || tokenData.workspaceId !== workspaceId) {
          return NextResponse.json(
            { error: "ข้อมูลไม่ตรงกับคำเชิญ" },
            { status: 400 }
          );
        }
      }
    } catch (tokenError) {
      console.error("Error decrypting token:", tokenError);
      // ไม่ return error เพราะผู้ใช้อาจไม่มี token
    }

    // ตรวจสอบว่า workspace มีอยู่จริงหรือไม่
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "ไม่พบ workspace ที่ระบุ" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามีผู้ใช้ที่ใช้อีเมลนี้แล้วหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    let userId;

    // ถ้ามีผู้ใช้อยู่แล้ว
    if (existingUser) {
      userId = existingUser.id;
    } 
    // ถ้ายังไม่มีผู้ใช้และมีการกำหนดรหัสผ่าน
    else if (password) {
      // สร้างผู้ใช้ใหม่
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          emailVerified: new Date(),
        },
      });
      
      userId = newUser.id;
    } else {
      // ถ้าไม่มีรหัสผ่านและไม่พบผู้ใช้
      return NextResponse.json(
        { error: "กรุณากำหนดรหัสผ่านเพื่อสร้างบัญชีผู้ใช้ใหม่" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของ workspace หรือไม่
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    // ถ้ายังไม่เป็นสมาชิก ให้เพิ่มเป็นสมาชิก
    if (!existingMember) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });
    }

    // ตรวจสอบว่ามีข้อมูลพนักงานแล้วหรือไม่
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        workspaceId,
        email,
      },
    });

    let employee;

    // ถ้ามีข้อมูลพนักงานแล้ว ให้อัปเดต
    if (existingEmployee) {
      employee = await prisma.employee.update({
        where: { id: existingEmployee.id },
        data: {
          firstName,
          lastName,
          positionId,
          departmentId,
          phone,
          userId,
        },
      });
    } 
    // ถ้ายังไม่มีข้อมูลพนักงาน ให้สร้างใหม่
    else {
      employee = await prisma.employee.create({
        data: {
          workspaceId,
          userId,
          email,
          firstName,
          lastName,
          positionId,
          departmentId,
          phone,
          hireDate: new Date(),
          status: 'ACTIVE',
        },
      });
    }

    // สร้างข้อมูลตอบกลับ
    return NextResponse.json({
      success: true,
      employee,
      workspaceSlug: workspace.slug,
    });
  } catch (error) {
    console.error("Error in register/employee API:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดำเนินการ" },
      { status: 500 }
    );
  }
} 