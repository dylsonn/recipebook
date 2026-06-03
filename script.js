// ── Storage ──────────────────────────────────────────────
const KEY = 'recipebook_v1';
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

// ── Helpers ───────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function fmt(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${m ? m + 'm' : ''}` : `${m}m`;
}
function catClass(c) { return 'cat-' + (c || 'other').toLowerCase().replace(/\s+/, '-'); }

// ── Ingredient grouping ───────────────────────────────────
const PRODUCE_OVERRIDES = [
  'bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'orange pepper',
  'sweet pepper', 'chili pepper', 'chile pepper', 'poblano', 'anaheim', 'pasilla',
  'banana pepper', 'jalapeño', 'jalapeno', 'habanero', 'serrano',
  'garlic clove', 'garlic bulb', 'head of garlic', 'clove of garlic', 'cloves garlic',
  'cloves of garlic', 'whole garlic', 'fresh ginger', 'ginger root', 'ginger knob',
];

const INGREDIENT_GROUPS = [
  {
    label: 'Seasonings & Spices',
    keywords: [
      'salt', 'pepper', 'black pepper', 'white pepper', 'ground pepper', 'cracked pepper', 'peppercorn',
      'paprika', 'smoked paprika', 'cumin', 'ground cumin', 'oregano', 'turmeric', 'cinnamon',
      'ground cinnamon', 'cayenne', 'chili powder', 'ancho powder', 'chipotle powder',
      'garlic powder', 'garlic salt', 'garlic flake', 'onion powder', 'onion salt', 'onion flake',
      'bay leaf', 'cardamom', 'coriander', 'nutmeg', 'ground nutmeg', 'clove', 'allspice',
      'star anise', 'anise', 'dill weed', 'dill seed', 'fennel seed', 'marjoram',
      'mustard seed', 'mustard powder', 'dry mustard', 'saffron', 'tarragon',
      'thyme', 'rosemary', 'sage', 'mint', 'basil', 'cilantro', 'parsley', 'chive',
      'red pepper flake', 'crushed red pepper', 'chili flake', 'italian seasoning',
      'herbes de provence', 'five spice', "za'atar", 'sumac', 'old bay', 'cajun',
      'seasoning', 'spice blend', 'spice rub', 'dry rub', 'zest', 'extract', 'vanilla',
    ],
  },
  {
    label: 'Proteins',
    keywords: [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'egg',
      'tofu', 'tempeh', 'seitan', 'bacon', 'ham', 'sausage', 'turkey', 'lamb', 'steak',
      'ground beef', 'ground pork', 'ground turkey', 'ground chicken', 'ground meat',
      'crab', 'lobster', 'scallop', 'anchovy', 'sardine', 'tilapia', 'cod', 'halibut',
      'sea bass', 'trout', 'mahi', 'duck', 'veal', 'bison', 'venison',
      'lentil', 'chickpea', 'black bean', 'kidney bean', 'pinto bean', 'navy bean',
      'white bean', 'cannellini', 'edamame', 'pancetta', 'prosciutto', 'pepperoni', 'salami',
    ],
  },
  {
    label: 'Dairy',
    keywords: [
      'milk', 'cream', 'butter', 'cheese', 'yogurt', 'sour cream', 'buttermilk',
      'half and half', 'heavy cream', 'whipping cream', 'light cream',
      'cheddar', 'mozzarella', 'parmesan', 'feta', 'ricotta', 'brie', 'gouda',
      'gruyere', 'cream cheese', 'cottage cheese', 'mascarpone', 'burrata', 'ghee', 'kefir',
    ],
  },
  {
    label: 'Pantry',
    keywords: [
      'flour', 'sugar', 'brown sugar', 'powdered sugar', 'confectioners',
      'oil', 'olive oil', 'vegetable oil', 'canola oil', 'sesame oil', 'coconut oil', 'avocado oil',
      'pasta', 'rice', 'bread', 'oat', 'quinoa', 'barley', 'couscous', 'farro', 'bulgur',
      'noodle', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'orzo', 'rigatoni', 'fusilli',
      'tortilla', 'pita', 'naan', 'panko', 'breadcrumb',
      'stock', 'broth', 'tomato paste', 'tomato sauce', 'crushed tomato', 'diced tomato', 'canned',
      'coconut milk', 'coconut cream',
      'honey', 'maple syrup', 'molasses', 'agave', 'corn syrup',
      'vinegar', 'balsamic', 'apple cider vinegar', 'rice vinegar',
      'soy sauce', 'tamari', 'fish sauce', 'oyster sauce', 'hoisin', 'worcestershire',
      'hot sauce', 'sriracha', 'tabasco', 'ketchup', 'mustard', 'mayonnaise', 'tahini', 'miso',
      'cornstarch', 'arrowroot', 'baking powder', 'baking soda', 'yeast',
      'cocoa', 'chocolate', 'chocolate chip',
      'almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'peanut', 'pine nut', 'hazelnut',
      'sesame seed', 'sunflower seed', 'pumpkin seed', 'flaxseed', 'chia seed',
      'lard', 'shortening',
    ],
  },
  {
    label: 'Produce',
    keywords: [
      'tomato', 'onion', 'garlic', 'lettuce', 'spinach', 'carrot', 'celery', 'mushroom',
      'potato', 'cucumber', 'zucchini', 'broccoli', 'cauliflower', 'leek', 'shallot',
      'scallion', 'green onion', 'lemon', 'lime', 'orange', 'apple', 'ginger',
      'berry', 'berries', 'kale', 'arugula', 'cabbage', 'bok choy', 'asparagus',
      'eggplant', 'artichoke', 'corn', 'pea', 'green bean', 'snap pea',
      'avocado', 'mango', 'pineapple', 'banana', 'strawberry', 'blueberry', 'raspberry',
      'blackberry', 'cherry', 'grape', 'peach', 'pear', 'plum', 'pomegranate',
      'beet', 'radish', 'turnip', 'parsnip', 'fennel', 'squash', 'pumpkin',
      'sweet potato', 'yam', 'pepper',
    ],
  },
];

function groupIngredients(ingredients) {
  const groups = {};
  for (const ingredient of ingredients) {
    const lower = ingredient.toLowerCase();
    if (PRODUCE_OVERRIDES.some(k => lower.includes(k))) {
      (groups['Produce'] = groups['Produce'] || []).push(ingredient);
      continue;
    }
    let matched = false;
    for (const group of INGREDIENT_GROUPS) {
      if (group.keywords.some(k => lower.includes(k))) {
        (groups[group.label] = groups[group.label] || []).push(ingredient);
        matched = true;
        break;
      }
    }
    if (!matched) (groups['Other'] = groups['Other'] || []).push(ingredient);
  }
  return groups;
}

function renderGroupedIngredients(ingredients) {
  const groups = groupIngredients(ingredients.filter(Boolean));
  const order = INGREDIENT_GROUPS.map(g => g.label).concat(['Other']);
  const presentGroups = order.filter(label => groups[label]);
  if (presentGroups.length === 1) {
    return `<ul class="ingredients-list">${ingredients.filter(Boolean).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  }
  return presentGroups.map(label => `
    <div class="ingredient-group">
      <div class="ingredient-group-label">${label}</div>
      <ul class="ingredients-list">${groups[label].map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>
  `).join('');
}

// ── Nutrition estimation ──────────────────────────────────
// Values per 100g (cooked where applicable). density = g/ml for volume conversions.
const NUTRITION_DB = [
  // ── Proteins ──
  { k: ['chicken breast', 'chicken thigh', 'chicken', 'rotisserie chicken'], cal: 165, p: 31, c: 0,   f: 3.6, fi: 0 },
  { k: ['ground beef', 'beef steak', 'beef', 'steak', 'bison'],             cal: 250, p: 26, c: 0,   f: 17,  fi: 0 },
  { k: ['ground pork', 'pork chop', 'pork loin', 'pork'],                   cal: 242, p: 27, c: 0,   f: 14,  fi: 0 },
  { k: ['ground turkey', 'turkey breast', 'turkey'],                        cal: 189, p: 29, c: 0,   f: 7,   fi: 0 },
  { k: ['ground lamb', 'lamb chop', 'lamb'],                                cal: 294, p: 25, c: 0,   f: 21,  fi: 0 },
  { k: ['salmon fillet', 'salmon'],                                         cal: 208, p: 20, c: 0,   f: 13,  fi: 0 },
  { k: ['tuna steak', 'canned tuna', 'tuna'],                               cal: 130, p: 29, c: 0,   f: 1,   fi: 0 },
  { k: ['shrimp', 'prawn'],                                                 cal: 99,  p: 24, c: 0,   f: 0.3, fi: 0 },
  { k: ['cod', 'tilapia', 'halibut', 'sea bass', 'trout', 'mahi', 'fish'], cal: 82,  p: 18, c: 0,   f: 0.7, fi: 0 },
  { k: ['bacon'],                                                           cal: 541, p: 37, c: 1.4, f: 42,  fi: 0 },
  { k: ['ham'],                                                             cal: 145, p: 21, c: 1.5, f: 5.5, fi: 0 },
  { k: ['italian sausage', 'pork sausage', 'sausage'],                     cal: 301, p: 11, c: 3,   f: 27,  fi: 0 },
  { k: ['pancetta', 'prosciutto'],                                          cal: 340, p: 26, c: 0,   f: 26,  fi: 0 },
  { k: ['duck'],                                                            cal: 337, p: 19, c: 0,   f: 28,  fi: 0 },
  { k: ['egg'],                                                             cal: 155, p: 13, c: 1.1, f: 11,  fi: 0 },
  { k: ['tofu'],                                                            cal: 76,  p: 8,  c: 1.9, f: 4.8, fi: 0.3 },
  { k: ['tempeh'],                                                          cal: 193, p: 19, c: 9,   f: 11,  fi: 0 },
  { k: ['lentil'],                                                          cal: 116, p: 9,  c: 20,  f: 0.4, fi: 8, density: 0.85 },
  { k: ['chickpea', 'garbanzo'],                                            cal: 164, p: 9,  c: 27,  f: 2.6, fi: 8 },
  { k: ['black bean', 'kidney bean', 'pinto bean', 'navy bean', 'white bean', 'cannellini bean', 'beans'], cal: 132, p: 9, c: 24, f: 0.5, fi: 8, density: 0.85 },
  { k: ['edamame'],                                                         cal: 122, p: 11, c: 10,  f: 5,   fi: 5 },
  // ── Dairy ──
  { k: ['whole milk', 'skim milk', 'milk'],                                 cal: 61,  p: 3.2, c: 4.8, f: 3.3, fi: 0, density: 1.03 },
  { k: ['heavy whipping cream', 'heavy cream', 'whipping cream'],           cal: 340, p: 2.8, c: 2.8, f: 36,  fi: 0, density: 0.99 },
  { k: ['half and half', 'light cream'],                                    cal: 130, p: 3,   c: 4.3, f: 12,  fi: 0, density: 1.02 },
  { k: ['sour cream'],                                                      cal: 193, p: 2.1, c: 4.6, f: 20,  fi: 0, density: 0.95 },
  { k: ['cream cheese'],                                                    cal: 342, p: 6,   c: 4.1, f: 34,  fi: 0, density: 0.98 },
  { k: ['greek yogurt', 'plain yogurt', 'yogurt'],                         cal: 59,  p: 10,  c: 3.6, f: 0.4, fi: 0, density: 1.0 },
  { k: ['cottage cheese'],                                                  cal: 98,  p: 11,  c: 3.4, f: 4.3, fi: 0, density: 1.0 },
  { k: ['parmesan'],                                                        cal: 431, p: 38,  c: 4.1, f: 29,  fi: 0 },
  { k: ['mozzarella'],                                                      cal: 280, p: 28,  c: 2.2, f: 17,  fi: 0 },
  { k: ['feta'],                                                            cal: 264, p: 14,  c: 4,   f: 21,  fi: 0 },
  { k: ['ricotta'],                                                         cal: 174, p: 11,  c: 3,   f: 13,  fi: 0 },
  { k: ['cheddar', 'gouda', 'gruyere', 'swiss cheese', 'cheese'],          cal: 403, p: 25,  c: 1.3, f: 33,  fi: 0 },
  { k: ['unsalted butter', 'salted butter', 'butter'],                     cal: 717, p: 0.9, c: 0.1, f: 81,  fi: 0, density: 0.91 },
  { k: ['ghee'],                                                            cal: 900, p: 0,   c: 0,   f: 100, fi: 0, density: 0.9 },
  // ── Oils & Fats ──
  { k: ['extra virgin olive oil', 'olive oil'],                            cal: 884, p: 0, c: 0, f: 100, fi: 0, density: 0.91 },
  { k: ['vegetable oil', 'canola oil', 'avocado oil', 'coconut oil', 'sesame oil', 'oil'], cal: 884, p: 0, c: 0, f: 100, fi: 0, density: 0.92 },
  { k: ['mayonnaise'],                                                      cal: 680, p: 1,  c: 0.6, f: 75, fi: 0, density: 1.0 },
  { k: ['peanut butter'],                                                   cal: 588, p: 25, c: 20,  f: 50, fi: 6 },
  { k: ['almond butter'],                                                   cal: 614, p: 21, c: 19,  f: 55, fi: 10 },
  { k: ['tahini'],                                                          cal: 595, p: 17, c: 21,  f: 54, fi: 9 },
  { k: ['avocado'],                                                         cal: 160, p: 2,  c: 9,   f: 15, fi: 7 },
  // ── Grains & Starches ──
  { k: ['bread flour', 'whole wheat flour', 'all-purpose flour', 'flour'], cal: 364, p: 10, c: 76, f: 1,   fi: 2.7, density: 0.53 },
  { k: ['granulated sugar', 'white sugar', 'caster sugar', 'sugar'],       cal: 387, p: 0,  c: 100,f: 0,   fi: 0,   density: 0.85 },
  { k: ['brown sugar'],                                                     cal: 380, p: 0,  c: 98, f: 0,   fi: 0,   density: 0.72 },
  { k: ['powdered sugar', 'confectioners sugar', 'icing sugar'],           cal: 389, p: 0,  c: 99, f: 0,   fi: 0,   density: 0.56 },
  { k: ['white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'rice'],cal:130, p: 2.7,c: 28, f: 0.3, fi: 0.4, density: 0.75 },
  { k: ['spaghetti', 'fettuccine', 'penne', 'linguine', 'orzo', 'rigatoni', 'pasta', 'noodle'], cal: 371, p: 13, c: 74, f: 1.5, fi: 2.5, density: 0.75 },
  { k: ['rolled oats', 'oats', 'oatmeal'],                                 cal: 389, p: 17, c: 66, f: 7,   fi: 10,  density: 0.41 },
  { k: ['quinoa'],                                                          cal: 368, p: 14, c: 64, f: 6,   fi: 7,   density: 0.7 },
  { k: ['panko', 'breadcrumb'],                                             cal: 395, p: 13, c: 72, f: 5,   fi: 3,   density: 0.3 },
  { k: ['tortilla', 'pita', 'naan', 'flatbread', 'bread'],                 cal: 266, p: 9,  c: 49, f: 3.3, fi: 2,   density: 0.4 },
  { k: ['cornstarch', 'arrowroot starch'],                                  cal: 381, p: 0.3,c: 91, f: 0.1, fi: 0.9, density: 0.6 },
  // ── Sweeteners ──
  { k: ['honey'],       cal: 304, p: 0.3, c: 82, f: 0,   fi: 0.2, density: 1.42 },
  { k: ['maple syrup'], cal: 260, p: 0,   c: 67, f: 0.1, fi: 0,   density: 1.33 },
  { k: ['molasses'],    cal: 290, p: 0,   c: 75, f: 0.1, fi: 0,   density: 1.4 },
  // ── Nuts & Seeds ──
  { k: ['almond'],       cal: 579, p: 21, c: 22, f: 50, fi: 12.5, density: 0.6 },
  { k: ['walnut'],       cal: 654, p: 15, c: 14, f: 65, fi: 6.7,  density: 0.5 },
  { k: ['pecan'],        cal: 691, p: 9,  c: 14, f: 72, fi: 9.6,  density: 0.48 },
  { k: ['cashew'],       cal: 553, p: 18, c: 30, f: 44, fi: 3.3,  density: 0.6 },
  { k: ['peanut'],       cal: 567, p: 26, c: 16, f: 49, fi: 8.5,  density: 0.65 },
  { k: ['pine nut'],     cal: 673, p: 14, c: 13, f: 68, fi: 3.7,  density: 0.55 },
  { k: ['sesame seed'],  cal: 573, p: 17, c: 23, f: 50, fi: 12,   density: 0.55 },
  { k: ['flaxseed', 'chia seed'], cal: 486, p: 17, c: 42, f: 31, fi: 27, density: 0.5 },
  // ── Produce ──
  { k: ['tomato paste'],                                                    cal: 82,  p: 4.5, c: 19, f: 0.5, fi: 4.1, density: 1.07 },
  { k: ['canned tomato', 'crushed tomato', 'diced tomato', 'tomato sauce'], cal: 35, p: 1.5, c: 7,  f: 0.3, fi: 1.6, density: 1.05 },
  { k: ['tomato'],        cal: 18, p: 0.9, c: 3.9, f: 0.2, fi: 1.2 },
  { k: ['sweet potato', 'yam'], cal: 86, p: 1.6, c: 20, f: 0.1, fi: 3 },
  { k: ['potato'],        cal: 77,  p: 2,   c: 17, f: 0.1, fi: 2.2 },
  { k: ['onion'],         cal: 40,  p: 1.1, c: 9.3,f: 0.1, fi: 1.7, density: 0.73 },
  { k: ['garlic'],        cal: 149, p: 6.4, c: 33, f: 0.5, fi: 2.1 },
  { k: ['fresh ginger', 'ginger'], cal: 80, p: 1.8, c: 18, f: 0.8, fi: 2 },
  { k: ['carrot'],        cal: 41,  p: 0.9, c: 10, f: 0.2, fi: 2.8 },
  { k: ['broccoli', 'cauliflower'], cal: 34, p: 2.8, c: 7, f: 0.4, fi: 2.6, density: 0.37 },
  { k: ['spinach', 'kale', 'arugula'], cal: 23, p: 2.9, c: 3.6, f: 0.4, fi: 2.2, density: 0.3 },
  { k: ['mushroom'],      cal: 22,  p: 3.1, c: 3.3, f: 0.3, fi: 1 },
  { k: ['bell pepper', 'red pepper', 'green pepper', 'sweet pepper'], cal: 31, p: 1, c: 6, f: 0.3, fi: 2.1 },
  { k: ['corn'],          cal: 86,  p: 3.2, c: 19, f: 1.2, fi: 2 },
  { k: ['pea'],           cal: 81,  p: 5.4, c: 14, f: 0.4, fi: 5.1, density: 0.6 },
  { k: ['zucchini', 'summer squash'], cal: 17, p: 1.2, c: 3.1, f: 0.3, fi: 1 },
  { k: ['eggplant'],      cal: 25,  p: 1,   c: 6,  f: 0.2, fi: 3 },
  { k: ['cucumber'],      cal: 15,  p: 0.7, c: 3.6,f: 0.1, fi: 0.5 },
  { k: ['celery'],        cal: 16,  p: 0.7, c: 3,  f: 0.2, fi: 1.6 },
  { k: ['banana'],        cal: 89,  p: 1.1, c: 23, f: 0.3, fi: 2.6 },
  { k: ['apple'],         cal: 52,  p: 0.3, c: 14, f: 0.2, fi: 2.4 },
  { k: ['lemon', 'lime'], cal: 29,  p: 0.7, c: 9,  f: 0.3, fi: 2.8, density: 1.0 },
  { k: ['orange'],        cal: 47,  p: 0.9, c: 12, f: 0.1, fi: 2.4 },
  // ── Liquids ──
  { k: ['coconut milk', 'coconut cream'],                                   cal: 197, p: 2,  c: 2.8,f: 21, fi: 0.2, density: 0.97 },
  { k: ['chicken broth', 'chicken stock', 'beef broth', 'beef stock', 'vegetable broth', 'vegetable stock', 'stock', 'broth'], cal: 17, p: 3, c: 1, f: 0.4, fi: 0, density: 1.0 },
  { k: ['soy sauce', 'tamari', 'liquid aminos'],                           cal: 53,  p: 8,  c: 5, f: 0.1, fi: 0.8, density: 1.1 },
  { k: ['balsamic vinegar', 'apple cider vinegar', 'rice vinegar', 'vinegar'], cal: 88, p: 0.5, c: 17, f: 0, fi: 0, density: 1.01 },
  { k: ['dry white wine', 'red wine', 'wine'],                             cal: 82,  p: 0.1,c: 2.7,f: 0, fi: 0,   density: 0.99 },
  // ── Chocolate & Baking ──
  { k: ['dark chocolate', 'semi-sweet chocolate', 'chocolate chip', 'chocolate'], cal: 546, p: 5, c: 60, f: 31, fi: 7, density: 0.67 },
  { k: ['cocoa powder', 'unsweetened cocoa', 'cocoa'],                     cal: 228, p: 20, c: 58, f: 14, fi: 33, density: 0.3 },
];

// Default gram weight for items usually counted (no unit), keyed by partial name
const COUNTABLE_WEIGHTS = {
  // proteins
  'chicken breast':  170,
  'chicken thigh':    85,
  'chicken drumstick':70,
  'chicken leg':     130,
  'salmon fillet':   170,
  'salmon steak':    170,
  'tilapia fillet':  140,
  'cod fillet':      140,
  'shrimp':           14,  // per piece (large shrimp ≈ 14g)
  'prawn':            14,
  'scallop':          30,
  'bacon strip':      15,
  'sausage link':     70,
  'egg':              50,
  // produce
  'tomato':          120,
  'onion':           110,
  'lemon':            65,
  'lime':             44,
  'orange':          130,
  'apple':           182,
  'banana':          118,
  'avocado':         200,
  'potato':          150,
  'sweet potato':    130,
  'garlic clove':      3,
  'clove garlic':      3,
  'cloves garlic':     3,
  'garlic cloves':     3,
  'jalapeño':         14,
  'jalapeno':         14,
  'bell pepper':     120,
  'mushroom':         20,
  // pantry / other
  'tortilla':         45,
  'slice bread':      30,
  'piece':            80,
};

const VOLUME_TO_ML = {
  tablespoons: 15, tablespoon: 15, tbsps: 15, tbsp: 15,
  teaspoons: 5,    teaspoon: 5,    tsps: 5,   tsp: 5,
  cups: 240,       cup: 240,
  liters: 1000,    liter: 1000,    l: 1000,
  mls: 1,          ml: 1,
};
const WEIGHT_TO_G = {
  kilograms: 1000, kilogram: 1000, kgs: 1000, kg: 1000,
  pounds: 453.6,   pound: 453.6,   lbs: 453.6, lb: 453.6,
  ounces: 28.35,   ounce: 28.35,   ozs: 28.35, oz: 28.35,
  grams: 1,        gram: 1,        g: 1,
};

function parseIngredientLine(raw) {
  const s = raw.toLowerCase().replace(/\(.*?\)/g, '').replace(/[,;]/g, '').trim();

  let qty = null, rest = s;

  // Mixed fraction: "1 1/2 ..."
  let m = rest.match(/^(\d+)\s+(\d+)\/(\d+)\s+(.+)$/);
  if (m) { qty = parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]); rest = m[4]; }

  // Simple fraction: "1/2 ..."
  if (qty === null) {
    m = rest.match(/^(\d+)\/(\d+)\s+(.+)$/);
    if (m) { qty = parseInt(m[1]) / parseInt(m[2]); rest = m[3]; }
  }

  // Integer or decimal: "2 ..." or "1.5 ..."
  if (qty === null) {
    m = rest.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (m) { qty = parseFloat(m[1]); rest = m[2]; }
  }

  if (!qty || qty <= 0) return null;

  // Skip "to N" range suffix (e.g. "1 to 2 cups") — just use the first number
  rest = rest.replace(/^to\s+\d+(?:\/\d+)?\s+/, '');

  // Extract unit (try longest first to avoid partial matches)
  const allUnits = [
    ...Object.keys(VOLUME_TO_ML),
    ...Object.keys(WEIGHT_TO_G),
  ].sort((a, b) => b.length - a.length);

  let unit = null;
  for (const u of allUnits) {
    if (rest === u || rest.startsWith(u + ' ')) {
      unit = u;
      rest = rest.slice(u.length).trim();
      break;
    }
  }

  const name = rest.replace(/^of\s+/, '').trim();
  return name ? { qty, unit, name } : null;
}

function matchNutritionEntry(name) {
  for (const entry of NUTRITION_DB) {
    if (entry.k.some(k => name.includes(k))) return entry;
  }
  return null;
}

function estimateMacros(ingredients, servings) {
  const srv = Math.max(1, servings || 1);
  let totals = { cal: 0, p: 0, c: 0, f: 0, fi: 0 };
  let matched = 0;

  for (const raw of ingredients.filter(Boolean)) {
    const parsed = parseIngredientLine(raw);
    if (!parsed) continue;

    const { qty, unit, name } = parsed;
    const entry = matchNutritionEntry(name);
    if (!entry) continue;

    let grams = null;

    // Weight unit → grams directly
    const wKey = unit && Object.keys(WEIGHT_TO_G).find(k => unit === k);
    if (wKey) grams = qty * WEIGHT_TO_G[wKey];

    // Volume unit → ml → grams via density (default 1.0 g/ml)
    if (grams === null) {
      const vKey = unit && Object.keys(VOLUME_TO_ML).find(k => unit === k);
      if (vKey) grams = qty * VOLUME_TO_ML[vKey] * (entry.density || 1.0);
    }

    // No unit → countable item lookup
    if (grams === null && !unit) {
      const cKey = Object.keys(COUNTABLE_WEIGHTS).find(k => name.includes(k));
      if (cKey) grams = qty * COUNTABLE_WEIGHTS[cKey];
    }

    if (!grams || grams <= 0) continue;

    totals.cal += (entry.cal / 100) * grams;
    totals.p   += (entry.p   / 100) * grams;
    totals.c   += (entry.c   / 100) * grams;
    totals.f   += (entry.f   / 100) * grams;
    totals.fi  += (entry.fi  / 100) * grams;
    matched++;
  }

  if (matched === 0) return null;

  return {
    cal:     Math.round(totals.cal / srv),
    protein: Math.round(totals.p   / srv),
    carbs:   Math.round(totals.c   / srv),
    fat:     Math.round(totals.f   / srv),
    fiber:   Math.round(totals.fi  / srv),
  };
}

// ── Photo / Crop editor ───────────────────────────────────
const cropState = {
  src: null,
  naturalW: 0, naturalH: 0,
  containerSize: 0,
  minScale: 1, scale: 1,
  offsetX: 0, offsetY: 0,
  isDragging: false,
  dragStartX: 0, dragStartY: 0,
  startOffsetX: 0, startOffsetY: 0,
};
let savedPhoto = null;
let cropDragCleanup = null;

function loadImageForCrop(dataUrl) {
  const img = new Image();
  img.onload = () => {
    cropState.src = dataUrl;
    cropState.naturalW = img.naturalWidth;
    cropState.naturalH = img.naturalHeight;

    // Show the editor BEFORE measuring offsetWidth — a hidden element reports 0
    document.getElementById('crop-image').src = dataUrl;
    document.getElementById('photo-empty').style.display = 'none';
    document.getElementById('photo-editor').style.display = 'block';

    // RAF lets the browser compute layout so offsetWidth is accurate
    requestAnimationFrame(() => {
      const container = document.getElementById('crop-container');
      const size = container.offsetWidth;
      cropState.containerSize = size;
      const minScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
      cropState.minScale = minScale;
      cropState.scale = minScale;
      cropState.offsetX = (size - img.naturalWidth * minScale) / 2;
      cropState.offsetY = (size - img.naturalHeight * minScale) / 2;
      document.getElementById('crop-zoom').value = 100;
      applyCropTransform();
      setupCropDrag();
    });
  };
  img.src = dataUrl;
}

function applyCropTransform() {
  const el = document.getElementById('crop-image');
  const { naturalW, naturalH, scale, offsetX, offsetY } = cropState;
  el.style.left   = offsetX + 'px';
  el.style.top    = offsetY + 'px';
  el.style.width  = (naturalW * scale) + 'px';
  el.style.height = (naturalH * scale) + 'px';
}

function clampCropOffsets() {
  const { naturalW, naturalH, scale, containerSize } = cropState;
  const dW = naturalW * scale, dH = naturalH * scale;
  cropState.offsetX = dW <= containerSize
    ? (containerSize - dW) / 2
    : Math.min(0, Math.max(containerSize - dW, cropState.offsetX));
  cropState.offsetY = dH <= containerSize
    ? (containerSize - dH) / 2
    : Math.min(0, Math.max(containerSize - dH, cropState.offsetY));
}

function onCropZoom(value) {
  const { minScale, containerSize } = cropState;
  const cx = containerSize / 2, cy = containerSize / 2;
  const imgCX = (cx - cropState.offsetX) / cropState.scale;
  const imgCY = (cy - cropState.offsetY) / cropState.scale;
  cropState.scale = minScale * (value / 100);
  cropState.offsetX = cx - imgCX * cropState.scale;
  cropState.offsetY = cy - imgCY * cropState.scale;
  clampCropOffsets();
  applyCropTransform();
}

function setupCropDrag() {
  if (cropDragCleanup) cropDragCleanup();
  const container = document.getElementById('crop-container');
  const startDrag = (x, y) => {
    cropState.isDragging = true;
    cropState.dragStartX = x; cropState.dragStartY = y;
    cropState.startOffsetX = cropState.offsetX;
    cropState.startOffsetY = cropState.offsetY;
  };
  const moveDrag = (x, y) => {
    if (!cropState.isDragging) return;
    cropState.offsetX = cropState.startOffsetX + (x - cropState.dragStartX);
    cropState.offsetY = cropState.startOffsetY + (y - cropState.dragStartY);
    clampCropOffsets();
    applyCropTransform();
  };
  const endDrag = () => { cropState.isDragging = false; };
  const onMouseDown  = e => { e.preventDefault(); startDrag(e.clientX, e.clientY); };
  const onMouseMove  = e => moveDrag(e.clientX, e.clientY);
  const onTouchStart = e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); };
  const onTouchMove  = e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); };
  container.addEventListener('mousedown',  onMouseDown);
  document.addEventListener('mousemove',   onMouseMove);
  document.addEventListener('mouseup',     endDrag);
  container.addEventListener('touchstart', onTouchStart, { passive: false });
  document.addEventListener('touchmove',   onTouchMove,  { passive: false });
  document.addEventListener('touchend',    endDrag);
  cropDragCleanup = () => {
    container.removeEventListener('mousedown',  onMouseDown);
    document.removeEventListener('mousemove',   onMouseMove);
    document.removeEventListener('mouseup',     endDrag);
    container.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove',   onTouchMove);
    document.removeEventListener('touchend',    endDrag);
  };
}

function resizeForCrop(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let { width: w, height: h } = img;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
          else        { w = Math.round(w * MAX / h); h = MAX; }
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.9));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  loadImageForCrop(await resizeForCrop(file));
}

function renderCroppedPhoto() {
  return new Promise(resolve => {
    const { src, scale, offsetX, offsetY, containerSize } = cropState;
    const OUTPUT = 600;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT; canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, -offsetX / scale, -offsetY / scale, containerSize / scale, containerSize / scale, 0, 0, OUTPUT, OUTPUT);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = src;
  });
}

function removePhoto() {
  cropState.src = null;
  savedPhoto = null;
  if (cropDragCleanup) { cropDragCleanup(); cropDragCleanup = null; }
  document.getElementById('crop-image').src = '';
  document.getElementById('photo-editor').style.display = 'none';
  document.getElementById('photo-empty').style.display = 'flex';
  document.getElementById('f-photo').value = '';
}

// ── Views ─────────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}
function showList() { renderList(); showView('view-list'); }
function showDetail(id) { renderDetail(id); showView('view-detail'); }
function showForm(id) {
  resetForm();
  showView('view-form');        // show first so crop container has layout dimensions
  if (id) loadFormForEdit(id);
}

// ── List ──────────────────────────────────────────────────
function renderList() {
  const q = document.getElementById('search').value.toLowerCase();
  const cat = document.getElementById('filter-cat').value;
  let recipes = load();
  if (q) recipes = recipes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    (r.desc || '').toLowerCase().includes(q) ||
    (r.ingredients || []).some(i => i.toLowerCase().includes(q))
  );
  if (cat) recipes = recipes.filter(r => r.category === cat);
  const grid = document.getElementById('recipe-grid');
  if (!recipes.length) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">🍽️</div><p>${
      load().length ? 'No recipes match your search.' : 'No recipes yet. Add your first one!'
    }</p></div>`;
    return;
  }
  grid.innerHTML = recipes.map(r => `
    <div class="card" onclick="showDetail('${r.id}')">
      ${r.photo
        ? `<img class="card-img" src="${r.photo}" alt="${esc(r.name)}" />`
        : `<div class="card-color ${catClass(r.category)}"></div>`}
      <div class="card-body">
        <div class="card-title">${esc(r.name)}</div>
        ${r.desc ? `<div class="card-desc">${esc(r.desc)}</div>` : ''}
        <div class="card-meta">
          ${r.prep || r.cook ? `<span>⏱ ${fmt((r.prep || 0) + (r.cook || 0))} total</span>` : ''}
          ${r.servings ? `<span>🍽 ${r.servings} servings</span>` : ''}
          ${r.difficulty ? `<span>📊 ${esc(r.difficulty)}</span>` : ''}
        </div>
        ${r.category ? `<div class="tag">${esc(r.category)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ── Detail ────────────────────────────────────────────────
function renderDetail(id) {
  const r = load().find(x => x.id === id);
  if (!r) { showList(); return; }

  const macros = estimateMacros(r.ingredients || [], r.servings);

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-header">
      <div>
        ${r.category ? `<div class="tag" style="margin-bottom:8px">${esc(r.category)}</div>` : ''}
        <div class="detail-title">${esc(r.name)}</div>
        ${r.desc ? `<div class="detail-desc">${esc(r.desc)}</div>` : ''}
      </div>
      <div class="detail-actions">
        <button class="btn btn-ghost btn-sm" onclick="showForm('${r.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRecipe('${r.id}')">🗑 Delete</button>
      </div>
    </div>

    <div class="detail-meta">
      <div class="meta-item"><span class="meta-label">Prep</span><span class="meta-value">${fmt(r.prep)}</span></div>
      <div class="meta-item"><span class="meta-label">Cook</span><span class="meta-value">${fmt(r.cook)}</span></div>
      <div class="meta-item"><span class="meta-label">Total</span><span class="meta-value">${fmt((r.prep || 0) + (r.cook || 0)) || '—'}</span></div>
      <div class="meta-item"><span class="meta-label">Servings</span><span class="meta-value">${r.servings || '—'}</span></div>
      <div class="meta-item"><span class="meta-label">Difficulty</span><span class="meta-value">${esc(r.difficulty) || '—'}</span></div>
      ${macros ? `
        <div class="meta-sep"></div>
        <div class="meta-item"><span class="meta-label">Calories</span><span class="meta-value">~${macros.cal}</span></div>
        <div class="meta-item"><span class="meta-label">Protein</span><span class="meta-value">~${macros.protein}g</span></div>
        <div class="meta-item"><span class="meta-label">Carbs</span><span class="meta-value">~${macros.carbs}g</span></div>
        <div class="meta-item"><span class="meta-label">Fat</span><span class="meta-value">~${macros.fat}g</span></div>
        <div class="meta-item"><span class="meta-label">Fiber</span><span class="meta-value">~${macros.fiber}g</span></div>
        <span class="macro-note">est. per serving</span>
      ` : ''}
    </div>

    ${r.photo ? `<img class="detail-photo detail-photo-mobile" src="${r.photo}" alt="${esc(r.name)}" />` : ''}

    <div class="two-col">
      <div>
        <div class="section-title">Ingredients</div>
        ${renderGroupedIngredients(r.ingredients || [])}
      </div>
      <div>
        ${r.photo ? `<img class="detail-photo detail-photo-desktop" src="${r.photo}" alt="${esc(r.name)}" />` : ''}
        <div class="section-title">Instructions</div>
        <ol class="steps-list">
          ${(r.steps || []).filter(Boolean).map((s, i) => `
            <li><div class="step-num">${i + 1}</div><div class="step-text">${esc(s)}</div></li>
          `).join('')}
        </ol>
        ${r.notes ? `<div class="notes-box"><strong>Notes:</strong> ${esc(r.notes)}</div>` : ''}
      </div>
    </div>
  `;
}

function deleteRecipe(id) {
  if (!confirm('Delete this recipe?')) return;
  save(load().filter(r => r.id !== id));
  showList();
}

// ── Form ──────────────────────────────────────────────────
function recalculateFormMacros() {
  const ingredients = [...document.querySelectorAll('#ingredients-list input')]
    .map(i => i.value.trim()).filter(Boolean);
  const servings = parseInt(document.getElementById('f-servings').value) || 1;
  const macros = estimateMacros(ingredients, servings);
  const el = document.getElementById('form-macro-values');
  if (!macros) {
    el.innerHTML = '<span class="form-macro-hint">Could not estimate — use quantities like "1 lb chicken", "2 cups flour", "6 shrimp"</span>';
    return;
  }
  el.innerHTML = `
    <div class="form-macro-item"><span class="form-macro-val">${macros.cal}</span><span class="form-macro-lbl">Calories</span></div>
    <div class="form-macro-item"><span class="form-macro-val">${macros.protein}g</span><span class="form-macro-lbl">Protein</span></div>
    <div class="form-macro-item"><span class="form-macro-val">${macros.carbs}g</span><span class="form-macro-lbl">Carbs</span></div>
    <div class="form-macro-item"><span class="form-macro-val">${macros.fat}g</span><span class="form-macro-lbl">Fat</span></div>
    <div class="form-macro-item"><span class="form-macro-val">${macros.fiber}g</span><span class="form-macro-lbl">Fiber</span></div>
  `;
}

function resetForm() {
  document.getElementById('recipe-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('form-title').textContent = 'Add New Recipe';
  document.getElementById('ingredients-list').innerHTML = '';
  document.getElementById('steps-list').innerHTML = '';
  addIngredient(); addIngredient(); addIngredient();
  addStep(); addStep();
  removePhoto();
  document.getElementById('form-macro-values').innerHTML =
    '<span class="form-macro-hint">Add ingredients above and click Recalculate</span>';
}

function loadFormForEdit(id) {
  const r = load().find(x => x.id === id);
  if (!r) return;
  document.getElementById('edit-id').value = r.id;
  document.getElementById('form-title').textContent = 'Edit Recipe';
  document.getElementById('f-name').value = r.name || '';
  document.getElementById('f-category').value = r.category || 'Dinner';
  document.getElementById('f-servings').value = r.servings || '';
  document.getElementById('f-prep').value = r.prep || '';
  document.getElementById('f-cook').value = r.cook || '';
  document.getElementById('f-difficulty').value = r.difficulty || 'Medium';
  document.getElementById('f-desc').value = r.desc || '';
  document.getElementById('f-notes').value = r.notes || '';
  if (r.photo) { savedPhoto = r.photo; loadImageForCrop(r.photo); }
  const il = document.getElementById('ingredients-list');
  const sl = document.getElementById('steps-list');
  il.innerHTML = ''; sl.innerHTML = '';
  (r.ingredients || ['']).forEach(v => addIngredient(v));
  (r.steps || ['']).forEach(v => addStep(v));
  if (r.ingredients && r.ingredients.length) recalculateFormMacros();
}

function addIngredient(val = '') {
  const row = document.createElement('div');
  row.className = 'dynamic-item';
  row.innerHTML = `<input type="text" placeholder="e.g. 2 cups flour" value="${esc(val)}" />
    <button type="button" class="rm-btn" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById('ingredients-list').appendChild(row);
  if (!val) row.querySelector('input').focus();
}

function addStep(val = '') {
  const row = document.createElement('div');
  row.className = 'dynamic-item';
  row.innerHTML = `<textarea placeholder="Describe this step…" rows="2">${esc(val)}</textarea>
    <button type="button" class="rm-btn" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById('steps-list').appendChild(row);
  if (!val) row.querySelector('textarea').focus();
}

async function saveRecipe(e) {
  e.preventDefault();
  const ingredients = [...document.querySelectorAll('#ingredients-list input')].map(i => i.value.trim()).filter(Boolean);
  const steps = [...document.querySelectorAll('#steps-list textarea')].map(t => t.value.trim()).filter(Boolean);
  if (!ingredients.length) { alert('Add at least one ingredient.'); return; }
  if (!steps.length) { alert('Add at least one instruction step.'); return; }

  let photo = null;
  if (cropState.src) photo = await renderCroppedPhoto();
  else if (savedPhoto)  photo = savedPhoto;

  const recipes = load();
  const editId = document.getElementById('edit-id').value;
  const recipe = {
    id: editId || uid(),
    name: document.getElementById('f-name').value.trim(),
    category: document.getElementById('f-category').value,
    servings: parseInt(document.getElementById('f-servings').value) || null,
    prep: parseInt(document.getElementById('f-prep').value) || null,
    cook: parseInt(document.getElementById('f-cook').value) || null,
    difficulty: document.getElementById('f-difficulty').value,
    desc: document.getElementById('f-desc').value.trim(),
    notes: document.getElementById('f-notes').value.trim(),
    photo,
    ingredients,
    steps,
    updatedAt: Date.now(),
  };
  if (editId) {
    const idx = recipes.findIndex(r => r.id === editId);
    if (idx >= 0) recipes[idx] = recipe; else recipes.push(recipe);
  } else {
    recipe.createdAt = Date.now();
    recipes.unshift(recipe);
  }
  save(recipes);
  showDetail(recipe.id);
}

// ── Init ──────────────────────────────────────────────────
renderList();
