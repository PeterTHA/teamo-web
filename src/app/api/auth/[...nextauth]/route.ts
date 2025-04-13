import NextAuth, { AuthOptions, DefaultSession, Session, User, Account } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { compare } from "bcrypt";
import { logActivity } from "@/utils/activity-logger";
import { JWT } from "next-auth/jwt";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      workspaceId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    workspaceId?: string;
    password?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    workspaceId?: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Check if credentials are valid
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log("Invalid credentials format");
          return null;
        }

        const { email, password } = parsedCredentials.data;
        
        try {
          // ค้นหาผู้ใช้โดยไม่รวม password ในการค้นหาเริ่มต้น
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              image: true,
              employee: true
            }
          });
          
          if (!user) {
            console.log(`User not found with email: ${email}`);
            return null;
          }
          
          // ตรวจสอบสถานะผู้ใช้
          if (user.status !== "ACTIVE") {
            console.log(`Login attempt by inactive user: ${email}`);
            return null;
          }
          
          // ดึงข้อมูลรหัสผ่านแยกต่างหาก (ลดปัญหา Type)
          const userPassword = await prisma.user.findUnique({
            where: { email },
            select: { password: true }
          });
          
          // ตรวจสอบรหัสผ่าน
          if (!userPassword?.password) {
            // รหัสผ่านตั้งต้นสำหรับผู้ใช้แต่ละประเภท
            const fallbackPasswords: Record<string, string> = {
              "SUPERADMIN": "admin123",
              "ADMIN": "manager123",
              "USER": "user123"
            };
            
            if (password === fallbackPasswords[user.role]) {
              console.log(`Using fallback password for user: ${email}`);
              return user;
            }
            
            console.log(`No password set for user: ${email}`);
            return null;
          }
          
          // ตรวจสอบรหัสผ่านด้วย bcrypt
          const isPasswordValid = await compare(password, userPassword.password);
          
          if (!isPasswordValid) {
            console.log(`Password mismatch for user: ${email}`);
            return null;
          }
          
          console.log(`Successful login for user: ${email}`);
          return user;
        } catch (error) {
          console.error("Error authenticating user:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.workspaceId = user.workspaceId;
        
        // Log login activity
        await logActivity({
          userId: user.id,
          action: "LOGIN",
          entity: "AUTH",
          entityId: user.id,
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.workspaceId = token.workspaceId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 