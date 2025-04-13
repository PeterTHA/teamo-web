"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/components/ui/use-toast';
import { getDecryptedParams, decryptToObject } from '@/lib/crypto';
import { useSession } from 'next-auth/react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RegisterParams {
  token?: string;
  email?: string;
  code?: string;
}

interface EmployeeData {
  id?: string;
  firstName?: string;
  lastName?: string;
  positionId?: string;
  departmentId?: string;
  phone?: string;
  employeeCode?: string;
}

interface Position {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface TokenData {
  id: string;
  email: string;
  workspaceId: string;
  timestamp: number;
  isFromFallback: boolean;
}

export default function EmployeeRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<RegisterParams | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData>({});
  
  // สำหรับเลือกตำแหน่งและแผนก
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // ข้อมูลผู้ใช้
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [positionId, setPositionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [password, setPassword] = useState('');
  
  // โหลดข้อมูลเมื่อเปิดหน้า
  useEffect(() => {
    async function loadData() {
      try {
        // ดึงพารามิเตอร์จาก URL
        const token = searchParams.get('token') || '';
        const email = searchParams.get('email') || '';
        const code = searchParams.get('code') || '';
        const workspaceId = searchParams.get('workspaceId') || '';
        
        if (!token && !email) {
          setError('ไม่พบข้อมูลคำเชิญ');
          return;
        }
        
        // ถอดรหัส token
        try {
          console.log('Trying to decrypt token:', token.substring(0, 20) + '...');
          
          // ส่ง token ไปถอดรหัสที่ API และส่ง email ไปด้วย
          const tokenResponse = await fetch('/api/token/decrypt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              token,
              email,
              workspaceId
            }),
          });
          
          if (!tokenResponse.ok) {
            throw new Error('ไม่สามารถถอดรหัส token ได้');
          }
          
          const tokenData = await tokenResponse.json();
          console.log('Token data from API:', tokenData);
          
          // ตรวจสอบว่าข้อมูลเป็นข้อมูลสำรองหรือไม่
          if (tokenData.isFromFallback) {
            console.log('Using fallback data instead of decrypted token');
            toast({
              title: 'ข้อควรระวัง',
              description: 'ไม่สามารถถอดรหัสข้อมูลได้ แต่ระบบยังสามารถดำเนินการต่อได้',
              variant: 'destructive',
            });
          }
          
          if (!tokenData.id || (!tokenData.workspaceId && !workspaceId)) {
            throw new Error('ข้อมูล token ไม่ถูกต้องหรือไม่ครบถ้วน');
          }
          
          // ใช้ workspaceId จาก URL ถ้าไม่มีใน token
          if (!tokenData.workspaceId && workspaceId) {
            tokenData.workspaceId = workspaceId;
          }
          
          setTokenData(tokenData);
          
          // ใช้ token และ email ในการดึงข้อมูลพนักงาน
          const employeeResponse = await fetch('/api/employee/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              email: tokenData.email || email,
              invitationId: tokenData.id,
              workspaceId: tokenData.workspaceId
            }),
          });
          
          // กรณีที่ไม่สามารถดึงข้อมูลพนักงานได้ แต่ยังต้องให้ผู้ใช้ลงทะเบียนได้
          if (!employeeResponse.ok) {
            console.warn('Cannot fetch employee data, will proceed with manual registration');
            
            // นำข้อมูลที่มีอยู่มาใช้
            setParams({ token, email: tokenData.email || email, code });
            
            if (session?.user) {
              // ถ้ามีข้อมูลผู้ใช้จาก session ให้นำมาใช้
              const nameParts = session.user.name?.split(' ') || ['', ''];
              setFirstName(nameParts[0] || '');
              setLastName(nameParts[1] || '');
            }
            
            // ไม่ต้อง return เพื่อให้ทำงานต่อไป
          } else {
            const employeeData = await employeeResponse.json();
            console.log('Employee data from API:', employeeData);
            
            // ตั้งค่าข้อมูลพนักงานและข้อมูลอื่นๆ
            setEmployeeData(employeeData.employee || {});
            setPositions(employeeData.positions || []);
            setDepartments(employeeData.departments || []);
            
            // ตั้งค่าข้อมูลเริ่มต้น
            if (employeeData.employee) {
              setFirstName(employeeData.employee.firstName || '');
              setLastName(employeeData.employee.lastName || '');
              setPhone(employeeData.employee.phone || '');
              if (employeeData.employee.positionId) setPositionId(employeeData.employee.positionId);
              if (employeeData.employee.departmentId) setDepartmentId(employeeData.employee.departmentId);
            } else {
              // ใช้ email จาก tokenData หรือ URL parameter
              const emailToUse = tokenData?.email || searchParams.get('email') || '';
              
              // ดึงข้อมูลพนักงานจาก API ด้วย email
              if (emailToUse && tokenData?.workspaceId) {
                try {
                  const employeeByEmailResponse = await fetch(`/api/employee/search?email=${emailToUse}&workspaceId=${tokenData.workspaceId}`);
                  
                  if (employeeByEmailResponse.ok) {
                    const employeeByEmailData = await employeeByEmailResponse.json();
                    console.log('Retrieved employee data by email:', employeeByEmailData);
                    
                    if (employeeByEmailData.employee) {
                      // ใช้ข้อมูลพนักงานที่ดึงด้วย email
                      setFirstName(employeeByEmailData.employee.firstName || '');
                      setLastName(employeeByEmailData.employee.lastName || '');
                      setPhone(employeeByEmailData.employee.phone || '');
                      if (employeeByEmailData.employee.positionId) setPositionId(employeeByEmailData.employee.positionId);
                      if (employeeByEmailData.employee.departmentId) setDepartmentId(employeeByEmailData.employee.departmentId);
                      
                      // อัปเดตข้อมูลพนักงานในสเตทเพื่อใช้ในขั้นตอนถัดไป
                      setEmployeeData({ ...employeeData, employee: employeeByEmailData.employee });
                    }
                  }
                } catch (emailLookupError) {
                  console.error('Error fetching employee data by email:', emailLookupError);
                }
              }
              
              // ถ้าไม่สามารถดึงข้อมูลพนักงานด้วย email ได้ และมีข้อมูลใน session ให้ใช้ข้อมูลจาก session เป็นตัวเลือกสุดท้าย
              if (!firstName && !lastName && session?.user) {
                const nameParts = session.user.name?.split(' ') || ['', ''];
                setFirstName(nameParts[0] || '');
                setLastName(nameParts[1] || '');
              }
            }
          }
          
          setParams({ token, email: tokenData.email || email, code });
          
        } catch (error) {
          console.error('Error decoding token or fetching data:', error);
          setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    }
    
    loadData();
  }, [searchParams, router, status]);
  
  // ดึงข้อมูลพนักงานเดิม
  const fetchEmployeeData = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/employee-data`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถดึงข้อมูลพนักงานได้');
      }
      
      const data = await response.json();
      setEmployeeData(data.employee || {});
      
      // ตั้งค่าข้อมูลเริ่มต้น
      if (data.employee) {
        setFirstName(data.employee.firstName || '');
        setLastName(data.employee.lastName || '');
        setPhone(data.employee.phone || '');
        if (data.employee.positionId) setPositionId(data.employee.positionId);
        if (data.employee.departmentId) setDepartmentId(data.employee.departmentId);
      } else {
        // ใช้ email จาก tokenData หรือ URL parameter
        const emailToUse = tokenData?.email || searchParams.get('email') || '';
        const workspaceIdToUse = tokenData?.workspaceId || searchParams.get('workspaceId') || '';
        
        // ดึงข้อมูลพนักงานจาก API ด้วย email
        if (emailToUse && workspaceIdToUse) {
          try {
            const employeeByEmailResponse = await fetch(`/api/employee/search?email=${emailToUse}&workspaceId=${workspaceIdToUse}`);
            
            if (employeeByEmailResponse.ok) {
              const employeeByEmailData = await employeeByEmailResponse.json();
              console.log('Retrieved employee data by email in fetchEmployeeData:', employeeByEmailData);
              
              if (employeeByEmailData.employee) {
                // ใช้ข้อมูลพนักงานที่ดึงด้วย email
                setFirstName(employeeByEmailData.employee.firstName || '');
                setLastName(employeeByEmailData.employee.lastName || '');
                setPhone(employeeByEmailData.employee.phone || '');
                if (employeeByEmailData.employee.positionId) setPositionId(employeeByEmailData.employee.positionId);
                if (employeeByEmailData.employee.departmentId) setDepartmentId(employeeByEmailData.employee.departmentId);
                
                // อัปเดตข้อมูลพนักงานในสเตทเพื่อใช้ในขั้นตอนถัดไป
                setEmployeeData({ ...data, employee: employeeByEmailData.employee });
                return;
              }
            }
          } catch (emailLookupError) {
            console.error('Error fetching employee data by email in fetchEmployeeData:', emailLookupError);
          }
        }
        
        // ถ้าไม่สามารถดึงข้อมูลพนักงานด้วย email ได้ และมีข้อมูลใน session ให้ใช้ข้อมูลจาก session เป็นตัวเลือกสุดท้าย
        if (session?.user) {
          const nameParts = session.user.name?.split(' ') || ['', ''];
          setFirstName(nameParts[0] || '');
          setLastName(nameParts[1] || '');
        }
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      // ไม่ต้องแสดงข้อผิดพลาดให้ผู้ใช้เห็น เพราะอาจจะเป็นกรณีที่ยังไม่มีข้อมูลพนักงาน
    }
  };
  
  // ดึงข้อมูลตำแหน่ง
  const fetchPositions = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/positions`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถดึงข้อมูลตำแหน่งได้');
      }
      
      const data = await response.json();
      setPositions(data.positions || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setError('ไม่สามารถดึงข้อมูลตำแหน่งได้');
    }
  };
  
  // ดึงข้อมูลแผนก
  const fetchDepartments = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/departments`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถดึงข้อมูลแผนกได้');
      }
      
      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('ไม่สามารถดึงข้อมูลแผนกได้');
    }
  };
  
  // ส่งข้อมูลเพื่อลงทะเบียน
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenData) {
      setError('ไม่พบข้อมูลคำเชิญ');
      return;
    }
    
    if (!firstName || !lastName) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    
    if (!positionId) {
      setError('กรุณาเลือกตำแหน่ง');
      return;
    }
    
    if (!departmentId) {
      setError('กรุณาเลือกแผนก');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // สร้างข้อมูลสำหรับส่งไป API
      const registerData = {
        token: params?.token,
        email: tokenData.email,
        workspaceId: tokenData.workspaceId,
        firstName,
        lastName,
        positionId,
        departmentId,
        phone,
        password: password || undefined,
      };
      
      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/register/employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'ไม่สามารถลงทะเบียนได้');
      }
      
      // ถ้าไม่มี session หรือ password ให้ไปที่หน้า login
      if (status !== 'authenticated' && password) {
        // หากมีการกำหนดรหัสผ่าน ให้ sign in ทันที
        const signInResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: tokenData.email,
            password,
          }),
        });
        
        if (signInResponse.ok) {
          // เข้าสู่ระบบสำเร็จ ให้ redirect ไปยัง dashboard
          router.push(`/dashboard`);
          return;
        }
      }
      
      // ถ้ายังไม่ได้ login ให้ไปที่หน้า login
      if (status !== 'authenticated') {
        router.push(`/login?email=${encodeURIComponent(tokenData.email)}`);
        return;
      }
      
      // ถ้า login แล้ว ให้ไปที่ dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error registering employee:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ถ้ายังไม่มี session ให้แสดงข้อความกำลังโหลด
  if (status === 'loading') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Icons.spinner className="mr-2 h-16 w-16 animate-spin" />
            </div>
            <p className="text-center mt-4">กำลังโหลดข้อมูล...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // ถ้ามีข้อผิดพลาดในการถอดรหัส token ให้แสดงฟอร์มพิเศษ
  if (error && error.includes('ข้อมูลคำเชิญไม่ถูกต้อง')) {
    return (
      <div className="container flex min-h-screen w-screen flex-col items-center justify-center py-10">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">เกิดข้อผิดพลาด</CardTitle>
            <CardDescription className="text-center">
              ไม่สามารถถอดรหัสข้อมูลคำเชิญได้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
              <p className="text-red-700 text-sm mt-2">กรุณาลองเข้าลิงก์จากอีเมลอีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
            </div>
            
            <div className="mt-6 border-t pt-6">
              <h3 className="font-medium text-lg mb-4">มีบัญชีอยู่แล้ว?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                หากคุณมีบัญชีในระบบอยู่แล้ว และต้องการเข้าสู่ระบบ คุณสามารถกดปุ่มด้านล่างเพื่อไปยังหน้าเข้าสู่ระบบ
              </p>
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full"
              >
                ไปยังหน้าเข้าสู่ระบบ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container flex min-h-screen w-screen flex-col items-center justify-center py-10">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">เพิ่มข้อมูลพนักงาน</CardTitle>
          <CardDescription className="text-center">
            กรุณากรอกข้อมูลเพิ่มเติมเพื่อลงทะเบียนเป็นพนักงาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={tokenData?.email || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">อีเมลที่ใช้ในการลงทะเบียน</p>
            </div>
            
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">ชื่อ</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">นามสกุล</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <Label htmlFor="position">ตำแหน่ง</Label>
              <Select value={positionId} onValueChange={setPositionId} required>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกตำแหน่ง" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>{position.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">แผนก</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} required>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="กรอกรหัสผ่านเพื่อยืนยันตัวตน"
              />
              <p className="text-xs text-muted-foreground">รหัสผ่านของคุณเพื่อยืนยันตัวตน</p>
            </div>
            
            {error && (
              <div className="text-sm font-medium text-red-500">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                'บันทึกข้อมูลและเข้าสู่ระบบ'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 