<script>
	import { confetti } from "@neoconfetti/svelte";
	import Logo from "$lib/assets/Flordle.png";

	import { game } from "./game-state";

	$: {
		console.log($game);
	}

	/** Whether or not the user has won */
	$: won = $game.answers.at(-1) === "x".repeat($game.wordLength);
	$: endRound = won || $game.answers.length === $game.guesses.length;
	$: isLastRound = $game.wordId + 1 == $game.totalWords;

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
	 * Forward keywoard events to the main logic
	 */
	function keydown(event) {
		// console.log(event);
		if (event.metaKey) return;
		userAction(event.key);
	}

	/**
	 * Forward events from the virtual keyboard to the actual logic
	 * @param event
	 */
	function keyclicked(event) {
		const key = event.target.getAttribute("data-key");
		userAction(key);
	}

	/**
	 * Main logic for user actions, using virtual or physical keyboard
	 * @param key
	 */
	function userAction(key) {
		key = key.toLowerCase();
		const currentGuess = $game.guesses[currentIndex];

		if (key === "enter" && submittable) {
			game.submit();
		} else if (key === "enter" && endRound) {
			game.next();
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

	<div class="info">
		<p>Thème <strong>« {$game.theme} »</strong></p>
		<p>Mot n°{$game.wordId + 1} sur {$game.totalWords}</p>
	</div>

	<div class="game">
		<div class="grid-container">
			<div class="grid-content">
				<div
					class="grid"
					style="--row-length:{$game.wordLength};aspect-ratio:{$game.wordLength}/{$game
						.guesses.length};"
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
									<input
										name="guess"
										disabled={!current}
										type="hidden"
										{value}
									/>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>

			{#if endRound}
				<div class="endround-overlay">
					<div
						class="endround-container"
						style="--endround-color: {won ? '#5cb85c' : '#d9534f'};"
					>
						<div class="endround-content">
							{#if won}
								<p class="smiley">🥳</p>
								<p>C'est gagné !</p>
								<p>Tu as trouvé <strong>« {$game.originalAnswer} »</strong></p>
							{:else}
								<p>🙊</p>
								<p>Oups, tu as perdu...</p>
								<p>
									La réponse était <strong>« {$game.originalAnswer} »</strong>
								</p>
							{/if}

							{#if isLastRound}
								<hr />
								<p>C'est fini pour aujourd'hui,</p>
								<p>À demain !</p>
								<p class="smiley">😘</p>
							{:else}
								<button on:click={game.next}>Passer au suivant</button>
								<p style="font-size:0.6rem;">
									(ou appuyez sur la touche entrée)
								</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="controls">
			<div class="keyboard">
				{#each ["azertyuiop", "qsdfghjklm", "  wxcvbn  "] as row}
					<div class="row">
						{#each row as letter}
							{#if letter === " "}
								<button class="empty" disabled />
							{:else}
								<button
									on:click|preventDefault={keyclicked}
									data-key={letter}
									class={classnames[letter]}
									name="key"
									value={letter}
									aria-label="{letter} {description[letter] || ''}"
								>
									{letter}
								</button>
							{/if}
						{/each}
					</div>
				{/each}
			</div>

			<div class="hotkeys">
				<button
					on:click|preventDefault={keyclicked}
					data-key="backspace"
					name="key"
					value="backspace">⌫</button
				>

				<button
					on:click|preventDefault={keyclicked}
					data-key="enter"
					class:selected={submittable}
					disabled={!submittable}>↵</button
				>
			</div>
		</div>
	</div>

	<div class="game-buttons">
		<button on:click|preventDefault={game.next}>suivant</button>
		<button on:click|preventDefault={game.reset}>reset</button>
	</div>

	{#if won}
		<div
			style="position: absolute; left: 50%; top: 30%; "
			use:confetti={{
				force: 0.7,
				stageWidth: window.innerWidth + 200,
				stageHeight: document.documentElement.scrollHeight - 250,
				colors: ["#ff3e00", "#40b3ff", "#676778"],
			}}
		/>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		width: 100%;
		padding: 1rem;
		box-sizing: border-box;
	}

	.logo {
		max-width: 320px;
	}

	.info p {
		margin: 0;
		text-align: center;
		color: var(--color-text);
	}

	/* GRID */
	.game {
		width: 100%;
		max-width: 580px;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		align-items: center;
	}

	.grid-container {
		position: relative;
		width: 100%;
	}

	.grid-content {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	.grid {
		/* injected: aspect-ratio */
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.2rem;
	}

	.grid .row {
		display: grid;
		grid-template-columns: repeat(var(--row-length), 1fr);
		gap: 0.2rem;
	}

	.grid.playing .row.current {
		filter: drop-shadow(3px 3px 10px var(--color-bg-0));
	}

	.letter {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		box-sizing: border-box;
		text-transform: lowercase;
		border: none;
		font-size: 150%;
		font-weight: 300;
		font-family: var(--font-mono);
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

	/* END GAME OVERLAY */
	.endround-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		margin: 10%;
	}

	.endround-container {
		/* injected: --endround-color  */
		display: flex;
		backdrop-filter: blur(0.3rem);
		border: 3px solid var(--endround-color);
		border-radius: 7px;
		width: 100%;
		height: 100%;
		align-items: center;
		justify-content: center;
	}

	.endround-content {
		color: var(--color-text);
		text-align: center;
	}

	.endround-content p {
		line-height: 0.6;
	}

	.endround-content p.smiley {
		font-size: 2rem;
		line-height: 0;
	}

	.endround-content button {
		color: var(--color-text);
		background-color: #fff;
		border: 1px solid var(--endround-color);
		border-radius: 4px;
		padding: 0.4rem 1rem;
		margin-top: 1rem;
		cursor: pointer;
	}

	/* CONTROLS / KEYBOARD */
	.controls {
		width: 100%;
		max-width: 500px;
		display: grid;
		grid-template-columns: 1fr 11%;
		gap: 0.18rem;
		justify-content: center;
		font-family: var(--font-mono);
	}

	.hotkeys {
		display: flex;
		gap: 0.18rem;
		flex-direction: column;
	}

	.controls .hotkeys button {
		width: 100%;
		height: 100%;
	}

	.keyboard {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
	}

	.keyboard .row {
		display: flex;
		justify-content: center;
		gap: 0.18rem;
	}

	.controls button {
		width: 100%;
		background-color: white;
		color: black;
		border: none;
		border-radius: 3px;
		margin: 0;
		cursor: pointer;
	}

	.keyboard button,
	.keyboard button:disabled {
		height: calc(var(--size) * 1.3);
		aspect-ratio: 0.8;
		font-weight: 400;
	}

	.controls button.empty {
		visibility: hidden;
	}

	.controls button.exact {
		background: var(--color-theme-2);
		color: white;
	}

	.controls button.missing {
		opacity: 0.5;
	}

	.controls button.close {
		border: 2px solid var(--color-theme-2);
	}

	.controls button:active {
		background: var(--color-theme-1);
		color: white;
		outline: none;
	}

	.controls button[data-key="enter"]:disabled {
		opacity: 0.5;
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

	/* BUTTONS */
	.game-buttons {
		display: flex;
		flex-wrap: nowrap;
		gap: 10px;
		align-items: center;
		margin-top: 5rem;
	}

	.game-buttons button {
		background-color: transparent;
		border: 1px solid rgb(225, 225, 225);
		border-radius: 5px;
		padding: 5px 10px;
		color: rgb(156, 156, 156);
	}

	.game-buttons button:hover {
		cursor: pointer;
		color: #000;
		border-color: #000;
	}
</style>
