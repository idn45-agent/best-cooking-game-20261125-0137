// render.js — every pixel of Wajan Senja is drawn here on one canvas: the
// night-market kitchen, the order board, the ingredient crates, the chopping
// board, the flaming wok, the plate shelf, the food itself, and the HUD.
// Food is drawn with vector shapes (no image files), so the game loads nothing.

import { COLORS, LAYOUT, STATIONS, CANVAS_WIDTH, CANVAS_HEIGHT, WOK_CAPACITY } from './config.js';
import { INGREDIENTS, RECIPES } from './recipes.js';

// ---------- small drawing helpers ----------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold', font = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, bg = '#00000055') {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
}

// ---------- food drawing: one function per ingredient, drawn at (x, y) ----------

export function drawIngredient(ctx, id, x, y, s, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  switch (id) {
    case 'nasi': {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.ellipse(0, 0, 15, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8d9b0';
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(-10 + i * 3.2, -3 + (i % 2) * 5, 1.6, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'mie': {
      ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 3; i++) { ctx.arc(0, 0, 5 + i * 4, i * 1.1, i * 1.1 + 4.2); }
      ctx.stroke();
      break;
    }
    case 'telur': {
      ctx.fillStyle = '#fffdf5';
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 10, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb347';
      ctx.beginPath(); ctx.arc(2, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath(); ctx.arc(0.5, -1.5, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ayam': {
      ctx.fillStyle = '#f2a65e';
      ctx.beginPath(); ctx.ellipse(-4, -2, 10, 7, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(5, 3, 9, 6, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c47a33';
      ctx.beginPath(); ctx.arc(-6, -4, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, 5, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'udang': {
      ctx.strokeStyle = '#ff9d8a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 1, 9, 0.3, 4.6); ctx.stroke();
      ctx.strokeStyle = '#e05a4e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 1, 9, 1.2, 2.6); ctx.stroke();
      ctx.fillStyle = '#ff9d8a';
      ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(14, -9); ctx.lineTo(12, -3); ctx.closePath(); ctx.fill();
      break;
    }
    case 'sayur': {
      ctx.fillStyle = '#69c24a';
      ctx.beginPath(); ctx.ellipse(-6, -3, 9, 5, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(6, 2, 9, 5, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2f8f2a';
      ctx.fillRect(-2, -1, 3, 3); ctx.fillRect(4, 3, 3, 3);
      ctx.fillStyle = '#a8e88a';
      ctx.beginPath(); ctx.arc(-7, -5, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'cabai': {
      ctx.fillStyle = '#e5484d';
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 5, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2f8f2a';
      ctx.fillRect(9, -8, 3, 6);
      ctx.fillStyle = '#ff7a7e';
      ctx.beginPath(); ctx.ellipse(-3, -2, 6, 2, -0.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: break;
  }
  ctx.restore();
}

// A finished dish served on a plate: the plate plus the recipe's food.
export function drawDishOnPlate(ctx, recipeId, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath(); ctx.ellipse(0, 0, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9d2da'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, 34, 12, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -1, 26, 8, 0, 0, Math.PI * 2); ctx.stroke();
  const recipe = RECIPES[recipeId];
  if (recipe) {
    const spots = [[-12, -4], [2, -6], [12, -2], [-4, 2], [8, 4]];
    recipe.needs.forEach((id, i) => {
      const [dx, dy] = spots[i % spots.length];
      drawIngredient(ctx, id, dx, dy - 4, 0.55);
    });
  }
  ctx.restore();
}

// ---------- the renderer ----------

export function drawGame(ctx, game, input, nowMs) {
  const { state, kitchen } = game;
  const t = nowMs / 1000;
  drawKitchenShell(ctx, t);
  drawTopBar(ctx, game);
  drawOrderBoard(ctx, game);
  drawCrates(ctx, game, input);
  drawChoppingBoard(ctx, game, input, t);
  drawWok(ctx, game, input, t);
  drawPlateShelf(ctx, game, input);
  drawTrash(ctx, game, input);
  drawServeShelf(ctx, game);
  drawBottomBar(ctx, game, input);
  drawHandCursor(ctx, game, input);
  if (state.screen === 'title') drawTitleOverlay(ctx, game);
  if (state.screen === 'dayEnd') drawDayEndOverlay(ctx, game);
  if (state.screen === 'paused') drawPausedOverlay(ctx);
  if (state.flash) drawFlash(ctx, state);
}

function drawKitchenShell(ctx, t) {
  const wall = ctx.createLinearGradient(0, 0, 0, 720);
  wall.addColorStop(0, COLORS.wallTop);
  wall.addColorStop(1, COLORS.wall);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, 1280, 720);
  // Hanging lamps.
  for (const lx of [220, 640, 1060]) {
    ctx.strokeStyle = '#1c130c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 34); ctx.stroke();
    const glow = ctx.createRadialGradient(lx, 44, 4, lx, 44, 60);
    glow.addColorStop(0, 'rgba(255, 214, 130, 0.5)');
    glow.addColorStop(1, 'rgba(255, 214, 130, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(lx, 44, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffc53d';
    ctx.beginPath(); ctx.moveTo(lx - 16, 34); ctx.lineTo(lx + 16, 34); ctx.lineTo(lx + 8, 52); ctx.lineTo(lx - 8, 52); ctx.closePath(); ctx.fill();
  }
  // Tiled back wall band behind the counter.
  ctx.fillStyle = '#5d4128';
  ctx.fillRect(0, 196, 1280, 16);
  ctx.fillStyle = '#6e4f31';
  for (let x = 0; x < 1280; x += 64) ctx.fillRect(x, 196, 2, 16);
  // Floor.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 620, 1280, 100);
  ctx.fillStyle = '#241811';
  for (let x = 0; x < 1280; x += 96) ctx.fillRect(x, 620, 2, 100);
  // Counter top.
  ctx.fillStyle = COLORS.counter;
  ctx.fillRect(0, 200, 1280, 420);
  ctx.fillStyle = COLORS.counterEdge;
  ctx.fillRect(0, 200, 1280, 8);
  ctx.fillStyle = '#7a4c2a';
  ctx.fillRect(0, 600, 1280, 20);
}

function drawTopBar(ctx, game) {
  const { state } = game;
  ctx.fillStyle = '#241811ee';
  ctx.fillRect(0, 0, 1280, 62);
  ctx.fillStyle = COLORS.gold;
  text(ctx, '🍳 WAJAN SENJA', 24, 40, 28, COLORS.gold);
  text(ctx, 'Dapur Pasar Malam', 268, 40, 16, '#e8d9b0', 'left', 'normal');
  // Day timer, big in the middle.
  const remain = Math.max(0, state.timeLeft);
  const mm = String(Math.floor(remain / 60)).padStart(2, '0');
  const ss = String(Math.floor(remain % 60)).padStart(2, '0');
  const urgent = remain <= 20 && state.screen === 'playing';
  ctx.fillStyle = urgent ? '#ff5a5a' : '#fff3d6';
  roundRect(ctx, 560, 8, 160, 46, 10);
  ctx.fill();
  text(ctx, `⏱ ${mm}:${ss}`, 640, 41, 26, urgent ? '#a11' : '#33261a', 'center');
  text(ctx, `HARI ${state.day}`, 740, 40, 18, '#e8d9b0');
  // Coins and score.
  text(ctx, `🪙 ${state.coins}`, 900, 40, 24, COLORS.gold, 'right');
  text(ctx, `Skor ${state.score}`, 1010, 40, 18, '#fff3d6', 'right');
  text(ctx, state.combo > 1 ? `🔥 Combo x${state.combo}` : '', 1120, 40, 18, '#ff9d5c', 'left');
  text(ctx, game.audio.muted ? '🔇 M' : '🔊 M', 1252, 40, 16, '#e8d9b0', 'right');
}

function drawOrderBoard(ctx, game) {
  const { state } = game;
  const b = LAYOUT.orderBoard;
  ctx.fillStyle = '#1c130c';
  roundRect(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 12);
  ctx.fill();
  ctx.fillStyle = '#5d4128';
  roundRect(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  text(ctx, '📋 PAPAN PESANAN', b.x + 16, b.y + 26, 15, '#ffd98a');
  text(ctx, 'Klik piring lalu klik pesanan untuk mengantar', b.x + 220, b.y + 26, 13, '#e8d9b0', 'left', 'normal');
  const orders = state.orders.filter((o) => !o.served && !o.expired);
  if (orders.length === 0) {
    text(ctx, 'Belum ada pesanan — pelanggan segera datang…', b.x + 16, b.y + 72, 17, '#e8d9b0', 'left', 'normal');
  }
  orders.forEach((order, i) => {
    const x = b.x + 16 + i * 400;
    const y = b.y + 36;
    const w = 384;
    const h = 72;
    const frac = order.patienceLeft / order.patience;
    const urgent = frac < 0.35;
    ctx.fillStyle = COLORS.paper;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? COLORS.red : COLORS.paperEdge;
    ctx.lineWidth = urgent ? 3 : 1.5;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    text(ctx, `#${order.id}`, x + 12, y + 22, 13, '#8a6d3b');
    text(ctx, order.recipe.name, x + 52, y + 24, 17, COLORS.ink);
    text(ctx, `🪙 ${order.recipe.price}`, x + w - 12, y + 24, 16, '#8a6d3b', 'right');
    order.recipe.needs.forEach((id, j) => {
      drawIngredient(ctx, id, x + 26 + j * 34, y + 48, 0.8);
    });
    text(ctx, order.recipe.blurb, x + 150, y + 52, 12, '#6b543a', 'left', 'normal');
    bar(ctx, x + 12, y + h - 12, w - 24, 6, frac, frac > 0.5 ? COLORS.green : frac > 0.25 ? COLORS.gold : COLORS.red);
    game.orderHitBoxes[order.id] = { x, y, w, h };
  });
}

function drawCrates(ctx, game, input) {
  const { state } = game;
  const c = LAYOUT.crates;
  ctx.fillStyle = '#00000033';
  roundRect(ctx, c.x, c.y, c.w, c.h, 10);
  ctx.fill();
  text(ctx, '🧺 BAHAN — klik / tombol 1-7', c.x + 10, c.y + 24, 14, '#ffd98a');
  const ids = ['nasi', 'mie', 'telur', 'ayam', 'udang', 'sayur', 'cabai'];
  ids.forEach((id, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = c.x + 8 + col * 122;
    const y = c.y + 34 + row * 88;
    const w = 114;
    const h = 80;
    const def = INGREDIENTS[id];
    const hover = input.hoverCrate === id;
    ctx.fillStyle = hover ? '#a4713f' : '#8a5a33';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#5d3a1e';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    drawIngredient(ctx, id, x + w / 2, y + 30, 1.15);
    text(ctx, def.name, x + w / 2, y + 62, 14, '#fff3d6', 'center');
    text(ctx, `${def.key}${def.needsChop ? ' · potong' : ''}`, x + w / 2, y + 76, 11, '#e8d9b0', 'center', 'normal');
  });
  text(ctx, 'Ayam, udang & sayur harus dipotong dulu.', c.x + 10, c.y + 388, 12, '#e8d9b0', 'left', 'normal');
}

function drawChoppingBoard(ctx, game, input, t) {
  const { kitchen } = game;
  const b = LAYOUT.board;
  const hover = input.hoverStation === 'board';
  ctx.fillStyle = '#00000033';
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  text(ctx, '🔪 TALENAN — klik untuk memotong', b.x + 12, b.y + 24, 14, '#ffd98a');
  // Wooden board.
  ctx.fillStyle = hover ? '#d8b078' : COLORS.board;
  roundRect(ctx, b.x + 30, b.y + 44, 240, 116, 10);
  ctx.fill();
  ctx.strokeStyle = COLORS.boardEdge;
  ctx.lineWidth = 3;
  roundRect(ctx, b.x + 30, b.y + 44, 240, 116, 10);
  ctx.stroke();
  if (kitchen.board) {
    const def = INGREDIENTS[kitchen.board.id];
    drawIngredient(ctx, kitchen.board.id, b.x + 130, b.y + 100, 1.6);
    // Chop progress: knife marks.
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < kitchen.board.chopsDone ? COLORS.green : '#00000033';
      ctx.beginPath(); ctx.arc(b.x + 90 + i * 40, b.y + 140, 8, 0, Math.PI * 2); ctx.fill();
    }
    text(ctx, `${kitchen.board.chopsDone}/3 potongan`, b.x + 150, b.y + 178, 13, '#fff3d6', 'center');
  } else if (kitchen.hand && kitchen.hand.kind === 'ingredient' && !kitchen.hand.chopped) {
    text(ctx, `Klik untuk memotong ${INGREDIENTS[kitchen.hand.id].name}`, b.x + 150, b.y + 104, 15, '#fff3d6', 'center');
    drawIngredient(ctx, kitchen.hand.id, b.x + 150, b.y + 74, 0.9);
  } else {
    // Idle knife.
    ctx.save();
    ctx.translate(b.x + 150, b.y + 100);
    ctx.rotate(-0.5);
    ctx.fillStyle = COLORS.steel;
    roundRect(ctx, -70, -8, 110, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#5a3a22';
    roundRect(ctx, 40, -6, 44, 12, 4);
    ctx.fill();
    ctx.restore();
    text(ctx, 'Talenan kosong', b.x + 150, b.y + 150, 13, '#e8d9b0', 'center', 'normal');
  }
}

function drawWok(ctx, game, input, t) {
  const { kitchen } = game;
  const w = LAYOUT.wok;
  const hover = input.hoverStation === 'wok';
  ctx.fillStyle = '#00000033';
  roundRect(ctx, w.x, w.y, w.w, w.h, 10);
  ctx.fill();
  text(ctx, '🔥 WAJAN — klik / Spasi untuk mengaduk', w.x + 12, w.y + 24, 14, '#ffd98a');
  const cx = w.x + w.w / 2;
  const cy = w.y + 108;
  // Flames.
  for (let i = 0; i < 5; i++) {
    const fx = cx - 66 + i * 33;
    const flick = Math.sin(t * 9 + i * 1.7) * 4;
    ctx.fillStyle = i % 2 ? COLORS.flameB : COLORS.flameA;
    ctx.beginPath();
    ctx.moveTo(fx - 12, cy + 34);
    ctx.quadraticCurveTo(fx, cy - 26 - flick, fx + 12, cy + 34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = COLORS.flameC;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 34);
  ctx.quadraticCurveTo(cx, cy - 8, cx + 8, cy + 34);
  ctx.closePath();
  ctx.fill();
  // Wok body.
  ctx.fillStyle = COLORS.wok;
  ctx.beginPath(); ctx.ellipse(cx, cy + 6, 108, 44, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.wokRim; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(cx, cy + 6, 108, 44, 0, Math.PI, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#7d8894'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(cx + 104, cy - 6); ctx.lineTo(cx + 152, cy - 26); ctx.stroke();
  // Contents.
  kitchen.wok.forEach((item, i) => {
    const angle = -0.9 + i * 0.6;
    const ix = cx + Math.cos(angle) * 52;
    const iy = cy + 2 + Math.sin(angle) * 16;
    const s = item.burnt ? 0.9 : 1.0;
    if (item.burnt) {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(ix, iy, 13, 0, Math.PI * 2); ctx.fill();
    } else {
      drawIngredient(ctx, item.id, ix, iy, s);
    }
    // Cook ring.
    ctx.strokeStyle = '#00000066'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(ix, iy + 16, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = item.burnt ? '#333' : item.cook >= 80 ? COLORS.green : COLORS.gold;
    ctx.beginPath(); ctx.arc(ix, iy + 16, 10, -Math.PI / 2, -Math.PI / 2 + (item.cook / 100) * Math.PI * 2); ctx.stroke();
  });
  // Steam.
  if (kitchen.wok.length > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 4; i++) {
      const sx = cx - 50 + i * 32 + Math.sin(t * 2 + i * 2) * 6;
      const sy = cy - 34 - ((t * 22 + i * 17) % 40);
      ctx.beginPath(); ctx.arc(sx, sy, 6 + ((t * 10 + i * 7) % 8), 0, Math.PI * 2); ctx.fill();
    }
  }
  if (kitchen.wok.length === 0) {
    text(ctx, 'Wajan kosong — masukkan bahan', cx, cy + 4, 13, '#c9d2da', 'center', 'normal');
  }
  if (kitchen.wokReadyRecipe) {
    ctx.fillStyle = COLORS.green;
    roundRect(ctx, cx - 90, w.y + 158, 180, 26, 13);
    ctx.fill();
    text(ctx, `✓ ${kitchen.wokReadyRecipe.short} SIAP!`, cx, w.y + 177, 14, '#fff', 'center');
  } else if (kitchen.wok.length > 0) {
    const matched = kitchen.wok.length;
    text(ctx, `${matched}/${WOK_CAPACITY} bahan di wajan — aduk agar matang merata`, cx, w.y + 177, 12, '#e8d9b0', 'center', 'normal');
  }
}


function drawPlateShelf(ctx, game, input) {
  const { kitchen } = game;
  const p = LAYOUT.plates;
  const hover = input.hoverStation === 'plates';
  ctx.fillStyle = '#00000033';
  roundRect(ctx, p.x, p.y, p.w, p.h, 10);
  ctx.fill();
  text(ctx, '🍽️ PIRING SAJI — klik untuk ambil', p.x + 12, p.y + 24, 14, '#ffd98a');
  const cx = p.x + p.w / 2;
  const cy = p.y + 108;
  if (kitchen.plate) {
    drawDishOnPlate(ctx, kitchen.plate.recipeId, cx, cy, 1.6);
    const recipe = RECIPES[kitchen.plate.recipeId];
    text(ctx, recipe.name, cx, p.y + 168, 15, '#fff3d6', 'center');
    text(ctx, 'Siap diantar!', cx, p.y + 186, 12, COLORS.green, 'center');
  } else {
    // Empty plates stack.
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#f4f6f8';
      ctx.beginPath(); ctx.ellipse(cx, cy + 10 - i * 8, 52, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c9d2da'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy + 10 - i * 8, 52, 14, 0, 0, Math.PI * 2); ctx.stroke();
    }
    text(ctx, 'Belum ada hidangan', cx, p.y + 168, 13, '#e8d9b0', 'center', 'normal');
  }
  if (hover && kitchen.plate) {
    ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 3;
    roundRect(ctx, p.x + 4, p.y + 4, p.w - 8, p.h - 8, 8);
    ctx.stroke();
  }
}

function drawTrash(ctx, game, input) {
  const { kitchen } = game;
  const tr = LAYOUT.trash;
  const hover = input.hoverStation === 'trash';
  ctx.fillStyle = hover ? '#7a2e2e' : '#5a2323';
  roundRect(ctx, tr.x, tr.y, tr.w, tr.h, 10);
  ctx.fill();
  text(ctx, '🗑️ TEMPAT SAMPAH — klik untuk membuang isi tangan / wajan', tr.x + 16, tr.y + 30, 14, '#ffd9d9');
  text(ctx, `Terbuang: ${kitchen.trashCount}x`, tr.x + 16, tr.y + 54, 12, '#e8b0b0', 'left', 'normal');
  if (kitchen.wok.some((i) => i.burnt)) {
    text(ctx, '⚠️ Ada bahan gosong di wajan!', tr.x + tr.w - 16, tr.y + 54, 12, COLORS.gold, 'right');
  }
}

function drawServeShelf(ctx, game) {
  const { state } = game;
  const s = LAYOUT.serveShelf;
  ctx.fillStyle = '#00000033';
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  text(ctx, '🏪 ETALASE & STATISTIK HARI INI', s.x + 14, s.y + 26, 14, '#ffd98a');
  // Served dishes row.
  const served = state.servedDishes;
  if (served.length === 0) {
    text(ctx, 'Belum ada hidangan tersaji. Sajikan pesanan pertama!', s.x + 14, s.y + 80, 15, '#e8d9b0', 'left', 'normal');
  } else {
    served.slice(-6).forEach((recipeId, i) => {
      drawDishOnPlate(ctx, recipeId, s.x + 60 + i * 96, s.y + 84, 0.85);
    });
    text(ctx, `${served.length} hidangan tersaji`, s.x + 14, s.y + 150, 13, '#fff3d6');
  }
  // Stats column on the right of the shelf.
  const sx = s.x + 470;
  text(ctx, `Pesanan selesai: ${state.servedCount}`, sx, s.y + 60, 14, '#fff3d6');
  text(ctx, `Pesanan hangus: ${state.expiredCount}`, sx, s.y + 84, 14, '#ffb0b0');
  text(ctx, `Combo terbaik: x${state.bestCombo}`, sx, s.y + 108, 14, '#fff3d6');
  text(ctx, `Akurasi sajian: ${state.serveAttempts ? Math.round((state.servedCount / state.serveAttempts) * 100) : 100}%`, sx, s.y + 132, 14, '#fff3d6');
  // Rush indicator.
  const remain = state.timeLeft;
  if (remain <= 30 && state.screen === 'playing') {
    ctx.fillStyle = '#e5484d';
    roundRect(ctx, s.x + 14, s.y + 158, 200, 26, 13);
    ctx.fill();
    text(ctx, '⚡ RUSH PENUTUP — cepat!', s.x + 114, s.y + 177, 14, '#fff', 'center');
  }
}

function drawBottomBar(ctx, game, input) {
  const { kitchen, state } = game;
  ctx.fillStyle = '#241811ee';
  ctx.fillRect(0, 620, 1280, 100);
  // Hand indicator.
  text(ctx, 'TANGAN:', 24, 652, 14, '#ffd98a');
  if (kitchen.hand) {
    if (kitchen.hand.kind === 'ingredient') {
      drawIngredient(ctx, kitchen.hand.id, 130, 652, 1.1);
      const def = INGREDIENTS[kitchen.hand.id];
      text(ctx, `${def.name}${kitchen.hand.chopped ? ' (potong)' : ' (mentah)'}`, 158, 656, 16, '#fff3d6');
    } else {
      drawDishOnPlate(ctx, kitchen.hand.recipeId, 130, 652, 0.7);
      text(ctx, `${RECIPES[kitchen.hand.recipeId].name} — klik pesanan untuk mengantar`, 168, 656, 16, '#fff3d6');
    }
  } else {
    text(ctx, 'kosong — ambil bahan dari keranjang', 120, 656, 15, '#e8d9b0', 'left', 'normal');
  }
  // Controls hint.
  text(ctx, '1-7 bahan · C potong · Spasi aduk · P piring · S antar · R ulang · M suara', 24, 694, 14, '#cbb894', 'left', 'normal');
  // Message flash line.
  if (state.message) {
    text(ctx, state.message, 640, 694, 15, state.messageGood ? COLORS.green : COLORS.red, 'center');
  }
}

function drawHandCursor(ctx, game, input) {
  const { kitchen } = game;
  if (!kitchen.hand || input.mouse.x < 0) return;
  ctx.save();
  ctx.globalAlpha = 0.9;
  if (kitchen.hand.kind === 'ingredient') {
    drawIngredient(ctx, kitchen.hand.id, input.mouse.x, input.mouse.y - 18, 0.9);
  } else {
    drawDishOnPlate(ctx, kitchen.hand.recipeId, input.mouse.x, input.mouse.y - 18, 0.6);
  }
  ctx.restore();
}

function drawFlash(ctx, state) {
  ctx.fillStyle = state.flash === 'good' ? 'rgba(63,174,90,0.18)' : 'rgba(229,72,77,0.18)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawTitleOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,0.82)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = COLORS.gold;
  text(ctx, '🍳 WAJAN SENJA', 640, 170, 64, COLORS.gold, 'center');
  text(ctx, 'Dapur Pasar Malam — masak cepat, sajikan tepat waktu!', 640, 220, 22, '#fff3d6', 'center', 'normal');
  // Mini menu of the four dishes.
  const recipes = Object.values(RECIPES);
  recipes.forEach((recipe, i) => {
    const x = 240 + i * 200;
    const y = 300;
    ctx.fillStyle = COLORS.paper;
    roundRect(ctx, x, y, 180, 150, 12);
    ctx.fill();
    drawDishOnPlate(ctx, recipe.id, x + 90, y + 62, 1.0);
    text(ctx, recipe.short, x + 90, y + 108, 15, COLORS.ink, 'center');
    text(ctx, `🪙 ${recipe.price}`, x + 90, y + 132, 14, '#8a6d3b', 'center');
  });
  text(ctx, 'Pesanan datang di papan atas. Ambil bahan, potong, masak di wajan,', 640, 500, 18, '#fff3d6', 'center', 'normal');
  text(ctx, 'tata di piring, lalu antar sebelum pelanggan kehabisan sabar.', 640, 528, 18, '#fff3d6', 'center', 'normal');
  ctx.fillStyle = COLORS.green;
  roundRect(ctx, 490, 560, 300, 56, 12);
  ctx.fill();
  text(ctx, '▶  MULAI MEMASAK', 640, 597, 22, '#fff', 'center');
  text(ctx, 'Klik / tekan Enter · Mouse + Keyboard', 640, 650, 14, '#e8d9b0', 'center', 'normal');
}

function drawDayEndOverlay(ctx, game) {
  const { state } = game;
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, '🌙 HARI SELESAI', 640, 150, 52, COLORS.gold, 'center');
  text(ctx, 'Warung tutup — pelanggan pulang dengan perut kenyang.', 640, 195, 20, '#fff3d6', 'center', 'normal');
  const rows = [
    ['🪙 Koin hari ini', `${state.coins}`],
    ['🍽️ Hidangan tersaji', `${state.servedCount}`],
    ['🔥 Combo terbaik', `x${state.bestCombo}`],
    ['📋 Pesanan hangus', `${state.expiredCount}`],
    ['⭐ Skor akhir', `${state.score}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 260 + i * 48;
    ctx.fillStyle = COLORS.paper;
    roundRect(ctx, 440, y, 400, 38, 8);
    ctx.fill();
    text(ctx, label, 460, y + 26, 17, COLORS.ink);
    text(ctx, value, 820, y + 26, 18, '#8a6d3b', 'right');
  });
  const stars = state.servedCount >= 12 ? 3 : state.servedCount >= 8 ? 2 : state.servedCount >= 4 ? 1 : 0;
  text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), 640, 540, 44, COLORS.gold, 'center');
  text(ctx, 'Tekan R untuk memasak lagi', 640, 600, 18, '#fff3d6', 'center', 'normal');
}

function drawPausedOverlay(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.7)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, '⏸ JEDA', 640, 350, 52, '#fff3d6', 'center');
  text(ctx, 'Tekan Esc untuk lanjut', 640, 400, 18, '#e8d9b0', 'center', 'normal');
}
