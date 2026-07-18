type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipParams {
	text: string;
	shortcut?: string;
	placement?: Placement;
}

const SHOW_DELAY_MS = 900;
const WARM_WINDOW_MS = 500;
const GAP_PX = 8;

let tipEl: HTMLDivElement | null = null;
let textEl: HTMLSpanElement | null = null;
let kbdEl: HTMLElement | null = null;
let lastHiddenAt = 0;
let isVisible = false;

function ensureTip(): HTMLDivElement {
	if (tipEl) return tipEl;
	tipEl = document.createElement('div');
	tipEl.setAttribute('role', 'tooltip');
	Object.assign(tipEl.style, {
		position: 'fixed',
		display: 'none',
		alignItems: 'center',
		gap: 'var(--space-2)',
		padding: 'var(--space-1) var(--space-2)',
		/* Studio elevated chip — hardcoded, theme-independent */
		background: '#24262c',
		border: '1px solid #2e3138',
		color: '#e6e7ea',
		borderRadius: 'var(--radius-md)',
		boxShadow: 'var(--shadow-md)',
		fontSize: 'var(--text-sm)',
		fontFamily: 'var(--font-ui)',
		whiteSpace: 'nowrap',
		zIndex: '90',
		pointerEvents: 'none'
	});
	textEl = document.createElement('span');
	kbdEl = document.createElement('kbd');
	Object.assign(kbdEl.style, {
		display: 'none',
		padding: '1px 5px',
		background: 'rgba(255, 255, 255, 0.15)',
		border: '1px solid rgba(255, 255, 255, 0.3)',
		borderRadius: 'var(--radius-sm)',
		fontFamily: 'var(--font-mono)',
		fontSize: 'var(--text-xs)',
		color: '#fff'
	});
	tipEl.append(textEl, kbdEl);
	document.body.appendChild(tipEl);
	return tipEl;
}

function position(node: HTMLElement, placement: Placement): void {
	const tip = tipEl!;
	const rect = node.getBoundingClientRect();
	const tw = tip.offsetWidth;
	const th = tip.offsetHeight;
	const fits: Record<Placement, boolean> = {
		top: rect.top - th - GAP_PX >= 0,
		bottom: rect.bottom + th + GAP_PX <= window.innerHeight,
		left: rect.left - tw - GAP_PX >= 0,
		right: rect.right + tw + GAP_PX <= window.innerWidth
	};
	const flip: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
	const side = fits[placement] ? placement : flip[placement];
	let x: number;
	let y: number;
	if (side === 'top' || side === 'bottom') {
		x = rect.left + rect.width / 2 - tw / 2;
		y = side === 'top' ? rect.top - th - GAP_PX : rect.bottom + GAP_PX;
	} else {
		x = side === 'left' ? rect.left - tw - GAP_PX : rect.right + GAP_PX;
		y = rect.top + rect.height / 2 - th / 2;
	}
	x = Math.max(4, Math.min(x, window.innerWidth - tw - 4));
	y = Math.max(4, Math.min(y, window.innerHeight - th - 4));
	tip.style.left = `${x}px`;
	tip.style.top = `${y}px`;
}

function hasAccessibleName(node: HTMLElement): boolean {
	return Boolean(node.getAttribute('aria-label') || node.textContent?.trim());
}

export function tooltip(node: HTMLElement, params: TooltipParams) {
	let current = params;
	let showTimer: ReturnType<typeof setTimeout> | undefined;

	if (!hasAccessibleName(node)) node.setAttribute('aria-label', current.text);

	function show(): void {
		const tip = ensureTip();
		textEl!.textContent = current.text;
		if (current.shortcut) {
			kbdEl!.textContent = current.shortcut;
			kbdEl!.style.display = 'inline-block';
		} else {
			kbdEl!.style.display = 'none';
		}
		tip.style.display = 'flex';
		position(node, current.placement ?? 'top');
		isVisible = true;
	}

	function scheduleShow(): void {
		clearTimeout(showTimer);
		const isWarm = isVisible || Date.now() - lastHiddenAt < WARM_WINDOW_MS;
		if (isWarm) show();
		else showTimer = setTimeout(show, SHOW_DELAY_MS);
	}

	function hide(): void {
		clearTimeout(showTimer);
		if (tipEl && isVisible) {
			tipEl.style.display = 'none';
			isVisible = false;
			lastHiddenAt = Date.now();
		}
	}

	node.addEventListener('pointerenter', scheduleShow);
	node.addEventListener('focus', scheduleShow);
	node.addEventListener('pointerleave', hide);
	node.addEventListener('blur', hide);
	node.addEventListener('pointerdown', hide);

	return {
		update(next: TooltipParams) {
			current = next;
			if (!hasAccessibleName(node)) node.setAttribute('aria-label', current.text);
			if (isVisible) show();
		},
		destroy() {
			hide();
			node.removeEventListener('pointerenter', scheduleShow);
			node.removeEventListener('focus', scheduleShow);
			node.removeEventListener('pointerleave', hide);
			node.removeEventListener('blur', hide);
			node.removeEventListener('pointerdown', hide);
		}
	};
}
