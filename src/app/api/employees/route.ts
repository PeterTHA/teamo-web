import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { logActivity } from "@/utils/activity-logger";
import { getToken } from "next-auth/jwt";

/**
 * GET /api/employees
 * ดึงข้อมูลพนักงานทั้งหมดในองค์กร โดยกรองตามแผนก (department) และคำค้นหา (search)
 */
export async function GET(req: NextRequest) {
  try {
    // ตรวจสอบว่าผู้ใช้ลงชื่อเข้าใช้หรือไม่
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาลงชื่อเข้าใช้ก่อน" },
        { status: 401 }
      );
    }
    
    // ดึงพารามิเตอร์จาก URL
    const searchParams = req.nextUrl.searchParams;
    const department = searchParams.get("department");
    const search = searchParams.get("search");
    const workspaceSlug = searchParams.get("workspace") || "demo-corp";
    
    // ค้นหา workspace จาก slug
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: { id: true }
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: "ไม่พบ workspace ที่ระบุ" },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของ workspace นี้หรือไม่
    const isMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workspace.id,
        status: "ACTIVE"
      }
    });
    
    if (!isMember) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลของ workspace นี้" },
        { status: 403 }
      );
    }
    
    // สร้างเงื่อนไขสำหรับการค้นหา
    let whereCondition: any = {
      workspaceId: workspace.id
    };
    
    // เพิ่มเงื่อนไขค้นหาตามแผนก
    if (department) {
      whereCondition.department = {
        name: department
      };
    }
    
    // เพิ่มเงื่อนไขค้นหาตามข้อความ
    if (search) {
      whereCondition.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } }
      ];
    }
    
    // ดึงข้อมูลพนักงาน
    const employees = await prisma.employee.findMany({
      where: whereCondition,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeCode: true,
        status: true,
        position: {
          select: {
            name: true
          }
        },
        department: {
          select: {
            name: true
          }
        }
      },
      orderBy: { firstName: "asc" }
    });
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
    const formattedEmployees = employees.map(employee => ({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position?.name || "ไม่ระบุ",
      department: employee.department?.name || "ไม่ระบุ",
      email: employee.email,
      status: employee.status,
      employeeCode: employee.employeeCode || "-"
    }));
    
    return NextResponse.json(formattedEmployees);
    
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน" },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create new employee
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = token.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace selected" }, { status: 400 });
    }

    const body = await req.json();
    const { email, firstName, lastName, position, department, employeeCode, ...otherData } = body;

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        email: email.toLowerCase(),
        workspaceId: workspaceId as string,
      },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: "มีพนักงานที่ใช้อีเมลนี้ในระบบแล้ว" },
        { status: 400 }
      );
    }

    // สร้างรหัสผ่านชั่วคราว
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // สร้างข้อมูลผู้ใช้ใหม่ในสถานะ pending
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        status: 'PENDING',
      },
    });

    // สร้างข้อมูลพนักงานใหม่ในสถานะ pending
    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        employeeCode: employeeCode || null,
        positionId: position,
        departmentId: department,
        workspaceId: workspaceId as string,
        status: 'PENDING',
        userId: user.id,
        ...otherData,
      },
    });

    // สร้างรหัสเชิญ
    const inviteCode = Math.random().toString(36).slice(-6).toUpperCase();
    const hashedInviteCode = await bcrypt.hash(inviteCode, 10);

    // หาข้อมูล workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId as string },
      select: { name: true, slug: true }
    });

    // สร้างข้อมูล invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        code: hashedInviteCode,
        status: 'PENDING',
        type: 'EMPLOYEE_NEW',
        workspaceId: workspaceId as string,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // หมดอายุใน 7 วัน
        data: JSON.stringify({
          employeeId: employee.id,
          userId: user.id,
          tempPassword,
        }),
      },
    });

    // ส่งอีเมลให้พนักงานใหม่ (จำลองการส่งอีเมล)
    console.log('===== ส่งอีเมลเชิญพนักงานใหม่ =====');
    console.log(`ถึง: ${email}`);
    console.log(`เรื่อง: คำเชิญเข้าร่วม ${workspace?.name || 'องค์กร'}`);
    console.log(`เนื้อหา: 
      เรียน ${firstName} ${lastName},

      คุณได้รับเชิญให้เข้าร่วม ${workspace?.name || 'องค์กร'} ในระบบ Teamo
      
      รหัสเชิญของคุณคือ: ${inviteCode}
      รหัสผ่านชั่วคราวของคุณคือ: ${tempPassword}
      
      โปรดเข้าสู่ระบบที่ ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.teamo.co'}/invite 
      และกรอกรหัสเชิญพร้อมอีเมลของคุณเพื่อยืนยันการเข้าร่วม

      ขอแสดงความนับถือ,
      ทีม ${workspace?.name || 'Teamo'}
    `);

    // Log activity
    await logActivity({
      userId: token.id,
      action: "CREATE",
      entity: "EMPLOYEE",
      entityId: employee.id,
      details: { employee },
    });

    return NextResponse.json(
      { 
        success: true, 
        employeeId: employee.id,
        invitationId: invitation.id,
        inviteCode,
        tempPassword,
        message: `สร้างพนักงานใหม่และส่งคำเชิญเรียบร้อยแล้ว` 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างพนักงานใหม่" },
      { status: 500 }
    );
  }
} 