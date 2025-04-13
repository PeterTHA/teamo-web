import { prisma } from '../lib/db';

// เพิ่มฟังก์ชันตรวจสอบว่ารันอยู่ในเบราว์เซอร์หรือไม่
const isBrowser = () => typeof window !== 'undefined';

type LogActivityParams = {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any>;
};

/**
 * Log user activity throughout the system
 * 
 * @param params Activity log parameters
 * @returns Created activity log
 */
export async function logActivity({
  userId,
  action,
  entity,
  entityId,
  details
}: LogActivityParams) {
  try {
    // ตรวจสอบว่ารันอยู่ในเบราว์เซอร์หรือไม่
    if (isBrowser()) {
      console.log(`[Client-side] Activity log: ${action} on ${entity} ${entityId}`);
      return null; // ไม่ดำเนินการต่อถ้ารันในเบราว์เซอร์
    }

    const activityLog = await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });
    
    console.log(`Activity logged: ${action} on ${entity} ${entityId}`);
    return activityLog;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw to prevent breaking the main operation
    return null;
  }
}

/**
 * Log user login activity
 * 
 * @param userId User ID
 * @param details Additional login details like device, browser, IP
 * @returns Created activity log
 */
export async function logLogin(userId: string, details?: Record<string, any>) {
  // ตรวจสอบว่ารันอยู่ในเบราว์เซอร์หรือไม่
  if (isBrowser()) {
    console.log(`[Client-side] Login activity log for user: ${userId}`);
    return null;
  }

  const loginDetails = {
    timestamp: new Date().toISOString(),
    successful: true,
    ...details
  };

  return logActivity({
    userId,
    action: 'LOGIN',
    entity: 'AUTH',
    entityId: userId,
    details: loginDetails
  });
}

/**
 * Log user logout activity
 * 
 * @param userId User ID
 * @param details Additional logout details
 * @returns Created activity log
 */
export async function logLogout(userId: string, details?: Record<string, any>) {
  // ตรวจสอบว่ารันอยู่ในเบราว์เซอร์หรือไม่
  if (isBrowser()) {
    console.log(`[Client-side] Logout activity log for user: ${userId}`);
    return null;
  }

  const logoutDetails = {
    timestamp: new Date().toISOString(),
    ...details
  };

  return logActivity({
    userId,
    action: 'LOGOUT',
    entity: 'AUTH',
    entityId: userId,
    details: logoutDetails
  });
}

/**
 * Log failed login attempt
 * 
 * @param email Email that was used in the failed attempt
 * @param details Additional details about the failed login
 * @returns Created activity log
 */
export async function logFailedLogin(email: string, details?: Record<string, any>) {
  // ตรวจสอบว่ารันอยู่ในเบราว์เซอร์หรือไม่
  if (isBrowser()) {
    console.log(`[Client-side] Failed login activity log for email: ${email}`);
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  const userId = user?.id || 'unknown';
  
  const loginDetails = {
    timestamp: new Date().toISOString(),
    email,
    successful: false,
    ...details
  };

  return logActivity({
    userId,
    action: 'FAILED_LOGIN',
    entity: 'AUTH',
    entityId: userId,
    details: loginDetails
  });
}

/**
 * Get recent activities for a user
 * 
 * @param userId User ID
 * @param limit Number of activities to fetch
 * @returns List of recent activities
 */
export async function getRecentActivities(userId: string, limit = 10) {
  try {
    return await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to fetch recent activities:', error);
    return [];
  }
}

/**
 * Get entity activities
 * 
 * @param entity Entity type (e.g., 'employee', 'project')
 * @param entityId Entity ID
 * @param limit Number of activities to fetch
 * @returns List of entity activities
 */
export async function getEntityActivities(entity: string, entityId: string, limit = 10) {
  try {
    return await prisma.activityLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  } catch (error) {
    console.error('Failed to fetch entity activities:', error);
    return [];
  }
}

/**
 * Get all login/logout activities
 * 
 * @param limit Number of activities to fetch
 * @returns List of login/logout activities
 */
export async function getAuthActivities(limit = 50) {
  try {
    return await prisma.activityLog.findMany({
      where: { 
        action: { 
          in: ['LOGIN', 'LOGOUT', 'FAILED_LOGIN'] 
        } 
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  } catch (error) {
    console.error('Failed to fetch auth activities:', error);
    return [];
  }
} 