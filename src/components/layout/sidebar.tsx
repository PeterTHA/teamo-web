"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LucideIcon, Home, Users, Briefcase, Calendar, Clock, FileText, Settings, LogOut, BarChart3, ClipboardCheck, ChevronDown, Loader2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { logLogout } from "@/utils/activity-logger";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/components/workspace-context";

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

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

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { currentWorkspace, userWorkspaces, isLoading, switchWorkspace } = useWorkspace();
  
  // ใช้ workspace slug จาก context หรือจาก URL เป็นสำรอง
  const workspaceSlug = currentWorkspace?.slug || pathname.split("/")[2] || "default";

  const mainItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: `/dashboard/${workspaceSlug}`,
      icon: Home,
    },
    {
      title: "พนักงาน",
      href: `/dashboard/${workspaceSlug}/employees`,
      icon: Users,
    },
    {
      title: "โปรเจค",
      href: `/dashboard/${workspaceSlug}/projects`,
      icon: Briefcase,
    },
    {
      title: "การลา",
      href: `/dashboard/${workspaceSlug}/leaves`,
      icon: Calendar,
    },
    {
      title: "โอที",
      href: `/dashboard/${workspaceSlug}/overtime`,
      icon: Clock,
    },
    {
      title: "ปฏิทิน",
      href: `/dashboard/${workspaceSlug}/calendar`,
      icon: Calendar,
    },
    {
      title: "รายงาน",
      href: `/dashboard/${workspaceSlug}/reports`,
      icon: BarChart3,
    },
    {
      title: "การอนุมัติ",
      href: `/dashboard/${workspaceSlug}/approvals`,
      icon: ClipboardCheck,
    },
  ];

  const bottomItems: SidebarItem[] = [
    {
      title: "ตั้งค่า",
      href: `/dashboard/${workspaceSlug}/settings`,
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    // บันทึกกิจกรรม logout ก่อนออกจากระบบ
    if (session?.user?.id) {
      try {
        await logLogout(session.user.id, {
          workspace: workspaceSlug,
          timestamp: new Date().toISOString(),
          device: getBrowserInfo()
        });
      } catch (error) {
        console.error("Failed to log logout activity:", error);
      }
    }
    
    // ออกจากระบบ
    signOut({ callbackUrl: '/login' });
  };

  return (
    <aside className="w-64 h-screen border-r bg-white flex flex-col">
      <div className="p-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded">
              <div>
                <h2 className="text-xl font-bold">Teamo</h2>
                <p className="text-sm text-gray-500 flex items-center">
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      กำลังโหลด...
                    </span>
                  ) : (
                    currentWorkspace?.name || workspaceSlug
                  )}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="p-2 text-xs font-medium text-gray-500">เปลี่ยน Workspace</div>
            {userWorkspaces.map((workspace) => (
              <DropdownMenuItem 
                key={workspace.id}
                onClick={() => switchWorkspace(workspace.slug)}
                className={`flex items-center gap-2 ${workspace.slug === workspaceSlug ? 'bg-gray-100' : ''}`}
              >
                <div className="h-4 w-4 rounded-full bg-primary flex-shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{workspace.name}</span>
                  <span className="text-xs text-gray-500">{workspace.slug}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {mainItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
          />
        ))}
      </nav>

      <div className="p-4 border-t space-y-2">
        {bottomItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
          />
        ))}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          ออกจากระบบ
        </Button>
      </div>
    </aside>
  );
}

function NavItem({
  item,
  active,
}: {
  item: SidebarItem;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center p-2 rounded-md transition-colors ${
        active
          ? "bg-gray-100 text-black font-medium"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon className="h-5 w-5 mr-3" />
      {item.title}
    </Link>
  );
} 