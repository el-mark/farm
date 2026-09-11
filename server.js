import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadState, saveState } from './src/store.js';
import { getView, plant, harvest, buyLand, restartGame } from './src/game.js';
import { CROPS } from './src/crops.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const state = await loadState();

app.get('/api/state', (req, res) => {
  res.json({ ...getView(state), crops: CROPS });
});

app.post('/api/plant', async (req, res) => {
  const { plotIndex, cropId } = req.body;
  try {
    plant(state, plotIndex, cropId);
    await saveState(state);
    res.json(getView(state));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/buy-land', async (req, res) => {
  const { plotIndex } = req.body;
  try {
    buyLand(state, plotIndex);
    await saveState(state);
    res.json(getView(state));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/harvest', async (req, res) => {
  const { plotIndex } = req.body;
  try {
    harvest(state, plotIndex);
    await saveState(state);
    res.json(getView(state));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/restart', async (req, res) => {
  restartGame(state);
  await saveState(state);
  res.json(getView(state));
});

const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
  console.log(`Farm game running at http://localhost:${PORT}`);
});
