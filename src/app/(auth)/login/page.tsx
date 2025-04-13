"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login-form"

const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col p-0 md:p-0">
        <div className="flex items-center gap-3 p-6 md:p-10">
          <a href="#" className="flex items-center gap-3 font-medium">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">Teamo</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 pt-0 md:p-10 md:pt-0">
          <div className="w-full max-w-[350px]">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/team-collaboration.svg"
          alt="Team Collaboration"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3] dark:grayscale"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 p-10 text-center dark:bg-black/50">
          <div className="max-w-md">
            <h1 className="mb-6 text-4xl font-bold text-white">จัดการทีมคุณอย่างมีประสิทธิภาพ</h1>
            <p className="text-lg text-white/90">
              Teamo ช่วยให้การทำงานร่วมกันเป็นไปอย่างราบรื่น ติดตามโปรเจค และจัดการทรัพยากรได้อย่างมีประสิทธิภาพ
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 