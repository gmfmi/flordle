import { writable } from 'svelte/store';
import { gameInputs } from '$lib/input';

const nb_of_guesses = 6;

/**
 * Replace accented characters with their ascii version
 * @param {string} word 
 * @returns 
 */
function _asciiFolding(word) {
  return word.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
}

function init(id = 0) {
  const state = {}
  state.wordId = id;
  state.originalAnswer = gameInputs.words[id];
  state.answer = _asciiFolding(gameInputs.words[id]);
  state.answers = ([]);
  state.guesses = Array(nb_of_guesses).fill('');
  state.wordLength = state.answer.length;
  state.theme = gameInputs.theme;
  state.totalWords = gameInputs.words.length;
  console.log(`New game started, the word to guess is "${state.originalAnswer}"`)
  return state;
}


function submit(state) {
  const i = state.answers.length;
  const word = state.guesses[i];
  const letters = word.split('');

  const available = Array.from(state.answer);
  const answer = Array(state.wordLength).fill('_');

  // first, find exact matches
  for (let i = 0; i < state.wordLength; i += 1) {
    if (letters[i] === available[i]) {
      answer[i] = 'x';
      available[i] = ' ';
    }
  }

  // then find close matches (this has to happen
  // in a second step, otherwise an early close
  // match can prevent a later exact match)
  for (let i = 0; i < state.wordLength; i += 1) {
    if (answer[i] === '_') {
      const index = available.indexOf(letters[i]);
      if (index !== -1) {
        answer[i] = 'c';
        available[index] = ' ';
      }
    }
  }

  state.answers.push(answer.join(''));
  return state;
}


function next(state) {
  const currentWordId = state.wordId;
  const nextWordId = (currentWordId >= gameInputs.words.length - 1) ? 0 : currentWordId + 1;
  return init(nextWordId);
}


/**
 * Game state store constructor
 * @returns the store
 */
function create() {
  const { subscribe, set, update } = writable(init());

  return {
    subscribe,
    set,
    update,
    submit: () => update(submit),
    next: () => update(next),
    reset: () => set(init())
  };
}

export const game = create();