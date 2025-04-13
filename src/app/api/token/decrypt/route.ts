import { NextRequest, NextResponse } from "next/server";
import { decryptToObject } from "@/lib/crypto";

/**
 * API สำหรับถอดรหัส token ในฝั่ง server
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ตรวจสอบว่า Content-Type ถูกต้อง
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('[API:token/decrypt] Invalid content type:', contentType);
      return NextResponse.json(
        { error: 'Invalid content type', contentType },
        { status: 400 }
      );
    }

    // ดึงข้อมูลจาก request body
    const requestData = await request.json();
    const { token, email } = requestData || {};

    console.log('[API:token/decrypt] Received token length:', token?.length);
    console.log('[API:token/decrypt] Email from request:', email);

    // ตรวจสอบว่ามีโทเค็นส่งมาหรือไม่
    if (!token) {
      console.error('[API:token/decrypt] No token provided');
      return NextResponse.json(
        {
          error: 'No token provided',
          fallback: true,
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    try {
      // พยายามถอดรหัสโทเค็น
      console.log('[API:token/decrypt] Attempting to decrypt token of length:', token.length);
      
      // สำหรับดีบัก: แสดงส่วนของโทเค็น (ไม่แสดงทั้งหมดเพื่อความปลอดภัย)
      if (token.length > 20) {
        console.log('[API:token/decrypt] Token preview:', `${token.substring(0, 10)}...${token.substring(token.length - 10)}`);
      }
      
      const decryptedData = await decryptToObject(token);
      
      if (!decryptedData) {
        console.error('[API:token/decrypt] Failed to decrypt token - no data returned');
        throw new Error('Decryption failed - no data returned');
      }
      
      console.log('[API:token/decrypt] Successfully decrypted token:', 
        Object.keys(decryptedData).length > 0 ? 'Data found' : 'Empty data');
      
      return NextResponse.json({ 
        ...decryptedData, 
        _decrypted: true 
      });
    } catch (decryptError: any) {
      console.error('[API:token/decrypt] Failed to decrypt token:', decryptError);
      // ส่งข้อมูลสำรอง (fallback) ในกรณีที่ถอดรหัสไม่สำเร็จ
      return NextResponse.json({
        error: 'Failed to decrypt token',
        message: decryptError?.message || 'Unknown error',
        fallback: true,
        timestamp: Date.now(),
        tokenLength: token?.length,
      });
    }
  } catch (error: any) {
    console.error('[API:token/decrypt] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: error?.message || 'Unknown error',
        fallback: true,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
} 