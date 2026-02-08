import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    providers: [
        EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                name: { label: "Name", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                // Find or create user
                let user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email: credentials.email,
                            name: credentials.name || "User"
                        }
                    });
                } else if (credentials.name && user.name !== credentials.name) {
                    // Update name if provided and different (optional, but good for "updating" profile on login if we treat it as such)
                    // For now user just wants to capture it on sign up.
                    // Let's just update it if it's "User" or null/empty
                    if (!user.name || user.name === "User") {
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { name: credentials.name }
                        });
                    }
                }

                return user;
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
    },
};
