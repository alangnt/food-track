
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
              email: { label: "Email", type: "text" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                throw new Error("Email and password required");
              }
              
              try {
                const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/login`, {
                  method: 'POST',
                  body: JSON.stringify(credentials),
                  headers: { "Content-Type": "application/json" }
                });
            
                if (res.ok) {
                  const user = await res.json();
                  return user;
                } else {
                  const errorText = await res.text();
                  console.error('Login failed:', errorText);
                  throw new Error(errorText || 'Login failed');
                }
              } catch (error) {
                console.error('Authorization error:', error);
                throw new Error('An error occurred during authentication');
              }
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
      async jwt({ token, user }) {
          if (user) {
              token.id = user.id;
          }
          return token;
      },
      async session({ session, token }) {
          session.user = {
              id: token.id as string,
              email: token.email,
          };
          return session;
      },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
