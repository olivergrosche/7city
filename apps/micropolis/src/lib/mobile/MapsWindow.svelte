<script lang="ts">
	import { onMount } from 'svelte';
	import type { MicropolisSimulator } from '$lib/MicropolisSimulator';
	import { t, type UiKey } from './i18n.svelte';

	let { simulator = null, onClose }: {
		simulator: MicropolisSimulator | null;
		onClose: () => void;
	} = $props();

	type MapMode =
		| 'all' | 'res' | 'com' | 'ind'
		| 'power' | 'popdensity' | 'growth' | 'traffic'
		| 'pollution' | 'crime' | 'landvalue' | 'police' | 'fire';

	interface ModeDef { id: MapMode; icon: string; label: UiKey; legend: 'heat' | 'power' | 'growth' | 'zones' }

	const MODES: ModeDef[] = [
		{ id: 'all', icon: '🏙️', label: 'allZones', legend: 'zones' },
		{ id: 'res', icon: '🏠', label: 'resZones', legend: 'zones' },
		{ id: 'com', icon: '🏬', label: 'comZones', legend: 'zones' },
		{ id: 'ind', icon: '🏭', label: 'indZones', legend: 'zones' },
		{ id: 'power', icon: '⚡', label: 'powerGrid', legend: 'power' },
		{ id: 'popdensity', icon: '👥', label: 'populationMap', legend: 'heat' },
		{ id: 'growth', icon: '📈', label: 'rateOfGrowth', legend: 'growth' },
		{ id: 'traffic', icon: '🚗', label: 'trafficDensity', legend: 'heat' },
		{ id: 'pollution', icon: '🏭', label: 'pollution', legend: 'heat' },
		{ id: 'crime', icon: '🚨', label: 'crimeRate', legend: 'heat' },
		{ id: 'landvalue', icon: '💰', label: 'landValue', legend: 'heat' },
		{ id: 'police', icon: '👮', label: 'policeCoverage', legend: 'heat' },
		{ id: 'fire', icon: '🚒', label: 'fireCoverage', legend: 'heat' },
	];

	let mode = $state<MapMode>('all');
	let canvas = $state<HTMLCanvasElement | null>(null);

	const currentMode = $derived(MODES.find((m) => m.id === mode)!);

	// Tile ranges from the classic tile map
	const RESBASE = 240, COMBASE = 423, INDBASE = 612, PORTBASE = 693;

	function terrainColor(tile: number): [number, number, number] {
		if (tile >= 2 && tile <= 20) return [43, 78, 158]; // water
		if (tile >= 21 && tile <= 43) return [30, 96, 46]; // trees/park
		if (tile <= 1) return [206, 175, 118]; // clear
		return [120, 124, 130]; // built
	}

	/** Blue→green→yellow→red heat scale for 0..1. */
	function heatColor(v: number): [number, number, number] {
		const x = Math.max(0, Math.min(1, v));
		if (x < 0.25) { const k = x / 0.25; return [0, Math.round(120 * k), Math.round(200 - 60 * k)]; }
		if (x < 0.5) { const k = (x - 0.25) / 0.25; return [0, Math.round(120 + 100 * k), Math.round(140 - 140 * k)]; }
		if (x < 0.75) { const k = (x - 0.5) / 0.25; return [Math.round(255 * k), Math.round(220 - 40 * k), 0]; }
		const k = (x - 0.75) / 0.25;
		return [255, Math.round(180 - 180 * k), 0];
	}

	function render() {
		const sim = simulator;
		const m = sim?.micropolis;
		const eng = sim?.micropolisengine;
		const map = sim?.mapData;
		if (!sim || !m || !eng || !map || !canvas) return;

		// Note: no m.updateMaps() here — it fires engine→JS callbacks that
		// mutate reactive state mid-render (re-entrancy froze the WebView).
		// The overlay maps refresh continuously during normal sim census.

		const W = eng.WORLD_W;
		const H = eng.WORLD_H;
		canvas.width = W;
		canvas.height = H;
		const ctx = canvas.getContext('2d')!;
		const img = ctx.createImageData(W, H);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const me = m as any;

		for (let x = 0; x < W; x++) {
			for (let y = 0; y < H; y++) {
				const tile = map[x * H + y] & 0x3ff;
				let [r, g, b] = terrainColor(tile);
				const built = tile >= 44;

				switch (mode) {
					case 'all':
						if (tile >= RESBASE && tile < PORTBASE) [r, g, b] = [235, 235, 230];
						else if (built) [r, g, b] = [168, 168, 164];
						break;
					case 'res':
						if (tile >= RESBASE && tile < COMBASE) [r, g, b] = [240, 240, 235];
						break;
					case 'com':
						if (tile >= COMBASE && tile < INDBASE) [r, g, b] = [240, 240, 235];
						break;
					case 'ind':
						if (tile >= INDBASE && tile < PORTBASE) [r, g, b] = [240, 240, 235];
						break;
					case 'power': {
						if (built) {
							const powered = me.getPowerGridAt(x, y) > 0;
							[r, g, b] = powered ? [235, 60, 40] : [60, 90, 235];
						}
						break;
					}
					case 'popdensity': {
						const v = me.getPopulationDensityAt(x, y) / 255;
						if (v > 0.02) [r, g, b] = heatColor(v);
						break;
					}
					case 'growth': {
						const v = me.getRateOfGrowthAt(x, y);
						if (v < -2) [r, g, b] = [40, 170, 60];
						else if (v > 2) [r, g, b] = heatColor(0.5 + Math.min(0.5, v / 200));
						break;
					}
					case 'traffic': {
						const v = me.getTrafficDensityAt(x, y) / 240;
						if (v > 0.03) [r, g, b] = heatColor(v);
						break;
					}
					case 'pollution': {
						const v = me.getPollutionAt(x, y) / 255;
						if (v > 0.03) [r, g, b] = heatColor(v);
						break;
					}
					case 'crime': {
						const v = me.getCrimeAt(x, y) / 250;
						if (v > 0.03) [r, g, b] = heatColor(v);
						break;
					}
					case 'landvalue': {
						const v = me.getLandValueAt(x, y) / 250;
						if (v > 0.03) [r, g, b] = heatColor(v);
						break;
					}
					case 'police': {
						const v = me.getPoliceCoverageAt(x, y) / 1000;
						if (v > 0.01) [r, g, b] = heatColor(v);
						break;
					}
					case 'fire': {
						const v = me.getFireCoverageAt(x, y) / 1000;
						if (v > 0.01) [r, g, b] = heatColor(v);
						break;
					}
				}

				const o = (y * W + x) * 4;
				img.data[o] = r;
				img.data[o + 1] = g;
				img.data[o + 2] = b;
				img.data[o + 3] = 255;
			}
		}
		ctx.putImageData(img, 0, 0);
	}

	function setMode(next: MapMode) {
		mode = next;
		render();
	}

	// Deliberately no $effect here: render() reaches deep into the WASM engine,
	// and rerunning it from reactive tracking caused re-entrant callback loops.
	onMount(() => {
		render();
	});
</script>

<div class="maps-scrim" role="presentation" onclick={onClose}></div>
<div class="maps-window" role="dialog" aria-label={t('maps')}>
	<div class="maps-head">
		<span class="maps-title">🗺️ {t('cityMap')} — {t(currentMode.label)}</span>
		<button class="maps-close" aria-label={t('mapExit')} onclick={onClose}>✕</button>
	</div>

	<div class="maps-canvas-wrap">
		<canvas bind:this={canvas} class="maps-canvas"></canvas>
	</div>

	<div class="maps-legend">
		{#if currentMode.legend === 'heat'}
			<span class="legend-label">{t('legendLow')}</span>
			<span class="legend-bar heat"></span>
			<span class="legend-label">{t('legendHigh')}</span>
		{:else if currentMode.legend === 'power'}
			<span class="legend-chip" style="background:#eb3c28"></span><span class="legend-label">{t('powered')}</span>
			<span class="legend-chip" style="background:#3c5aeb"></span><span class="legend-label">{t('unpowered')}</span>
		{:else if currentMode.legend === 'growth'}
			<span class="legend-chip" style="background:#28aa3c"></span><span class="legend-label">{t('growthShrink')}</span>
			<span class="legend-bar growth"></span>
			<span class="legend-label">{t('growthGrow')}</span>
		{/if}
	</div>

	<div class="maps-modes">
		{#each MODES as md (md.id)}
			<button class="mode-btn" class:sel={mode === md.id} onclick={() => setMode(md.id)}>
				<span class="mode-icon">{md.icon}</span>
				<span class="mode-label">{t(md.label)}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.maps-scrim {
		position: absolute;
		inset: 0;
		z-index: 55;
		background: rgba(0, 0, 0, 0.55);
	}

	.maps-window {
		position: absolute;
		inset: 0.6rem;
		z-index: 56;
		display: flex;
		flex-direction: column;
		background: #10182a;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.6rem;
		overflow: hidden;
		font-family: ui-monospace, Menlo, monospace;
		color: #e8eeff;
	}

	.maps-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.55rem 0.7rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		flex: 0 0 auto;
	}
	.maps-title {
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.maps-close {
		font: inherit;
		font-size: 1rem;
		color: inherit;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 0.35rem;
		width: 2.2rem;
		height: 2.2rem;
		cursor: pointer;
		flex: 0 0 auto;
	}

	.maps-canvas-wrap {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.6rem;
	}
	.maps-canvas {
		max-width: 100%;
		max-height: 100%;
		aspect-ratio: 6 / 5;
		width: 100%;
		height: auto;
		image-rendering: pixelated;
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 0.3rem;
		background: #0a0f1c;
	}

	.maps-legend {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		padding: 0.15rem 0.6rem 0.4rem;
		font-size: 0.66rem;
		color: #aeb8d6;
		min-height: 1.3rem;
	}
	.legend-bar {
		width: 7rem;
		height: 0.55rem;
		border-radius: 0.3rem;
		border: 1px solid rgba(255, 255, 255, 0.25);
	}
	.legend-bar.heat {
		background: linear-gradient(90deg, #0078c8, #00dc8c, #ffdc00, #ff6400, #ff0000);
	}
	.legend-bar.growth {
		background: linear-gradient(90deg, #ffdc00, #ff6400, #ff0000);
	}
	.legend-chip {
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 0.2rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.maps-modes {
		flex: 0 0 auto;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(4.6rem, 1fr);
		gap: 0.3rem;
		overflow-x: auto;
		padding: 0.45rem 0.55rem calc(0.55rem + env(safe-area-inset-bottom, 0px));
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		scrollbar-width: thin;
	}
	.mode-btn {
		font: inherit;
		color: inherit;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 0.4rem;
		padding: 0.35rem 0.25rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.12rem;
		min-height: 3.1rem;
	}
	.mode-btn.sel {
		background: #2f4a7d;
		border-color: #8ab8ff;
	}
	.mode-icon { font-size: 1rem; line-height: 1; }
	.mode-label {
		font-size: 0.52rem;
		line-height: 1.15;
		text-align: center;
		letter-spacing: 0.02em;
	}
</style>
