/**
 * Savegame persistence for the mobile app.
 *
 * A savegame is the original binary `.cty` city file (produced by the engine's
 * own saveCityAs), wrapped in a JSON envelope with display metadata. The city
 * bytes stay 100% compatible with classic SimCity/Micropolis city files.
 *
 * Slots live in localStorage (persistent app storage inside the Capacitor
 * WebView): 4 manual + 4 rotating autosave slots.
 */

import type { MicropolisSimulator } from '$lib/MicropolisSimulator';

export const SAVE_FORMAT = 'micropolis-savegame';
export const SAVE_VERSION = 1;
export const SLOT_COUNT = 4;

export type SlotKind = 'manual' | 'auto';

export interface SaveGame {
	format: typeof SAVE_FORMAT;
	version: number;
	name: string;
	savedAt: string; // ISO timestamp
	funds: number;
	population: number;
	cityYear: number;
	cityMonth: number;
	/** Base64-encoded original .cty city file. */
	cty: string;
}

const slotKey = (kind: SlotKind, index: number) => `micropolis.save.${kind}${index}`;
const AUTO_INDEX_KEY = 'micropolis.autosaveIndex';

// --- Engine FS bridge -------------------------------------------------------

interface EmscriptenFS {
	writeFile(path: string, data: Uint8Array): void;
	readFile(path: string): Uint8Array;
	unlink(path: string): void;
	analyzePath?(path: string): { exists: boolean };
}

function engineFS(sim: MicropolisSimulator): EmscriptenFS {
	const fs = (sim.micropolisengine as unknown as { FS?: EmscriptenFS })?.FS;
	if (!fs) throw new Error('Engine FS not available');
	return fs;
}

/** Serialize the current city through the engine's own .cty writer. */
export function cityToBytes(sim: MicropolisSimulator): Uint8Array {
	const m = sim.micropolis;
	if (!m) throw new Error('No city loaded');
	// saveCityAs derives cityName/cityFileName from the target path — preserve them.
	const prevName = m.cityName;
	const prevFileName = m.cityFileName;
	const path = '/__save_tmp.cty';
	m.saveCityAs(path);
	const bytes = engineFS(sim).readFile(path);
	try { engineFS(sim).unlink(path); } catch { /* ignore */ }
	m.setCityName(prevName);
	m.cityFileName = prevFileName;
	return bytes;
}

/** Load city bytes (original .cty format) into the running engine. */
export function bytesToCity(sim: MicropolisSimulator, bytes: Uint8Array): boolean {
	const m = sim.micropolis;
	if (!m) throw new Error('Engine not ready');
	const path = '/__load_tmp.cty';
	engineFS(sim).writeFile(path, bytes);
	const ok = m.loadCity(path);
	try { engineFS(sim).unlink(path); } catch { /* ignore */ }
	sim.syncMapViews();
	return ok;
}

// --- Base64 helpers (Uint8Array-safe) --------------------------------------

export function bytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

// --- Savegame envelope ------------------------------------------------------

export function makeSaveGame(sim: MicropolisSimulator, name: string): SaveGame {
	const m = sim.micropolis!;
	return {
		format: SAVE_FORMAT,
		version: SAVE_VERSION,
		name: name || m.cityName || 'Micropolis',
		savedAt: new Date().toISOString(),
		funds: m.totalFunds,
		population: m.cityPop,
		cityYear: m.cityYear,
		cityMonth: m.cityMonth,
		cty: bytesToBase64(cityToBytes(sim)),
	};
}

export function parseSaveGame(text: string): SaveGame {
	const data = JSON.parse(text) as Partial<SaveGame>;
	if (data?.format !== SAVE_FORMAT || typeof data.cty !== 'string') {
		throw new Error('invalid-savegame');
	}
	return data as SaveGame;
}

export function applySaveGame(sim: MicropolisSimulator, save: SaveGame): boolean {
	const ok = bytesToCity(sim, base64ToBytes(save.cty));
	if (ok && save.name) sim.micropolis!.setCityName(save.name);
	return ok;
}

// --- Slot storage -----------------------------------------------------------

function storage(): Storage | null {
	try {
		return typeof localStorage !== 'undefined' ? localStorage : null;
	} catch {
		return null;
	}
}

export function readSlot(kind: SlotKind, index: number): SaveGame | null {
	const raw = storage()?.getItem(slotKey(kind, index));
	if (!raw) return null;
	try {
		return parseSaveGame(raw);
	} catch {
		return null;
	}
}

export function writeSlot(kind: SlotKind, index: number, save: SaveGame): void {
	storage()?.setItem(slotKey(kind, index), JSON.stringify(save));
}

export function listSlots(kind: SlotKind): (SaveGame | null)[] {
	return Array.from({ length: SLOT_COUNT }, (_, i) => readSlot(kind, i));
}

export function nextAutosaveIndex(): number {
	const s = storage();
	const idx = Number(s?.getItem(AUTO_INDEX_KEY) ?? '0') % SLOT_COUNT;
	s?.setItem(AUTO_INDEX_KEY, String((idx + 1) % SLOT_COUNT));
	return idx;
}

// --- File export / import ---------------------------------------------------

function saveFileName(save: SaveGame): string {
	const base = (save.name || '7city').replace(/[^\w-]+/g, '_').toLowerCase();
	return `${base}_${save.cityYear}.7city.json`;
}

function isNativeCapacitor(): boolean {
	const cap = (globalThis as Record<string, unknown>).Capacitor as
		| { isNativePlatform?: () => boolean }
		| undefined;
	return !!cap?.isNativePlatform?.();
}

/**
 * Export a savegame as a JSON file. Native: write to cache + system share
 * sheet. Browser: regular download.
 */
export async function exportSaveGameFile(save: SaveGame): Promise<void> {
	const json = JSON.stringify(save, null, '\t');
	const fileName = saveFileName(save);

	if (isNativeCapacitor()) {
		const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
		const { Share } = await import('@capacitor/share');
		const result = await Filesystem.writeFile({
			path: fileName,
			data: json,
			directory: Directory.Cache,
			encoding: Encoding.UTF8,
		});
		await Share.share({
			title: save.name,
			url: result.uri,
			dialogTitle: save.name,
		});
		return;
	}

	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Read a user-picked savegame file (from an <input type="file"> change event). */
export async function readSaveGameFile(file: File): Promise<SaveGame> {
	const text = await file.text();
	return parseSaveGame(text);
}
