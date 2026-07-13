export type ToastKind = 'error' | 'success' | 'info';

export interface Toast {
	id: number;
	kind: ToastKind;
	message: string;
}

const MAX_VISIBLE = 4;
const DISMISS_MS = 4000;
const ERROR_DISMISS_MS = 6000;

let toasts = $state<Toast[]>([]);
let nextId = 1;

function push(kind: ToastKind, message: string): void {
	const id = nextId++;
	toasts.push({ id, kind, message });
	if (toasts.length > MAX_VISIBLE) toasts.shift();
	const lifetime = kind === 'error' ? ERROR_DISMISS_MS : DISMISS_MS;
	setTimeout(() => toastStore.dismiss(id), lifetime);
}

export const toastStore = {
	get toasts() {
		return toasts;
	},

	error(message: string): void {
		push('error', message);
	},

	success(message: string): void {
		push('success', message);
	},

	info(message: string): void {
		push('info', message);
	},

	dismiss(id: number): void {
		toasts = toasts.filter((t) => t.id !== id);
	}
};
