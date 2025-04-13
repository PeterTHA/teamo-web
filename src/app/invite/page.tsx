"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/components/ui/use-toast';
import { getDecryptedParams } from '@/lib/crypto';

// กำหนดอินเทอร์เฟซสำหรับพารามิเตอร์ที่เข้ารหัส
interface InviteParams {
  code?: string;
  email?: string;
  token?: string;
}

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // พารามิเตอร์จาก URL
  const [params, setParams] = useState<InviteParams | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  
  // โหลดพารามิเตอร์จาก URL เมื่อโหลดหน้า
  useEffect(() => {
    async function loadParams() {
      try {
        // ถอดรหัสพารามิเตอร์จาก URL
        const decryptedParams = await getDecryptedParams(searchParams);
        setParams(decryptedParams as InviteParams);
        
        // ถ้ามีพารามิเตอร์ให้ตั้งค่า
        if (decryptedParams) {
          if (decryptedParams.code) setInviteCode(decryptedParams.code);
          if (decryptedParams.email) setEmailAddress(decryptedParams.email);
        }
      } catch (error) {
        console.error('Error loading params:', error);
      }
    }
    
    loadParams();
  }, [searchParams]);
  
  const verifyInvitation = async () => {
    if (!inviteCode || !emailAddress) {
      setError('กรุณากรอกรหัสเชิญและอีเมล');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/invite/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: inviteCode,
          email: emailAddress,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'เกิดข้อผิดพลาดในการตรวจสอบคำเชิญ');
      }
      
      // เก็บ token ที่ได้จากการตรวจสอบคำเชิญ
      setToken(data.token);
      
      // คำเชิญถูกต้อง
      setSuccess('ตรวจสอบคำเชิญสำเร็จ');
      
      // ดำเนินการยอมรับคำเชิญทันที
      await acceptInvitation(data.token);
      
      // เช็คประเภทคำเชิญและดำเนินการตามประเภท
      if (data.invitation.type === 'EMPLOYEE_NEW') {
        // กรณีพนักงานใหม่ นำทางไปยังหน้าล็อกอิน
        toast({
          title: 'คำเชิญถูกต้อง',
          description: 'กรุณาล็อกอินด้วยอีเมลและรหัสผ่านชั่วคราวที่ได้รับทางอีเมล',
        });
        
        router.push(`/login?email=${encodeURIComponent(emailAddress)}`);
        return;
      }
      
      // กรณีอื่นๆ ให้ไปยังหน้าลงทะเบียน
      const redirectUrl = data.redirectUrl || 
        `/register?code=${inviteCode}&email=${encodeURIComponent(emailAddress)}&token=${data.token}`;
      
      router.push(redirectUrl);
      
    } catch (error: any) {
      console.error('Invitation error:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการตรวจสอบคำเชิญ');
    } finally {
      setIsLoading(false);
    }
  };
  
  const acceptInvitation = async (inviteToken: string) => {
    try {
      const acceptResponse = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: inviteToken,
          email: emailAddress,
        }),
      });
      
      const acceptData = await acceptResponse.json();
      
      if (!acceptResponse.ok) {
        console.error('Error accepting invitation:', acceptData);
        return null;
      }
      
      return acceptData;
    } catch (error) {
      console.error('Accept invitation error:', error);
      return null;
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyInvitation();
  };
  
  // สร้างฟังก์ชันสำหรับไปยังหน้าเข้าสู่ระบบ
  const goToLogin = () => {
    router.push(`/login?email=${encodeURIComponent(emailAddress)}`);
  };
  
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">เข้าร่วม Workspace</CardTitle>
          <CardDescription className="text-center">
            กรุณากรอกข้อมูลให้ตรงกับอีเมลเชิญที่คุณได้รับ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมลที่ได้รับเชิญ</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">กรอกอีเมลที่ระบุในอีเมลเชิญที่คุณได้รับ</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteCode">รหัสเชิญ</Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="123456"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="text-sm font-medium text-red-500">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-sm font-medium text-green-500">
                {success}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                'ตรวจสอบคำเชิญ'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-sm text-muted-foreground text-center">
            หากคุณได้รับอีเมลพร้อมรหัสผ่านชั่วคราว กรุณาล็อกอินด้วยข้อมูลดังกล่าวหลังยืนยันคำเชิญ
          </p>
          
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={goToLogin}
          >
            ไปยังหน้าเข้าสู่ระบบ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 