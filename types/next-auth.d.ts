import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    id?: string;
    studentId?: string;
  }

  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      role?: string;
      studentId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    studentId?: string;
  }
}
