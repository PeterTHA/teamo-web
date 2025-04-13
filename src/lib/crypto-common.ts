/**
 * ไฟล์นี้เป็นส่วนกลางสำหรับการเข้ารหัสและถอดรหัสที่ใช้ทั้งในฝั่ง client และ server
 * ใช้ base64 สำหรับ key, iv และ data เพื่อให้มั่นใจว่าการเข้ารหัสและถอดรหัสทำงานเหมือนกันในทุกสภาพแวดล้อม
 */

// ค่า secret key และ initialization vector ในรูปแบบ base64
// ค่าเหล่านี้ควรเก็บใน .env file ในโปรดักชัน
export const DEFAULT_KEY_BASE64 = process.env.ENCRYPTION_KEY_BASE64 || 'dGVhbW8tc2VjdXJlLWVuY3J5cHRpb24ta2V5LTMyLWJ5dGVzIQ=='; // "teamo-secure-encryption-key-32-bytes!"
export const DEFAULT_IV_BASE64 = process.env.ENCRYPTION_IV_BASE64 || 'dGVhbW8tMTZieXRlLWl2MDAh'; // "teamo-16byte-iv00!"

// ตรวจสอบว่ารันอยู่บนฝั่ง Client หรือ Server
export const isClient = typeof window !== 'undefined';

/**
 * สร้าง Buffer จาก base64 string (แบบปลอดภัยสำหรับทั้ง client และ server)
 */
export function base64ToBuffer(base64String: string): Uint8Array {
  if (isClient) {
    // ใช้ atob ในฝั่ง client (browser)
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else {
    // ใช้ Buffer ในฝั่ง server (Node.js)
    return Buffer.from(base64String, 'base64');
  }
}

/**
 * แปลง buffer เป็น base64 string (แบบปลอดภัยสำหรับทั้ง client และ server)
 */
export function bufferToBase64(buffer: Uint8Array): string {
  if (isClient) {
    // ใช้ btoa ในฝั่ง client (browser)
    const binary = Array.from(buffer).map(byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  } else {
    // ใช้ Buffer ในฝั่ง server (Node.js)
    return Buffer.from(buffer).toString('base64');
  }
}

/**
 * Base64 URL Encode - เข้ากันได้กับ URL
 * เปลี่ยน +/ เป็น -_ และลบ = ออก
 */
export function base64URLEncode(base64String: string): string {
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64 URL Decode - ถอดรหัสจาก URL-safe base64
 * เปลี่ยน -_ กลับเป็น +/ และเพิ่ม = กลับเข้าไป
 */
export function base64URLDecode(base64URLString: string): string {
  // เพิ่ม padding = กลับเข้าไป
  const padding = '='.repeat((4 - (base64URLString.length % 4)) % 4);
  
  // เปลี่ยน - และ _ กลับเป็น + และ /
  return (base64URLString + padding).replace(/-/g, '+').replace(/_/g, '/');
}

/**
 * เข้ารหัสข้อมูลเป็น URL-safe base64 สำหรับใช้ในพารามิเตอร์ URL
 */
export function encodeURLSafeBase64(data: string | object): string {
  // แปลงข้อมูลเป็น string ถ้าเป็น object
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  
  // เข้ารหัสเป็น base64 และแปลงเป็น URL-safe
  return base64URLEncode(bufferToBase64(new TextEncoder().encode(str)));
}

/**
 * ถอดรหัสข้อมูลจาก URL-safe base64
 */
export function decodeURLSafeBase64(encodedData: string): string {
  // ถอดรหัสจาก URL-safe base64
  const base64Str = base64URLDecode(encodedData);
  const buffer = base64ToBuffer(base64Str);
  
  // แปลงกลับเป็น string
  return new TextDecoder().decode(buffer);
}

/**
 * สร้าง hash ของข้อมูลในรูปแบบ base64
 */
export function generateRandomBytes(length: number = 32): Uint8Array {
  if (isClient) {
    // ใช้ Web Crypto API ในฝั่ง client
    return crypto.getRandomValues(new Uint8Array(length));
  } else {
    // ใช้ crypto module ในฝั่ง server
    const cryptoNode = require('crypto');
    return cryptoNode.randomBytes(length);
  }
}

/**
 * สร้าง key หรือ iv ใหม่ในรูปแบบ base64
 */
export function generateNewKeyBase64(length: number = 32): string {
  return bufferToBase64(generateRandomBytes(length));
}

/**
 * สร้าง token แบบ URL-safe
 */
export function generateToken(length: number = 32): string {
  return base64URLEncode(bufferToBase64(generateRandomBytes(length)));
}

// นี่คือค่าที่สร้างขึ้นใหม่เพื่อใช้ใน .env file
console.log('Generated new keys for .env:');
console.log(`ENCRYPTION_KEY_BASE64=${generateNewKeyBase64(32)}`);
console.log(`ENCRYPTION_IV_BASE64=${generateNewKeyBase64(16)}`); 