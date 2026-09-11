import { CROPS } from './crops.js';

export const GRID_COLS = 8;
export const GRID_ROWS = 8;

const OWNED_COLS = 4; // starting farm is a 4x4 block...
const OWNED_ROWS = 4; // ...centered in the larger 8x8 map
const OWNED_COL_START = Math.floor((GRID_COLS - OWNED_COLS) / 2);
const OWNED_ROW_START = Math.floor((GRID_ROWS - OWNED_ROWS) / 2);

const LAND_BASE_PRICE = 8;
const LAND_PRICE_STEP = 4; // each plot you buy makes the next one cost more

export const POINTS_TO_WIN = 100;

export function createInitialState() {
  const plots = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const owned =
        row >= OWNED_ROW_START && row < OWNED_ROW_START + OWNED_ROWS &&
        col >= OWNED_COL_START && col < OWNED_COL_START + OWNED_COLS;
      plots.push({ owned, crop: null, plantedAt: null });
    }
  }
  return { gold: 20, landPurchased: 0, points: 0, won: false, plots };
}

export function restartGame(state) {
  const fresh = createInitialState();
  state.gold = fresh.gold;
  state.landPurchased = fresh.landPurchased;
  state.points = fresh.points;
  state.won = fresh.won;
  state.plots = fresh.plots;
  return state;
}

function neighborsOf(index) {
  const row = Math.floor(index / GRID_COLS);
  const col = index % GRID_COLS;
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        result.push(nr * GRID_COLS + nc);
      }
    }
  }
  return result;
}

function isBuyable(state, index) {
  if (state.plots[index].owned) return false;
  return neighborsOf(index).some((n) => state.plots[n].owned);
}

export function getLandPrice(state) {
  return LAND_BASE_PRICE + state.landPurchased * LAND_PRICE_STEP;
}

export function buyLand(state, plotIndex) {
  if (state.won) throw new Error('You already reached the goal — restart to play again');
  const plot = state.plots[plotIndex];
  if (!plot) throw new Error('Invalid plot');
  if (plot.owned) throw new Error('You already own this plot');
  if (!isBuyable(state, plotIndex)) throw new Error('Land must border a plot you already own');

  const price = getLandPrice(state);
  if (state.gold < price) throw new Error('Not enough gold');

  state.gold -= price;
  plot.owned = true;
  state.landPurchased += 1;
  return state;
}

function getStage(plot, now) {
  if (!plot.crop) return 'empty';
  const crop = CROPS[plot.crop];
  const elapsed = (now - plot.plantedAt) / 1000;
  if (elapsed >= crop.growSeconds) return 'ready';
  if (elapsed >= crop.growSeconds / 2) return 'growing';
  return 'seed';
}

export function getView(state) {
  const now = Date.now();
  const price = getLandPrice(state);
  return {
    gold: state.gold,
    points: state.points,
    pointsToWin: POINTS_TO_WIN,
    won: state.won,
    cols: GRID_COLS,
    rows: GRID_ROWS,
    plots: state.plots.map((plot, index) => {
      if (!plot.owned) {
        return { index, owned: false, buyable: isBuyable(state, index), price };
      }
      const stage = getStage(plot, now);
      let progress = 0;
      if (plot.crop) {
        const crop = CROPS[plot.crop];
        const elapsed = (now - plot.plantedAt) / 1000;
        progress = Math.min(1, elapsed / crop.growSeconds);
      }
      return { index, owned: true, crop: plot.crop, stage, progress };
    }),
  };
}

export function plant(state, plotIndex, cropId) {
  if (state.won) throw new Error('You already reached the goal — restart to play again');
  const crop = CROPS[cropId];
  if (!crop) throw new Error('Unknown crop');
  const plot = state.plots[plotIndex];
  if (!plot) throw new Error('Invalid plot');
  if (!plot.owned) throw new Error('You do not own this land yet');
  if (plot.crop) throw new Error('Plot already planted');
  if (state.gold < crop.seedCost) throw new Error('Not enough gold');

  state.gold -= crop.seedCost;
  plot.crop = cropId;
  plot.plantedAt = Date.now();
  return state;
}

export function harvest(state, plotIndex) {
  if (state.won) throw new Error('You already reached the goal — restart to play again');
  const plot = state.plots[plotIndex];
  if (!plot || !plot.owned || !plot.crop) throw new Error('Nothing planted here');
  if (getStage(plot, Date.now()) !== 'ready') throw new Error('Crop is not ready yet');

  const crop = CROPS[plot.crop];
  state.gold += crop.sellPrice;
  state.points += crop.points;
  plot.crop = null;
  plot.plantedAt = null;

  if (state.points >= POINTS_TO_WIN) state.won = true;
  return state;
}
