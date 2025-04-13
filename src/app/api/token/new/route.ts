import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';

// กำหนดค่า secret key และ initialization vector
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'teamo-secure-key-32-bytes-length!'; // ควรเป็น 32 ตัวอักษร (256 bit)
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'teamo-16byte-iv00'; // ต้องเป็น 16 ตัวอักษร (128 bit) พอดี

/**
 * API สำหรับสร้าง token แบบใหม่ที่ใช้ GCM
 */
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ content-type
    const contentType = request.headers.get("content-type");
    if (contentType !== "application/json") {
      return NextResponse.json(
        { error: "Content-Type ต้องเป็น application/json" },
        { status: 400 }
      );
    }

    // ดึงข้อมูลจาก request body
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลที่ต้องการเข้ารหัส" },
        { status: 400 }
      );
    }

    try {
      // แปลงข้อมูลเป็น string ถ้าเป็น object
      const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
      
      console.log('Creating new token with GCM, data length:', dataStr.length);
      
      // ตรวจสอบขนาดข้อมูล
      const isLargeData = dataStr.length > 200;
      console.log('Need compression:', isLargeData);
      
      // บีบอัดข้อมูลถ้าขนาดใหญ่เกินไป
      let compressedData = dataStr;
      let isCompressed = false;
      
      if (isLargeData) {
        try {
          const zlib = require('zlib');
          const compressed = zlib.deflateSync(dataStr);
          const compressedStr = compressed.toString('base64');
          
          // ใช้ข้อมูลที่บีบอัดแล้วถ้าสั้นกว่าข้อมูลต้นฉบับ
          if (compressedStr.length < dataStr.length) {
            compressedData = compressedStr;
            isCompressed = true;
            console.log('Data compressed from', dataStr.length, 'to', compressedData.length, 'chars');
          }
        } catch (compressError) {
          console.error('Error compressing data:', compressError);
          // ถ้าบีบอัดไม่สำเร็จ ใช้ข้อมูลเดิม
          isCompressed = false;
        }
      }
      
      // สร้าง key และ iv จาก ENV หรือค่า default
      const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
      const iv = Buffer.from(ENCRYPTION_IV.padEnd(16, '0').slice(0, 16));
      
      // แสดงข้อมูล key และ iv สำหรับการ debug (เฉพาะบางส่วน)
      console.log('Using key (first 10 chars):', ENCRYPTION_KEY.substring(0, 10));
      console.log('Using iv (first 10 chars):', ENCRYPTION_IV.substring(0, 10));
      
      // สร้าง cipher ด้วย AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      
      // เข้ารหัสข้อมูล
      let encrypted = cipher.update(compressedData, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // ดึง auth tag
      const authTag = cipher.getAuthTag().toString('base64');
      
      // แปลง Base64 เป็น URL-safe Base64
      // โดยแทนที่ + ด้วย - และ / ด้วย _ และลบ = ที่ใช้สำหรับ padding
      encrypted = encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const urlSafeAuthTag = authTag.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      // รวม encrypted data, auth tag และ compression flag ด้วยเครื่องหมาย .
      const token = `${encrypted}.${urlSafeAuthTag}.${isCompressed ? '1' : '0'}`;
      
      console.log('Successfully created token with GCM, compression:', isCompressed);
      console.log('Token (first 30 chars):', token.substring(0, 30) + '...');
      
      // ส่งข้อมูลกลับไป
      return NextResponse.json({
        token,
        originalToken: body.token
      });
    } catch (error) {
      console.error("Error creating token:", error);
      return NextResponse.json(
        { error: "ไม่สามารถสร้าง token ได้" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in token/new API:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดำเนินการ" },
      { status: 500 }
    );
  }
} 