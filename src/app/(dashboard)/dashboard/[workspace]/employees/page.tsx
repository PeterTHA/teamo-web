"use client";

import { useState, cache, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  status: string;
  employeeCode: string;
}

export default function EmployeesPage() {
  // ใช้ useParams hook จาก next/navigation แทนการใช้ params โดยตรง
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // ดึงข้อมูลพนักงาน
  const { data: employees, isLoading, error, refetch } = useQuery<Employee[]>({
    queryKey: ["employees", workspaceSlug, departmentFilter, search],
    queryFn: async () => {
      let url = `/api/employees?workspace=${workspaceSlug}`;
      
      if (departmentFilter) {
        url += `&department=${departmentFilter}`;
      }
      
      if (search) {
        url += `&search=${search}`;
      }
      
      try {
        const res = await fetch(url);
        
        if (res.status === 404) {
          // ถ้าไม่พบ workspace หรือ api ให้แสดง toast และส่งคืนอาร์เรย์ว่าง
          toast({
            title: "ไม่พบข้อมูล Workspace",
            description: "Workspace ที่ระบุไม่มีในระบบ",
            variant: "destructive",
          });
          return [];
        }
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch employees");
        }
        
        return res.json();
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
          variant: "destructive",
        });
        return [];
      }
    },
    retry: 1, // ลดจำนวนครั้งที่จะลองใหม่ลงเหลือแค่ 1 ครั้ง
  });

  const departments = employees 
    ? Array.from(new Set(employees.map(emp => emp.department)))
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">พนักงาน</h1>
        <Button onClick={() => setIsAddEmployeeOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          เพิ่มพนักงาน
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อพนักงานทั้งหมด</CardTitle>
          <CardDescription>รายชื่อพนักงานทั้งหมดในองค์กรของคุณ</CardDescription>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="ค้นหาพนักงาน..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border rounded-md p-2"
              value={departmentFilter || ""}
              onChange={(e) => setDepartmentFilter(e.target.value || null)}
            >
              <option value="">แผนกทั้งหมด</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <EmployeesTableSkeleton />
          ) : error ? (
            <div className="text-center py-8 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
          ) : employees && employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสพนักงาน</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>แผนก</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.employeeCode}</TableCell>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Badge status={employee.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/${workspaceSlug}/employees/${employee.id}`}>
                        <Button variant="outline" size="sm">
                          รายละเอียด
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">ไม่พบพนักงาน</div>
          )}
        </CardContent>
      </Card>

      <AddEmployeeDialog 
        open={isAddEmployeeOpen} 
        onOpenChange={setIsAddEmployeeOpen} 
        workspace={workspaceSlug}
        onSuccess={() => {
          refetch();
          toast({
            title: "เพิ่มพนักงานสำเร็จ",
            description: "เพิ่มพนักงานและส่งอีเมลเชิญเรียบร้อยแล้ว",
          });
        }}
      />
    </div>
  );
}

function Badge({ status }: { status: string }) {
  let bgColor;
  let textColor;
  let statusText;

  switch (status) {
    case "ACTIVE":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      statusText = "กำลังทำงาน";
      break;
    case "INACTIVE":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      statusText = "ไม่ได้ทำงาน";
      break;
    case "PROBATION":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      statusText = "ทดลองงาน";
      break;
    case "TERMINATED":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      statusText = "สิ้นสุดการจ้าง";
      break;
    case "RESIGNED":
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
      statusText = "ลาออก";
      break;
      case "PENDING":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        statusText = "รอการยืนยัน";
        break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
      statusText = status;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {statusText}
    </span>
  );
}

function EmployeesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface PositionOption {
  id: string;
  name: string;
  code: string;
}

function AddEmployeeDialog({ 
  open, 
  onOpenChange,
  workspace,
  onSuccess
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  workspace: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    position: "",
    department: "",
    email: "",
    phone: "",
    hireDate: new Date().toISOString().split("T")[0],
    employeeCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // ดึงข้อมูลแผนก
  const { data: departments = [], error: departmentError } = useQuery<DepartmentOption[]>({
    queryKey: ["departments", workspace],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/departments?workspace=${workspace}`);
        
        if (res.status === 404) {
          return []; // ส่งค่าอาร์เรย์ว่างถ้าไม่พบข้อมูล
        }
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch departments");
        }
        
        return res.json();
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast({
          title: "ไม่สามารถดึงข้อมูลแผนก",
          description: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ",
          variant: "destructive",
        });
        return [];
      }
    },
    retry: 1,
    enabled: open, // ดึงข้อมูลเมื่อเปิดไดอะล็อกเท่านั้น
  });
  
  // ดึงข้อมูลตำแหน่ง
  const { data: positions = [], error: positionError } = useQuery<PositionOption[]>({
    queryKey: ["positions", workspace],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/positions?workspace=${workspace}`);
        
        if (res.status === 404) {
          return []; // ส่งค่าอาร์เรย์ว่างถ้าไม่พบข้อมูล
        }
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch positions");
        }
        
        return res.json();
      } catch (error) {
        console.error("Error fetching positions:", error);
        toast({
          title: "ไม่สามารถดึงข้อมูลตำแหน่ง",
          description: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ",
          variant: "destructive",
        });
        return [];
      }
    },
    retry: 1,
    enabled: open, // ดึงข้อมูลเมื่อเปิดไดอะล็อกเท่านั้น
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // ส่งข้อมูลไปยัง API
      const response = await fetch("/api/employees/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          workspaceSlug: workspace,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการเพิ่มพนักงาน");
      }
      
      // รีเซ็ตฟอร์ม
      setFormData({
        firstName: "",
        lastName: "",
        position: "",
        department: "",
        email: "",
        phone: "",
        hireDate: new Date().toISOString().split("T")[0],
        employeeCode: "",
      });
      
      // ปิด dialog
      onOpenChange(false);
      
      // เรียก callback สำเร็จ
      onSuccess();
      
    } catch (error: any) {
      console.error("Error adding employee:", error);
      setError(error.message || "เกิดข้อผิดพลาดในการเพิ่มพนักงาน");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>เพิ่มพนักงานใหม่</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลเพื่อเพิ่มพนักงานใหม่และส่งคำเชิญทางอีเมล
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* แสดงข้อความเตือนถ้าไม่มีข้อมูลแผนกหรือตำแหน่ง */}
          {departments.length === 0 && (
            <div className="bg-yellow-50 text-yellow-800 p-2 rounded text-sm">
              ไม่พบข้อมูลแผนก กรุณาเพิ่มแผนกก่อนเพิ่มพนักงาน
            </div>
          )}
          
          {positions.length === 0 && (
            <div className="bg-yellow-50 text-yellow-800 p-2 rounded text-sm">
              ไม่พบข้อมูลตำแหน่ง กรุณาเพิ่มตำแหน่งก่อนเพิ่มพนักงาน
            </div>
          )}
        
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">ชื่อ</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">นามสกุล</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeCode">รหัสพนักงาน</Label>
              <Input
                id="employeeCode"
                name="employeeCode"
                value={formData.employeeCode}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">วันที่เริ่มงาน</Label>
              <Input
                id="hireDate"
                name="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">แผนก</Label>
              <Select 
                name="department"
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                required
                disabled={departments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.code}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">ตำแหน่ง</Label>
              <Select 
                name="position"
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                required
                disabled={positions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกตำแหน่ง" />
                </SelectTrigger>
                <SelectContent>
                  {positions?.map((pos) => (
                    <SelectItem key={pos.id} value={pos.code}>{pos.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading || departments.length === 0 || positions.length === 0}>
              {isLoading ? "กำลังดำเนินการ..." : "เพิ่มพนักงาน"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 