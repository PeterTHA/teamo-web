import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * GET /api/departments
 * ดึงข้อมูลแผนกทั้งหมดในองค์กร
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
    
    // ดึงข้อมูลแผนก
    const departments = await prisma.department.findMany({
      where: {
        workspaceId: workspace.id,
        status: "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true
      },
      orderBy: { name: "asc" }
    });
    
    return NextResponse.json(departments);
    
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลแผนก" },
      { status: 500 }
    );
  }
} 