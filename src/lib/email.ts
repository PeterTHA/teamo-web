import crypto from 'crypto';
import nodemailer from 'nodemailer';

/**
 * สร้างรหัสเชิญสำหรับส่งไปกับอีเมล
 * @returns รหัสเชิญ 6 หลัก
 */
export function generateInviteCode(): string {
  // สร้างรหัสเชิญแบบสุ่ม 6 หลัก
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * สร้างโทเค็นสำหรับรีเซ็ตรหัสผ่าน
 * @returns โทเค็นสำหรับรีเซ็ตรหัสผ่าน
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * สร้างรหัสผ่านชั่วคราวแบบสุ่มที่มีความปลอดภัย
 * @param length ความยาวของรหัสผ่าน (ค่าเริ่มต้น 12 อักขระ)
 * @returns รหัสผ่านชั่วคราวที่สร้างขึ้น
 */
export function generateTemporaryPassword(length: number = 12): string {
  // ชุดอักขระที่ใช้ในการสร้างรหัสผ่าน (ตัวอักษรตัวเล็ก ตัวใหญ่ ตัวเลข และอักขระพิเศษ)
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()-_=+';
  const allChars = lowercase + uppercase + numbers + special;
  
  // สร้างรหัสผ่านโดยใช้ crypto.randomBytes ซึ่งปลอดภัยกว่า Math.random
  let password = '';
  
  // เพื่อให้แน่ใจว่ามีอักขระครบทุกประเภท กำหนดให้มีการใช้อักขระแต่ละประเภทอย่างน้อย 1 ตัว
  password += lowercase.charAt(crypto.randomInt(0, lowercase.length));
  password += uppercase.charAt(crypto.randomInt(0, uppercase.length));
  password += numbers.charAt(crypto.randomInt(0, numbers.length));
  password += special.charAt(crypto.randomInt(0, special.length));
  
  // สร้างส่วนที่เหลือของรหัสผ่าน
  const randomBytes = crypto.randomBytes(length - 4);
  for (let i = 0; i < length - 4; i++) {
    const randomIndex = randomBytes[i] % allChars.length;
    password += allChars.charAt(randomIndex);
  }
  
  // สลับตำแหน่งอักขระเพื่อให้รหัสผ่านไม่เป็นรูปแบบที่คาดเดาได้
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * ส่งอีเมล
 * @param options ตัวเลือกสำหรับการส่งอีเมล
 */
async function sendEmail(options: EmailOptions): Promise<void> {
  // ตรวจสอบโหมด development
  if (process.env.NODE_ENV === 'development' && process.env.EMAIL_DEV_MODE === 'true') {
    console.log('📧 [DEV MODE] Email would be sent with the following details:');
    console.log(`📧 To: ${options.to}`);
    console.log(`📧 Subject: ${options.subject}`);
    console.log(`📧 Content: ${options.html.substring(0, 150)}...`);
    return;
  }

  // ตั้งค่า transport สำหรับ Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // ใช้ App Password ไม่ใช่รหัสผ่านปกติ
    },
  });

  // ตั้งค่าอีเมล
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    // ส่งอีเมล
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    
    // ในโหมด development ไม่โยน error เพื่อให้โปรแกรมทำงานต่อได้
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Failed to send email');
    } else {
      console.log('📧 [DEV] Email sending failed but proceeding anyway in development mode.');
    }
  }
}

interface InvitationEmailOptions {
  to: string;
  name: string;
  workspace: string;
  inviteCode: string;
}

/**
 * ส่งอีเมลเชิญพนักงานเข้าร่วม workspace
 * @param options ตัวเลือกสำหรับการส่งอีเมลเชิญ
 */
export async function sendInvitationEmail(options: InvitationEmailOptions): Promise<void> {
  const { to, name, workspace, inviteCode } = options;

  // สร้าง HTML สำหรับอีเมล
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const invitePageUrl = `${baseUrl}/invite`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">คุณได้รับเชิญให้เข้าร่วม ${workspace}</h2>
      <p>สวัสดี ${name},</p>
      <p>คุณได้รับเชิญให้เข้าร่วม workspace "${workspace}" ในระบบ Teamo</p>
      <p>รหัสเชิญของคุณคือ: <strong>${inviteCode}</strong></p>
      <div style="margin: 25px 0;">
        <a 
          href="${invitePageUrl}" 
          style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;"
          target="_blank"
        >
          คลิกที่นี่เพื่อเข้าร่วม
        </a>
      </div>
      <p>กรุณาไปที่ <a href="${invitePageUrl}" style="color: #2563eb; text-decoration: underline;">หน้าเข้าร่วม</a> และกรอกข้อมูลด้านล่าง:</p>
      <ul>
        <li>อีเมล: <strong>${to}</strong></li>
        <li>รหัสเชิญ: <strong>${inviteCode}</strong></li>
      </ul>
      <p>อีเมลนี้จะหมดอายุใน 7 วัน</p>
      <p>ทีม Teamo</p>
    </div>
  `;

  // ส่งอีเมล
  await sendEmail({
    to,
    subject: `คุณได้รับเชิญให้เข้าร่วม ${workspace}`,
    html,
  });
}

interface ResetPasswordEmailOptions {
  to: string;
  name: string;
  resetLink: string;
}

/**
 * ส่งอีเมลรีเซ็ตรหัสผ่าน
 * @param options ตัวเลือกสำหรับการส่งอีเมลรีเซ็ตรหัสผ่าน
 */
export async function sendResetPasswordEmail(options: ResetPasswordEmailOptions): Promise<void> {
  const { to, name, resetLink } = options;

  // สร้าง HTML สำหรับอีเมล
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">รีเซ็ตรหัสผ่าน</h2>
      <p>สวัสดี ${name},</p>
      <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีในระบบ Teamo</p>
      <p>
        <a 
          href="${resetLink}" 
          style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;"
        >
          รีเซ็ตรหัสผ่าน
        </a>
      </p>
      <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน โปรดละเว้นอีเมลนี้</p>
      <p>อีเมลนี้จะหมดอายุใน 1 ชั่วโมง</p>
      <p>ทีม Teamo</p>
    </div>
  `;

  // ส่งอีเมล
  await sendEmail({
    to,
    subject: 'รีเซ็ตรหัสผ่านในระบบ Teamo',
    html,
  });
}

interface EmployeeInvitationEmailOptions {
  to: string;
  firstName: string;
  lastName: string;
  workspace: string;
  inviteCode: string;
  temporaryPassword: string;
}

/**
 * ส่งอีเมลแจ้งข้อมูลบัญชีพนักงานใหม่พร้อมรหัสผ่านชั่วคราว
 * @param options ตัวเลือกสำหรับการส่งอีเมลข้อมูลบัญชีพนักงานใหม่
 */
export async function sendEmployeeAccountEmail(options: EmployeeInvitationEmailOptions): Promise<void> {
  const { to, firstName, lastName, workspace, inviteCode, temporaryPassword } = options;

  // สร้าง HTML สำหรับอีเมล
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const invitePageUrl = `${baseUrl}/invite`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">ข้อมูลบัญชีพนักงานใหม่</h2>
      <p>สวัสดี ${firstName} ${lastName},</p>
      <p>บัญชีพนักงานของคุณได้ถูกสร้างในระบบ <strong>${workspace}</strong></p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>อีเมล:</strong> ${to}</p>
        <p style="margin: 5px 0;"><strong>รหัสผ่านชั่วคราว:</strong> ${temporaryPassword}</p>
        <p style="margin: 5px 0;"><strong>รหัสเชิญ:</strong> ${inviteCode}</p>
      </div>
      
      <p>กรุณาดำเนินการยืนยันบัญชีของคุณโดยคลิกที่ลิงก์ด้านล่างและกรอกรหัสเชิญ:</p>
      
      <div style="margin: 25px 0;">
        <a 
          href="${invitePageUrl}" 
          style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;"
          target="_blank"
        >
          ยืนยันบัญชีพนักงาน
        </a>
      </div>
      
      <p><strong>ขั้นตอนการยืนยันบัญชี:</strong></p>
      <ol>
        <li>คลิกที่ลิงก์ด้านบนเพื่อไปยังหน้ายืนยันบัญชี</li>
        <li>กรอกอีเมลและรหัสเชิญของคุณ</li>
        <li>เข้าสู่ระบบด้วยอีเมลและรหัสผ่านชั่วคราว</li>
        <li>เปลี่ยนรหัสผ่านชั่วคราวเป็นรหัสผ่านของคุณเอง</li>
      </ol>
      
      <p style="color: #ef4444; font-weight: bold;">หมายเหตุ: รหัสเชิญนี้จะหมดอายุใน 7 วัน กรุณาดำเนินการยืนยันบัญชีโดยเร็ว</p>
      <p>ทีม ${workspace}</p>
    </div>
  `;

  // ส่งอีเมล
  await sendEmail({
    to,
    subject: `ข้อมูลบัญชีพนักงานใหม่ - ${workspace}`,
    html,
  });
}

// เมื่อเราอยู่ในสภาพแวดล้อมการพัฒนา เราจะจำลองการส่งอีเมล
if (process.env.NODE_ENV === 'development') {
  console.log('📧 Email service is in development mode.');
  if (process.env.EMAIL_DEV_MODE === 'true') {
    console.log('📧 Emails will be logged to console instead of being sent.');
  } else {
    console.log('📧 Emails will be sent using Gmail. Make sure GMAIL_USER and GMAIL_APP_PASSWORD are set correctly.');
  }
}

// สำหรับการทดสอบ
export const test = {
  sendEmail,
}; 