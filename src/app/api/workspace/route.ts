import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * API endpoint to get workspace information
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the workspace slug from URL query parameter
    const slug = req.nextUrl.searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ error: "Workspace slug is required" }, { status: 400 });
    }
    
    // Check if user has access to this workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspace: { slug },
        status: "ACTIVE"
      },
      include: {
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
    });
    
    if (!workspaceMember) {
      // If not found, check if it's the default workspace
      if (slug === "default") {
        return NextResponse.json({
          workspace: {
            id: "default",
            name: "Default Workspace",
            slug: "default",
            status: "ACTIVE"
          }
        });
      }
      
      return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      workspace: workspaceMember.workspace,
      role: workspaceMember.role
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 