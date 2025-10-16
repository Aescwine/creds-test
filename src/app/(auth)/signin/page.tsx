import { signInWithGoogleAction } from "./actions";
import { Button } from "@/components/ui/button";

export default async function SignInPage({
    searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;

    return (
        <div className="mx-auto max-w-md space-y-6">
            <h1 className="text-2xl font-bold">Sign in</h1>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <form action={signInWithGoogleAction} className="space-y-2">
                <Button type="submit" variant="outline" className="w-full">
                    Continue with Google
                </Button>
                <p className="text-xs text-gray-600 text-center">
                    New here? We’ll create your account automatically.
                </p>
            </form>

        </div>
    );
}