import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hashSync } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { authConfig } from "@/lib/auth.config";
import { loginSchema } from "@/lib/validation";

// Хеш-заглушка: сравнение выполняется всегда, чтобы время ответа не выдавало,
// существует ли пользователь с таким email.
const DUMMY_HASH = hashSync("salary-dummy-password", 10);

// Auth.js v5 + Credentials требует JWT-сессий, поэтому DrizzleAdapter здесь не используется:
// пользователи читаются напрямую из таблицы users.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
        const ok = await compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
