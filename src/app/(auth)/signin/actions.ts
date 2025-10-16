'use server';

import { signIn } from '@/auth';

export async function signInWithGoogleAction() {
    await signIn('google', { redirectTo: '/dashboard' });
}
