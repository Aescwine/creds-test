import "next-auth";

declare module "next-auth" {
    interface User {
        role?: "USER" | "ADMIN";
    }
    interface Session {
        user: {
            id?: string;
            email?: string | null;
            name?: string | null;
            image?: string | null;
            role?: "USER" | "ADMIN";
        };
    }
}
