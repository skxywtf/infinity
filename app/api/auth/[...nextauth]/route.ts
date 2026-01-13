
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
// import EmailProvider from "next-auth/providers/email";
import { syncGhostMember } from "@/lib/ghost";

const providers = [
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID!,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
];

const handler = NextAuth({
    providers: providers,
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("User signed in:", user.email, "Provider:", account?.provider);

            // Sync with Ghost (TEMPORARILY DISABLED FOR DEBUGGING)
            /*
            if (user.email) {
                try {
                   await syncGhostMember(user.email, user.name || undefined);
                } catch(e) {
                   console.error("Ghost Sync Error", e);
                }
            }
            */
            return true;
        },
        async session({ session, token }) {
            return session;
        },
    },
} as any);

export { handler as GET, handler as POST };
