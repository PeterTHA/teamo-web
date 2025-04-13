import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import bcrypt from "bcrypt";

/**
 * API สำหรับตรวจสอบรหัสเชิญ
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
    const { code, email } = body;

    // ตรวจสอบว่ามีข้อมูลที่จำเป็นหรือไม่
    if (!code || !email) {
      return NextResponse.json(
        { error: "กรุณาระบุรหัสเชิญและอีเมล" },
        { status: 400 }
      );
    }

    // ดึงข้อมูลคำเชิญจาก database
    const invitation = await prisma.invitation.findFirst({
      where: {
        email: email.toLowerCase(),
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
        { error: "ไม่พบคำเชิญที่ตรงกับอีเมลนี้ หรือคำเชิญหมดอายุแล้ว" },
        { status: 404 }
      );
    }

    // ตรวจสอบรหัสเชิญ
    const isValidCode = await bcrypt.compare(code, invitation.code);

    if (!isValidCode) {
      return NextResponse.json(
        { error: "รหัสเชิญไม่ถูกต้อง" },
        { status: 400 }
      );
    }
    
    // ดึงข้อมูลพนักงานที่มีอยู่แล้วด้วย email (ถ้ามี)
    const employee = await prisma.employee.findFirst({
      where: {
        email: email.toLowerCase(),
        workspaceId: invitation.workspaceId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        positionId: true,
        departmentId: true,
        employeeCode: true,
      },
    });
    
    console.log('Found employee for email:', email, employee ? 'Yes' : 'No');

    // สร้างโทเค็นและส่งกลับให้ client
    try {
      // สร้างข้อมูลสำหรับโทเค็น
      const tokenData = {
        id: invitation.id,
        email: invitation.email,
        workspaceId: invitation.workspaceId,
        type: invitation.type,
        timestamp: Date.now(),
      };

      // เข้ารหัสข้อมูลโดยใช้ encrypt function แทนการเรียก API
      const token = await encrypt(JSON.stringify(tokenData));

      // ดึงข้อมูลเพิ่มเติมจาก invitation data ถ้ามี
      const invitationData = invitation.data ? JSON.parse(invitation.data) : {};
      
      // ส่งข้อมูลกลับไปให้ client
      return NextResponse.json({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          type: invitation.type,
          status: invitation.status,
          workspace: {
            id: invitation.workspaceId,
            name: invitation.workspace?.name || "",
            subdomain: invitation.workspace?.slug || "",
          },
          inviter: invitationData?.invitedBy ? {
            id: invitationData.invitedBy.id || "",
            name: invitationData.invitedBy.name || "",
            profileUrl: invitationData.invitedBy.profileUrl || ""
          } : null
        },
        employee: employee || null,
        token,
      });
    } catch (tokenError) {
      console.error("Error creating token:", tokenError);
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการสร้างโทเค็น" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in invitation verification:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบคำเชิญ" },
      { status: 500 }
    );
  }
} 