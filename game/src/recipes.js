// recipes.js — the ingredients and dishes of Wajan Senja. Every dish, name and
// drawing colour here is original to this game: night-market wok food from an
// imaginary stall, not a copy of any existing game's menu.

export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',    key: '1', needsChop: false, color: '#fff8e7', accent: '#e8d9b0', price: 2 },
  mie:    { id: 'mie',    name: 'Mie',     key: '2', needsChop: false, color: '#ffd94d', accent: '#d9a91f', price: 2 },
  telur:  { id: 'telur',  name: 'Telur',   key: '3', needsChop: false, color: '#fffdf5', accent: '#ffb347', price: 3 },
  ayam:   { id: 'ayam',   name: 'Ayam',    key: '4', needsChop: true,  color: '#f2a65e', accent: '#c47a33', price: 4 },
  udang:  { id: 'udang',  name: 'Udang',   key: '5', needsChop: true,  color: '#ff9d8a', accent: '#e05a4e', price: 5 },
  sayur:  { id: 'sayur',  name: 'Sayur',   key: '6', needsChop: true,  color: '#69c24a', accent: '#2f8f2a', price: 3 },
  cabai:  { id: 'cabai',  name: 'Cabai',   key: '7', needsChop: false, color: '#e5484d', accent: '#8f1d22', price: 2 },
};

export const INGREDIENT_ORDER = ['nasi', 'mie', 'telur', 'ayam', 'udang', 'sayur', 'cabai'];

// A recipe lists ingredient ids; an ingredient that needs chopping must be
// chopped before it goes in the wok. `serves` is the dish's base coin price.
export const RECIPES = {
  nasiGoreng: {
    id: 'nasiGoreng', name: 'Nasi Goreng Senja', short: 'Nasi Goreng',
    needs: ['nasi', 'telur', 'cabai'], price: 28, color: '#f2a65e',
    blurb: 'Nasi, telur, cabai — wajan panas, asap mengepul.',
  },
  mieGoreng: {
    id: 'mieGoreng', name: 'Mie Goreng Pasar', short: 'Mie Goreng',
    needs: ['mie', 'ayam', 'sayur'], price: 32, color: '#ffd94d',
    blurb: 'Mie kuning, ayam cincang, sayur segar.',
  },
  tumisUdang: {
    id: 'tumisUdang', name: 'Tumis Udang Cabe', short: 'Tumis Udang',
    needs: ['udang', 'cabai', 'sayur'], price: 36, color: '#ff9d8a',
    blurb: 'Udang pedas manis, cabai merah menyala.',
  },
  omeletSenja: {
    id: 'omeletSenja', name: 'Omelet Senja', short: 'Omelet',
    needs: ['telur', 'ayam', 'sayur'], price: 30, color: '#ffe066',
    blurb: 'Telur dadar isi ayam dan sayur, lipat rapi.',
  },
};

export const RECIPE_LIST = [RECIPES.nasiGoreng, RECIPES.mieGoreng, RECIPES.tumisUdang, RECIPES.omeletSenja];

// Find the recipe whose ingredient set exactly matches the wok contents.
export function matchRecipe(ingredientIds) {
  const have = [...ingredientIds].sort().join(',');
  for (const recipe of RECIPE_LIST) {
    if ([...recipe.needs].sort().join(',') === have) return recipe;
  }
  return null;
}

// A wok item is { id, chopped, cook, burnt }. Cook is 0..100 percent.
export function makeWokItem(ingredientId, chopped) {
  return { id: ingredientId, chopped, cook: 0, burnt: false, overcook: 0 };
}
