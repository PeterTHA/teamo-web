"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from "next/link";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getDecryptedParams } from '@/lib/crypto';
import { useToast } from '@/components/ui/use-toast';
import { Icons } from "@/components/icons";
import { signIn } from 'next-auth/react';

// อินเตอร์เฟซสำหรับค่าพารามิเตอร์ที่ถูกเข้ารหัส
interface InviteParams {
  code?: string;
  email?: string;
  token?: string;
}

// สร้าง form schema สำหรับการตรวจสอบข้อมูล
const formSchema = z.object({
  name: z.string().min(2, {
    message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร',
  }),
  email: z.string().email({
    message: 'กรุณาระบุอีเมลที่ถูกต้อง',
  }),
  password: z.string().min(6, {
    message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  }),
  confirmPassword: z.string().min(6, {
    message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inviteParams, setInviteParams] = useState<InviteParams | null>(null);

  // สร้าง form และกำหนดค่าเริ่มต้น
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // โหลดข้อมูลคำเชิญจาก URL
  useEffect(() => {
    async function loadInviteParams() {
      try {
        // ถอดรหัสพารามิเตอร์จาก URL
        const params = await getDecryptedParams<InviteParams>(searchParams);
        
        if (params) {
          setInviteParams(params);
          
          // ตั้งค่าอีเมลจากพารามิเตอร์ถ้ามี
          if (params.email) {
            form.setValue('email', params.email);
          }
          
          // แสดงข้อความถ้ามี token
          if (params.token) {
            toast({
              title: 'ตรวจสอบคำเชิญสำเร็จ',
              description: 'คุณได้รับคำเชิญให้เข้าร่วมทีม กรุณาลงทะเบียนเพื่อเข้าร่วม',
            });
          }
          
          // แสดงข้อความถ้ามี invite code 
          if (params.code) {
            toast({
              title: 'คำเชิญ',
              description: 'คุณได้รับคำเชิญให้เข้าร่วมทีม กรุณาลงทะเบียนเพื่อเข้าร่วม',
            });
          }
        } else {
          // ถ้าไม่สามารถถอดรหัสได้แต่พบ token ในพารามิเตอร์
          const token = searchParams.get('token');
          const email = searchParams.get('email');
          
          if (token) {
            setInviteParams({ token, email: email || undefined });
            
            if (email) {
              form.setValue('email', email);
            }
            
            toast({
              title: 'คำเชิญ',
              description: 'คุณได้รับคำเชิญให้เข้าร่วมทีม กรุณาลงทะเบียนเพื่อเข้าร่วม',
            });
          }
        }
      } catch (error) {
        console.error('Error loading invite params:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถอ่านข้อมูลคำเชิญได้',
          variant: 'destructive',
        });
      }
    }
    
    loadInviteParams();
  }, [searchParams, form, toast]);

  // จัดการการส่งฟอร์ม
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // ส่งคำขอลงทะเบียน
      const registerData = {
        ...values,
        inviteCode: inviteParams?.code,
        inviteToken: inviteParams?.token,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }

      toast({
        title: 'ลงทะเบียนสำเร็จ',
        description: 'คุณสามารถเข้าสู่ระบบได้เลย',
      });

      // ล็อกอินอัตโนมัติ
      const signInResult = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false
      });
      
      if (signInResult?.error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถล็อกอินอัตโนมัติได้ กรุณาล็อกอินด้วยตนเอง",
          variant: "destructive"
        });
        router.push('/login');
        return;
      }
      
      // ถ้ามี token ให้ยอมรับคำเชิญและไปยังหน้าลงทะเบียนข้อมูลพนักงานเพิ่มเติม
      if (inviteParams?.token) {
        try {
          const acceptResponse = await fetch('/api/invite/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: inviteParams.token,
            }),
          });
          
          const acceptData = await acceptResponse.json();
          
          if (acceptResponse.ok && acceptData.success) {
            // ถ้ามีการเชิญแบบ EMPLOYEE_NEW ให้ไปยังหน้าลงทะเบียนข้อมูลพนักงานเพิ่มเติม
            if (inviteParams.code === 'EMPLOYEE_NEW') {
              router.push(`/register/employee?token=${inviteParams.token}&email=${encodeURIComponent(values.email)}`);
              return;
            }
          }
        } catch (error) {
          console.error('Error accepting invitation:', error);
          // ถ้าเกิดข้อผิดพลาดในการยอมรับคำเชิญ ให้ไปยัง dashboard
        }
      }
      
      // ถ้าไม่มี token หรือไม่มีการเชิญแบบ EMPLOYEE_NEW ให้ไปยัง dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถลงทะเบียนได้ กรุณาลองอีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className="absolute left-4 top-4 md:left-8 md:top-8"
      >
        <Button variant="ghost">
          <>
            <Icons.chevronLeft className="mr-2 h-4 w-4" />
            กลับ
          </>
        </Button>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-6 w-6" />
          <h1 className="text-2xl font-semibold tracking-tight">
            สมัครสมาชิก
          </h1>
          <p className="text-sm text-muted-foreground">
            กรอกข้อมูลด้านล่างเพื่อสร้างบัญชีของคุณ
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อ</FormLabel>
                  <FormControl>
                    <Input placeholder="ชื่อของคุณ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>อีเมล</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your@email.com" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่าน</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'กำลังดำเนินการ...' : 'ลงทะเบียน'}
            </Button>
          </form>
        </Form>
        <p className="px-8 text-center text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-primary"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
} 