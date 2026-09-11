const gridEl = document.getElementById('grid');
const goldEl = document.getElementById('gold');
const pointsEl = document.getElementById('points');
const messageEl = document.getElementById('message');
const winOverlay = document.getElementById('win-overlay');
const winText = document.getElementById('win-text');
const restartBtn = document.getElementById('restart-btn');

const STAGE_ICON = {
  empty: '',
  seed: '🌱',
  growing: '🌿',
  ready: null, // filled in with the crop's own emoji
};

let crops = {};

function showMessage(text) {
  messageEl.textContent = text;
  if (text) setTimeout(() => { if (messageEl.textContent === text) messageEl.textContent = ''; }, 2500);
}

async function fetchState() {
  const res = await fetch('/api/state');
  const data = await res.json();
  crops = data.crops;
  render(data);
}

async function plant(plotIndex) {
  const res = await fetch('/api/plant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plotIndex, cropId: 'wheat' }),
  });
  const data = await res.json();
  if (!res.ok) return showMessage(data.error);
  render(data);
}

async function harvest(plotIndex) {
  const res = await fetch('/api/harvest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plotIndex }),
  });
  const data = await res.json();
  if (!res.ok) return showMessage(data.error);
  render(data);
}

async function buyLand(plotIndex) {
  const res = await fetch('/api/buy-land', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plotIndex }),
  });
  const data = await res.json();
  if (!res.ok) return showMessage(data.error);
  render(data);
}

async function restart() {
  const res = await fetch('/api/restart', { method: 'POST' });
  const data = await res.json();
  render(data);
}

restartBtn.onclick = restart;

function render(state) {
  goldEl.textContent = `Gold: ${state.gold}`;
  pointsEl.textContent = `Points: ${state.points} / ${state.pointsToWin}`;

  winOverlay.hidden = !state.won;
  if (state.won) {
    winText.textContent = `You grew your way to ${state.points} points. Restart to play again!`;
  }

  gridEl.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;
  gridEl.innerHTML = '';

  state.plots.forEach((plot) => {
    const el = document.createElement('button');

    if (!plot.owned) {
      el.className = `plot ${plot.buyable ? 'buyable' : 'locked'}`;
      if (plot.buyable) {
        el.textContent = '🔒';
        el.title = `Buy this land (${plot.price} gold)`;
        el.onclick = () => buyLand(plot.index);
        const price = document.createElement('div');
        price.className = 'price';
        price.textContent = `${plot.price}g`;
        el.appendChild(price);
      } else {
        el.title = 'Unclaimed land — expand your farm to reach it';
      }
      gridEl.appendChild(el);
      return;
    }

    el.className = `plot ${plot.stage}`;

    let icon = STAGE_ICON[plot.stage];
    if (plot.stage === 'ready' && plot.crop) icon = crops[plot.crop].emoji;
    el.textContent = icon || '';

    if (plot.stage === 'empty') {
      el.title = `Plant wheat (${crops.wheat.seedCost} gold)`;
      el.onclick = () => plant(plot.index);
    } else if (plot.stage === 'ready') {
      el.title = `Harvest (+${crops[plot.crop].sellPrice} gold)`;
      el.onclick = () => harvest(plot.index);
    } else {
      el.title = 'Still growing...';
      const bar = document.createElement('div');
      bar.className = 'progress';
      bar.style.width = `${Math.round(plot.progress * 100)}%`;
      el.appendChild(bar);
    }

    gridEl.appendChild(el);
  });
}

fetchState();
setInterval(fetchState, 2000);
