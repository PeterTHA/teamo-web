import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * API endpoint to get user profile with workspaces and permissions
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get user with their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            nickname: true,
            departmentId: true,
            teamId: true,
            positionId: true,
            status: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            team: {
              select: {
                id: true,
                name: true
              }
            },
            position: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        // Get all workspaces where user is a member
        workspaceMember: {
          select: {
            id: true,
            role: true,
            status: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                status: true,
                planType: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform the data to a cleaner format
    const workspaces = user.workspaceMember.map(member => ({
      id: member.workspace.id,
      name: member.workspace.name,
      slug: member.workspace.slug,
      logo: member.workspace.logo,
      status: member.workspace.status,
      planType: member.workspace.planType,
      userRole: member.role,
      memberStatus: member.status,
      isDefault: member.workspace.slug === 'default' || member.workspace.slug === 'demo-corp'
    }));

    // Log all available workspaces
    console.log("[API:user/profile] Available workspaces:", workspaces.map(w => ({ 
      slug: w.slug, 
      status: w.status, 
      isDefault: w.isDefault 
    })));

    // Find default workspace (prefer active ones)
    const defaultWorkspace = workspaces.find(w => w.status === 'ACTIVE' && w.isDefault) || 
                             workspaces.find(w => w.isDefault) ||
                             workspaces.find(w => w.status === 'ACTIVE') ||
                             workspaces[0];
    
    console.log("[API:user/profile] Selected default workspace:", defaultWorkspace ? 
      { slug: defaultWorkspace.slug, status: defaultWorkspace.status, isDefault: defaultWorkspace.isDefault } : 'None found');

    // Build permissions based on user role and workspace roles
    const permissions = {
      isAdmin: user.role === 'ADMIN' || user.role === 'SUPERADMIN',
      isSuperAdmin: user.role === 'SUPERADMIN',
      canManageUsers: user.role === 'SUPERADMIN' || user.role === 'ADMIN',
      canManageWorkspaces: user.role === 'SUPERADMIN',
      canViewReports: true,
      canManageEmployees: user.role === 'SUPERADMIN' || user.role === 'ADMIN' || 
                        user.workspaceMember.some(m => m.role === 'OWNER' || m.role === 'ADMIN')
    };

    // Return the profile data
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.image,
        employee: user.employee
      },
      workspaces,
      defaultWorkspace,
      permissions,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}