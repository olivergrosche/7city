<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSharedSimulator, releaseSharedSimulator, setSuppressDefaultCityLoad, hasSharedCity, type MicropolisSimulator } from '$lib/MicropolisSimulator';
	import { micropolisReactive } from '$lib/MicropolisReactive.svelte';
	import { t, scenarioProblem } from './i18n.svelte';
	import {
		SCENARIOS,
		DIFFICULTY_FUNDS,
		setPendingAction,
		peekPendingAction,
		type DifficultyLevel,
	} from './gameSession';
	import { listSlots, readSaveGameFile, cityToBytes, bytesToCity, SLOT_COUNT, type SlotKind, type SaveGame } from './persistence';
	import { onDestroy, onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	type Screen = 'menu' | 'new' | 'load' | 'scenario';
	const validScreens: Screen[] = ['menu', 'new', 'load', 'scenario'];

	let screen = $state<Screen>('menu');

	/** ?screen=… is read client-side only (the page is prerendered). */
	function applyQueryScreen() {
		const q = new URLSearchParams(location.search).get('screen') as Screen | null;
		openScreen(q && validScreens.includes(q) ? q : 'menu');
	}

	onMount(() => {
		canContinue = hasSharedCity();
		applyQueryScreen();
	});
	afterNavigate(applyQueryScreen);
	let fileError = $state('');
	let fileInput = $state<HTMLInputElement | null>(null);

	// --- New city state ---
	let seed = $state(Math.floor(Math.random() * 0x7fffffff));
	let cityName = $state('');
	let level = $state<DifficultyLevel>(0);
	let previewCanvas = $state<HTMLCanvasElement | null>(null);
	let generating = $state(false);
	let sim: MicropolisSimulator | null = null;
	let simAcquired = false;

	// A running game survives visits to the start screen: it stays in the
	// shared simulator (paused). The terrain preview generates into that same
	// simulator, so snapshot the live city first and restore it unless the
	// player actually starts something new.
	let canContinue = $state(false);
	let resumeSnapshot: Uint8Array | null = null;

	function snapshotLiveCityOnce() {
		if (resumeSnapshot || !canContinue || !sim?.micropolis) return;
		try {
			resumeSnapshot = cityToBytes(sim);
		} catch (e) {
			console.warn('city snapshot failed:', e);
		}
	}

	function restoreLiveCity() {
		if (!resumeSnapshot || !sim?.micropolis) return;
		try {
			bytesToCity(sim, resumeSnapshot);
		} catch (e) {
			console.warn('city restore failed:', e);
		}
		resumeSnapshot = null;
	}

	// --- Slots ---
	let manualSlots = $state<(SaveGame | null)[]>([]);
	let autoSlots = $state<(SaveGame | null)[]>([]);

	function refreshSlots() {
		manualSlots = listSlots('manual');
		autoSlots = listSlots('auto');
	}

	async function ensureSim(): Promise<MicropolisSimulator> {
		if (sim) return sim;
		setSuppressDefaultCityLoad(true);
		sim = await getSharedSimulator(micropolisReactive.engineCallback, null);
		simAcquired = true;
		sim.setPaused(true);
		return sim;
	}

	onDestroy(() => {
		// Leaving without starting something new (e.g. Continue): put the
		// snapshotted live city back before the play view picks the sim up.
		if (!peekPendingAction()) restoreLiveCity();
		if (simAcquired) releaseSharedSimulator();
	});

	// Terrain preview colors (classic map view palette)
	function tileColor(tile: number): [number, number, number] {
		if (tile >= 2 && tile <= 20) return [45, 82, 165]; // water
		if (tile >= 21 && tile <= 39) return [28, 100, 44]; // trees
		if (tile === 0 || tile === 1) return [199, 164, 100]; // clear land
		if (tile >= 44 && tile <= 47) return [130, 130, 122]; // rubble
		return [150, 150, 150]; // anything built
	}

	async function generatePreview(newSeed = false) {
		generating = true;
		try {
			const s = await ensureSim();
			snapshotLiveCityOnce();
			if (newSeed) seed = Math.floor(Math.random() * 0x7fffffff);
			s.micropolis!.generateSomeCity(seed);
			s.syncMapViews();
			drawPreview(s);
		} finally {
			generating = false;
		}
	}

	function drawPreview(s: MicropolisSimulator) {
		const eng = s.micropolisengine!;
		const W = eng.WORLD_W;
		const H = eng.WORLD_H;
		const map = s.mapData;
		if (!previewCanvas || !map) return;
		previewCanvas.width = W;
		previewCanvas.height = H;
		const ctx = previewCanvas.getContext('2d')!;
		const img = ctx.createImageData(W, H);
		for (let x = 0; x < W; x++) {
			for (let y = 0; y < H; y++) {
				const tile = map[x * H + y] & 0x3ff;
				const [r, g, b] = tileColor(tile);
				const o = (y * W + x) * 4;
				img.data[o] = r;
				img.data[o + 1] = g;
				img.data[o + 2] = b;
				img.data[o + 3] = 255;
			}
		}
		ctx.putImageData(img, 0, 0);
	}

	function openScreen(next: Screen) {
		fileError = '';
		// Backing out of the terrain preview: bring the live city back.
		if (screen === 'new' && next !== 'new') restoreLiveCity();
		screen = next;
		if (next === 'load') refreshSlots();
		if (next === 'new') setTimeout(() => generatePreview(false), 0);
	}

	function continueGame() {
		goto('/play/micropolis');
	}

	function startNewCity() {
		resumeSnapshot = null; // deliberately replacing the old game
		setSuppressDefaultCityLoad(true);
		setPendingAction({ type: 'new', seed, level, name: cityName.trim() });
		goto('/play/micropolis');
	}

	function startScenario(id: number) {
		setSuppressDefaultCityLoad(true);
		setPendingAction({ type: 'scenario', id });
		goto('/play/micropolis');
	}

	function startSlot(kind: SlotKind, index: number) {
		setSuppressDefaultCityLoad(true);
		setPendingAction({ type: 'slot', kind, index });
		goto('/play/micropolis');
	}

	async function onFilePicked(ev: Event) {
		fileError = '';
		const input = ev.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		try {
			const save = await readSaveGameFile(file);
			setSuppressDefaultCityLoad(true);
			setPendingAction({ type: 'file', save });
			goto('/play/micropolis');
		} catch {
			fileError = t('invalidSaveFile');
		}
	}

	function fmtDate(iso: string): string {
		try {
			return new Date(iso).toLocaleString(undefined, {
				day: '2-digit', month: '2-digit', year: '2-digit',
				hour: '2-digit', minute: '2-digit',
			});
		} catch {
			return iso;
		}
	}

	const levelDefs: { level: DifficultyLevel; label: () => string }[] = [
		{ level: 0, label: () => t('easy') },
		{ level: 1, label: () => t('medium') },
		{ level: 2, label: () => t('hard') },
	];
</script>

<div class="start-root">
	<div class="sky"></div>

	<div class="sign-wrap">
		<div class="sign">
			<span class="screw screw-tl"></span>
			<span class="screw screw-tr"></span>
			<span class="screw screw-bl"></span>
			<span class="screw screw-br"></span>

			{#if screen === 'menu'}
				<h1 class="title">7CITY</h1>
				<div class="menu-buttons">
					<button class="sign-btn" onclick={() => openScreen('new')}>{t('startNewCity')}</button>
					<button class="sign-btn" onclick={() => openScreen('load')}>{t('loadCity')}</button>
					<button class="sign-btn" onclick={() => fileInput?.click()}>{t('loadFromFile')}</button>
					<button class="sign-btn" onclick={() => openScreen('scenario')}>{t('selectScenario')}</button>
					{#if canContinue}
						<button class="sign-btn continue-btn" onclick={continueGame}>▶ {t('continueGame')}</button>
					{/if}
				</div>
				{#if fileError}<p class="file-error">{fileError}</p>{/if}

			{:else if screen === 'new'}
				<div class="sub-head">
					<button class="sign-btn small" onclick={() => (screen = 'menu')}>‹ {t('back')}</button>
					<h2 class="sub-title">{t('startNewCity')}</h2>
				</div>
				<div class="new-city">
					<div class="preview-box">
						<canvas bind:this={previewCanvas} class="preview-canvas"></canvas>
						{#if generating}<div class="preview-busy">{t('generatingTerrain')}</div>{/if}
					</div>
					<div class="new-controls">
						<button class="sign-btn small" onclick={() => generatePreview(true)}>🎲 {t('newMap')}</button>
						<input
							class="name-input"
							type="text"
							maxlength="24"
							placeholder={t('cityName')}
							bind:value={cityName}
						/>
						<div class="difficulty" role="radiogroup" aria-label={t('difficulty')}>
							{#each levelDefs as d (d.level)}
								<button
									class="diff-btn"
									class:selected={level === d.level}
									role="radio"
									aria-checked={level === d.level}
									onclick={() => (level = d.level)}
								>
									<span class="diff-label">{d.label()}</span>
									<span class="diff-funds">${DIFFICULTY_FUNDS[d.level].toLocaleString()}</span>
								</button>
							{/each}
						</div>
						<button class="sign-btn play-btn" onclick={startNewCity}>▶ {t('play')}</button>
					</div>
				</div>

			{:else if screen === 'load'}
				<div class="sub-head">
					<button class="sign-btn small" onclick={() => (screen = 'menu')}>‹ {t('back')}</button>
					<h2 class="sub-title">{t('loadCity')}</h2>
				</div>
				<div class="slots-scroll">
					<h3 class="slots-heading">{t('manualSlots')}</h3>
					<div class="slot-list">
						{#each manualSlots as save, i (i)}
							<button class="slot" disabled={!save} onclick={() => startSlot('manual', i)}>
								<span class="slot-tag">{t('slot')} {i + 1}</span>
								{#if save}
									<span class="slot-name">{save.name}</span>
									<span class="slot-meta">{save.cityMonth}/{save.cityYear} · ${save.funds.toLocaleString()} · {fmtDate(save.savedAt)}</span>
								{:else}
									<span class="slot-empty">{t('emptySlot')}</span>
								{/if}
							</button>
						{/each}
					</div>
					<h3 class="slots-heading">{t('autoSlots')}</h3>
					<div class="slot-list">
						{#each autoSlots as save, i (i)}
							<button class="slot" disabled={!save} onclick={() => startSlot('auto', i)}>
								<span class="slot-tag">{t('autoSlot')} {i + 1}</span>
								{#if save}
									<span class="slot-name">{save.name}</span>
									<span class="slot-meta">{save.cityMonth}/{save.cityYear} · ${save.funds.toLocaleString()} · {fmtDate(save.savedAt)}</span>
								{:else}
									<span class="slot-empty">{t('emptySlot')}</span>
								{/if}
							</button>
						{/each}
					</div>
					<button class="sign-btn small file-btn" onclick={() => fileInput?.click()}>📄 {t('loadFromFile')}</button>
					{#if fileError}<p class="file-error">{fileError}</p>{/if}
				</div>

			{:else if screen === 'scenario'}
				<div class="sub-head">
					<button class="sign-btn small" onclick={() => (screen = 'menu')}>‹ {t('back')}</button>
					<h2 class="sub-title">{t('selectScenario')}</h2>
				</div>
				<div class="scenario-scroll">
					<div class="scenario-grid">
						{#each SCENARIOS as sc (sc.id)}
							<button class="scenario-card" onclick={() => startScenario(sc.id)}>
								<span class="sc-emoji">{sc.emoji}</span>
								<span class="sc-city">{sc.city}</span>
								<span class="sc-region">{sc.region}, {sc.year}</span>
								<span class="sc-problem">{scenarioProblem(sc.key)}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<p class="attribution">{t('attribution')}</p>
	</div>

	<input
		bind:this={fileInput}
		type="file"
		accept=".json,application/json"
		class="hidden-file"
		onchange={onFilePicked}
	/>
</div>

<style>
	.start-root {
		position: absolute;
		inset: 0;
		overflow: hidden;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		display: flex;
		flex-direction: column;
	}

	.sky {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 28rem 7rem at 15% 22%, rgba(255, 255, 255, 0.85) 0 38%, transparent 62%),
			radial-gradient(ellipse 22rem 6rem at 80% 12%, rgba(255, 255, 255, 0.75) 0 40%, transparent 65%),
			radial-gradient(ellipse 30rem 8rem at 60% 78%, rgba(255, 255, 255, 0.35) 0 40%, transparent 70%),
			linear-gradient(#3f8fd4 0%, #74b6e8 55%, #a8d4f2 100%);
	}

	.sign-wrap {
		position: relative;
		z-index: 1;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		min-height: 0;
	}

	.sign {
		position: relative;
		width: min(44rem, 100%);
		max-height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		background: linear-gradient(#17672f, #0f5424);
		border: 0.28rem solid #e8ecef;
		outline: 0.18rem solid #6b7178;
		border-radius: 0.9rem;
		box-shadow: 0 0.8rem 2rem rgba(0, 0, 0, 0.35), inset 0 0 0 0.12rem rgba(0, 0, 0, 0.25);
		padding: 1.1rem 1.2rem 1.3rem;
	}

	.screw {
		position: absolute;
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #f4f6f8, #9aa2ab 60%, #5c636b);
		box-shadow: inset 0 0 0.1rem rgba(0, 0, 0, 0.5);
	}
	.screw-tl { top: 0.45rem; left: 0.45rem; }
	.screw-tr { top: 0.45rem; right: 0.45rem; }
	.screw-bl { bottom: 0.45rem; left: 0.45rem; }
	.screw-br { bottom: 0.45rem; right: 0.45rem; }

	.title {
		margin: 0.6rem 0 1.2rem;
		text-align: center;
		font-family: Georgia, 'Times New Roman', serif;
		font-weight: 700;
		font-size: clamp(2rem, 9vw, 3.6rem);
		letter-spacing: 0.06em;
		color: #fff;
		text-shadow: 0.14rem 0.14rem 0 rgba(0, 0, 0, 0.45);
	}

	.menu-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
		padding: 0 0.4rem 0.6rem;
	}

	@media (max-width: 480px) {
		.menu-buttons { grid-template-columns: 1fr; }
	}

	.sign-btn {
		appearance: none;
		cursor: pointer;
		font: inherit;
		font-weight: 700;
		font-size: 0.95rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #fff;
		background: linear-gradient(#1d7a39, #135c29);
		border: 0.14rem solid #e8ecef;
		border-radius: 0.45rem;
		box-shadow: inset 0 0.1rem 0 rgba(255, 255, 255, 0.25), 0 0.15rem 0.3rem rgba(0, 0, 0, 0.35);
		padding: 0.85rem 0.9rem;
		min-height: 3rem;
	}
	.sign-btn:active {
		transform: translateY(0.08rem);
		box-shadow: inset 0 0.12rem 0.25rem rgba(0, 0, 0, 0.4);
	}
	.sign-btn.small {
		font-size: 0.75rem;
		padding: 0.5rem 0.7rem;
		min-height: 2.3rem;
	}

	.sub-head {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 0.8rem;
	}
	.sub-title {
		margin: 0;
		color: #fff;
		font-size: 1.05rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	/* --- New city --- */
	.new-city {
		display: flex;
		gap: 1rem;
		min-height: 0;
		flex-wrap: wrap;
	}
	.preview-box {
		position: relative;
		flex: 1 1 14rem;
		min-width: 12rem;
		background: #0b3d1c;
		border: 0.12rem solid rgba(255, 255, 255, 0.7);
		border-radius: 0.4rem;
		overflow: hidden;
		aspect-ratio: 6 / 5;
	}
	.preview-canvas {
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
		display: block;
	}
	.preview-busy {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.45);
		color: #fff;
		font-size: 0.8rem;
	}
	.new-controls {
		flex: 1 1 14rem;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		min-width: 12rem;
	}
	.name-input {
		font: inherit;
		font-size: 1rem;
		padding: 0.6rem 0.7rem;
		border-radius: 0.4rem;
		border: 0.12rem solid #e8ecef;
		background: rgba(255, 255, 255, 0.92);
		color: #123;
	}
	.difficulty {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}
	.diff-btn {
		font: inherit;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.55rem 0.3rem;
		border-radius: 0.4rem;
		border: 0.12rem solid rgba(232, 236, 239, 0.6);
		background: rgba(255, 255, 255, 0.08);
		color: #e8f5ea;
	}
	.diff-btn.selected {
		background: #e8ecef;
		color: #114422;
		border-color: #fff;
		font-weight: 700;
	}
	.diff-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; }
	.diff-funds { font-size: 0.75rem; opacity: 0.85; }

	.play-btn {
		font-size: 1.05rem;
		background: linear-gradient(#2b9950, #1d7a39);
	}

	.continue-btn {
		grid-column: 1 / -1;
		background: linear-gradient(#2b9950, #1d7a39);
	}

	/* --- Slots --- */
	.slots-scroll {
		overflow-y: auto;
		min-height: 0;
		padding-right: 0.2rem;
	}
	.slots-heading {
		margin: 0.6rem 0 0.4rem;
		color: #cfe8d6;
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.slot-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	@media (max-width: 520px) {
		.slot-list { grid-template-columns: 1fr; }
	}
	.slot {
		font: inherit;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		text-align: left;
		padding: 0.6rem 0.7rem;
		border-radius: 0.45rem;
		border: 0.12rem solid rgba(232, 236, 239, 0.65);
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
		min-height: 3.6rem;
	}
	.slot:disabled {
		opacity: 0.55;
		cursor: default;
	}
	.slot-tag {
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ffd76a;
	}
	.slot-name { font-weight: 700; font-size: 0.95rem; }
	.slot-meta { font-size: 0.7rem; opacity: 0.85; }
	.slot-empty { font-size: 0.85rem; opacity: 0.7; }

	.file-btn { margin-top: 0.8rem; }
	.file-error {
		color: #ffd0d0;
		background: rgba(120, 20, 20, 0.55);
		border-radius: 0.35rem;
		padding: 0.45rem 0.6rem;
		font-size: 0.8rem;
		margin: 0.6rem 0 0;
	}

	/* --- Scenarios --- */
	.scenario-scroll {
		overflow-y: auto;
		min-height: 0;
	}
	.scenario-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
		gap: 0.55rem;
	}
	.scenario-card {
		font: inherit;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.1rem;
		text-align: left;
		padding: 0.6rem 0.65rem;
		border-radius: 0.45rem;
		border: 0.12rem solid rgba(232, 236, 239, 0.65);
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
	}
	.scenario-card:active { background: rgba(255, 255, 255, 0.2); }
	.sc-emoji { font-size: 1.3rem; }
	.sc-city { font-weight: 700; font-size: 0.95rem; }
	.sc-region { font-size: 0.72rem; opacity: 0.85; }
	.sc-problem {
		margin-top: 0.15rem;
		font-size: 0.7rem;
		color: #ffd76a;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.attribution {
		position: relative;
		z-index: 1;
		margin: 0.8rem auto 0;
		max-width: 44rem;
		text-align: center;
		font-size: 0.62rem;
		line-height: 1.4;
		color: rgba(255, 255, 255, 0.92);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
		padding: 0 1rem calc(0.4rem + env(safe-area-inset-bottom, 0px));
	}

	.hidden-file { display: none; }
</style>
