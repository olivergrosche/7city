<script lang="ts">

  import { onMount, onDestroy } from 'svelte';
  import { getSharedSimulator, releaseSharedSimulator, MicropolisSimulator } from '$lib/MicropolisSimulator';
  import { micropolisReactive } from '$lib/MicropolisReactive.svelte';
  import TileView from '$lib/TileView.svelte';
  import GameHud from '$lib/GameHud.svelte';
  import HelpModal from '$lib/HelpModal.svelte';
  import Toolbar from '$lib/Toolbar.svelte';
  import MessageOverlay from '$lib/MessageOverlay.svelte';
  import ZoneStatusPanel from '$lib/ZoneStatusPanel.svelte';
  import BudgetModal from '$lib/BudgetModal.svelte';
  import SoftwareSpriteLayer from '$lib/sprites/SoftwareSpriteLayer.svelte';
  import { triggerSkywriting, toggleSkywritingPilot } from '$lib/sprites/plugins/skywriting/SkywritingPlugin.svelte';
  import CursorLayer from '$lib/input/CursorLayer.svelte';
  import { tileFootprintScreenRect } from '$lib/input/viewportTileFrame';
  import { toolState } from '$lib/ToolState.svelte';
  import { toolFootprintAtCenter } from '$lib/gameTools';
  import type { CursorPresence } from '$lib/input/types';
  import type { ScreenRect } from '$lib/input/viewportTileFrame';
  import GameMenu from '$lib/mobile/GameMenu.svelte';
  import { takePendingAction, applyStartAction, startAutosave, stopAutosave } from '$lib/mobile/gameSession';
  import { t } from '$lib/mobile/i18n.svelte';

  let micropolisSimulator = $state<MicropolisSimulator | null>(null);
  let tileView: TileView | null = null;
  let viewRenderRef: (() => void) | null = null;

  // WASM boot + city load can take 10–20 s on slower phones; without feedback
  // that reads as "black screen, no map" (first tester bug report).
  let engineLoading = $state(true);

  function getMapViewport() {
    return tileView?.getMapViewport() ?? null;
  }

  const localPlayerId = 'local';

  const localCursorPresence = $derived.by((): CursorPresence[] => {
    void toolState.toolRevision;
    void toolState.hoverRevision;
    const tile = toolState.hoverTile;
    const toolId = toolState.activeToolId;
    if (!tile) return [];
    const footprint = toolFootprintAtCenter(tile[0], tile[1], toolId);
    return [{
      playerId: localPlayerId,
      local: true,
      toolId,
      anchorSpace: 'world-tile',
      visible: true,
      tile: footprint,
      rimPolicy: 'fat',
      representations: { dom: [] }
    }];
  });

  const domFrameRects = $derived.by((): Record<string, ScreenRect> => {
    void micropolisReactive.mapCameraRevision;
    void toolState.toolRevision;
    void toolState.hoverRevision;
    const tile = toolState.hoverTile;
    const toolId = toolState.activeToolId;
    const vp = tileView?.getMapViewport?.();
    if (!tile || !vp || vp.screenWidth <= 0 || vp.screenHeight <= 0) return {};
    const footprint = toolFootprintAtCenter(tile[0], tile[1], toolId);
    const rect = tileFootprintScreenRect(vp, footprint.x, footprint.y, footprint.w, footprint.h);
    if (rect.w <= 0 || rect.h <= 0) return {};
    return { [localPlayerId]: rect };
  });

  onMount(async () => {

    console.log("MicropolisView: onMount: initializing micropolisengine...");

    viewRenderRef = () => { tileView?.render?.(); };
    micropolisSimulator = await getSharedSimulator(micropolisReactive.engineCallback, viewRenderRef);
    micropolisReactive.attach(micropolisSimulator);

    // Pause sim ticks until tile atlas is loaded — avoids render-before-ready race.
    micropolisSimulator.setPaused(true);
    micropolisSimulator.syncMapViews();
    await tileView!.initialize(micropolisSimulator);

    // Apply what the start screen chose (new city / scenario / slot / file).
    const pending = takePendingAction();
    if (pending) {
      try { applyStartAction(micropolisSimulator, pending); } catch (e) { console.warn('start action failed:', e); }
      // New/loaded city: start centered, not at the previous game's camera.
      tileView?.recenter();
    }
    micropolisSimulator.setPaused(false);
    engineLoading = false;

    // Scenario/city loads park the engine's internal speed at 0 until told to
    // run (classic "press to start"); the first tick can re-clear it, so arm
    // it again once loading settles.
    setTimeout(() => {
      const m = micropolisSimulator?.micropolis;
      if (m && m.simSpeed === 0) m.setSpeed(3);
    }, 500);

    startAutosave(micropolisSimulator);

    console.log("MicropolisView: onMount:", "micropolisSimulator:", micropolisSimulator);

    if (typeof window !== 'undefined') {
      const w = window as unknown as {
        micropolisSkywrite?: typeof triggerSkywriting;
        micropolisSkyPilot?: () => boolean;
      };
      w.micropolisSkywrite = triggerSkywriting;
      w.micropolisSkyPilot = toggleSkywritingPilot;
    }
  });

  onDestroy(() => {
    console.log('MicropolisView: onDestroy');
    stopAutosave();
    micropolisReactive.registerMapPan(null);
    micropolisReactive.detach();
    releaseSharedSimulator(viewRenderRef || undefined);
  });

</script>

<div class="view-container">
  <Toolbar />
  <div class="play-main">
    <div class="map-stack">
      <TileView bind:this={tileView} />
      <SoftwareSpriteLayer getViewport={getMapViewport} simulator={micropolisSimulator} />
      <CursorLayer
        backend="dom"
        presences={localCursorPresence}
        domFrameRects={domFrameRects}
      />
      {#if engineLoading}
        <div class="engine-loading" role="status" aria-live="polite">
          <span class="loading-spinner" aria-hidden="true"></span>
          <span class="loading-text">{t('loadingCity')}</span>
        </div>
      {/if}
      <GameHud />
      <GameMenu simulator={micropolisSimulator} />
      <ZoneStatusPanel />
      <BudgetModal />
      <HelpModal />
    </div>

    <MessageOverlay />
  </div>
</div>

<style>

.view-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  --message-bar-height: 2.5rem;
}

/* Portrait phones: tool palette moves to the bottom edge. */
@media (orientation: portrait) {
  .view-container {
    flex-direction: column;
  }
  .view-container > :global(.toolbar) {
    order: 2;
  }
}

.play-main {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-stack {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

.engine-loading {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: #1a2030;
  color: #e8eeff;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 0.95rem;
}

.loading-spinner {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  border: 0.3rem solid rgba(255, 255, 255, 0.15);
  border-top-color: #8ab8ff;
  animation: engine-spin 0.9s linear infinite;
}

@keyframes engine-spin {
  to { transform: rotate(360deg); }
}

</style>
