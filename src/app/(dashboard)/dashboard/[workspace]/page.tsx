import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/db";

// Generate metadata without using params.workspace directly
export function generateMetadata(): Metadata {
  return {
    title: "Dashboard - Teamo",
  };
}

// ปรับปรุง type definition ให้รองรับทั้ง Promise และไม่ใช่ Promise
type PageProps = {
  params: { workspace: string } | Promise<{ workspace: string }>;
};

export default async function DashboardPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }
  
  // รองรับกรณีที่ params เป็น Promise
  const resolvedParams = params instanceof Promise ? await params : params;
  const workspaceSlug = resolvedParams.workspace;
  
  // ดึงข้อมูล workspace จากฐานข้อมูล
  let workspace = { name: "Default Workspace", slug: workspaceSlug };
  
  try {
    // ดึงข้อมูล workspace จากฐานข้อมูลตาม slug ที่ได้จาก route parameter
    const workspaceData = await prisma.workspace.findFirst({
      where: {
        slug: workspaceSlug
      },
      select: {
        name: true,
        slug: true
      }
    });
    
    if (workspaceData) {
      workspace = workspaceData;
    }
  } catch (error) {
    console.error("Error fetching workspace:", error);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">
            Welcome back, {session.user.name} | Workspace: {workspace.name} ({workspace.slug})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="พนักงานทั้งหมด"
          value={`${workspace.slug}-emp`}
          description="จำนวนพนักงานในทีม"
          loading={false}
        />
        <StatCard
          title="โปรเจคทั้งหมด"
          value={`${workspace.slug}-prj`}
          description="โปรเจคที่ดำเนินการอยู่"
          loading={false}
        />
        <StatCard
          title="ลาป่วยเดือนนี้"
          value={`${workspace.slug}-lev`}
          description="วันลาป่วยในเดือนนี้"
          loading={false}
        />
        <StatCard
          title="โอทีเดือนนี้"
          value={`${workspace.slug}-ot`}
          description="ชั่วโมงโอทีทั้งหมดเดือนนี้"
          loading={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>รายการพนักงานลาล่าสุด</CardTitle>
            <CardDescription>Leave requests in the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-[200px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>โปรเจคล่าสุด</CardTitle>
            <CardDescription>Recently added projects</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-[200px]" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>กิจกรรมล่าสุด</CardTitle>
          <CardDescription>Recent activities in your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  loading,
}: {
  title: string;
  value: string;
  description: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
} 