// config.js — every tunable number of Wajan Senja lives here: canvas size,
// layout rectangles, timers, prices and difficulty. Nothing else reads magic
// numbers; change the feel of the game by editing this file alone.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export const DAY_LENGTH_SECONDS = 150;
export const MAX_ACTIVE_ORDERS = 3;
export const ORDER_PATIENCE_SECONDS = 48;
export const ORDER_SPAWN_FIRST_SECONDS = 4;
export const ORDER_SPAWN_GAP_SECONDS = 14;
export const ORDER_SPAWN_GAP_LATE_SECONDS = 9;
export const LATE_DAY_AFTER_SECONDS = 90;

export const CHOPS_PER_ITEM = 3;
export const WOK_CAPACITY = 4;
export const COOK_SECONDS_PER_ITEM = 7;
export const READY_COOK_PERCENT = 80;
export const BURN_AFTER_SECONDS = 9;
export const STIR_BOOST = 1.6;

export const TIP_MAX_PERCENT = 50;
export const COMBO_BONUS_PER_STEP = 5;
export const EXPIRED_ORDER_PENALTY_COINS = 10;

export const COLORS = {
  wall: '#3a2a1e',
  wallTop: '#4a3626',
  floor: '#2b1d13',
  counter: '#8a5a33',
  counterEdge: '#6e4525',
  board: '#caa06a',
  boardEdge: '#a87c4a',
  steel: '#b8c0c8',
  steelDark: '#7d8894',
  wok: '#23272e',
  wokRim: '#3a4048',
  flameA: '#ffb347',
  flameB: '#ff7847',
  flameC: '#ffe066',
  paper: '#fff6dd',
  paperEdge: '#d9c48f',
  ink: '#33261a',
  cream: '#fff3d6',
  red: '#e5484d',
  green: '#3fae5a',
  gold: '#ffc53d',
  teal: '#2bb3a3',
  purple: '#8a6fd6',
};

export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 62 },
  orderBoard: { x: 24, y: 74, w: 1232, h: 118 },
  crates: { x: 24, y: 212, w: 250, h: 396 },
  board: { x: 306, y: 212, w: 300, h: 190 },
  wok: { x: 640, y: 212, w: 330, h: 190 },
  plates: { x: 1002, y: 212, w: 254, h: 190 },
  trash: { x: 1002, y: 414, w: 254, h: 70 },
  serveShelf: { x: 306, y: 414, w: 664, h: 194 },
  bottomBar: { x: 0, y: 620, w: 1280, h: 100 },
};

// Station hit rectangles, derived from LAYOUT so input.js and render.js agree.
export const STATIONS = {
  crates: { x: 24, y: 212, w: 250, h: 396 },
  board: { x: 306, y: 212, w: 300, h: 190 },
  wok: { x: 640, y: 212, w: 330, h: 190 },
  plates: { x: 1002, y: 212, w: 254, h: 190 },
  trash: { x: 1002, y: 414, w: 254, h: 70 },
  serveShelf: { x: 306, y: 414, w: 664, h: 194 },
};
