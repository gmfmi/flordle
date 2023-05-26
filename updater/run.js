import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js'; // dependent on utc plugin
dayjs.extend(dayOfYear);
dayjs.extend(utc);
dayjs.extend(timezone);


import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFilePath = path.join(__dirname, 'wordlist.json')
const outputFilePath = path.join(__dirname, '../src/lib/input.js')


function getAllDays() {
  const rawData = fs.readFileSync(inputFilePath, 'utf8');
  return JSON.parse(rawData);
}

function getToday(input) {
  // const now = dayjs('2023-05-27').tz('Europe/Paris');
  const now = dayjs().tz('Europe/Paris');
  const dayOfYear = now.dayOfYear();
  console.log("Today number of the year:", dayOfYear);
  return input[dayOfYear];
}

function getPayloadFromTemplate(input) {
  const todayJson = JSON.stringify(input, null, 2);
  return `export const gameInputs = ${todayJson}`
}

function writeOutput(payload) {
  fs.writeFileSync(outputFilePath, payload);
}

function main() {
  const allDays = getAllDays();
  const today = getToday(allDays);
  console.log("Today's payload:", today);
  const payload = getPayloadFromTemplate(today);
  writeOutput(payload);
  console.log("Job done");
}

main();
