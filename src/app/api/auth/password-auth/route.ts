import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import { prisma } from "@/lib/db";
import { z } from "zod";

/**
 * API endpoint สำหรับตรวจสอบรหัสผ่านใน Server-side เพื่อหลีกเลี่ยงการตรวจสอบใน NextAuth
 * ซึ่งอาจมีข้อจำกัดในการดึงข้อมูลรหัสผ่านจากฐานข้อมูล
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // ตรวจสอบความถูกต้องของข้อมูลที่ส่งมา
    const schema = z.object({
      email: z.string().email("อีเมลไม่ถูกต้อง"),
      password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
    });
    
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, password } = result.data;
    
    // ค้นหาผู้ใช้จากอีเมล
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        password: true,
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "ไม่พบผู้ใช้" },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสถานะผู้ใช้
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "บัญชีถูกระงับหรือยังไม่ได้เปิดใช้งาน" },
        { status: 403 }
      );
    }
    
    // ตรวจสอบว่ามีการตั้งรหัสผ่านหรือไม่
    if (!user.password) {
      // Fallback สำหรับผู้ใช้ที่ยังไม่ได้ตั้งรหัสผ่าน
      const fallbackPasswords: Record<string, string> = {
        "SUPERADMIN": "admin123",
        "ADMIN": "manager123",
        "USER": "user123"
      };
      
      if (password === fallbackPasswords[user.role]) {
        // ส่งข้อมูลผู้ใช้กลับโดยไม่รวม password
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({ success: true, user: userWithoutPassword });
      } else {
        return NextResponse.json(
          { success: false, error: "รหัสผ่านไม่ถูกต้อง" },
          { status: 401 }
        );
      }
    }
    
    // ตรวจสอบรหัสผ่านด้วย bcrypt
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }
    
    // ส่งข้อมูลผู้ใช้กลับโดยไม่รวม password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, user: userWithoutPassword });
    
  } catch (error) {
    console.error("Password authentication error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน" },
      { status: 500 }
    );
  }
} 