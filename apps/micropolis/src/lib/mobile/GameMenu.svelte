<script lang="ts">
	import { goto } from '$app/navigation';
	import { micropolisReactive } from '$lib/MicropolisReactive.svelte';
	import type { MicropolisSimulator } from '$lib/MicropolisSimulator';
	import { t, UI_LANGS, setLang, getLang } from './i18n.svelte';
	import { listSlots, makeSaveGame, writeSlot, exportSaveGameFile, SLOT_COUNT, type SaveGame } from './persistence';
	import { setOption } from './settings';
	import MapsWindow from './MapsWindow.svelte';

	let { simulator = null }: { simulator: MicropolisSimulator | null } = $props();

	let open = $state(false);
	let mapsOpen = $state(false);
	let saveOpen = $state(false);
	let manualSlots = $state<(SaveGame | null)[]>([]);
	let toast = $state('');
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	// Options mirror (engine state isn't reactive; sync on open)
	let optAutoBulldoze = $state(true);
	let optAutoBudget = $state(true);
	let optAutoGoto = $state(true);
	let optDisasters = $state(true);
	let optSound = $state(true);

	type SpeedId = 'pause' | 'slow' | 'medium' | 'fast';
	let speed = $state<SpeedId>('medium');

	function showToast(msg: string) {
		toast = msg;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = ''), 1800);
	}

	function syncFromEngine() {
		const m = simulator?.micropolis;
		if (!m) return;
		optAutoBulldoze = m.autoBulldoze;
		optAutoBudget = m.autoBudget;
		optAutoGoto = m.autoGoto;
		optDisasters = m.enableDisasters;
		optSound = m.enableSound;
		speed = micropolisReactive.simPaused
			? 'pause'
			: (simulator!.gameSpeed <= 1 ? 'slow' : simulator!.gameSpeed >= 5 ? 'fast' : 'medium');
	}

	function toggleOpen() {
		open = !open;
		if (open) {
			syncFromEngine();
			saveOpen = false;
		}
	}

	function close() {
		open = false;
		saveOpen = false;
	}

	// --- System ---
	function menuNewCity() { close(); goto('/start?screen=new'); }
	function menuLoad() { close(); goto('/start?screen=load'); }
	function menuStartScreen() { close(); goto('/start'); }

	function openSaveSlots() {
		manualSlots = listSlots('manual');
		saveOpen = true;
	}

	function saveToSlot(i: number) {
		if (!simulator?.micropolis) return;
		try {
			const save = makeSaveGame(simulator, simulator.micropolis.cityName || 'Micropolis');
			writeSlot('manual', i, save);
			manualSlots = listSlots('manual');
			showToast(t('saveDone'));
		} catch (e) {
			console.warn('save failed:', e instanceof Error ? `${e.name}: ${e.message}` : String(e));
		}
	}

	async function saveToFile() {
		if (!simulator?.micropolis) return;
		try {
			const save = makeSaveGame(simulator, simulator.micropolis.cityName || 'Micropolis');
			await exportSaveGameFile(save);
			close();
		} catch (e) {
			console.warn('export failed', e);
		}
	}

	// --- Options ---
	function setSpeed(s: SpeedId) {
		speed = s;
		if (!simulator) return;
		if (s === 'pause') {
			simulator.setPaused(true);
			return;
		}
		simulator.setPaused(false);
		simulator.setGameSpeed(s === 'slow' ? 1 : s === 'medium' ? 3 : 5);
	}

	function applyToggle(key: 'bulldoze' | 'budget' | 'goto' | 'disasters' | 'sound', value: boolean) {
		const m = simulator?.micropolis;
		if (!m) return;
		// Mirror every change into local storage: the engine forgets these on a
		// fresh start, and loading a .cty overwrites them with the file's values.
		switch (key) {
			case 'bulldoze': m.setAutoBulldoze(value); optAutoBulldoze = value; setOption('autoBulldoze', value); break;
			case 'budget': m.setAutoBudget(value); optAutoBudget = value; setOption('autoBudget', value); break;
			case 'goto': m.setAutoGoto(value); optAutoGoto = value; setOption('autoGoto', value); break;
			case 'disasters': m.setEnableDisasters(value); optDisasters = value; setOption('disasters', value); break;
			case 'sound': m.setEnableSound(value); optSound = value; setOption('sound', value); break;
		}
	}

	// --- Disasters ---
	function disaster(kind: 'fire' | 'flood' | 'earthquake' | 'tornado' | 'monster' | 'meltdown') {
		const m = simulator?.micropolis;
		if (!m) return;
		switch (kind) {
			case 'fire': m.makeFire(); break;
			case 'flood': m.makeFlood(); break;
			case 'earthquake': m.makeEarthquake(); break;
			case 'tornado': m.makeTornado(); break;
			case 'monster': m.makeMonster(); break;
			case 'meltdown': m.makeMeltdown(); break;
		}
		close();
	}

	// --- Windows ---
	function openMaps() {
		close();
		mapsOpen = true;
	}
	function openBudget() {
		close();
		simulator?.micropolis?.doBudget();
	}
</script>

<button class="menu-fab" aria-label={t('menu')} onclick={toggleOpen}>⋮</button>

{#if toast}
	<div class="toast">{toast}</div>
{/if}

{#if open}
	<div class="scrim" onclick={close} role="presentation"></div>
	<div class="menu-panel" role="menu" aria-label={t('menu')}>
		{#if !saveOpen}
			<div class="section">
				<div class="section-title">{t('system')}</div>
				<button class="row" onclick={menuNewCity}>🏙️ {t('newCity')}</button>
				<button class="row" onclick={menuLoad}>📂 {t('load')}</button>
				<button class="row" onclick={openSaveSlots}>💾 {t('save')}</button>
				<button class="row" onclick={saveToFile}>📄 {t('saveToFile')}</button>
				<button class="row" onclick={menuStartScreen}>🚪 {t('toStartScreen')}</button>
			</div>

			<div class="section">
				<div class="section-title">{t('options')}</div>
				<div class="lang-row" role="radiogroup" aria-label={t('language')}>
					{#each UI_LANGS as l (l.id)}
						<button class="speed-btn" class:sel={getLang() === l.id} onclick={() => setLang(l.id)}>{l.label}</button>
					{/each}
				</div>
				<div class="speed-row" role="radiogroup" aria-label={t('gameSpeed')}>
					<button class="speed-btn" class:sel={speed === 'pause'} onclick={() => setSpeed('pause')}>⏸ {t('pause')}</button>
					<button class="speed-btn" class:sel={speed === 'slow'} onclick={() => setSpeed('slow')}>🐢 {t('slow')}</button>
					<button class="speed-btn" class:sel={speed === 'medium'} onclick={() => setSpeed('medium')}>▶ {t('medium')}</button>
					<button class="speed-btn" class:sel={speed === 'fast'} onclick={() => setSpeed('fast')}>⏩ {t('fast')}</button>
				</div>
				<label class="toggle-row">
					<span>{t('autoBulldoze')}</span>
					<input type="checkbox" checked={optAutoBulldoze} onchange={(e) => applyToggle('bulldoze', e.currentTarget.checked)} />
				</label>
				<label class="toggle-row">
					<span>{t('autoBudget')}</span>
					<input type="checkbox" checked={optAutoBudget} onchange={(e) => applyToggle('budget', e.currentTarget.checked)} />
				</label>
				<label class="toggle-row">
					<span>{t('autoGoto')}</span>
					<input type="checkbox" checked={optAutoGoto} onchange={(e) => applyToggle('goto', e.currentTarget.checked)} />
				</label>
				<label class="toggle-row">
					<span>{t('disastersEnabled')}</span>
					<input type="checkbox" checked={optDisasters} onchange={(e) => applyToggle('disasters', e.currentTarget.checked)} />
				</label>
				<label class="toggle-row">
					<span>{t('sound')}</span>
					<input type="checkbox" checked={optSound} onchange={(e) => applyToggle('sound', e.currentTarget.checked)} />
				</label>
			</div>

			<div class="section">
				<div class="section-title">{t('disasters')}</div>
				<div class="disaster-grid">
					<button class="dis-btn" onclick={() => disaster('fire')}>🔥 {t('fire')}</button>
					<button class="dis-btn" onclick={() => disaster('flood')}>🌊 {t('flood')}</button>
					<button class="dis-btn" onclick={() => disaster('earthquake')}>🫨 {t('earthquake')}</button>
					<button class="dis-btn" onclick={() => disaster('tornado')}>🌪️ {t('tornado')}</button>
					<button class="dis-btn" onclick={() => disaster('monster')}>🦖 {t('monster')}</button>
					<button class="dis-btn" onclick={() => disaster('meltdown')}>☢️ {t('meltdown')}</button>
				</div>
			</div>

			<div class="section">
				<div class="section-title">{t('windows')}</div>
				<button class="row" onclick={openMaps}>🗺️ {t('maps')}</button>
				<button class="row" onclick={openBudget}>💰 {t('budget')}</button>
			</div>

			<div class="section">
				<div class="section-title">{t('legal')}</div>
				<a class="row link-row" href="https://super7.io/impressum.html" target="_blank" rel="noopener">📄 {t('impressum')}</a>
				<a class="row link-row" href="https://super7.io/7citydatenschutz.html" target="_blank" rel="noopener">🔒 {t('datenschutz')}</a>
			</div>
		{:else}
			<div class="section">
				<div class="section-title">{t('saveToSlot')}</div>
				{#each manualSlots as save, i (i)}
					<button class="row slot-row" onclick={() => saveToSlot(i)}>
						<span class="slot-tag">{t('slot')} {i + 1}</span>
						{#if save}
							<span class="slot-info">{save.name} · {save.cityMonth}/{save.cityYear}</span>
							<span class="slot-over">{t('overwrite')}</span>
						{:else}
							<span class="slot-info empty">{t('emptySlot')}</span>
						{/if}
					</button>
				{/each}
				<button class="row" onclick={() => (saveOpen = false)}>‹ {t('back')}</button>
			</div>
		{/if}
	</div>
{/if}

{#if mapsOpen}
	<MapsWindow {simulator} onClose={() => (mapsOpen = false)} />
{/if}

<style>
	.menu-fab {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 40;
		width: 2.4rem;
		height: 2.4rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.4rem;
		font-weight: 700;
		color: #eef2ff;
		background: rgba(8, 12, 20, 0.82);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 6px;
		cursor: pointer;
		backdrop-filter: blur(4px);
	}

	.scrim {
		position: absolute;
		inset: 0;
		z-index: 45;
		background: rgba(0, 0, 0, 0.45);
	}

	.menu-panel {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 50;
		width: min(23rem, 94vw);
		overflow-y: auto;
		overflow-x: hidden;
		background: #141a2a;
		border-right: 1px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0.4rem 0 1.6rem rgba(0, 0, 0, 0.45);
		padding: 0.7rem 0.7rem 1.2rem;
		font-family: ui-monospace, Menlo, monospace;
		color: #e8eeff;
	}

	.section { margin-bottom: 0.9rem; }
	.section-title {
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #8a92b0;
		padding: 0.3rem 0.3rem 0.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 0.3rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		text-align: left;
		font: inherit;
		font-size: 0.88rem;
		color: inherit;
		background: transparent;
		border: none;
		border-radius: 0.35rem;
		padding: 0.55rem 0.45rem;
		cursor: pointer;
		min-height: 2.6rem;
	}
	.row:active { background: rgba(255, 255, 255, 0.12); }

	.link-row {
		text-decoration: none;
		box-sizing: border-box;
	}

	/* auto-fit: rows wrap instead of forcing horizontal overflow */
	.speed-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(6.4rem, 1fr));
		gap: 0.3rem;
		padding: 0.3rem 0.2rem 0.5rem;
	}
	.lang-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(6.4rem, 1fr));
		gap: 0.3rem;
		padding: 0.3rem 0.2rem 0.15rem;
	}
	.speed-btn {
		font: inherit;
		font-size: 0.66rem;
		color: inherit;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 0.35rem;
		padding: 0.45rem 0.1rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.speed-btn.sel {
		background: #2f4a7d;
		border-color: #8ab8ff;
		font-weight: 700;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0.5rem 0.45rem;
		font-size: 0.82rem;
		min-height: 2.4rem;
		cursor: pointer;
	}
	.toggle-row input {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: #4a86e8;
	}

	.disaster-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem;
		padding: 0.2rem;
	}
	.dis-btn {
		font: inherit;
		font-size: 0.78rem;
		color: inherit;
		text-align: left;
		background: rgba(200, 60, 40, 0.16);
		border: 1px solid rgba(255, 120, 90, 0.35);
		border-radius: 0.35rem;
		padding: 0.55rem 0.5rem;
		cursor: pointer;
		min-height: 2.5rem;
	}
	.dis-btn:active { background: rgba(200, 60, 40, 0.35); }

	.slot-row { flex-wrap: wrap; }
	.slot-tag {
		font-size: 0.62rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ffd76a;
		flex: 0 0 100%;
	}
	.slot-info { font-size: 0.8rem; }
	.slot-info.empty { opacity: 0.6; }
	.slot-over {
		margin-left: auto;
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #ff9d7a;
	}

	.toast {
		position: absolute;
		top: 3.4rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 60;
		background: rgba(20, 90, 40, 0.92);
		color: #fff;
		font-family: ui-monospace, Menlo, monospace;
		font-size: 0.8rem;
		padding: 0.45rem 0.9rem;
		border-radius: 0.4rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}
</style>
