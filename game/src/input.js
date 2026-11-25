// input.js — mouse and keyboard for Wajan Senja. Clicks are hit-tested against
// the station rectangles from config.js; keys 1-7 grab ingredients, Space stirs
// the wok, C chops, P plates, S serves the first matching order, R restarts.

import { STATIONS } from './config.js';
import { INGREDIENT_ORDER } from './recipes.js';

export function makeInput(canvas, handlers) {
  const input = {
    mouse: { x: -100, y: -100, down: false },
    hoverStation: null,
    hoverCrate: null,
    hoverOrder: null,
  };

  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function stationAt(x, y) {
    for (const [name, rect] of Object.entries(STATIONS)) {
      if (x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h) return name;
    }
    return null;
  }

  function crateAt(x, y) {
    if (stationAt(x, y) !== 'crates') return null;
    const cols = 2;
    const cellW = 250 / cols;
    const cellH = 396 / 4;
    const col = Math.floor((x - 24) / cellW);
    const row = Math.floor((y - 212) / cellH);
    const index = row * cols + col;
    return INGREDIENT_ORDER[index] ?? null;
  }

  function orderAt(x, y) {
    // Order tickets live on the board strip; the game supplies the hit test.
    return handlers.orderHitTest ? handlers.orderHitTest(x, y) : null;
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = toGameCoords(event);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
    input.hoverStation = stationAt(p.x, p.y);
    input.hoverCrate = crateAt(p.x, p.y);
    input.hoverOrder = orderAt(p.x, p.y);
  });

  canvas.addEventListener('mousedown', (event) => {
    const p = toGameCoords(event);
    input.mouse.down = true;
    const station = stationAt(p.x, p.y);
    const crate = crateAt(p.x, p.y);
    const order = orderAt(p.x, p.y);
    handlers.onClick({ x: p.x, y: p.y, station, crate, order, button: event.button });
  });

  window.addEventListener('mouseup', () => { input.mouse.down = false; });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === ' ') { event.preventDefault(); handlers.onKey('stir'); return; }
    if (key >= '1' && key <= '7') {
      const id = INGREDIENT_ORDER[Number(key) - 1];
      if (id) handlers.onKey('ingredient', id);
      return;
    }
    const map = { c: 'chop', p: 'plate', s: 'serve', r: 'restart', m: 'mute', escape: 'pause', enter: 'start' };
    if (map[key]) handlers.onKey(map[key]);
  });

  return input;
}
