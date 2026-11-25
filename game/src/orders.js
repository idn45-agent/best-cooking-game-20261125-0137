// orders.js — the order board: spawning tickets, patience timers, serving and
// scoring. An order is a ticket on the board asking for one recipe; serve the
// matching dish before its patience runs out to earn coins and a tip.

import { RECIPES, RECIPE_LIST } from './recipes.js';
import {
  MAX_ACTIVE_ORDERS, ORDER_PATIENCE_SECONDS, ORDER_SPAWN_GAP_SECONDS,
  ORDER_SPAWN_GAP_LATE_SECONDS, LATE_DAY_AFTER_SECONDS, TIP_MAX_PERCENT,
  COMBO_BONUS_PER_STEP, EXPIRED_ORDER_PENALTY_COINS,
} from './config.js';

let nextOrderId = 1;

export function makeOrder(recipeId, nowSeconds, rng) {
  const recipe = RECIPES[recipeId];
  return {
    id: nextOrderId++,
    recipeId,
    recipe,
    bornAt: nowSeconds,
    patience: ORDER_PATIENCE_SECONDS,
    // A little wobble so tickets do not all expire together.
    patienceLeft: ORDER_PATIENCE_SECONDS - rng() * 6,
    served: false,
    expired: false,
  };
}

export function pickRandomRecipe(rng) {
  return RECIPE_LIST[Math.floor(rng() * RECIPE_LIST.length)];
}

export function spawnGapSeconds(elapsedSeconds) {
  return elapsedSeconds >= LATE_DAY_AFTER_SECONDS
    ? ORDER_SPAWN_GAP_LATE_SECONDS
    : ORDER_SPAWN_GAP_SECONDS;
}

// Tick every order's patience. Returns the orders that just expired.
export function tickOrders(orders, dtSeconds) {
  const expired = [];
  for (const order of orders) {
    if (order.served || order.expired) continue;
    order.patienceLeft -= dtSeconds;
    if (order.patienceLeft <= 0) {
      order.patienceLeft = 0;
      order.expired = true;
      expired.push(order);
    }
  }
  return expired;
}

export function activeOrders(orders) {
  return orders.filter((o) => !o.served && !o.expired);
}

export function canSpawnMore(orders) {
  return activeOrders(orders).length < MAX_ACTIVE_ORDERS;
}

// Coins for serving `order` now: base price + tip for patience left + combo.
export function serveReward(order, combo) {
  const tipFrac = Math.max(0, order.patienceLeft / order.patience) * (TIP_MAX_PERCENT / 100);
  const tip = Math.round(order.recipe.price * tipFrac);
  const comboBonus = combo * COMBO_BONUS_PER_STEP;
  return { base: order.recipe.price, tip, comboBonus, total: order.recipe.price + tip + comboBonus };
}

export function expiredPenalty() {
  return EXPIRED_ORDER_PENALTY_COINS;
}
