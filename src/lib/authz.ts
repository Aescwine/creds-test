export function isAdminSession(session: any) {
    const role = (session?.user as any)?.role;
    return role === "ADMIN";
}
