<script lang="ts">
	import { micropolisReactive } from '$lib/MicropolisReactive.svelte';
	import { toolState } from '$lib/ToolState.svelte';
	import { monthAbbrev } from '$lib/mobile/i18n.svelte';

	const funds = $derived(micropolisReactive.totalFunds);
	const dateLabel = $derived(
		`${monthAbbrev(micropolisReactive.cityMonth)} ${micropolisReactive.cityYear} · ${micropolisReactive.cityName || '7CITY'}`
	);

	// Classic RCI demand indicator: bars from a center line, ±2000 full scale.
	const RCI_MAX = 2000;
	const rciBars = $derived(
		[
			{ letter: 'R', v: micropolisReactive.demandR, color: '#00c000' },
			{ letter: 'C', v: micropolisReactive.demandC, color: '#0080ff' },
			{ letter: 'I', v: micropolisReactive.demandI, color: '#ffc800' },
		].map((b) => ({
			...b,
			up: Math.min(50, Math.max(0, (b.v / RCI_MAX) * 50)),
			down: Math.min(50, Math.max(0, (-b.v / RCI_MAX) * 50)),
		}))
	);
</script>

<div class="game-hud" aria-live="polite">
	<div class="hud-row">
		<span class="hud-funds">${funds.toLocaleString()}</span>
		<span class="hud-rci" role="img" aria-label="R {micropolisReactive.demandR}, C {micropolisReactive.demandC}, I {micropolisReactive.demandI}">
			{#each rciBars as b (b.letter)}
				<span class="rci-track" title={b.letter}>
					{#if b.up > 0}<span class="rci-fill up" style="height:{b.up}%; background:{b.color}"></span>{/if}
					{#if b.down > 0}<span class="rci-fill down" style="height:{b.down}%; background:{b.color}"></span>{/if}
				</span>
			{/each}
		</span>
		<span class="hud-date" title={dateLabel}>{dateLabel}</span>
	</div>
	{#if toolState.lastToolFeedback}
		<div class="hud-feedback">{toolState.lastToolFeedback}</div>
	{/if}
</div>

<style>
	.game-hud {
		position: absolute;
		top: 0.5rem;
		left: 3.4rem; /* leaves room for the ⋮ menu button */
		z-index: 20;
		max-width: calc(100% - 6.5rem);
		pointer-events: none;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.78rem;
		line-height: 1.3;
		color: #f4f4f0;
		background: rgba(8, 12, 20, 0.82);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		padding: 0.3rem 0.55rem;
		width: fit-content;
		box-sizing: border-box;
		backdrop-filter: blur(4px);
	}

	.hud-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		white-space: nowrap;
	}

	.hud-funds {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: #9cf59c;
	}

	.hud-rci {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
	}

	.rci-track {
		position: relative;
		width: 0.5rem;
		height: 1.25rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.rci-track::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 1px;
		background: rgba(255, 255, 255, 0.55);
	}

	.rci-fill {
		position: absolute;
		left: 0;
		right: 0;
	}

	.rci-fill.up {
		bottom: 50%;
	}

	.rci-fill.down {
		top: 50%;
	}

	.hud-date {
		font-variant-numeric: tabular-nums;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hud-feedback {
		margin-top: 0.25rem;
		padding-top: 0.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		font-size: 0.72rem;
		font-weight: 600;
		color: #ffc840;
	}
</style>
