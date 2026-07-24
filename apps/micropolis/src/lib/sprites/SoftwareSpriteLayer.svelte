<script lang="ts">
	import type { MapViewport } from '@micropolis/render-core';
	import type { MicropolisSimulator } from '$lib/MicropolisSimulator';
	import { micropolisReactive } from '$lib/MicropolisReactive.svelte';
	import Sprite from './Sprite.svelte';
	import AtmosphericLayerView from './layers/AtmosphericLayerView.svelte';
	import { allSpriteInstances } from './spriteRegistry.svelte';
	import { syncEngineSprites } from './syncEngineSprites';
	import { setEngineSpriteInstances } from './spriteRegistry.svelte';
	import {
		tickSkywriting,
		handleSkywritingKeyDown,
		handleSkywritingKeyUp,
		toggleSkywritingPilot,
		isSkywritingPilot,
	} from './plugins/skywriting/SkywritingPlugin.svelte';

	interface Props {
		getViewport: () => MapViewport | null | undefined;
		simulator?: MicropolisSimulator | null;
	}

	let { getViewport, simulator = null }: Props = $props();

	let layerView: AtmosphericLayerView | null = $state(null);

	const instances = $derived(allSpriteInstances());
	// Re-read every frame instead of $derived: the viewport is a mutable
	// non-reactive object, so a derived would never see it appear or change.
	let viewport = $state<MapViewport | null>(null);

	function refreshSprites(): void {
		viewport = getViewport() ?? null;
		const m = simulator?.micropolis ?? null;
		if (m) {
			setEngineSpriteInstances(syncEngineSprites(m, 'classic'));
		}
		// Population milestones used to auto-launch a second, smoke-writing
		// plane. It is not part of the original game and reads as stray plane
		// parts drifting past the real airliner, so it now only flies when the
		// hidden pilot mode is switched on by hand.
		tickSkywriting();
		layerView?.refresh();
	}

	function onKeyDown(e: KeyboardEvent): void {
		if (e.key === '`' || e.key === 'F9') {
			const on = toggleSkywritingPilot();
			console.info(`Skywriting pilot: ${on ? 'ON' : 'OFF'} (arrows + space = smoke, type letters to paint)`);
			e.preventDefault();
			return;
		}
		if (isSkywritingPilot() && handleSkywritingKeyDown(e)) return;
	}

	function onKeyUp(e: KeyboardEvent): void {
		if (isSkywritingPilot()) handleSkywritingKeyUp(e);
	}

	$effect(() => {
		micropolisReactive.cityPop;
		micropolisReactive.mapRevision;
		refreshSprites();
	});

	$effect(() => {
		if (typeof requestAnimationFrame === 'undefined') return;
		let frameId = 0;
		const loop = () => {
			refreshSprites();
			frameId = requestAnimationFrame(loop);
		};
		frameId = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(frameId);
	});
</script>

<svelte:window onkeydown={onKeyDown} onkeyup={onKeyUp} />

<div class="software-sprite-layer" aria-hidden="true">
	{#if viewport}
		<AtmosphericLayerView bind:this={layerView} {viewport} />
		{#each instances as instance (instance.id)}
			<Sprite {instance} {viewport} />
		{/each}
	{/if}
</div>

<style>
	.software-sprite-layer {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 5;
	}
</style>
