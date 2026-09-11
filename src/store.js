import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createInitialState } from './game.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const SAVE_PATH = path.join(DATA_DIR, 'save.json');

export async function loadState() {
  try {
    const raw = await readFile(SAVE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const initial = createInitialState();
      await saveState(initial);
      return initial;
    }
    throw err;
  }
}

export async function saveState(state) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SAVE_PATH, JSON.stringify(state, null, 2));
}
