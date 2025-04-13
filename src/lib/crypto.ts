import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { Crypto } from '@peculiar/webcrypto';

// ตรวจสอบว่ารันอยู่บนฝั่ง Client หรือ Server
const isClient = typeof window !== 'undefined';

// สร้าง WebCrypto instance สำหรับใช้ในฝั่ง server
const webCrypto = isClient ? (window.crypto) : new Crypto();

// กำหนดค่า secret key และ initialization vector
// ในการใช้งานจริง ควรเก็บค่าเหล่านี้ในไฟล์ .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'teamo-secure-key-32-bytes-length!'; // ควรเป็น 32 ตัวอักษร (256 bit)
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'teamo-16byte-iv00'; // ต้องเป็น 16 ตัวอักษร (128 bit) พอดี
const ENCRYPTION_AUTH_TAG_LENGTH = 16; // ความยาว auth tag สำหรับ GCM (บิต)

// ค่าคงที่สำหรับการบีบอัดข้อมูล
const COMPRESSION_THRESHOLD = 200;

// ========== ฟังก์ชันสำหรับใช้งานในฝั่ง server ==========

/**
 * เข้ารหัสข้อมูลในฝั่ง server
 */
function encryptServer(data: string | object): string {
  try {
    console.log('Encrypting in server side, data length:', typeof data === 'string' ? data.length : JSON.stringify(data).length);
    
    // แปลง object เป็น string ถ้าจำเป็น
    let dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // สร้าง key และ iv
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const iv = Buffer.from(ENCRYPTION_IV.padEnd(16, '0').slice(0, 16));
    
    // บีบอัดข้อมูลหากมีขนาดใหญ่
    let isCompressed = false;
    
    // บีบอัดข้อมูลหากมีขนาดใหญ่กว่า compression threshold
    if (dataStr.length > COMPRESSION_THRESHOLD) {
      try {
        console.log('Data exceeds compression threshold, compressing...');
        const zlib = require('zlib');
        const compressedData = zlib.deflateSync(dataStr).toString('base64');
        
        // ใช้ข้อมูลที่บีบอัดเฉพาะเมื่อมีขนาดเล็กกว่าข้อมูลดิบ
        if (compressedData && compressedData.length < dataStr.length) {
          console.log('Compression successful. Original size:', dataStr.length, 'Compressed size:', compressedData.length);
          dataStr = compressedData;
          isCompressed = true;
        } else {
          console.log('Compression did not reduce size, using original data');
        }
      } catch (compressionError) {
        console.error('Error compressing data:', compressionError);
        // ใช้ข้อมูลเดิมถ้าบีบอัดไม่สำเร็จ
      }
    }
    
    // สร้าง cipher ด้วย AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // เข้ารหัสข้อมูล
    let encrypted = cipher.update(dataStr, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // ดึง auth tag (16 bytes)
    const authTag = cipher.getAuthTag().toString('base64');
    
    // แปลง base64 ให้เป็น URL-safe โดยแทนที่ + ด้วย - และ / ด้วย _
    encrypted = encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const urlSafeAuthTag = authTag.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // สร้างข้อความที่เข้ารหัส โดยเชื่อมรหัสข้อมูลและ auth tag ด้วยจุด แล้วเพิ่มสถานะการบีบอัด
    const finalEncrypted = `${encrypted}.${urlSafeAuthTag}.${isCompressed ? '1' : '0'}`;
    
    console.log('Encryption successful, result length:', finalEncrypted.length);
    return finalEncrypted;
  } catch (error) {
    console.error('Server encryption error:', error);
    throw error;
  }
}

/**
 * ถอดรหัสข้อมูลในฝั่ง server
 */
const decryptServer = (
  encryptedData: string,
  algorithm = 'aes-256-gcm'
): string => {
  try {
    console.log('[S] Attempting to decrypt with', algorithm);

    // ลบช่องว่างทั้งหมดก่อน
    encryptedData = encryptedData.trim().replace(/\s+/g, '');
    
    // ตรวจสอบว่ามีการ URL encoding หรือไม่
    if (encryptedData.includes('%')) {
      try {
        console.log('[S] Detected URL encoding, decoding...');
        encryptedData = decodeURIComponent(encryptedData);
      } catch (decodeError) {
        console.error('[S] Error decoding URL encoded data:', decodeError);
      }
    }
    
    console.log('[S] After whitespace removal, length:', encryptedData.length, 'data:', encryptedData.substring(0, 20) + '...');

    // แยกข้อมูลที่เข้ารหัสไว้, auth tag และ compression flag
    const parts = encryptedData.split('.');
    if (parts.length !== 3) {
      console.log('[S] Failed to split encryptedData. Expected 3 parts but got', parts.length);
      throw new Error('Invalid encrypted data format');
    }
    
    // แปลง URL-safe Base64 กลับเป็น Base64 มาตรฐาน
    let encryptedText = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    // เพิ่ม padding กลับคืนถ้าจำเป็น
    while (encryptedText.length % 4) {
      encryptedText += '=';
    }
    
    let authTag = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // เพิ่ม padding กลับคืนถ้าจำเป็น
    while (authTag.length % 4) {
      authTag += '=';
    }
    
    const isCompressed = parts[2] === '1';

    console.log('[S] Processing encrypted parts:');
    console.log('[S] - Encrypted text length:', encryptedText.length);
    console.log('[S] - Auth tag length:', authTag.length);
    console.log('[S] - Is compressed:', isCompressed);
    
    // ถ้าเป็นโทเค็นจาก URL ให้ลองใช้ค่าดีฟอลต์
    try {
      return decryptWithKeyAndIV(encryptedText, authTag, isCompressed, algorithm);
    } catch (defaultKeyError) {
      console.error('[S] Failed with default key/IV:', defaultKeyError);
      
      // ถ้าเราใช้ algorithm GCM แล้วไม่สำเร็จ ให้ลองใช้ CBC
      if (algorithm === 'aes-256-gcm') {
        console.log('[S] GCM decryption failed, attempting CBC fallback');
        try {
          return decryptServer(encryptedData, 'aes-256-cbc');
        } catch (cbcError) {
          console.error('[S] CBC fallback also failed:', cbcError);
          
          // ถ้าทั้ง GCM และ CBC ไม่สำเร็จ ให้ลองใช้ key และ iv หลายๆ แบบ
          console.log('[S] Trying with alternative key/IV combinations');
          
          // ลองใช้ key และ iv หลายๆ แบบ
          const altKeys = [
            process.env.ALT_ENCRYPTION_KEY || 'teamo-secure-key-32-bytes-length!',
            'teamo-secure-key-32-bytes-length!'
          ];
          
          const altIVs = [
            process.env.ALT_ENCRYPTION_IV || 'teamo-16byte-iv00',
            'teamo-16byte-iv00'
          ];
          
          for (const altKey of altKeys) {
            for (const altIV of altIVs) {
              try {
                console.log('[S] Trying with alternative key/IV');
                return decryptWithKeyAndIV(encryptedText, authTag, isCompressed, algorithm, altKey, altIV);
              } catch (altError) {
                // ไม่ต้อง log ทุกครั้ง เพราะจะเยอะเกินไป
              }
            }
          }
          
          // ถ้าทุกวิธีไม่สำเร็จ ให้โยน error ออกไป
          throw defaultKeyError;
        }
      } else {
        throw defaultKeyError;
      }
    }
  } catch (error) {
    console.error('[S] Failed to decrypt with', algorithm, ':', error);
    throw error;
  }
};

/**
 * ฟังก์ชันย่อยสำหรับถอดรหัสด้วย key และ iv ที่ระบุ
 */
function decryptWithKeyAndIV(
  encryptedText: string,
  authTag: string,
  isCompressed: boolean,
  algorithm = 'aes-256-gcm',
  customKey?: string,
  customIV?: string
): string {
  // เตรียม key และ iv
  const keyStr = customKey || ENCRYPTION_KEY;
  const ivStr = customIV || ENCRYPTION_IV;
  
  const key = Buffer.from(keyStr.padEnd(32, '0').slice(0, 32));
  const iv = Buffer.from(ivStr.padEnd(16, '0').slice(0, 16));
  
  console.log('[S] Using key (first 8 chars):', keyStr.substring(0, 8));
  console.log('[S] Using iv (first 8 chars):', ivStr.substring(0, 8));

  // สร้าง decipher
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  // ตั้งค่า auth tag สำหรับ GCM mode
  if (algorithm === 'aes-256-gcm') {
    try {
      (decipher as any).setAuthTag(Buffer.from(authTag, 'base64'));
    } catch (authTagError) {
      console.error('[S] Error setting auth tag:', authTagError);
      throw new Error('Invalid auth tag');
    }
  }

  // ถอดรหัส
  try {
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log('[S] Decryption successful, checking for compression');

    // ถ้ามีการบีบอัดข้อมูล ให้ทำการคลายการบีบอัด
    if (isCompressed) {
      console.log('[S] Data is compressed, attempting to decompress');
      try {
        const zlib = require('zlib');
        const compressedBuffer = Buffer.from(decrypted, 'base64');
        const decompressedData = zlib.inflateSync(compressedBuffer).toString();
        console.log('[S] Successfully decompressed data');
        return decompressedData;
      } catch (decompressError) {
        console.error('[S] Failed to decompress data:', decompressError);
        // ถ้าการคลายการบีบอัดล้มเหลว ใช้ข้อมูลที่ถอดรหัสแล้ว
        return decrypted;
      }
    }

    console.log('[S] Successfully decrypted data (not compressed)');
    return decrypted;
  } catch (decryptError) {
    console.error('[S] Error during decryption with specified key/IV:', decryptError);
    throw decryptError;
  }
}

// ========== ฟังก์ชันสำหรับใช้งานในฝั่ง client ==========

/**
 * เข้ารหัสข้อมูลในฝั่ง client ใช้ WebCrypto API
 */
async function encryptClient(data: any): Promise<string> {
  try {
    // ถ้าข้อมูลเป็น object แปลงเป็น string ก่อน
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    console.log('Client encrypting data with WebCrypto GCM, length:', plaintext.length);

    // ใช้ API สำหรับเข้ารหัสโดยตรง
    try {
      const apiUrl = window.location.origin || 'http://localhost:3000';
      console.log('Using API for encryption from client side');
      
      const response = await fetch(`${apiUrl}/api/token/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });
      
      if (!response.ok) {
        throw new Error('API encryption failed');
      }
      
      const result = await response.json();
      console.log('Successfully encrypted with API');
      return result.token;
    } catch (apiError) {
      console.error('Error using API for encryption:', apiError);
      
      // ถ้าไม่สามารถใช้ API ได้ ให้ใช้ WebCrypto เอง
      if (window.crypto && window.crypto.subtle) {
        console.log('Using WebCrypto for GCM encryption');
        
        try {
          // แปลง key และ iv เป็น ArrayBuffer
          const encoder = new TextEncoder();
          const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
          const ivData = encoder.encode(ENCRYPTION_IV.padEnd(16, '0').slice(0, 16));
          
          // สร้าง CryptoKey
          const key = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
          );
          
          // เข้ารหัสข้อมูล
          const encodedData = encoder.encode(plaintext);
          const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
              name: 'AES-GCM',
              iv: ivData,
              tagLength: ENCRYPTION_AUTH_TAG_LENGTH * 8 // ต้องระบุเป็นบิต
            },
            key,
            encodedData
          );
          
          // แปลงผลลัพธ์เป็น base64
          const encryptedArray = new Uint8Array(encryptedBuffer);
          const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
          
          // เนื่องจาก WebCrypto จะรวม auth tag ไว้ในผลลัพธ์แล้ว เราจะสร้าง dummy auth tag และ flag
          return `${encryptedBase64}.webcrypto.0`;
        } catch (webCryptoError) {
          console.error('WebCrypto encryption failed:', webCryptoError);
          throw new Error('ไม่สามารถเข้ารหัสข้อมูลด้วย WebCrypto ได้');
        }
      } else {
        throw new Error('ไม่พบ WebCrypto API และไม่สามารถเชื่อมต่อกับ API ได้');
      }
    }
  } catch (error) {
    console.error('Client encryption error:', error);
    throw new Error('ไม่สามารถเข้ารหัสข้อมูลได้');
  }
}

/**
 * ถอดรหัสข้อมูลในฝั่ง client ใช้ WebCrypto API
 */
async function decryptClient(encryptedData: any): Promise<string> {
  try {
    // ตรวจสอบว่า encryptedData เป็น object หรือไม่
    if (typeof encryptedData === 'object') {
      return JSON.stringify(encryptedData);
    }
    
    // ตรวจสอบว่า encryptedData เป็น string หรือไม่
    if (typeof encryptedData !== 'string') {
      throw new Error('ข้อมูลที่จะถอดรหัสต้องเป็น string');
    }
    
    // ตรวจสอบและลบช่องว่างออกจาก encryptedData
    encryptedData = encryptedData.replace(/\s+/g, '');
    
    // แยกส่วนประกอบของข้อมูลที่เข้ารหัส
    const parts = encryptedData.split('.');
    const encryptedText = parts[0];
    const authTag = parts.length > 1 ? parts[1] : null;
    
    // ถ้าเป็น GCM token (มี .) ให้เรียกใช้ API ในการถอดรหัส
    if (authTag) {
      console.log('GCM token detected in client side, using API for decryption');
      
      try {
        const apiUrl = window.location.origin || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/token/decrypt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: encryptedData }),
        });
        
        if (!response.ok) {
          throw new Error('API decryption failed');
        }
        
        const result = await response.json();
        console.log('Successfully decrypted with API');
        return JSON.stringify(result);
      } catch (apiError) {
        console.error('Error using API for decryption:', apiError);
        
        // ถ้า token มีรูปแบบ webcrypto จะใช้ WebCrypto API
        if (authTag === 'webcrypto' && window.crypto && window.crypto.subtle) {
          console.log('Using WebCrypto for decryption');
          
          try {
            // แปลง key และ iv เป็น ArrayBuffer
            const encoder = new TextEncoder();
            const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
            const ivData = encoder.encode(ENCRYPTION_IV.padEnd(16, '0').slice(0, 16));
            
            // สร้าง CryptoKey
            const key = await window.crypto.subtle.importKey(
              'raw',
              keyData,
              { name: 'AES-GCM' },
              false,
              ['decrypt']
            );
            
            // แปลง base64 เป็น ArrayBuffer
            const encryptedBytes = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
            
            // ถอดรหัสข้อมูล
            const decryptedBuffer = await window.crypto.subtle.decrypt(
              {
                name: 'AES-GCM',
                iv: ivData,
                tagLength: ENCRYPTION_AUTH_TAG_LENGTH * 8 // ต้องระบุเป็นบิต
              },
              key,
              encryptedBytes
            );
            
            // แปลงผลลัพธ์เป็น string
            const decoder = new TextDecoder();
            const decryptedText = decoder.decode(decryptedBuffer);
            
            return decryptedText;
          } catch (webCryptoError) {
            console.error('WebCrypto decryption failed:', webCryptoError);
            throw new Error('ไม่สามารถถอดรหัสข้อมูลด้วย WebCrypto ได้');
          }
        } else {
          throw new Error('ไม่สามารถถอดรหัสโทเค็น GCM ในฝั่ง client ได้');
        }
      }
    } else {
      // หากไม่มีรูปแบบ GCM ก็ไม่สามารถถอดรหัสได้
      console.error('Non-GCM format token cannot be decrypted');
      throw new Error('ไม่สามารถถอดรหัสข้อมูลที่ไม่ได้ใช้ GCM');
    }
  } catch (error) {
    console.error('Client decryption error:', error);
    throw new Error('ไม่สามารถถอดรหัสข้อมูลได้ หรือข้อมูลไม่ถูกต้อง');
  }
}

/**
 * ปรับปรุงรูปแบบ token ให้พร้อมสำหรับการถอดรหัส
 * แก้ไขปัญหาเรื่อง URL encoding และ whitespace
 */
function normalizeToken(token: string): string {
  try {
    console.log('Normalizing token, original length:', token.length);
    
    // ตรวจสอบว่ามีการ URL encoding หรือไม่
    if (token.includes('%')) {
      try {
        console.log('Detected URL encoding, decoding...');
        token = decodeURIComponent(token);
        console.log('Decoded URL encoded token, new length:', token.length);
      } catch (decodeError) {
        console.error('Error decoding URL encoded token:', decodeError);
        // หากถอดรหัส URL ไม่สำเร็จ ใช้ข้อมูลเดิมต่อไป
      }
    }
    
    // ลบช่องว่างทั้งหมด
    token = token.replace(/\s+/g, '');
    
    // แก้ไขปัญหาเครื่องหมาย + ที่อาจถูกแปลงเป็นช่องว่างใน URL
    // ถ้าเป็น token แบบ GCM (มีจุด) ให้ตรวจสอบและแก้ไขแต่ละส่วน
    if (token.includes('.')) {
      const parts = token.split('.');
      
      // ตรวจสอบว่ามีปัญหาเรื่อง + หรือไม่
      // ในการเข้ารหัส base64 ปกติจะมีเครื่องหมาย + และ / ซึ่งเป็นปัญหาใน URL
      // ถ้ามีเครื่องหมาย - หรือ _ (ซึ่งเป็น URL-safe base64) แต่ไม่มี + หรือ /
      // แสดงว่าควรจะมี + หรือ / แต่อาจถูกแปลงแล้ว
      const hasUrlSafeChars = parts[0].includes('-') || parts[0].includes('_');
      const hasStandardBase64Chars = parts[0].includes('+') || parts[0].includes('/');
      
      if (hasUrlSafeChars && !hasStandardBase64Chars) {
        console.log('Token appears to be in URL-safe format but missing + or /, converting...');
        // แปลงกลับเป็น base64 มาตรฐาน
        parts[0] = parts[0].replace(/-/g, '+').replace(/_/g, '/');
        if (parts.length > 1) {
          parts[1] = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        }
        token = parts.join('.');
      }
    }
    
    console.log('Normalized token:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('Error normalizing token:', error);
    return token; // ส่งคืนค่าเดิมในกรณีที่มีข้อผิดพลาด
  }
}

/**
 * เข้ารหัสข้อมูลด้วย AES-256 สำหรับทั้งฝั่ง client และ server
 * 
 * ฝั่ง server: ใช้ GCM
 * ฝั่ง client: WebCrypto API เพื่อใช้ GCM, หากไม่สามารถใช้ได้จะเรียกใช้ API แทน
 * 
 * @param data ข้อมูลที่ต้องการเข้ารหัส
 * @returns ข้อมูลที่ถูกเข้ารหัสแล้ว
 */
export async function encrypt(data: any): Promise<string> {
  try {
    // ถ้าอยู่ฝั่ง client
    if (isClient) {
      return await encryptClient(data);
    } else {
      // ฝั่ง server
      return encryptServer(data);
    }
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('ไม่สามารถเข้ารหัสข้อมูลได้');
  }
}

/**
 * ถอดรหัสข้อมูลที่ถูกเข้ารหัสด้วย AES-256
 * @param encryptedData ข้อมูลที่ถูกเข้ารหัส
 * @returns ข้อมูลที่ถูกถอดรหัสแล้ว
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    // ปรับปรุงรูปแบบ token
    if (typeof encryptedData === 'string') {
      encryptedData = normalizeToken(encryptedData);
    }
    
    // ถ้าอยู่ฝั่ง client
    if (isClient) {
      return await decryptClient(encryptedData);
    } else {
      // ถ้าอยู่ฝั่ง server ใช้ decryptServer
      return decryptServer(encryptedData);
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('ไม่สามารถถอดรหัสข้อมูลได้ หรือข้อมูลไม่ถูกต้อง');
  }
}

/**
 * สร้าง hash ของข้อมูลด้วย SHA-256
 * @param data ข้อมูลที่ต้องการสร้าง hash
 * @returns hash ในรูปแบบ hex
 */
export async function hash(data: string): Promise<string> {
  if (isClient) {
    return CryptoJS.SHA256(data).toString();
  } else {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * ตรวจสอบ hash ของข้อมูล
 * @param data ข้อมูลที่ต้องการตรวจสอบ
 * @param hashedData hash ที่ต้องการตรวจสอบ
 * @returns true ถ้า hash ตรงกัน, false ถ้าไม่ตรงกัน
 */
export async function verifyHash(data: string, hashedData: string): Promise<boolean> {
  const dataHash = await hash(data);
  return dataHash === hashedData;
}

/**
 * สร้าง token สำหรับ CSRF protection
 * @returns token สำหรับ CSRF protection
 */
export async function generateCSRFToken(): Promise<string> {
  if (isClient) {
    const randomWords = CryptoJS.lib.WordArray.random(16);
    return randomWords.toString(CryptoJS.enc.Hex);
  } else {
    return crypto.randomBytes(32).toString('hex');
  }
}

/**
 * เข้ารหัสพารามิเตอร์สำหรับใช้ใน URL
 * @param params อ็อบเจกต์ที่มีพารามิเตอร์ที่ต้องการเข้ารหัส
 * @returns พารามิเตอร์ที่ถูกเข้ารหัสพร้อมใช้ใน URL ในรูปแบบ enc=encoded_data
 */
export async function encryptURLParams(params: Record<string, any>): Promise<string> {
  // เข้ารหัสข้อมูลด้วย encrypt และแปลงให้ปลอดภัยสำหรับใส่ใน URL
  const encrypted = await encrypt(params);
  const urlSafeEncrypted = encodeURIComponent(encrypted);
  
  return `encrypted=${urlSafeEncrypted}`;
}

/**
 * ถอดรหัสพารามิเตอร์จาก URL
 * @param encryptedParams พารามิเตอร์ที่ถูกเข้ารหัสจาก URL (encrypted=...)
 * @returns อ็อบเจกต์ที่มีพารามิเตอร์ที่ถูกถอดรหัสแล้ว
 */
export async function decryptURLParams<T>(encryptedParam: string): Promise<T> {
  try {
    // ตัด 'encrypted=' ออกถ้ามี
    const encryptedData = encryptedParam.startsWith('encrypted=') 
      ? encryptedParam.substring(10)
      : encryptedParam;
    
    const decoded = decodeURIComponent(encryptedData);
    return await decryptToObject<T>(decoded);
  } catch (error) {
    console.error('URL params decryption error:', error);
    throw new Error('ไม่สามารถถอดรหัสพารามิเตอร์ URL ได้');
  }
}

/**
 * สร้าง URL ที่มีพารามิเตอร์ที่ถูกเข้ารหัส
 * @param baseUrl URL พื้นฐาน (เช่น /invite)
 * @param params พารามิเตอร์ที่ต้องการเข้ารหัส
 * @returns URL ที่มีพารามิเตอร์ที่ถูกเข้ารหัส
 */
export async function createSecureURL(baseUrl: string, params: Record<string, any>): Promise<string> {
  try {
    const encryptedParams = await encryptURLParams(params);
    const connector = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${connector}${encryptedParams}`;
  } catch (error) {
    console.error('Error creating secure URL:', error);
    // หากเกิดข้อผิดพลาดในการเข้ารหัส ให้สร้าง URL แบบธรรมดา
    const params_str = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    const connector = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${connector}${params_str}`;
  }
}

/**
 * รับพารามิเตอร์จาก URL และถอดรหัสถ้าจำเป็น
 * สำหรับใช้ในฝั่ง client ที่ต้องการดึงข้อมูลจาก URL
 */
export async function getDecryptedParams(searchParams: URLSearchParams): Promise<Record<string, any> | null> {
  try {
    console.log('getDecryptedParams searchParams:', searchParams);
    
    // ถ้ามี token ให้ถอดรหัสและส่งคืน
    const token = searchParams.get('token');
    
    if (token) {
      console.log('Found token in URL, attempting to decrypt:', token);
      
      // ใช้ API สำหรับถอดรหัส token ที่เป็น GCM
      if (token.includes('.')) {
        try {
          console.log('GCM token detected, using API for decryption');
          
          const apiUrl = window.location.origin || 'http://localhost:3000';
          const response = await fetch(`${apiUrl}/api/token/decrypt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              token,
              email: searchParams.get('email'),
              workspaceId: searchParams.get('workspaceId')
            }),
          });
          
          if (!response.ok) {
            console.error('API decryption failed:', response.statusText);
            // ใช้ข้อมูลจาก URL แทน
            return extractParamsFromURL(searchParams);
          }
          
          const result = await response.json();
          console.log('Decrypted token result:', result);
          
          return result;
        } catch (apiError) {
          console.error('Error using API for decryption:', apiError);
          // ใช้ข้อมูลจาก URL แทน
          return extractParamsFromURL(searchParams);
        }
      } else {
        // ถ้าเป็น token แบบเดิม (CBC) ไม่มีจุด
        try {
          const decryptedData = await decrypt(token);
          try {
            const parsedData = JSON.parse(decryptedData);
            console.log('Successfully parsed decrypted data:', parsedData);
            return parsedData;
          } catch (parseError) {
            console.error('Error parsing decrypted data:', parseError);
            return { token: decryptedData };
          }
        } catch (decryptError) {
          console.error('Failed to decrypt token:', decryptError);
          // ใช้ข้อมูลจาก URL แทน
          return extractParamsFromURL(searchParams);
        }
      }
    }
    
    // ถ้าไม่มี token ให้รวบรวมพารามิเตอร์จาก URL
    return extractParamsFromURL(searchParams);
  } catch (error) {
    console.error('Error in getDecryptedParams:', error);
    return null;
  }
}

/**
 * สกัดพารามิเตอร์จาก URL
 */
function extractParamsFromURL(searchParams: URLSearchParams): Record<string, any> {
  const params: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  // ตรวจสอบว่ามีพารามิเตอร์อย่างน้อย 1 ตัว
  if (Object.keys(params).length > 0) {
    console.log('Using raw parameters from URL:', params);
    return params;
  }
  
  // ไม่มีพารามิเตอร์ใดๆ - ส่งคืนอ็อบเจกต์ว่าง
  console.log('No parameters found in URL, returning empty object');
  return {};
}

// ฟังก์ชันแบบ synchronous สำหรับความเข้ากันได้กับโค้ดเดิม
// ใช้เฉพาะในฝั่ง server เท่านั้น

export function encryptSync(data: string | object): string {
  if (isClient) {
    throw new Error('encryptSync สามารถใช้ได้เฉพาะในฝั่ง server เท่านั้น');
  }
  
  return encryptServer(data);
}

export function decryptSync(encryptedData: string): string {
  if (isClient) {
    throw new Error('decryptSync สามารถใช้ได้เฉพาะในฝั่ง server เท่านั้น');
  }
  
  return decryptServer(encryptedData);
}

export function decryptToObjectSync<T>(encryptedData: any): T {
  if (isClient) {
    throw new Error('decryptToObjectSync สามารถใช้ได้เฉพาะในฝั่ง server เท่านั้น');
  }
  
  // ตรวจสอบว่าข้อมูลเป็น object อยู่แล้วหรือไม่
  if (typeof encryptedData === 'object') {
    return encryptedData as T;
  }
  
  const decrypted = decryptServer(encryptedData);
  
  try {
    return JSON.parse(decrypted) as T;
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Raw data:', decrypted);
    throw new Error('ไม่สามารถแปลงข้อมูลเป็น object ได้');
  }
}

export function hashSync(data: string): string {
  if (isClient) {
    throw new Error('hashSync สามารถใช้ได้เฉพาะในฝั่ง server เท่านั้น');
  }
  
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function verifyHashSync(data: string, hashedData: string): boolean {
  if (isClient) {
    throw new Error('verifyHashSync สามารถใช้ได้เฉพาะในฝั่ง server เท่านั้น');
  }
  
  const dataHash = hashSync(data);
  return dataHash === hashedData;
}

export function generateCSRFTokenSync(): string {
  if (isClient) {
    throw new Error('generateCSRFTokenSync สามารถใช้ได้เฉพาะในฝั่ง server เท่านั้น');
  }
  
  return crypto.randomBytes(32).toString('hex');
}

/**
 * ถอดรหัสข้อมูลเป็น Object
 */
export async function decryptToObject<T = any>(encryptedData: string): Promise<T> {
  try {
    console.log('=== STARTING DECRYPTION TO OBJECT ===');
    console.log('Raw encrypted data:', encryptedData.substring(0, 20) + '...');
    
    if (!encryptedData || typeof encryptedData !== 'string') {
      console.error('Invalid encrypted data:', encryptedData);
      return createFallbackObject<T>();
    }
    
    // ลบช่องว่าง (whitespace) ออกจาก token
    encryptedData = encryptedData.replace(/\s+/g, '');
    console.log('After whitespace removal:', encryptedData.substring(0, 20) + '...');
    
    // ปรับปรุงรูปแบบ token ก่อนถอดรหัส
    encryptedData = normalizeToken(encryptedData);
    
    try {
      // ถอดรหัสข้อมูล
      const decryptedStr = decryptServer(encryptedData);
      console.log('Decrypted string:', decryptedStr?.substring(0, 100) + '...');
      
      if (!decryptedStr || decryptedStr.trim() === '') {
        console.error('Empty decrypted data');
        return createFallbackObject<T>();
      }
      
      // แปลงข้อมูลเป็น Object
      try {
        const obj = JSON.parse(decryptedStr);
        console.log('Successfully parsed to object:', Object.keys(obj).join(', '));
        
        // ตรวจสอบว่า obj มีข้อมูลอย่างน้อย 1 key
        if (Object.keys(obj).length === 0) {
          console.warn('Decrypted object is empty');
          return createFallbackObject<T>(encryptedData);
        }
        
        return obj as T;
      } catch (jsonError) {
        console.error('Error parsing decrypted data to JSON:', jsonError);
        
        // ตรวจสอบว่า decryptedStr อาจเป็น JSON ที่ถูกเข้ารหัสซ้ำหรือไม่
        if (decryptedStr.includes('{') && decryptedStr.includes('}')) {
          try {
            // ลอง sanitize string และพาร์ส JSON อีกครั้ง
            const sanitized = decryptedStr.replace(/[\u0000-\u001F]+/g, '').trim();
            const obj = JSON.parse(sanitized);
            console.log('Successfully parsed sanitized data to object');
            return obj as T;
          } catch (sanitizeError) {
            console.error('Failed to parse sanitized data:', sanitizeError);
          }
        }
        
        // ถ้าไม่สามารถแปลงเป็น JSON ได้ ให้ส่งคืนข้อความบอกข้อมูลดิบ
        return createFallbackObject<T>(decryptedStr);
      }
    } catch (decryptError) {
      console.error('Error during decryption:', decryptError);
      return createFallbackObject<T>(encryptedData);
    }
  } catch (error) {
    console.error('Error in decryptToObject:', error);
    
    // ส่งคืนข้อมูลสำรองเพื่อให้ application ไม่ล้ม
    return createFallbackObject<T>();
  }
}

/**
 * สร้างข้อมูลสำรองในกรณีที่ถอดรหัสไม่สำเร็จ
 */
function createFallbackObject<T>(data?: string): T {
  const fallback: Record<string, any> = {
    error: "ไม่สามารถถอดรหัสข้อมูลได้",
    isRaw: true,
    fallback: true,
    timestamp: Date.now(),
    tokenPreview: data ? `${data.substring(0, 10)}...${data.substring(data.length - 10, data.length)}` : undefined
  };
  
  if (data) {
    fallback.rawPreview = data.substring(0, 20) + (data.length > 20 ? '...' : '');
  }
  
  console.log('Created fallback object:', fallback);
  return fallback as T;
} 