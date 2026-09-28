import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { hash, verify } from "@node-rs/argon2";
import { createHmac } from "node:crypto";
import { db } from "@/server/db";
import { loginSchema } from "@/lib/domain";
import { rateLimit } from "@/server/auth/rate-limit";

const dummyHash = hash("invalid-account-password", {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost:
    process.env.NODE_ENV !== "production" ||
    Boolean(process.env.VERCEL) ||
    process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt", maxAge: 60 * 60 * 4 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const key = createHmac("sha256", process.env.AUTH_SECRET ?? "development")
          .update(parsed.data.email)
          .digest("hex");
        try {
          await rateLimit(`login:${key}`, 10, 300);
          await rateLimit("login:global", 120, 60);
        } catch {
          return null;
        }
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        const valid = await verify(user?.passwordHash ?? (await dummyHash), parsed.data.password);
        if (!user || !valid || !user.isActive || !user.passwordHash) return null;
        await db.auditLog.create({
          data: { actorId: user.id, action: "LOGIN", resourceType: "User", resourceId: user.id },
        });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.sessionVersion = Number(token.sessionVersion);
      }
      return session;
    },
  },
});
