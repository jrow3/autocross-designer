import { getSupabase } from './supabase';

function signInFailureReason(message: string): string {
	if (message.includes('Email not confirmed')) {
		return 'Account not confirmed — confirm the ops user in the Supabase dashboard';
	}
	if (message.includes('Invalid login credentials')) {
		return 'Wrong email or password';
	}
	if (message.includes('logins are disabled') || message.includes('not enabled')) {
		return 'Email sign-in is disabled in Supabase Auth settings';
	}
	return message;
}

let isOps = $state(false);
let isInitialized = false;

export const opsAuth = {
	get isOps() {
		return isOps;
	},

	init(): void {
		if (isInitialized) return;
		isInitialized = true;
		const sb = getSupabase();
		if (!sb) return;
		sb.auth.getSession().then(({ data }) => {
			isOps = !!data.session;
		});
		sb.auth.onAuthStateChange((_event, session) => {
			isOps = !!session;
		});
	},

	async signIn(
		email: string,
		password: string
	): Promise<{ ok: true } | { ok: false; reason: string }> {
		const sb = getSupabase();
		if (!sb) return { ok: false, reason: 'Supabase is not configured' };

		const { error } = await sb.auth.signInWithPassword({ email, password });
		if (error) {
			console.error('signIn:', error);
			return { ok: false, reason: signInFailureReason(error.message) };
		}
		return { ok: true };
	},

	async signOut(): Promise<void> {
		const sb = getSupabase();
		if (!sb) return;

		const { error } = await sb.auth.signOut();
		if (error) console.error('signOut:', error);
	}
};
