/**
 * Game session glue between the start screen and the play view.
 *
 * The start screen records what the player chose (new city / scenario / slot /
 * file) as a pending action; the play view applies it once the shared
 * simulator is ready. Also hosts the rotating autosave.
 */

import type { MicropolisSimulator } from '$lib/MicropolisSimulator';
import type { MainModule } from '../../types/micropolisengine.d.js';
import { applyOptions } from './settings';
import {
	makeSaveGame,
	writeSlot,
	readSlot,
	applySaveGame,
	nextAutosaveIndex,
	type SaveGame,
	type SlotKind,
} from './persistence';

// --- Scenario catalog (the 8 originals from SimCity 1989) -------------------

export interface ScenarioDef {
	id: number; // engine Scenario enum value (SC_*)
	key: string;
	city: string;
	region: string;
	year: number;
	/** Short problem label, kept English like the in-game messages. */
	problem: string;
	emoji: string;
}

export const SCENARIOS: ScenarioDef[] = [
	{ id: 1, key: 'dullsville', city: 'Dullsville', region: 'USA', year: 1900, problem: 'Boredom', emoji: '🥱' },
	{ id: 2, key: 'san_francisco', city: 'San Francisco', region: 'CA, USA', year: 1906, problem: '8.0 Earthquake', emoji: '🌉' },
	{ id: 3, key: 'hamburg', city: 'Hamburg', region: 'Germany', year: 1944, problem: 'Firebombing', emoji: '🔥' },
	{ id: 4, key: 'bern', city: 'Bern', region: 'Switzerland', year: 1965, problem: 'Traffic', emoji: '🚗' },
	{ id: 5, key: 'tokyo', city: 'Tokyo', region: 'Japan', year: 1961, problem: 'Monster Attack', emoji: '🦖' },
	{ id: 6, key: 'detroit', city: 'Detroit', region: 'MI, USA', year: 1972, problem: 'Crime', emoji: '🚨' },
	{ id: 7, key: 'boston', city: 'Boston', region: 'MA, USA', year: 2010, problem: 'Nuclear Meltdown', emoji: '☢️' },
	{ id: 8, key: 'rio', city: 'Rio de Janeiro', region: 'Brazil', year: 2047, problem: 'Coastal Flooding', emoji: '🌊' },
];

export type DifficultyLevel = 0 | 1 | 2;

export const DIFFICULTY_FUNDS: Record<DifficultyLevel, number> = {
	0: 20000,
	1: 10000,
	2: 5000,
};

// --- Pending start action ---------------------------------------------------

export type StartAction =
	| { type: 'new'; seed: number; level: DifficultyLevel; name: string }
	| { type: 'scenario'; id: number }
	| { type: 'slot'; kind: SlotKind; index: number }
	| { type: 'file'; save: SaveGame };

let pending: StartAction | null = null;

export function setPendingAction(action: StartAction): void {
	pending = action;
}

export function peekPendingAction(): StartAction | null {
	return pending;
}

export function takePendingAction(): StartAction | null {
	const a = pending;
	pending = null;
	return a;
}

function levelEnum(eng: MainModule, level: DifficultyLevel) {
	const g = eng.GameLevel;
	return level === 0 ? g.LEVEL_EASY : level === 1 ? g.LEVEL_MEDIUM : g.LEVEL_HARD;
}

function scenarioEnum(eng: MainModule, id: number) {
	const s = eng.Scenario as unknown as Record<string, unknown>;
	const byId: Record<number, string> = {
		1: 'SC_DULLSVILLE', 2: 'SC_SAN_FRANCISCO', 3: 'SC_HAMBURG', 4: 'SC_BERN',
		5: 'SC_TOKYO', 6: 'SC_DETROIT', 7: 'SC_BOSTON', 8: 'SC_RIO',
	};
	return s[byId[id]];
}

/** Apply a start action to the live simulator (engine already initialized). */
export function applyStartAction(sim: MicropolisSimulator, action: StartAction): void {
	const m = sim.micropolis;
	const eng = sim.micropolisengine;
	if (!m || !eng) return;

	switch (action.type) {
		case 'new':
			m.generateSomeCity(action.seed);
			m.setGameLevelFunds(levelEnum(eng, action.level));
			// Always set a name — generateSomeCity keeps the previous city's.
			m.setCityName(action.name || '7CITY');
			break;
		case 'scenario':
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			m.loadScenario(scenarioEnum(eng, action.id) as any);
			break;
		case 'slot': {
			const save = readSlot(action.kind, action.index);
			if (save) applySaveGame(sim, save);
			break;
		}
		case 'file':
			applySaveGame(sim, action.save);
			break;
	}
	// Loading a .cty restores that file's autoBulldoze/autoBudget/autoGoto/sound,
	// clobbering the player's preferences — put them back.
	applyOptions(sim);

	// Scenario/city loads can leave the engine's internal speed at 0 ("stopped").
	if (m.simSpeed === 0) m.setSpeed(3);
	// A fresh game means a fresh view — don't restore the previous camera.
	clearSavedCamera();
	sim.syncMapViews();
}

// --- Camera persistence across view remounts --------------------------------

export interface SavedCamera {
	x: number;
	y: number;
	zoom: number;
}

let savedCamera: SavedCamera | null = null;

export function saveCamera(cam: SavedCamera): void {
	savedCamera = cam;
}

/** Returns and clears the saved camera (one-shot restore on view mount). */
export function takeSavedCamera(): SavedCamera | null {
	const c = savedCamera;
	savedCamera = null;
	return c;
}

export function clearSavedCamera(): void {
	savedCamera = null;
}

// --- Autosave ---------------------------------------------------------------

const AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000;

let autosaveTimer: ReturnType<typeof setInterval> | null = null;
let autosaveSim: MicropolisSimulator | null = null;
let visibilityHandler: (() => void) | null = null;

export function doAutosave(reason: 'interval' | 'background' = 'interval'): void {
	const sim = autosaveSim;
	if (!sim?.micropolis) return;
	try {
		const idx = nextAutosaveIndex();
		const name = sim.micropolis.cityName || 'Micropolis';
		writeSlot('auto', idx, makeSaveGame(sim, name));
		console.log(`Autosave (${reason}) → auto slot ${idx}`);
	} catch (e) {
		console.warn('Autosave failed:', e);
	}
}

export function startAutosave(sim: MicropolisSimulator): void {
	stopAutosave();
	autosaveSim = sim;
	autosaveTimer = setInterval(() => doAutosave('interval'), AUTOSAVE_INTERVAL_MS);
	visibilityHandler = () => {
		if (document.visibilityState === 'hidden') doAutosave('background');
	};
	document.addEventListener('visibilitychange', visibilityHandler);
}

export function stopAutosave(): void {
	if (autosaveTimer) clearInterval(autosaveTimer);
	autosaveTimer = null;
	if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
	visibilityHandler = null;
	autosaveSim = null;
}
