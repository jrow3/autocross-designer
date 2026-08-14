// Lets the active canvas register a key handler that the global shortcut
// listener in +layout.svelte consults first. Returning true consumes the event.
export type CanvasKeyHandler = (e: KeyboardEvent) => boolean;

let handler: CanvasKeyHandler | null = null;

export function registerCanvasKeys(h: CanvasKeyHandler): () => void {
	handler = h;
	return () => {
		if (handler === h) handler = null;
	};
}

export function dispatchCanvasKeys(e: KeyboardEvent): boolean {
	return handler ? handler(e) : false;
}
