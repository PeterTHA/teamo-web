"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { GalleryVerticalEnd } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { logLogin, logFailedLogin } from "@/utils/activity-logger";
import { getDecryptedParams } from "@/lib/crypto";
import { useToast } from "@/components/ui/use-toast";

// อินเตอร์เฟซสำหรับค่าพารามิเตอร์ที่ถูกเข้ารหัส
interface InviteParams {
  code?: string;
  email?: string;
  token?: string;
}

const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

// ฟังก์ชันสำหรับรับข้อมูลเบราว์เซอร์และอุปกรณ์
function getBrowserInfo() {
  if (typeof window === 'undefined') return {};
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteParams, setInviteParams] = useState<InviteParams | null>(null);

  // ดึงค่าพารามิเตอร์ที่เข้ารหัสจาก URL
  useEffect(() => {
    async function loadParams() {
      try {
        // ถอดรหัสพารามิเตอร์จาก URL
        const params = await getDecryptedParams(searchParams);
        
        if (params) {
          // กำหนดค่า inviteParams จาก params
          setInviteParams(params as InviteParams);
          
          // ตั้งค่าอีเมลจากพารามิเตอร์ถ้ามี
          if (params.email) {
            setFormData(prev => ({ 
              ...prev, 
              email: params.email || "" 
            }));
          }
          
          // แสดงข้อความถ้ามี invite code
          if (params.code) {
            toast({
              title: 'คำเชิญ',
              description: 'คุณได้รับคำเชิญให้เข้าร่วมทีม กรุณาล็อกอินเพื่อเข้าร่วม',
            });
          }
        }
      } catch (error) {
        console.error('Error loading params:', error);
      }
    }
    
    loadParams();
  }, [searchParams, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // จัดการการ submit ฟอร์ม
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // ตรวจสอบความถูกต้องของข้อมูล
    const result = loginSchema.safeParse(formData);
    
    if (!result.success) {
      setError(result.error.errors[0].message);
      setLoading(false);
      return;
    }
    
    try {
      // เก็บข้อมูลเบราว์เซอร์
      const browserInfo = getBrowserInfo();

      // ลงชื่อเข้าใช้
      const response = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      // บันทึกข้อมูลการล็อกอิน
      console.log("[Login Form] Login response:", response);
      
      if (response?.ok) {
        try {
          // ดึงข้อมูลเซสชันจาก NextAuth
          const session = await fetch('/api/auth/session');
          const sessionData = await session.json();
          
          // บันทึกการล็อกอินสำเร็จ
          if (sessionData?.user?.id) {
            await logLogin(sessionData.user.id, {
              email: formData.email,
              device: browserInfo
            });
          }
        } catch (logError) {
          console.error("[Login Form] Failed to log successful login:", logError);
        }
        
        // แสดงแจ้งเตือนการล็อกอินสำเร็จ
        toast({
          title: 'ล็อกอินสำเร็จ',
          description: 'กำลังนำคุณไปยังหน้าแดชบอร์ด',
        });
        
        try {
          // ดึงข้อมูลผู้ใช้และ workspace
          const userProfileResponse = await fetch('/api/user/profile');
          if (userProfileResponse.ok) {
            const userProfileData = await userProfileResponse.json();
            console.log("[Login Form] User profile data:", userProfileData);
            
            if (userProfileData?.defaultWorkspace?.slug) {
              // ใช้ window.location.href เพื่อนำทางไปยัง dashboard
              console.log("[Login Form] Redirecting to workspace:", userProfileData.defaultWorkspace.slug);
              window.location.href = `/dashboard/${userProfileData.defaultWorkspace.slug}`;
              return;
            }
          } else {
            console.error("[Login Form] Failed to fetch user profile, status:", userProfileResponse.status);
          }
          
          // กรณีไม่สามารถดึงข้อมูล workspace ได้ ให้ไปที่ default workspace
          console.log("[Login Form] Redirecting to default workspace");
          window.location.href = '/dashboard/default';
        } catch (error) {
          console.error('[Login Form] Error fetching user profile:', error);
          // กรณีมีข้อผิดพลาด ให้ไปที่ default workspace
          window.location.href = '/dashboard/default';
        }
      } else {
        // กรณีล็อกอินไม่สำเร็จ
        try {
          await logFailedLogin(formData.email, {
            reason: "Invalid credentials",
            device: browserInfo
          });
        } catch (logError) {
          console.error("[Login Form] Failed to log failed login:", logError);
        }
        
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (error) {
      console.error('[Login Form] Error during login:', error);
      
      try {
        await logFailedLogin(formData.email, {
          reason: "Unknown error",
          error: String(error),
          device: getBrowserInfo()
        });
      } catch (logError) {
        console.error("[Login Form] Failed to log error:", logError);
      }
      
      setError("เกิดข้อผิดพลาดในระหว่างการล็อกอิน กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">เข้าสู่ระบบ</h1>
        <p className="text-base text-muted-foreground">กรอกข้อมูลเพื่อเข้าสู่ระบบ Teamo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">อีเมล</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="h-10"
            disabled={!!inviteParams?.email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="h-10"
          />
        </div>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>
      </form>

      <div className="mt-6">
        <p className="text-sm text-center text-muted-foreground">
          ยังไม่มีบัญชี?{" "}
          <a
            href={inviteParams?.code && inviteParams?.token && inviteParams?.email ? 
              `/register?code=${inviteParams.code}&token=${inviteParams.token}&email=${encodeURIComponent(inviteParams.email)}` : 
              "/register"
            }
            className="underline underline-offset-4 hover:text-primary"
          >
            สมัครสมาชิก
          </a>
        </p>
        <p className="text-sm text-center text-muted-foreground mt-2">
          <a
            href="/reset-password"
            className="underline underline-offset-4 hover:text-primary"
          >
            ลืมรหัสผ่าน?
          </a>
        </p>
      </div>

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
    </div>
  );
} 