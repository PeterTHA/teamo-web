/**
 * ฟังก์ชันการเข้ารหัสและถอดรหัสด้วย AES-256-GCM 
 * ที่ใช้ได้ทั้งในฝั่ง client และ server โดยใช้ base64 สำหรับ key, iv และ data
 */

import { 
  DEFAULT_KEY_BASE64, 
  DEFAULT_IV_BASE64, 
  isClient, 
  base64ToBuffer, 
  bufferToBase64, 
  base64URLEncode, 
  base64URLDecode 
} from './crypto-common';

// ========== ฟังก์ชัน GCM ใช้ในฝั่ง Server (Node.js) ==========

/**
 * เข้ารหัสข้อมูลด้วย AES-256-GCM ในฝั่ง server
 * 
 * @param data ข้อมูลที่ต้องการเข้ารหัส
 * @param keyBase64 key ในรูปแบบ base64 (ถ้าไม่ระบุจะใช้ค่าเริ่มต้น)
 * @param ivBase64 iv ในรูปแบบ base64 (ถ้าไม่ระบุจะใช้ค่าเริ่มต้น)
 * @returns ข้อมูลที่ถูกเข้ารหัสในรูปแบบ base64-url และมีรูปแบบ: {encryptedData}.{authTag}.{isCompressed}
 */
export async function encryptWithGCM(
  data: string | object, 
  keyBase64: string = DEFAULT_KEY_BASE64, 
  ivBase64: string = DEFAULT_IV_BASE64
): Promise<string> {
  if (isClient) {
    // เรียกใช้ API ในฝั่ง client
    return await encryptWithAPIFromClient(data);
  }
  
  try {
    // แปลงข้อมูลเป็น string ถ้าเป็น object
    let dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // ตรวจสอบขนาดข้อมูล
    const isLargeData = dataStr.length > 200;
    
    // บีบอัดข้อมูลถ้าขนาดใหญ่เกินไป
    let isCompressed = false;
    if (isLargeData) {
      try {
        const zlib = require('zlib');
        const compressedBuf = zlib.deflateSync(Buffer.from(dataStr, 'utf8'));
        const compressedStr = bufferToBase64(compressedBuf);
        
        // ใช้ข้อมูลที่บีบอัดแล้วถ้าสั้นกว่าข้อมูลต้นฉบับ
        if (compressedStr.length < dataStr.length) {
          dataStr = compressedStr;
          isCompressed = true;
        }
      } catch (compressError) {
        console.error('Error compressing data:', compressError);
        // ถ้าบีบอัดไม่สำเร็จ ใช้ข้อมูลเดิม
        isCompressed = false;
      }
    }
    
    // สร้าง key และ iv จาก base64
    const crypto = require('crypto');
    const key = base64ToBuffer(keyBase64);
    const iv = base64ToBuffer(ivBase64);
    
    // สร้าง cipher ด้วย AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // เข้ารหัสข้อมูลเป็น base64
    let encrypted = cipher.update(dataStr, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // ดึง auth tag แปลงเป็น base64
    const authTag = bufferToBase64(cipher.getAuthTag());
    
    // รวมข้อมูลที่เข้ารหัสแล้ว auth tag และ flag บอกว่าบีบอัดหรือไม่
    // ใช้ URL-safe base64 เพื่อความปลอดภัยในการส่งผ่าน URL
    const encryptedURLSafe = base64URLEncode(encrypted);
    const authTagURLSafe = base64URLEncode(authTag);
    
    return `${encryptedURLSafe}.${authTagURLSafe}.${isCompressed ? '1' : '0'}`;
  } catch (error) {
    console.error('GCM encryption error:', error);
    throw new Error('ไม่สามารถเข้ารหัสข้อมูลด้วย GCM ได้');
  }
}

/**
 * ถอดรหัสข้อมูลด้วย AES-256-GCM ในฝั่ง server
 * 
 * @param encryptedData ข้อมูลที่เข้ารหัสในรูปแบบ {encryptedData}.{authTag}.{isCompressed}
 * @param keyBase64 key ในรูปแบบ base64 (ถ้าไม่ระบุจะใช้ค่าเริ่มต้น)
 * @param ivBase64 iv ในรูปแบบ base64 (ถ้าไม่ระบุจะใช้ค่าเริ่มต้น)
 * @returns ข้อมูลที่ถูกถอดรหัสแล้ว
 */
export async function decryptWithGCM(
  encryptedData: string, 
  keyBase64: string = DEFAULT_KEY_BASE64, 
  ivBase64: string = DEFAULT_IV_BASE64
): Promise<string> {
  if (isClient) {
    // เรียกใช้ API ในฝั่ง client
    return await decryptWithAPIFromClient(encryptedData);
  }
  
  try {
    // แยกข้อมูลที่เข้ารหัส auth tag และ compression flag
    const parts = encryptedData.split('.');
    if (parts.length < 2) {
      throw new Error('รูปแบบข้อมูลที่เข้ารหัสไม่ถูกต้อง ต้องมีรูปแบบ: encryptedData.authTag[.isCompressed]');
    }
    
    // ถอดรหัส URL-safe base64
    const encryptedBase64 = base64URLDecode(parts[0]);
    const authTagBase64 = base64URLDecode(parts[1]);
    const isCompressed = parts.length > 2 && parts[2] === '1';
    
    // สร้าง key และ iv จาก base64
    const crypto = require('crypto');
    const key = base64ToBuffer(keyBase64);
    const iv = base64ToBuffer(ivBase64);
    
    // สร้าง decipher ด้วย AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    
    // ตั้งค่า auth tag
    decipher.setAuthTag(base64ToBuffer(authTagBase64));
    
    // ถอดรหัสข้อมูล
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    // คลายข้อมูลถ้าถูกบีบอัด
    if (isCompressed) {
      const zlib = require('zlib');
      // ข้อมูลที่ถูกบีบอัดจะเป็น base64 ต้องแปลงกลับเป็น buffer ก่อน
      const compressedBuffer = Buffer.from(decrypted, 'base64');
      const decompressedBuffer = zlib.inflateSync(compressedBuffer);
      return decompressedBuffer.toString('utf8');
    }
    
    return decrypted;
  } catch (error) {
    console.error('GCM decryption error:', error);
    
    // ถ้าถอดรหัสไม่สำเร็จ ให้ลอง CBC
    try {
      return await decryptWithCBC(encryptedData, keyBase64, ivBase64);
    } catch (cbcError) {
      console.error('Fallback to CBC failed:', cbcError);
      throw new Error('ไม่สามารถถอดรหัสข้อมูลด้วย GCM และ CBC ได้');
    }
  }
}

// ========== ฟังก์ชัน CBC เป็นตัวสำรอง ==========

/**
 * ถอดรหัสข้อมูลด้วย AES-256-CBC (สำรองกรณี GCM ล้มเหลว)
 */
async function decryptWithCBC(
  encryptedData: string,
  keyBase64: string = DEFAULT_KEY_BASE64,
  ivBase64: string = DEFAULT_IV_BASE64
): Promise<string> {
  try {
    // ถอดรหัส URL-safe base64 ถ้าจำเป็น
    let encryptedBase64 = encryptedData;
    if (encryptedData.includes('.')) {
      encryptedBase64 = base64URLDecode(encryptedData.split('.')[0]);
    }
    
    // สร้าง key และ iv จาก base64
    const crypto = require('crypto');
    const key = base64ToBuffer(keyBase64);
    const iv = base64ToBuffer(ivBase64);
    
    // สร้าง decipher ด้วย AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // ถอดรหัสข้อมูล
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('CBC decryption error:', error);
    throw error;
  }
}

// ========== ฟังก์ชันเรียกใช้ API ในฝั่ง Client ==========

/**
 * เข้ารหัสข้อมูลโดยเรียกใช้ API จากฝั่ง client
 */
async function encryptWithAPIFromClient(data: string | object): Promise<string> {
  const apiUrl = `${window.location.origin}/api/token/new`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.token;
  } catch (error) {
    console.error('API encryption error:', error);
    throw new Error('ไม่สามารถเข้ารหัสข้อมูลผ่าน API ได้');
  }
}

/**
 * ถอดรหัสข้อมูลโดยเรียกใช้ API จากฝั่ง client
 */
async function decryptWithAPIFromClient(
  encryptedData: string,
  email?: string,
  workspaceId?: string
): Promise<string> {
  const apiUrl = `${window.location.origin}/api/token/decrypt`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token: encryptedData,
        email,
        workspaceId
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // ตรวจสอบว่าผลลัพธ์เป็นข้อมูลที่ถอดรหัสได้หรือไม่
    if (result.error) {
      throw new Error(`API decryption error: ${result.error}`);
    }
    
    return typeof result === 'object' ? JSON.stringify(result) : result;
  } catch (error) {
    console.error('API decryption error:', error);
    throw new Error('ไม่สามารถถอดรหัสข้อมูลผ่าน API ได้');
  }
}

/**
 * ถอดรหัสข้อมูลเป็น Object
 */
export async function decryptToObject<T = any>(encryptedData: string): Promise<T> {
  try {
    const decryptedStr = await decryptWithGCM(encryptedData);
    
    // แปลงเป็น object
    try {
      return JSON.parse(decryptedStr) as T;
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      
      // ส่งคืนข้อมูลดิบเพื่อให้ application ไม่ล้ม
      return {
        error: "ไม่สามารถแปลงข้อมูลที่ถอดรหัสได้เป็น JSON",
        raw: decryptedStr,
        isRaw: true
      } as unknown as T;
    }
  } catch (error) {
    console.error('Error in decryptToObject:', error);
    
    // ส่งคืนข้อมูลเพื่อให้ application ไม่ล้ม
    return {
      error: "ไม่สามารถถอดรหัสข้อมูลได้",
      isRaw: true
    } as unknown as T;
  }
} 