import type { NextAuthConfig } from "next-auth";

// Edge-совместимая часть конфигурации (без БД и bcrypt) — используется в middleware.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const onAuthPage = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
      if (onAuthPage) {
        return loggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      return loggedIn; // false → редирект на /login
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
