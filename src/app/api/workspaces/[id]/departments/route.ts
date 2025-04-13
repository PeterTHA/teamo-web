import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * GET /api/workspaces/[id]/departments
 * ดึงข้อมูลแผนกในองค์กร
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
        { error: "กรุณาระบุรหัสองค์กร" },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้มีสิทธิ์ในองค์กรนี้หรือไม่
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        userId: session.user.id,
        status: 'ACTIVE',
      },
    });
    
    if (!member) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" },
        { status: 403 }
      );
    }
    
    // ดึงข้อมูลแผนก
    const departments = await prisma.department.findMany({
      where: {
        workspaceId: id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json({
      departments: departments
    });
    
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลแผนก" },
      { status: 500 }
    );
  }
} 