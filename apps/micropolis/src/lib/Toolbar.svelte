<script lang="ts">
	import { GAME_TOOL_GROUPS, toolIconUrl, type ToolId } from '$lib/gameTools';
	import { toolState } from '$lib/ToolState.svelte';
	import { toolLabel } from '$lib/mobile/i18n.svelte';

	function selectTool(id: ToolId) {
		toolState.setActiveTool(id);
	}
</script>

<nav class="toolbar" aria-label="City tools">
	{#each GAME_TOOL_GROUPS as group, gi (group.id)}
		{#if gi > 0}<div class="tool-sep" aria-hidden="true"></div>{/if}
		{#each group.tools as tool (tool.id)}
			{@const active = toolState.activeToolId === tool.id}
			<button
				type="button"
				class="tool-item"
				class:active
				title="{toolLabel(tool.id)} (${tool.cost})"
				aria-label="{toolLabel(tool.id)} (${tool.cost})"
				aria-pressed={active}
				onclick={() => selectTool(tool.id)}
			>
				<img class="tool-icon" src={toolIconUrl(tool.id, active)} alt="" draggable="false" />
				<span class="tool-cost">${tool.cost}</span>
			</button>
		{/each}
	{/each}
</nav>

<style>
	/* Shared: original pixel icons on a dark rail; scrolls along its axis. */
	.toolbar {
		flex-shrink: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 0.15rem;
		margin: 0;
		background: rgba(26, 26, 46, 0.96);
		font-family: ui-monospace, Menlo, monospace;
		contain: layout style;
		scrollbar-width: thin;
		scrollbar-color: #4a4a68 transparent;
		-webkit-overflow-scrolling: touch;
	}

	.tool-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		flex: 0 0 auto;
		border: 1px solid transparent;
		border-radius: 0.4rem;
		background: transparent;
		cursor: pointer;
		padding: 0.25rem 0.3rem;
		min-width: 3rem;
		min-height: 3rem;
		box-sizing: border-box;
	}

	.tool-icon {
		width: 2rem;
		height: 2rem;
		image-rendering: pixelated;
		pointer-events: none;
	}

	.tool-cost {
		font-size: 0.55rem;
		line-height: 1;
		color: #b9c2dd;
		font-variant-numeric: tabular-nums;
		pointer-events: none;
	}

	.tool-item.active {
		background: #304878;
		border-color: #8ab8ff;
	}
	.tool-item.active .tool-cost {
		color: #ffe566;
		font-weight: 700;
	}

	.tool-sep {
		flex: 0 0 auto;
		background: rgba(255, 255, 255, 0.14);
	}

	/* Landscape: vertical rail on the left */
	@media (orientation: landscape) {
		.toolbar {
			flex-direction: column;
			height: 100%;
			width: 3.6rem;
			overflow-y: auto;
			overflow-x: hidden;
			padding: 0.3rem 0.25rem calc(0.3rem + env(safe-area-inset-bottom, 0px));
			border-right: 1px solid #5a5a78;
		}
		.tool-sep {
			width: 70%;
			height: 1px;
			margin: 0.18rem 0;
		}
	}

	/* Portrait: horizontal bar at the bottom */
	@media (orientation: portrait) {
		.toolbar {
			flex-direction: row;
			width: 100%;
			height: 3.9rem;
			overflow-x: auto;
			overflow-y: hidden;
			padding: 0.25rem calc(0.35rem + env(safe-area-inset-left, 0px)) calc(0.25rem + env(safe-area-inset-bottom, 0px));
			border-top: 1px solid #5a5a78;
		}
		.tool-sep {
			width: 1px;
			height: 60%;
			margin: 0 0.18rem;
		}
	}
</style>
