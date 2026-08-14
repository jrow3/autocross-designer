import { describe, it, expect } from 'vitest';
import { mulberry32, jitter } from './prng';

describe('mulberry32', () => {
	it('is deterministic for a fixed seed', () => {
		const a = mulberry32(1234);
		const b = mulberry32(1234);
		for (let i = 0; i < 20; i++) {
			expect(a()).toBe(b());
		}
	});

	it('differs across seeds', () => {
		expect(mulberry32(1)()).not.toBe(mulberry32(2)());
	});

	it('stays in [0, 1)', () => {
		const rng = mulberry32(99);
		for (let i = 0; i < 1000; i++) {
			const v = rng();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});
});

describe('jitter', () => {
	it('stays within the percentage band', () => {
		const rng = mulberry32(7);
		for (let i = 0; i < 100; i++) {
			const v = jitter(rng, 60, 8);
			expect(v).toBeGreaterThanOrEqual(60 * 0.92);
			expect(v).toBeLessThanOrEqual(60 * 1.08);
		}
	});
});
