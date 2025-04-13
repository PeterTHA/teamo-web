import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt, decryptToObject } from "@/lib/crypto";

// กำหนด interface สำหรับ Position และ Department
interface Position {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

/**
 * API สำหรับดึงข้อมูลการลงทะเบียนพนักงาน
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
    const { token, email, invitationId, workspaceId } = body;

    if (!invitationId || !workspaceId) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    // ดึงข้อมูลคำเชิญจาก database
    let invitation;
    try {
      invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: "ไม่พบคำเชิญในระบบ" },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error("Error fetching invitation:", error);
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำเชิญ" },
        { status: 500 }
      );
    }

    // ดึงข้อมูลตำแหน่งจาก database
    let positions: Position[] = [];
    try {
      positions = await prisma.position.findMany({
        where: { workspaceId: workspaceId },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      console.error("Error fetching positions:", error);
      // ไม่ return error เพราะอาจจะไม่มีตำแหน่งในระบบ
    }

    // ดึงข้อมูลแผนกจาก database
    let departments: Department[] = [];
    try {
      departments = await prisma.department.findMany({
        where: { workspaceId: workspaceId },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      console.error("Error fetching departments:", error);
      // ไม่ return error เพราะอาจจะไม่มีแผนกในระบบ
    }

    // ดึงข้อมูลพนักงานที่มีอยู่แล้ว (ถ้ามี)
    let employee = null;
    try {
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          OR: [
            // หมายเหตุ: ถ้า invitationId ไม่มีใน schema ให้ใช้เงื่อนไขอื่น
            // { invitationId: invitationId },
            { email: email },
          ],
          workspaceId: workspaceId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          positionId: true,
          departmentId: true,
          phone: true,
          employeeCode: true,
        },
      });

      if (existingEmployee) {
        employee = existingEmployee;
      }
    } catch (error) {
      console.error("Error fetching existing employee:", error);
      // ไม่ return error เพราะอาจจะไม่มีพนักงานในระบบ
    }

    // สร้างข้อมูลตอบกลับ
    return NextResponse.json({
      invitation,
      employee,
      positions,
      departments,
    });
  } catch (error) {
    console.error("Error in employee/register API:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดำเนินการ" },
      { status: 500 }
    );
  }
} 