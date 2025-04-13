// ไฟล์ชั่วคราวสำหรับถอดรหัส token จาก URL
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// อ่านค่า ENCRYPTION_KEY และ ENCRYPTION_IV จากไฟล์ .env
let ENCRYPTION_KEY = '';
let ENCRYPTION_IV = '';

try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.startsWith('ENCRYPTION_KEY=')) {
        ENCRYPTION_KEY = line.substring('ENCRYPTION_KEY='.length).trim();
        console.log('Found ENCRYPTION_KEY in .env file');
      } else if (line.startsWith('ENCRYPTION_IV=')) {
        ENCRYPTION_IV = line.substring('ENCRYPTION_IV='.length).trim();
        console.log('Found ENCRYPTION_IV in .env file');
      }
    }
  }
} catch (err) {
  console.error('Error reading .env file:', err);
}

console.log('ENCRYPTION_KEY:', ENCRYPTION_KEY);
console.log('ENCRYPTION_IV:', ENCRYPTION_IV);

// กำหนดค่า key และ iv แบบเดิม (ก่อนแก้ไข)
const OLD_ENCRYPTION_KEY = 'teamo_secure_encryption_key_32_bytes';
const OLD_ENCRYPTION_IV = 'teamo_secure_iv16';

console.log('OLD_ENCRYPTION_KEY:', OLD_ENCRYPTION_KEY);
console.log('OLD_ENCRYPTION_IV:', OLD_ENCRYPTION_IV);

// token ที่ต้องการถอดรหัส (จาก URL)
const fullToken = '1DUXdUHR1aLA3M7FzrdKI9lxGkWoRgNFc1O31Wnj0LruIGIXpcuGZf+1YQOJVLBOTAxa83FBsC7QqH483Z/sQdeA8G3uriAzXJelXKbjBvhj83U0Wmg4T5UIbeH5NtfN9NqU9fs2swYLlcDQF77NuiM7+kB75SV/4owL2oUZ7W1lifjgArWRlUie.txZlw6swg5lj4tqeSujvCg==';

// แยก encrypted data และ auth tag
const [encryptedData, authTag] = fullToken.split('.');

console.log('Encrypted Data:', encryptedData);
console.log('Auth Tag:', authTag);

/**
 * ถอดรหัสข้อมูลด้วย AES-256-GCM
 */
function decryptGCM(encryptedData, authTag, key, iv) {
  try {
    // สร้าง key และ iv (กรณีเป็น string ธรรมดา)
    const keyBuffer = Buffer.isBuffer(key) ? key : 
      (key.includes('base64') ? Buffer.from(key, 'base64') : 
      Buffer.from(key.padEnd(32, '0').slice(0, 32)));
    
    const ivBuffer = Buffer.isBuffer(iv) ? iv : 
      (iv.includes('base64') ? Buffer.from(iv, 'base64') : 
      Buffer.from(iv.padEnd(16, '0').slice(0, 16)));
    
    console.log('Key (hex):', keyBuffer.toString('hex'));
    console.log('IV (hex):', ivBuffer.toString('hex'));
    
    // สร้าง decipher ด้วย AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    
    // ตั้งค่า auth tag
    if (authTag) {
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    }
    
    // ถอดรหัสข้อมูล
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('GCM decryption error:', error.message);
    return null;
  }
}

/**
 * ถอดรหัสข้อมูลด้วย AES-256-CBC (แบบเดิม)
 */
function decryptCBC(encryptedData, key, iv) {
  try {
    // สร้าง key และ iv (กรณีเป็น string ธรรมดา)
    const keyBuffer = Buffer.isBuffer(key) ? key : 
      (key.includes('base64') ? Buffer.from(key, 'base64') : 
      Buffer.from(key.padEnd(32, '0').slice(0, 32)));
    
    const ivBuffer = Buffer.isBuffer(iv) ? iv : 
      (iv.includes('base64') ? Buffer.from(iv, 'base64') : 
      Buffer.from(iv.padEnd(16, '0').slice(0, 16)));
    
    console.log('Key (hex):', keyBuffer.toString('hex'));
    console.log('IV (hex):', ivBuffer.toString('hex'));
    
    // สร้าง decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    
    // ถอดรหัสข้อมูล
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('CBC decryption error:', error.message);
    return null;
  }
}

// พยายามถอดรหัสด้วย GCM และค่า key/iv ใหม่
console.log('\n==== พยายามถอดรหัสด้วย GCM และค่า key/iv ใหม่ ====');
const decryptedTextGCM = decryptGCM(encryptedData, authTag, ENCRYPTION_KEY, ENCRYPTION_IV);

if (decryptedTextGCM) {
  console.log('Decrypted Text (GCM):', decryptedTextGCM);
  try {
    const jsonData = JSON.parse(decryptedTextGCM);
    console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
  } catch (e) {
    console.log('Not a valid JSON');
  }
}

// พยายามถอดรหัสด้วย GCM และค่า key/iv เดิม
console.log('\n==== พยายามถอดรหัสด้วย GCM และค่า key/iv เดิม ====');
const decryptedTextOldGCM = decryptGCM(encryptedData, authTag, OLD_ENCRYPTION_KEY, OLD_ENCRYPTION_IV);

if (decryptedTextOldGCM) {
  console.log('Decrypted Text (Old Key GCM):', decryptedTextOldGCM);
  try {
    const jsonData = JSON.parse(decryptedTextOldGCM);
    console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
  } catch (e) {
    console.log('Not a valid JSON');
  }
}

// พยายามถอดรหัสด้วย CBC และค่า key/iv ใหม่
console.log('\n==== พยายามถอดรหัสด้วย CBC และค่า key/iv ใหม่ ====');
const decryptedTextCBC = decryptCBC(fullToken, ENCRYPTION_KEY, ENCRYPTION_IV);

if (decryptedTextCBC) {
  console.log('Decrypted Text (CBC):', decryptedTextCBC);
  try {
    const jsonData = JSON.parse(decryptedTextCBC);
    console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
  } catch (e) {
    console.log('Not a valid JSON');
  }
}

// พยายามถอดรหัสด้วย CBC และค่า key/iv เดิม
console.log('\n==== พยายามถอดรหัสด้วย CBC และค่า key/iv เดิม ====');
const decryptedTextOldCBC = decryptCBC(encryptedData, OLD_ENCRYPTION_KEY, OLD_ENCRYPTION_IV);

if (decryptedTextOldCBC) {
  console.log('Decrypted Text (Old Key CBC):', decryptedTextOldCBC);
  try {
    const jsonData = JSON.parse(decryptedTextOldCBC);
    console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
  } catch (e) {
    console.log('Not a valid JSON');
  }
}

// ถ้าไม่สามารถถอดรหัสด้วยทุกวิธี
if (!decryptedTextGCM && !decryptedTextOldGCM && !decryptedTextCBC && !decryptedTextOldCBC) {
  console.log('Failed to decrypt with all methods.');
} 