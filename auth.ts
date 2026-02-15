import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import WhitelistedEmail from "@/models/WhitelistedEmail";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;

      try {
        await dbConnect();
        const whitelisted = await WhitelistedEmail.findOne({
          email: profile.email.toLowerCase(),
        });
        
        console.log("Whitelist check for email:", profile.email, "Result:", !!whitelisted);

        return !!whitelisted;
      } catch (error) {
        console.error("Error checking whitelist:", error);
        return false;
      }
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture as string | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
