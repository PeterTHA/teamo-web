import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ไม่ประมวลผลไฟล์ static
  if (
    pathname.includes('_next') || 
    pathname.includes('favicon.ico') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  console.log(`[Middleware] Processing request: ${pathname}`);

  // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้วหรือไม่
  const token = await getToken({ req: request });
  const isLoggedIn = !!token;
  console.log(`[Middleware] User is logged in: ${isLoggedIn}`);

  // เส้นทางที่ไม่จำเป็นต้องเข้าสู่ระบบ
  const isPublicRoute = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') || 
    pathname.startsWith('/invite') || 
    pathname.startsWith('/reset-password') ||
    pathname === '/';

  // เส้นทางที่เกี่ยวข้องกับ dashboard
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // ถ้าไม่ได้เข้าสู่ระบบและไม่ได้อยู่ในเส้นทางสาธารณะ ให้ redirect ไปที่หน้า login
  if (!isLoggedIn && !isPublicRoute) {
    console.log(`[Middleware] Redirecting to login page`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ถ้าเข้าสู่ระบบแล้วและอยู่ที่หน้าแรกหรือหน้า login/register ให้ redirect ไปที่ default workspace
  if (isLoggedIn && (pathname === '/' || isPublicRoute)) {
    console.log(`[Middleware] Logged in user on public route, redirecting to dashboard`);
    try {
      // ดึงข้อมูล workspace ที่เป็น default สำหรับผู้ใช้
      console.log(`[Middleware] Fetching user profile from API`);
      const response = await fetch(`${request.nextUrl.origin}/api/user/profile`, {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[Middleware] User profile API response: defaultWorkspace = ${JSON.stringify(data.defaultWorkspace || {})}`);
        
        if (data.defaultWorkspace) {
          // redirect ไปที่ dashboard ของ workspace ที่เป็น default
          console.log(`[Middleware] Redirecting to workspace: ${data.defaultWorkspace.slug}`);
          return NextResponse.redirect(new URL(`/dashboard/${data.defaultWorkspace.slug}`, request.url));
        } else {
          console.log(`[Middleware] No default workspace found, redirecting to default`);
        }
      } else {
        console.log(`[Middleware] Failed to fetch user profile, status: ${response.status}`);
      }
      
      // กรณีไม่พบ default workspace ให้ redirect ไปที่ default workspace
      console.log(`[Middleware] Redirecting to default workspace`);
      return NextResponse.redirect(new URL('/dashboard/default', request.url));
    } catch (error) {
      console.error('[Middleware] Error in middleware:', error);
      // กรณีมีข้อผิดพลาดให้ redirect ไปที่ default workspace
      return NextResponse.redirect(new URL('/dashboard/default', request.url));
    }
  }

  // กรณีเข้าสู่ระบบแล้วและอยู่ที่ /dashboard โดยที่ไม่ระบุ workspace
  if (isLoggedIn && pathname === '/dashboard') {
    console.log(`[Middleware] Logged in user at /dashboard, redirecting to specific workspace`);
    try {
      // ดึงข้อมูล workspace ที่เป็น default สำหรับผู้ใช้
      console.log(`[Middleware] Fetching user profile from API`);
      const response = await fetch(`${request.nextUrl.origin}/api/user/profile`, {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[Middleware] User profile API response: defaultWorkspace = ${JSON.stringify(data.defaultWorkspace || {})}`);
        
        if (data.defaultWorkspace) {
          // redirect ไปที่ dashboard ของ workspace ที่เป็น default
          console.log(`[Middleware] Redirecting to workspace: ${data.defaultWorkspace.slug}`);
          return NextResponse.redirect(new URL(`/dashboard/${data.defaultWorkspace.slug}`, request.url));
        } else {
          console.log(`[Middleware] No default workspace found, redirecting to default`);
        }
      } else {
        console.log(`[Middleware] Failed to fetch user profile, status: ${response.status}`);
      }
      
      // กรณีไม่พบ default workspace ให้ redirect ไปที่ default workspace
      console.log(`[Middleware] Redirecting to default workspace`);
      return NextResponse.redirect(new URL('/dashboard/default', request.url));
    } catch (error) {
      console.error('[Middleware] Error in middleware:', error);
      // กรณีมีข้อผิดพลาดให้ redirect ไปที่ default workspace
      return NextResponse.redirect(new URL('/dashboard/default', request.url));
    }
  }

  console.log(`[Middleware] Continuing to next middleware`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}; 