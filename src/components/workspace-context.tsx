"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  status: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  userWorkspaces: Workspace[];
  isLoading: boolean;
  error: string | null;
  switchWorkspace: (slug: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  currentWorkspace: null,
  userWorkspaces: [],
  isLoading: true,
  error: null,
  switchWorkspace: () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ดึง workspace slug จาก URL
  const getWorkspaceSlugFromPath = (): string => {
    const parts = pathname.split('/');
    return parts.length > 2 ? parts[2] : 'default';
  }
  
  // เปลี่ยน workspace
  const switchWorkspace = (slug: string) => {
    const currentPath = pathname.split('/').slice(3).join('/');
    router.push(`/dashboard/${slug}${currentPath ? `/${currentPath}` : ''}`);
  };
  
  // ดึงข้อมูล workspace ปัจจุบัน
  useEffect(() => {
    const fetchCurrentWorkspace = async () => {
      if (sessionStatus !== 'authenticated' || !pathname.includes('/dashboard')) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const slug = getWorkspaceSlugFromPath();
        const response = await fetch(`/api/workspace?slug=${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // ถ้าไม่พบ workspace ให้ redirect ไปที่ default
            if (slug !== 'default') {
              router.push('/dashboard/default');
            }
            setError("ไม่พบ workspace หรือไม่มีสิทธิ์เข้าถึง");
          } else {
            setError("เกิดข้อผิดพลาดในการดึงข้อมูล workspace");
          }
          return;
        }
        
        const data = await response.json();
        setCurrentWorkspace(data.workspace);
      } catch (e) {
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล workspace");
        console.error("Error fetching current workspace:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    // ดึงข้อมูลทุกครั้งที่ URL เปลี่ยน
    fetchCurrentWorkspace();
  }, [pathname, sessionStatus, router]);
  
  // ดึงรายการ workspace ทั้งหมดที่ผู้ใช้เป็นสมาชิก
  useEffect(() => {
    const fetchUserWorkspaces = async () => {
      if (sessionStatus !== 'authenticated') return;
      
      try {
        const response = await fetch('/api/user/profile');
        
        if (!response.ok) {
          setError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
          return;
        }
        
        const data = await response.json();
        if (data.workspaces) {
          setUserWorkspaces(data.workspaces);
        }
      } catch (e) {
        console.error("Error fetching user workspaces:", e);
      }
    };
    
    // ดึงข้อมูลเมื่อเซสชันโหลดเสร็จ
    fetchUserWorkspaces();
  }, [sessionStatus]);
  
  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace,
      userWorkspaces,
      isLoading,
      error,
      switchWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
} 