import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { randomUUID } from "node:crypto";

const USERNAME_REGEX = /^[\p{L}\p{N} ._'’-]{1,50}$/u;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    GitHub({
      issuer: "https://github.com/login/oauth",
    }),

    Credentials({
      id: "quick-login",
      name: "Quick Login",

      credentials: {
        username: {
          label: "Username",
          type: "text",
        },
      },

      async authorize(credentials) {
        if (typeof credentials?.username !== "string") {
          return null;
        }

        const username = credentials.username
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase();

        if (!USERNAME_REGEX.test(username)) {
          return null;
        }

        // Never sign in to an existing account using only its username.
        const existingUser = await prisma.user.findUnique({
          where: { username },
        });
        
        if (existingUser) {
          // Only allow passwordless access to demo accounts.
          // Never allow access to GitHub-authenticated users.
          if (!existingUser.isDemoUser) {
            return null;
          }
        
          return {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            image: existingUser.image,
          };
        }

        // The database's unique constraint also protects against
        // simultaneous registrations of the same username.
        const user = await prisma.user.create({
          data: {
            username,
            name: username,
            isDemoUser: true,
            email: `guest-${randomUUID()}@example.invalid`,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: null,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }

      return session;
    },
  },
});