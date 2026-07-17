<script lang="ts">
	import { micropolisReactive } from '$lib/MicropolisReactive.svelte';
	import { messageText } from '$lib/engineMessages';
	import { t } from '$lib/mobile/i18n.svelte';

	const displayText = $derived(
		micropolisReactive.messageIndex >= 0
			? messageText(micropolisReactive.messageIndex)
			: t('welcome'),
	);

	const showCoords = $derived(
		micropolisReactive.messageIndex >= 0 && micropolisReactive.messageX >= 0,
	);
</script>

<div
	class="message-bar"
	class:important={micropolisReactive.messageImportant}
	aria-live="polite"
	role="status"
>
	<span class="message-text">{displayText}</span>
	{#if showCoords}
		<button
			type="button"
			class="goto-btn"
			onclick={() => micropolisReactive.panMapTo(micropolisReactive.messageX, micropolisReactive.messageY)}
		>➤ Goto</button>
	{/if}
</div>

<style>
	.message-bar {
		flex-shrink: 0;
		z-index: 25;
		height: var(--message-bar-height, 2.5rem);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0 0.75rem;
		box-sizing: border-box;
		background: rgba(20, 24, 36, 0.94);
		border-top: 1px solid rgba(255, 255, 255, 0.18);
		color: #f5f5f5;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.78rem;
		line-height: 1.25;
		text-align: center;
		pointer-events: none;
	}

	.message-bar.important {
		border-top-color: rgba(255, 120, 80, 0.75);
		background: rgba(48, 16, 12, 0.94);
	}

	.message-text {
		flex: 0 1 auto;
	}

	.goto-btn {
		flex: 0 0 auto;
		pointer-events: auto;
		font: inherit;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: #ffc840;
		background: rgba(255, 200, 64, 0.12);
		border: 1px solid rgba(255, 200, 64, 0.55);
		border-radius: 0.35rem;
		padding: 0.3rem 0.6rem;
		min-height: 1.9rem;
		cursor: pointer;
	}
	.goto-btn:active {
		background: rgba(255, 200, 64, 0.3);
	}
</style>
