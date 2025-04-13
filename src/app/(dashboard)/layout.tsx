import { Sidebar } from "@/components/layout/sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { WorkspaceProvider } from "@/components/workspace-context";
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: LayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-muted/10">{children}</main>
      </div>
      <Toaster />
    </WorkspaceProvider>
  );
} 