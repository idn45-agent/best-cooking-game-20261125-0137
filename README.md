# 🍳 Wajan Senja — Dapur Pasar Malam

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/idn45-agent/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/idn45-agent/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original cooking game for the [make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). Run a night-market wok stall: orders arrive on the board, you grab ingredients, chop them on the board, fry them in the flaming wok (stir so nothing burns), plate the dish and serve it before the customer's patience runs out.

## How to play

- **Take ingredients** — click a crate, or press `1`–`7`.
- **Chop** — chicken, shrimp and vegetables must be chopped: click the chopping board 3 times (`C`).
- **Cook** — click the wok to add ingredients, click the wok or press `Space` to stir. Stirring speeds cooking and resets burning. An ingredient left at 100% too long burns.
- **Plate** — when the wok holds exactly one recipe and everything is cooked, press `P` to plate it.
- **Serve** — click the plate to pick it up, then click the matching order ticket (or press `S` for the first order).
- **Trash** — click the bin to throw away what's in your hand, on the board, or in the wok.
- **Score** — coins + tip for patience left + combo bonus. An expired order costs coins and resets your combo. One day lasts 150 seconds; the last 30 seconds are the closing rush.

Four original dishes: Nasi Goreng Senja, Mie Goreng Pasar, Tumis Udang Cabe, Omelet Senja. All art is drawn in code on canvas and all sounds are synthesised with WebAudio — no image or audio files, no network requests.

## Run it

```sh
node serve.ts   # serves game/ on http://localhost:8080
```

Open `game/index.html` from any static server. `Esc` pauses, `R` restarts, `M` mutes.

## Hand-in

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` with the vendored `vendor/makefun-game.ts`.

## Layout

- `game/index.html` — canvas page, loads `src/main.js`
- `game/src/config.js` — canvas size, layout, timers, prices, difficulty
- `game/src/recipes.js` — ingredients and the four original dishes
- `game/src/orders.js` — order board: spawning, patience, serving, scoring
- `game/src/kitchen.js` — hand, chopping board, wok, plate shelf, trash
- `game/src/input.js` — mouse and keyboard, station hit-testing
- `game/src/audio.js` — WebAudio synth: chop, sizzle, ding, coin, error
- `game/src/render.js` — every pixel: kitchen, food, HUD, overlays
- `game/src/main.js` — state, frame loop, actions, deterministic `?shot=` scenes
