
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

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
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("User signed in:", user.email);

            // Sync with Ghost
            // if (user.email) {
            //     try {
            //         await syncGhostMember(user.email, user.name || undefined);
            //     } catch (e) {
            //         console.error("Ghost Sync Error", e);
            //     }
            // }
            return true;
        },
        async session({ session, token }) {
            return session;
        },
    },
});

export { handler as GET, handler as POST };
