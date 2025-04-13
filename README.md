# Teamo - ระบบจัดการทรัพยากรบุคคลแบบครบวงจร

Teamo เป็นแพลตฟอร์มสำหรับการจัดการทรัพยากรบุคคล การทำงานร่วมกันเป็นทีม และการบริหารจัดการโครงการแบบครบวงจร พัฒนาด้วย Next.js, Prisma, Tailwind CSS และ PostgreSQL

## คุณสมบัติหลัก

- **การจัดการผู้ใช้และสิทธิ์การเข้าถึง** - ระบบสมาชิก การกำหนดบทบาท และสิทธิ์การเข้าถึง
- **การจัดการองค์กร** - โครงสร้างองค์กร แผนก ตำแหน่ง และระดับตำแหน่ง
- **การจัดการพนักงาน** - ข้อมูลพนักงาน ประวัติการทำงาน และเอกสารที่เกี่ยวข้อง
- **การจัดการโครงการ** - ติดตามความคืบหน้า จัดการทีม และบทบาทในโครงการ
- **การจัดการการลา** - ประเภทการลา โควต้าการลา และการขออนุมัติ
- **การจัดการโอที** - นโยบายการทำโอที การขออนุมัติ และการคำนวณ
- **ระบบอนุมัติ** - เทมเพลตการอนุมัติและขั้นตอนการอนุมัติแบบกำหนดเอง
- **ระบบการเชิญ** - เชิญสมาชิกใหม่และพนักงานเข้าสู่ระบบ
- **การติดตามกิจกรรม** - บันทึกกิจกรรมและตรวจสอบประวัติการทำงาน
- **การตั้งค่าและการปรับแต่ง** - ปรับแต่งระบบตามความต้องการขององค์กร

## การติดตั้ง

### ความต้องการของระบบ

- Node.js 18.x หรือใหม่กว่า
- PostgreSQL 14.x หรือใหม่กว่า (หรือใช้ Neon PostgreSQL)
- npm 9.x หรือใหม่กว่า

### ขั้นตอนการติดตั้ง

1. **โคลนโปรเจค**

```bash
git clone https://github.com/PeterTHA/teamo-web.git
cd teamo-web
```

2. **ติดตั้งแพ็คเกจที่จำเป็น**

```bash
npm install
```

3. **ตั้งค่าไฟล์สภาพแวดล้อม**

สร้างไฟล์ `.env` ที่รากของโปรเจคและกำหนดค่าตามตัวอย่างด้านล่าง:

```env
# ฐานข้อมูล PostgreSQL
DATABASE_URL=postgres://username:password@localhost:5432/teamo?schema=public

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# ค่าเข้ารหัสและความปลอดภัย
ENCRYPTION_KEY=your-encryption-key
ENCRYPTION_IV=your-encryption-iv

# ค่าตั้งต้นของระบบ
DEFAULT_WORKSPACE_SLUG=default
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=StrongPassword123!

# การตั้งค่าอีเมล (Gmail)
EMAIL_PROVIDER=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

4. **สร้างโครงสร้างฐานข้อมูล**

```bash
npx prisma migrate dev
```

5. **สร้างข้อมูลเริ่มต้น (ตัวเลือก)**

```bash
npx prisma db seed
```

6. **เริ่มต้นเซิร์ฟเวอร์สำหรับการพัฒนา**

```bash
npm run dev
```

เปิดเบราว์เซอร์และเข้าสู่ [http://localhost:3000](http://localhost:3000) เพื่อเริ่มใช้งาน

## การใช้งานเบื้องต้น

1. **สร้างบัญชีผู้ดูแลระบบ** - เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่กำหนดไว้ใน `.env`
2. **สร้าง Workspace** - สร้างพื้นที่ทำงานสำหรับองค์กรของคุณ
3. **เชิญสมาชิก** - เชิญสมาชิกในทีมเข้าร่วม Workspace
4. **ตั้งค่าโครงสร้างองค์กร** - กำหนดแผนก ตำแหน่ง และระดับตำแหน่ง
5. **เพิ่มพนักงาน** - เพิ่มข้อมูลพนักงานและกำหนดบทบาท
6. **สร้างโครงการ** - สร้างและจัดการโครงการ จัดสรรทรัพยากร

## รายละเอียดทางเทคนิค

### สถาปัตยกรรม

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **ฐานข้อมูล**: PostgreSQL (รองรับ Neon PostgreSQL)
- **การรับรองตัวตน**: NextAuth.js
- **การส่งอีเมล**: Nodemailer (รองรับ Gmail, SMTP ทั่วไป และ SendGrid)
- **การจัดการสถานะ**: React Context API และ React Query
- **การเข้ารหัส**: AES-256-GCM, bcrypt

### โครงสร้างโปรเจค

```
teamo/
├── prisma/            # Prisma schema และการ migrate
├── public/            # ไฟล์สาธารณะ
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── api/       # API Routes
│   │   ├── (auth)/    # หน้าเกี่ยวกับการรับรองตัวตน
│   │   └── (dashboard)/ # หน้าแดชบอร์ด
│   ├── components/    # React Components
│   ├── lib/           # ไลบรารีและฟังก์ชั่นช่วยเหลือ
│   └── utils/         # ยูทิลิตี้ฟังก์ชั่น
├── .env              # ตัวแปรสภาพแวดล้อม
└── middleware.ts     # Next.js Middleware
```

## การนำไปใช้งาน

สามารถ deploy Teamo ได้บนแพลตฟอร์มต่างๆ เช่น:

- **Vercel** - แนะนำสำหรับการติดตั้งที่ง่ายและรวดเร็ว
- **AWS, GCP, Azure** - สำหรับการติดตั้งที่มีความยืดหยุ่นมากขึ้น
- **Self-hosted** - สำหรับองค์กรที่ต้องการควบคุมโครงสร้างพื้นฐานเอง

## ใบอนุญาต

โปรเจคนี้เผยแพร่ภายใต้ใบอนุญาต MIT - ดูรายละเอียดเพิ่มเติมได้ที่ไฟล์ [LICENSE](LICENSE)
