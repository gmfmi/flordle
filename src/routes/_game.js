import { gameInputs } from './inputs';

export class Game {
	/**
	 * Create a game object from the player's cookie, or initialise a new game
	 */
	constructor(serialized = undefined) {
		this.number_of_guesses = 6;
		if (serialized) {
			const [wordId, guesses, answers] = serialized.split('-');

			this.wordId = +wordId;
			this.guesses = guesses ? guesses.split(' ') : [];
			this.answers = answers ? answers.split(' ') : [];
		} else {
			this.wordId = 0;
			this.guesses = Array(this.number_of_guesses).fill('');
			this.answers = ([]);
		}

		this.answer = gameInputs.words[this.wordId];
		this.wordLength = this.answer.length;
		this.theme = gameInputs.theme;
		console.log(`Constructor -- word:${this.answer}, length: ${this.wordLength}`)
	}

	next() {
		this.wordId = this.wordId >= gameInputs.words.length - 1 ? 0 : this.wordId + 1;
		this.guesses = Array(this.number_of_guesses).fill('');
		this.answers = ([]);
		return this.toString();
	}

	/**
	 * Update game state based on a guess of a five-letter word. Returns
	 * true if the guess was valid, false otherwise
	 */
	enter(word) {
		const letters = word.split();
		this.guesses[this.answers.length] = word;

		const available = Array.from(this.answer);
		const answer = Array(this.wordLength).fill('_');

		// first, find exact matches
		for (let i = 0; i < this.wordLength; i += 1) {
			if (letters[i] === available[i]) {
				answer[i] = 'x';
				available[i] = ' ';
			}
		}

		// then find close matches (this has to happen
		// in a second step, otherwise an early close
		// match can prevent a later exact match)
		for (let i = 0; i < this.wordLength; i += 1) {
			if (answer[i] === '_') {
				const index = available.indexOf(letters[i]);
				if (index !== -1) {
					answer[i] = 'c';
					available[index] = ' ';
				}
			}
		}

		this.answers.push(answer.join(''));
		this.answers = this.answers;

		return true;
	}

	/**
	 * Serialize game state so it can be set as a cookie
	 */
	toString() {
		return `${this.wordId}-${this.guesses.join(' ')}-${this.answers.join(' ')}`;
	}
}

export default Game;