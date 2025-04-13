import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * API สำหรับค้นหาข้อมูลพนักงานด้วย email
 */
export async function GET(request: NextRequest) {
  try {
    // ดึงพารามิเตอร์จาก URL
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const workspaceId = searchParams.get('workspaceId');
    
    // ตรวจสอบว่ามีพารามิเตอร์ที่จำเป็นหรือไม่
    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: "ต้องระบุทั้ง email และ workspaceId" },
        { status: 400 }
      );
    }
    
    console.log(`Searching for employee with email ${email} in workspace ${workspaceId}`);
    
    // ค้นหาพนักงานจากฐานข้อมูล
    const employee = await prisma.employee.findFirst({
      where: {
        email: email,
        workspaceId: workspaceId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        positionId: true,
        departmentId: true,
        employeeCode: true,
      },
    });
    
    if (!employee) {
      console.log(`No employee found with email ${email} in workspace ${workspaceId}`);
      return NextResponse.json(
        { 
          message: "ไม่พบข้อมูลพนักงาน",
          employee: null
        },
        { status: 200 }
      );
    }
    
    console.log(`Found employee for ${email}:`, employee);
    
    // ดึงข้อมูลตำแหน่งจาก database
    const positions = await prisma.position.findMany({
      where: { workspaceId: workspaceId },
      select: {
        id: true,
        name: true,
      },
    });
    
    // ดึงข้อมูลแผนกจาก database
    const departments = await prisma.department.findMany({
      where: { workspaceId: workspaceId },
      select: {
        id: true,
        name: true,
      },
    });
    
    // ส่งข้อมูลกลับไปยังไคลเอนต์
    return NextResponse.json({
      employee,
      positions,
      departments
    });
  } catch (error) {
    console.error("Error searching for employee:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการค้นหาข้อมูลพนักงาน" },
      { status: 500 }
    );
  }
} 