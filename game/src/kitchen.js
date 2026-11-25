// kitchen.js — the kitchen state machine: the hand, the chopping board, the
// wok, the plate shelf and the trash. All rules of cooking live here; render.js
// only draws what this file reports, and input.js only calls these verbs.

import { INGREDIENTS, matchRecipe, makeWokItem } from './recipes.js';
import {
  CHOPS_PER_ITEM, WOK_CAPACITY, COOK_SECONDS_PER_ITEM, READY_COOK_PERCENT,
  BURN_AFTER_SECONDS, STIR_BOOST,
} from './config.js';

export function makeKitchen() {
  return {
    hand: null,            // { kind: 'ingredient', id, chopped } | { kind: 'plate', recipeId } | null
    board: null,           // { id, chopsDone } — item being chopped, or null
    wok: [],               // wok items { id, chopped, cook, burnt, overcook }
    plate: null,           // { recipeId } — finished dish waiting on the plate shelf
    wokReadyRecipe: null,  // recipe the wok currently matches, once cooked enough
    stirHeat: 0,           // 0..1, recent stirring; decays over time
    trashCount: 0,
  };
}

export function takeIngredient(kitchen, ingredientId) {
  if (kitchen.hand) return { ok: false, reason: 'hand-full' };
  const def = INGREDIENTS[ingredientId];
  if (!def) return { ok: false, reason: 'unknown-ingredient' };
  kitchen.hand = { kind: 'ingredient', id: ingredientId, chopped: !def.needsChop };
  return { ok: true };
}

// Put the held raw ingredient on the board and chop it once. Returns the
// chop progress so the renderer can show the knife mid-swing.
export function chopOnBoard(kitchen) {
  const hand = kitchen.hand;
  if (!hand || hand.kind !== 'ingredient') return { ok: false, reason: 'nothing-to-chop' };
  if (hand.chopped) return { ok: false, reason: 'already-chopped' };
  if (kitchen.board && kitchen.board.id !== hand.id) return { ok: false, reason: 'board-busy' };
  if (!kitchen.board) kitchen.board = { id: hand.id, chopsDone: 0 };
  kitchen.board.chopsDone += 1;
  kitchen.hand = null;
  if (kitchen.board.chopsDone >= CHOPS_PER_ITEM) {
    const done = { kind: 'ingredient', id: kitchen.board.id, chopped: true };
    kitchen.board = null;
    kitchen.hand = done;
    return { ok: true, finished: true, chopsDone: CHOPS_PER_ITEM };
  }
  return { ok: true, finished: false, chopsDone: kitchen.board.chopsDone };
}

// Drop the held (chopped, if required) ingredient into the wok.
export function addToWok(kitchen) {
  const hand = kitchen.hand;
  if (!hand || hand.kind !== 'ingredient') return { ok: false, reason: 'no-ingredient' };
  if (!hand.chopped) return { ok: false, reason: 'needs-chopping' };
  if (kitchen.wok.length >= WOK_CAPACITY) return { ok: false, reason: 'wok-full' };
  kitchen.wok.push(makeWokItem(hand.id, true));
  kitchen.hand = null;
  kitchen.wokReadyRecipe = null;
  return { ok: true };
}

// Stir the wok: speeds cooking while the heat lasts and resets overcook.
export function stirWok(kitchen) {
  if (kitchen.wok.length === 0) return { ok: false, reason: 'wok-empty' };
  kitchen.stirHeat = 1;
  for (const item of kitchen.wok) item.overcook = 0;
  return { ok: true };
}

// Advance wok cooking. Returns true when a dish just became ready.
export function tickWok(kitchen, dtSeconds) {
  kitchen.stirHeat = Math.max(0, kitchen.stirHeat - dtSeconds * 0.5);
  const speed = 100 / COOK_SECONDS_PER_ITEM * (1 + kitchen.stirHeat * (STIR_BOOST - 1));
  let becameReady = false;
  for (const item of kitchen.wok) {
    if (item.burnt) continue;
    item.cook = Math.min(100, item.cook + speed * dtSeconds);
    if (item.cook >= 100) {
      item.overcook += dtSeconds;
      if (item.overcook >= BURN_AFTER_SECONDS) item.burnt = true;
    }
  }
  const recipe = matchRecipe(kitchen.wok.map((i) => i.id));
  const allCooked = kitchen.wok.length > 0 && kitchen.wok.every((i) => !i.burnt && i.cook >= READY_COOK_PERCENT);
  const ready = recipe && allCooked ? recipe : null;
  if (ready && !kitchen.wokReadyRecipe) becameReady = true;
  kitchen.wokReadyRecipe = ready;
  return becameReady;
}

// Move a ready dish from the wok onto the plate shelf.
export function plateDish(kitchen) {
  if (!kitchen.wokReadyRecipe) return { ok: false, reason: 'not-ready' };
  if (kitchen.plate) return { ok: false, reason: 'plate-busy' };
  const recipe = kitchen.wokReadyRecipe;
  kitchen.plate = { recipeId: recipe.id };
  kitchen.wok = [];
  kitchen.wokReadyRecipe = null;
  return { ok: true, recipe };
}

// Pick the plated dish up (hand becomes a plate) or put it back down.
export function takePlate(kitchen) {
  if (kitchen.hand) return { ok: false, reason: 'hand-full' };
  if (!kitchen.plate) return { ok: false, reason: 'no-plate' };
  kitchen.hand = { kind: 'plate', recipeId: kitchen.plate.recipeId };
  kitchen.plate = null;
  return { ok: true };
}

export function putPlateDown(kitchen) {
  if (!kitchen.hand || kitchen.hand.kind !== 'plate') return { ok: false, reason: 'no-plate-in-hand' };
  if (kitchen.plate) return { ok: false, reason: 'plate-busy' };
  kitchen.plate = { recipeId: kitchen.hand.recipeId };
  kitchen.hand = null;
  return { ok: true };
}

// Throw away whatever is in the hand, on the board, or in the wok.
export function trash(kitchen) {
  let trashed = false;
  if (kitchen.hand) { kitchen.hand = null; trashed = true; }
  if (kitchen.board) { kitchen.board = null; trashed = true; }
  if (kitchen.wok.length > 0) { kitchen.wok = []; kitchen.wokReadyRecipe = null; trashed = true; }
  if (trashed) kitchen.trashCount += 1;
  return { ok: trashed };
}

export function wokHasBurnt(kitchen) {
  return kitchen.wok.some((i) => i.burnt);
}
