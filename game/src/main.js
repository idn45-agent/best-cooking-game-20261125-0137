// main.js — Wajan Senja's entry point: the game state, the frame loop, click
// and key actions, serving, the day timer, and the deterministic ?shot= scenes
// used for screenshots (cover / play / serve / end).

import { CANVAS_WIDTH, CANVAS_HEIGHT, DAY_LENGTH_SECONDS, ORDER_SPAWN_FIRST_SECONDS } from './config.js';
import { INGREDIENTS, RECIPES } from './recipes.js';
import { makeOrder, pickRandomRecipe, spawnGapSeconds, tickOrders, canSpawnMore, serveReward, expiredPenalty } from './orders.js';
import {
  makeKitchen, takeIngredient, chopOnBoard, addToWok, stirWok, tickWok,
  plateDish, takePlate, putPlateDown, trash,
} from './kitchen.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';
import { drawGame } from './render.js';

// Seeded RNG (mulberry32) so ?shot= scenes and tests are reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeGameState() {
  return {
    screen: 'title', // title | playing | paused | dayEnd
    day: 1,
    elapsed: 0,
    timeLeft: DAY_LENGTH_SECONDS,
    coins: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    servedCount: 0,
    expiredCount: 0,
    serveAttempts: 0,
    servedDishes: [],
    orders: [],
    nextSpawnAt: ORDER_SPAWN_FIRST_SECONDS,
    message: '',
    messageGood: true,
    messageUntil: 0,
    flash: null,
    flashUntil: 0,
    frozen: false, // ?shot= scenes freeze the clock for a stable screenshot
  };
}

function setMessage(state, text, good, nowMs) {
  state.message = text;
  state.messageGood = good;
  state.messageUntil = nowMs + 2600;
  state.flash = good ? 'good' : 'bad';
  state.flashUntil = nowMs + 220;
}

export function startDay(game) {
  const { state } = game;
  state.screen = 'playing';
  state.elapsed = 0;
  state.timeLeft = DAY_LENGTH_SECONDS;
  state.coins = 0;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.servedCount = 0;
  state.expiredCount = 0;
  state.serveAttempts = 0;
  state.servedDishes = [];
  state.orders = [];
  state.nextSpawnAt = ORDER_SPAWN_FIRST_SECONDS;
  state.message = '';
  game.kitchen = makeKitchen();
  game.rng = makeRng((Date.now() % 2147483647) || 1);
}

function spawnOrder(game) {
  const recipe = pickRandomRecipe(game.rng);
  game.state.orders.push(makeOrder(recipe.id, game.state.elapsed, game.rng));
}

function endDay(game) {
  const { state } = game;
  state.screen = 'dayEnd';
  state.timeLeft = 0;
  state.score = state.coins + state.servedCount * 10 + state.bestCombo * 15;
  game.audio.stopSizzle();
}

function serveOrder(game, order, nowMs) {
  const { state, kitchen } = game;
  state.serveAttempts += 1;
  if (!kitchen.hand || kitchen.hand.kind !== 'plate') {
    setMessage(state, 'Ambil piring berisi hidangan dulu!', false, nowMs);
    game.audio.error();
    return;
  }
  if (kitchen.hand.recipeId !== order.recipeId) {
    setMessage(state, `Salah hidangan! Pesanan ini minta ${order.recipe.name}.`, false, nowMs);
    game.audio.error();
    return;
  }
  const reward = serveReward(order, state.combo);
  state.coins += reward.total;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.servedCount += 1;
  state.servedDishes.push(order.recipeId);
  order.served = true;
  kitchen.hand = null;
  setMessage(state, `Tersaji! +${reward.total} koin (${order.recipe.short})`, true, nowMs);
  game.audio.ding();
  game.audio.coin();
}

function handleClick(game, click, nowMs) {
  const { state, kitchen } = game;
  if (state.screen === 'title') { startDay(game); game.audio.ensure(); return; }
  if (state.screen === 'dayEnd') return;
  if (state.screen === 'paused') return;
  game.audio.ensure();

  if (click.order) {
    serveOrder(game, click.order, nowMs);
    return;
  }
  if (click.crate) {
    const res = takeIngredient(kitchen, click.crate);
    if (res.ok) { game.audio.pickup(); }
    else setMessage(state, 'Tangan penuh — buang atau masak dulu.', false, nowMs);
    return;
  }
  switch (click.station) {
    case 'board': {
      const res = chopOnBoard(kitchen);
      if (res.ok) {
        game.audio.chop();
        if (res.finished) setMessage(state, 'Selesai dipotong — masukkan ke wajan!', true, nowMs);
      } else if (res.reason === 'already-chopped') {
        setMessage(state, 'Sudah dipotong — langsung ke wajan.', false, nowMs);
      } else if (res.reason === 'board-busy') {
        setMessage(state, 'Talenan sedang dipakai bahan lain.', false, nowMs);
      } else {
        setMessage(state, 'Pegang bahan mentah dulu (ayam / udang / sayur).', false, nowMs);
      }
      return;
    }
    case 'wok': {
      if (kitchen.hand && kitchen.hand.kind === 'ingredient') {
        const res = addToWok(kitchen);
        if (res.ok) { game.audio.drop(); game.audio.startSizzle(); }
        else if (res.reason === 'needs-chopping') setMessage(state, 'Potong dulu di talenan!', false, nowMs);
        else if (res.reason === 'wok-full') setMessage(state, 'Wajan penuh — sajikan atau buang.', false, nowMs);
      } else {
        const res = stirWok(kitchen);
        if (res.ok) game.audio.chop();
        else setMessage(state, 'Wajan kosong.', false, nowMs);
      }
      return;
    }
    case 'plates': {
      if (kitchen.wokReadyRecipe) {
        const res = plateDish(kitchen);
        if (res.ok) { game.audio.drop(); setMessage(state, `${res.recipe.name} siap di piring — antar ke pesanan!`, true, nowMs); }
      } else if (kitchen.plate) {
        const res = takePlate(kitchen);
        if (res.ok) game.audio.pickup();
      } else if (kitchen.hand && kitchen.hand.kind === 'plate') {
        putPlateDown(kitchen);
      } else {
        setMessage(state, 'Belum ada hidangan matang di wajan.', false, nowMs);
      }
      return;
    }
    case 'trash': {
      const res = trash(kitchen);
      if (res.ok) { game.audio.error(); setMessage(state, 'Dibuang ke tempat sampah.', false, nowMs); }
      return;
    }
    default: return;
  }
}

function handleKey(game, action, arg, nowMs) {
  const { state, kitchen } = game;
  if (action === 'start' && state.screen === 'title') { startDay(game); game.audio.ensure(); return; }
  if (action === 'restart' && (state.screen === 'dayEnd' || state.screen === 'playing' || state.screen === 'paused')) {
    startDay(game); return;
  }
  if (action === 'mute') { game.audio.setMuted(!game.audio.muted); return; }
  if (action === 'pause') {
    if (state.screen === 'playing') { state.screen = 'paused'; game.audio.stopSizzle(); }
    else if (state.screen === 'paused') state.screen = 'playing';
    return;
  }
  if (state.screen !== 'playing') return;
  game.audio.ensure();
  if (action === 'ingredient') {
    const res = takeIngredient(kitchen, arg);
    if (res.ok) game.audio.pickup();
    else setMessage(state, 'Tangan penuh — buang atau masak dulu.', false, nowMs);
    return;
  }
  if (action === 'chop') { handleClick(game, { station: 'board' }, nowMs); return; }
  if (action === 'stir') { handleClick(game, { station: 'wok' }, nowMs); return; }
  if (action === 'plate') { handleClick(game, { station: 'plates' }, nowMs); return; }
  if (action === 'serve') {
    const first = state.orders.find((o) => !o.served && !o.expired);
    if (first) serveOrder(game, first, nowMs);
    return;
  }
}

function tick(game, dtSeconds, nowMs) {
  const { state, kitchen } = game;
  if (state.screen !== 'playing' || state.frozen) return;
  state.elapsed += dtSeconds;
  state.timeLeft = Math.max(0, DAY_LENGTH_SECONDS - state.elapsed);
  if (state.timeLeft <= 0) { endDay(game); return; }

  if (state.elapsed >= state.nextSpawnAt && canSpawnMore(state.orders)) {
    spawnOrder(game);
    state.nextSpawnAt = state.elapsed + spawnGapSeconds(state.elapsed);
  }
  const expired = tickOrders(state.orders, dtSeconds);
  for (const order of expired) {
    state.expiredCount += 1;
    state.combo = 0;
    state.coins = Math.max(0, state.coins - expiredPenalty());
    setMessage(state, `Pesanan #${order.id} hangus — pelanggan pergi (-${expiredPenalty()} koin).`, false, nowMs);
    game.audio.error();
  }
  const becameReady = tickWok(kitchen, dtSeconds);
  if (becameReady) {
    setMessage(state, `${kitchen.wokReadyRecipe.short} matang — tata di piring!`, true, nowMs);
    game.audio.ding();
  }
  if (kitchen.wok.length > 0) game.audio.setSizzleLevel(kitchen.wok.length / 4);
  else game.audio.stopSizzle();
  if (nowMs > state.messageUntil) state.message = '';
  if (nowMs > state.flashUntil) state.flash = null;
}

// ---------- deterministic screenshot scenes ----------

function sceneOrder(game, recipeId, patienceLeft) {
  const order = makeOrder(recipeId, 0, () => 0);
  order.patienceLeft = patienceLeft;
  game.state.orders.push(order);
}

function applyShot(game, shot) {
  const { state, kitchen } = game;
  startDay(game);
  state.frozen = true;
  state.screen = 'playing';
  game.rng = makeRng(20261125);
  if (shot === 'cover') {
    state.elapsed = 58;
    state.timeLeft = 92;
    state.coins = 340;
    state.combo = 2;
    state.bestCombo = 3;
    state.servedCount = 6;
    state.servedDishes = ['nasiGoreng', 'mieGoreng', 'tumisUdang'];
    sceneOrder(game, 'nasiGoreng', 31);
    sceneOrder(game, 'mieGoreng', 18);
    sceneOrder(game, 'tumisUdang', 42);
    kitchen.board = { id: 'ayam', chopsDone: 2 };
    kitchen.wok = [
      { id: 'nasi', chopped: true, cook: 55, burnt: false, overcook: 0 },
      { id: 'telur', chopped: true, cook: 62, burnt: false, overcook: 0 },
    ];
    kitchen.plate = { recipeId: 'mieGoreng' };
    kitchen.hand = { kind: 'ingredient', id: 'cabai', chopped: true };
    state.message = 'Nasi Goreng hampir matang — aduk wajannya!';
    state.messageGood = true;
  } else if (shot === 'play') {
    state.elapsed = 30;
    state.timeLeft = 120;
    state.coins = 96;
    state.combo = 1;
    state.servedCount = 2;
    state.servedDishes = ['nasiGoreng'];
    sceneOrder(game, 'mieGoreng', 38);
    sceneOrder(game, 'tumisUdang', 25);
    kitchen.board = { id: 'ayam', chopsDone: 1 };
    kitchen.wok = [
      { id: 'mie', chopped: true, cook: 35, burnt: false, overcook: 0 },
      { id: 'sayur', chopped: true, cook: 41, burnt: false, overcook: 0 },
    ];
    kitchen.hand = { kind: 'ingredient', id: 'ayam', chopped: false };
    state.message = 'Potong ayam 3x di talenan, lalu masukkan ke wajan.';
    state.messageGood = true;
  } else if (shot === 'serve') {
    state.elapsed = 104;
    state.timeLeft = 46;
    state.coins = 520;
    state.combo = 4;
    state.bestCombo = 4;
    state.servedCount = 10;
    state.servedDishes = ['nasiGoreng', 'mieGoreng', 'tumisUdang', 'omeletSenja'];
    sceneOrder(game, 'mieGoreng', 12);
    sceneOrder(game, 'nasiGoreng', 28);
    kitchen.hand = { kind: 'plate', recipeId: 'mieGoreng' };
    state.message = 'Mie Goreng Pasar siap — klik pesanan #1 untuk mengantar!';
    state.messageGood = true;
  } else if (shot === 'end') {
    state.screen = 'dayEnd';
    state.elapsed = DAY_LENGTH_SECONDS;
    state.timeLeft = 0;
    state.coins = 612;
    state.servedCount = 12;
    state.expiredCount = 1;
    state.bestCombo = 5;
    state.combo = 0;
    state.score = 612 + 12 * 10 + 5 * 15;
    state.servedDishes = ['nasiGoreng', 'mieGoreng', 'tumisUdang', 'omeletSenja', 'nasiGoreng'];
    sceneOrder(game, 'nasiGoreng', 20);
  }
}

// ---------- boot ----------

export function boot(canvas) {
  const game = {
    state: makeGameState(),
    kitchen: makeKitchen(),
    audio: makeAudio(),
    rng: makeRng(1),
    orderHitBoxes: {},
  };
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const input = makeInput(canvas, {
    orderHitTest(x, y) {
      for (const order of game.state.orders) {
        if (order.served || order.expired) continue;
        const box = game.orderHitBoxes[order.id];
        if (box && x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h) return order;
      }
      return null;
    },
    onClick(click) { handleClick(game, click, performance.now()); },
    onKey(action, arg) { handleKey(game, action, arg, performance.now()); },
  });

  if (shot) applyShot(game, shot);

  // Resize the canvas to its CSS box while keeping the 1280x720 logical size.
  function fitCanvas() {
    const scale = Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT);
    canvas.style.width = `${Math.floor(CANVAS_WIDTH * scale)}px`;
    canvas.style.height = `${Math.floor(CANVAS_HEIGHT * scale)}px`;
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    tick(game, dt, now);
    const ctx = canvas.getContext('2d');
    drawGame(ctx, game, input, now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Debug hook for automated play-testing (not part of the game UI).
  window.__wajan = { game, startDay: () => startDay(game), serveOrder: (o) => serveOrder(game, o, performance.now()) };
  return game;
}
