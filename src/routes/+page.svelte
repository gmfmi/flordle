<script>
	import { confetti } from "@neoconfetti/svelte";
	import Logo from "$lib/assets/Flordle.png";

	import { game } from "./game-state";

	// $: { console.log($game); }

	/** Whether or not the user has won */
	$: won = $game.answers.at(-1) === "x".repeat($game.wordLength);

	/** The index of the current guess */
	$: currentIndex = won ? -1 : $game.answers.length;

	/** Whether the current guess can be submitted */
	$: submittable = $game.guesses[currentIndex]?.length === $game.wordLength;

	/**
	 * A map of classnames for all letters that have been guessed,
	 * used for styling the keyboard
	 */
	let classnames;

	/**
	 * A map of descriptions for all letters that have been guessed,
	 * used for adding text for assistive technology (e.g. screen readers)
	 */
	let description;

	$: {
		classnames = {};
		description = {};

		$game.answers.forEach((answer, i) => {
			const guess = $game.guesses[i];

			for (let i = 0; i < $game.wordLength; i += 1) {
				const letter = guess[i];

				if (answer[i] === "x") {
					classnames[letter] = "exact";
					description[letter] = "correct";
				} else if (!classnames[letter]) {
					classnames[letter] = answer[i] === "c" ? "close" : "missing";
					description[letter] = answer[i] === "c" ? "present" : "absent";
				}
			}
		});
	}

	/**
	 * Modify the game state without making a trip to the server,
	 * if client-side JavaScript is enabled
	 */
	function update(event) {
		const guess = $game.guesses[currentIndex];
		const key = event.target.getAttribute("data-key");

		if (key === "backspace") {
			$game.guesses[currentIndex] = guess.slice(0, -1);
		} else if (guess.length < $game.wordLength) {
			$game.guesses[currentIndex] += key;
		}
	}

	/**
	 * Trigger form logic in response to a keydown event, so that
	 * desktop users can use the keyboard to play the game
	 */
	function keydown(event) {
		// console.log(event);
		if (event.metaKey) return;
		const key = event.key.toLowerCase();
		const currentGuess = $game.guesses[currentIndex];

		if (key === "enter" && submittable) {
			game.submit();
		} else if (key === "backspace") {
			$game.guesses[currentIndex] = currentGuess.slice(0, -1);
		} else if (currentGuess.length < $game.wordLength && key.match(/^[\w]$/)) {
			$game.guesses[currentIndex] += key;
		}
	}
</script>

<svelte:window on:keydown={keydown} />

<svelte:head>
	<title>Flordle</title>
	<meta name="description" content="A Wordle clone designed for Florence" />
</svelte:head>

<main>
	<img src={Logo} alt="" class="logo" />

	<p class="word-id">
		Thème: « {$game.theme} » | mot n°{$game.wordId + 1} sur {$game.totalWords}
	</p>

	<form>
		<div class="grid-container">
			<div
				class="grid"
				style="--row-length:{$game.wordLength};aspect-ratio:{$game.wordLength /
					$game.guesses.length};"
				class:playing={!won}
			>
				{#each Array.from(Array($game.guesses.length).keys()) as row (row)}
					{@const current = row === currentIndex}
					<h2 class="visually-hidden">Row {row + 1}</h2>
					<div class="row" class:current>
						{#each Array.from(Array($game.wordLength).keys()) as column (column)}
							{@const answer = $game.answers[row]?.[column]}
							{@const value = $game.guesses[row]?.[column] ?? ""}
							{@const selected =
								current && column === $game.guesses[row].length}
							{@const exact = answer === "x"}
							{@const close = answer === "c"}
							{@const missing = answer === "_"}
							<div
								class="letter"
								class:exact
								class:close
								class:missing
								class:selected
							>
								{value}
								<span class="visually-hidden">
									{#if exact}
										(correct)
									{:else if close}
										(present)
									{:else if missing}
										(absent)
									{:else}
										empty
									{/if}
								</span>
								<input name="guess" disabled={!current} type="hidden" {value} />
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<div class="winning-panel">
			{#if won || $game.answers.length >= $game.guesses.length}
				{#if !won && $game.answer}
					<p>the answer was "{$game.originalAnswer}"</p>
				{/if}
				<button on:click|preventDefault={game.next}>
					{won ? "you won :)" : `game over :(`} play again?
				</button>
			{/if}
		</div>

		<!-- <div class="controls">
			{#if won || $game.answers.length >= $game.guesses.length}
				{#if !won && $game.answer}
					<p>the answer was "{$game.originalAnswer}"</p>
				{/if}
				<button
					on:click|preventDefault={game.next}
					data-key="enter"
					class="restart selected"
				>
					{won ? "you won :)" : `game over :(`} play again?
				</button>
			{:else}
				<div class="keyboard">
					<button
						on:click|preventDefault={game.submit}
						data-key="enter"
						class:selected={submittable}
						disabled={!submittable}>enter</button
					>

					<button
						on:click|preventDefault={update}
						data-key="backspace"
						name="key"
						value="backspace"
					>
						back
					</button>

					{#each ["qwertyuiop", "asdfghjkl", "zxcvbnm"] as row}
						<div class="row">
							{#each row as letter}
								<button
									on:click|preventDefault={update}
									data-key={letter}
									class={classnames[letter]}
									disabled={$game.guesses[currentIndex].length === $game.wordLength}
									name="key"
									value={letter}
									aria-label="{letter} {description[letter] || ''}"
								>
									{letter}
								</button>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		</div> -->
	</form>

	<div class="buttons">
		<button on:click|preventDefault={game.next}>next</button>
		<button on:click|preventDefault={game.reset}>reset</button>
	</div>

	{#if won}
		<div
			style="position: absolute; left: 50%; top: 30%;"
			use:confetti={{
				force: 0.7,
				stageWidth: window.innerWidth + 200,
				stageHeight: window.innerHeight,
				colors: ["#ff3e00", "#40b3ff", "#676778"],
			}}
		/>
	{/if}
</main>

<style>
	/* Disable scroll bar when confettis pops */
	:global(body) {
		overflow: hidden;
	}

	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100vw;
		height: 100vh;
		padding: 0.5rem;
		box-sizing: border-box;
	}

	.logo {
		max-width: 320px;
	}

	.word-id {
		margin: 0;
	}

	form {
		flex-grow: 1;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 5px;
	}

	.grid-container {
		display: flex;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.grid {
		/* aspect-ratio: ->> injected value */
		max-width: 100%;
		height: 100%;
		min-height: 200px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.2rem;
	}

	.grid .row {
		display: grid;
		grid-template-columns: repeat(var(--row-length), 1fr);
		gap: 0.2rem;
		height: 100%;
	}

	.grid.playing .row.current {
		filter: drop-shadow(3px 3px 10px var(--color-bg-0));
	}

	.letter {
		/* aspect-ratio: 1; */
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		box-sizing: border-box;
		text-transform: lowercase;
		border: none;
		font-size: calc(0.08 * var(--width));
		border-radius: 3px;
		background: white;
		margin: 0;
		color: rgba(0, 0, 0, 0.7);
	}

	.letter.missing {
		background: rgba(255, 255, 255, 0.5);
		color: rgba(0, 0, 0, 0.5);
	}

	.letter.exact {
		background: var(--color-theme-2);
		color: white;
	}

	.letter.close {
		border: 2px solid var(--color-theme-2);
		border-radius: 100%;
	}

	.selected {
		outline: 2px solid var(--color-theme-1);
	}

	.controls {
		text-align: center;
		justify-content: center;
		height: min(18vh, 10rem);
	}

	.keyboard {
		--gap: 0.2rem;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--gap);
		height: 100%;
	}

	.keyboard .row {
		display: flex;
		justify-content: center;
		gap: 0.2rem;
		flex: 1;
	}

	.keyboard button,
	.keyboard button:disabled {
		--size: min(8vw, 4vh, 40px);
		background-color: white;
		color: black;
		width: var(--size);
		border: none;
		border-radius: 2px;
		font-size: calc(var(--size) * 0.5);
		margin: 0;
	}

	.keyboard button.exact {
		background: var(--color-theme-2);
		color: white;
	}

	.keyboard button.missing {
		opacity: 0.5;
	}

	.keyboard button.close {
		border: 2px solid var(--color-theme-2);
	}

	.keyboard button:focus {
		background: var(--color-theme-1);
		color: white;
		outline: none;
	}

	.keyboard button[data-key="enter"],
	.keyboard button[data-key="backspace"] {
		position: absolute;
		bottom: 0;
		width: calc(1.5 * var(--size));
		height: calc(1 / 3 * (100% - 2 * var(--gap)));
		text-transform: uppercase;
		font-size: calc(0.3 * var(--size));
		padding-top: calc(0.15 * var(--size));
	}

	.keyboard button[data-key="enter"] {
		right: calc(50% + 3.5 * var(--size) + 0.8rem);
	}

	.keyboard button[data-key="backspace"] {
		left: calc(50% + 3.5 * var(--size) + 0.8rem);
	}

	.keyboard button[data-key="enter"]:disabled {
		opacity: 0.5;
	}

	.restart {
		width: 100%;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 2px;
		border: none;
	}

	.restart:focus,
	.restart:hover {
		background: var(--color-theme-1);
		color: white;
		outline: none;
	}

	@keyframes wiggle {
		0% {
			transform: translateX(0);
		}
		10% {
			transform: translateX(-2px);
		}
		30% {
			transform: translateX(4px);
		}
		50% {
			transform: translateX(-6px);
		}
		70% {
			transform: translateX(+4px);
		}
		90% {
			transform: translateX(-2px);
		}
		100% {
			transform: translateX(0);
		}
	}

	.buttons {
		display: flex;
		flex-wrap: nowrap;
		gap: 10px;
		align-items: center;
	}

	.buttons button {
		background-color: transparent;
		border: 1px solid grey;
		border-radius: 5px;
		padding: 5px 10px;
		color: grey;
	}

	.buttons button:hover {
		cursor: pointer;
		color: #000;
		border-color: #000;
	}

	.winning-panel {
		height: 50px;
		width: 100%;
		flex-grow: 0;
	}
</style>
