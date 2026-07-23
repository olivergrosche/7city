/**
 * Persistent game options.
 *
 * The classic `.cty` format stores autoBulldoze, autoBudget, autoGoto and sound
 * (and restores them on load), but has no slot for `enableDisasters` at all.
 * Loading a city therefore also overwrites the player's current preferences
 * with whatever was saved in that file.
 *
 * Players expect these to be *app* preferences ("I turned disasters off"), not
 * per-city properties, so we keep them in local storage and re-apply them after
 * every engine init and city load.
 */

import type { MicropolisSimulator } from '$lib/MicropolisSimulator';

export interface GameOptions {
	autoBulldoze: boolean;
	autoBudget: boolean;
	autoGoto: boolean;
	disasters: boolean;
	sound: boolean;
}

const STORAGE_KEY = '7city.options';

const DEFAULTS: GameOptions = {
	autoBulldoze: true,
	autoBudget: true,
	autoGoto: true,
	disasters: true,
	sound: true,
};

let cached: GameOptions | null = null;

export function loadOptions(): GameOptions {
	if (cached) return cached;
	let opts = { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<GameOptions>;
			for (const key of Object.keys(DEFAULTS) as (keyof GameOptions)[]) {
				if (typeof parsed[key] === 'boolean') opts[key] = parsed[key] as boolean;
			}
		}
	} catch {
		opts = { ...DEFAULTS };
	}
	cached = opts;
	return opts;
}

export function setOption<K extends keyof GameOptions>(key: K, value: GameOptions[K]): void {
	const opts = { ...loadOptions(), [key]: value };
	cached = opts;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
	} catch {
		/* no storage — keep it in memory for this session */
	}
}

/** Push the stored options into the engine. Call after init and after any city load. */
export function applyOptions(sim: MicropolisSimulator | null): void {
	const m = sim?.micropolis;
	if (!m) return;
	const o = loadOptions();
	m.setAutoBulldoze(o.autoBulldoze);
	m.setAutoBudget(o.autoBudget);
	m.setAutoGoto(o.autoGoto);
	m.setEnableSound(o.sound);
	m.setEnableDisasters(o.disasters);
}
