import { getSupabase } from './supabase';

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

	async signIn(email: string, password: string): Promise<boolean> {
		const sb = getSupabase();
		if (!sb) return false;

		const { error } = await sb.auth.signInWithPassword({ email, password });
		if (error) {
			console.error('signIn:', error);
			return false;
		}
		return true;
	},

	async signOut(): Promise<void> {
		const sb = getSupabase();
		if (!sb) return;

		const { error } = await sb.auth.signOut();
		if (error) console.error('signOut:', error);
	}
};
