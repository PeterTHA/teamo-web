import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * GET /api/invitations/[id]/employee-data
 * ดึงข้อมูลพนักงานจากคำเชิญ
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบว่าผู้ใช้ลงชื่อเข้าใช้หรือไม่
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "กรุณาลงชื่อเข้าใช้ก่อน" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "กรุณาระบุรหัสคำเชิญ" },
        { status: 400 }
      );
    }
    
    // ค้นหาคำเชิญ
    const invitation = await prisma.invitation.findUnique({
      where: {
        id: id
      }
    });
    
    if (!invitation) {
      return NextResponse.json(
        { error: "ไม่พบคำเชิญ" },
        { status: 404 }
      );
    }
    
    // ดึงข้อมูลพนักงานจาก data ที่บันทึกไว้
    const invitationData = invitation.data ? JSON.parse(invitation.data) : {};
    const employeeId = invitationData.employeeId;
    
    if (!employeeId) {
      return NextResponse.json({ employee: null });
    }
    
    // ดึงข้อมูลพนักงาน
    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        positionId: true,
        departmentId: true,
        employeeCode: true
      }
    });
    
    return NextResponse.json({
      employee: employee
    });
    
  } catch (error) {
    console.error("Error fetching employee data:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน" },
      { status: 500 }
    );
  }
} 