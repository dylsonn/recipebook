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

// These terms would match a seasoning keyword ("pepper", "garlic") if run through
// normal group matching — force them directly to Produce before the main loop runs.
const PRODUCE_OVERRIDES = [
  'bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'orange pepper',
  'sweet pepper', 'chili pepper', 'chile pepper', 'poblano', 'anaheim', 'pasilla',
  'banana pepper', 'jalapeño', 'jalapeno', 'habanero', 'serrano',
  'garlic clove', 'garlic bulb', 'head of garlic', 'clove of garlic', 'cloves garlic',
  'cloves of garlic', 'whole garlic', 'fresh ginger', 'ginger root', 'ginger knob',
];

// Groups are checked in order — Seasonings & Spices is first so compound terms like
// "garlic powder" and "black pepper" match before the bare keywords in Produce.
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

    // Produce overrides run first — these would otherwise match a seasoning keyword
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
    if (!matched) {
      (groups['Other'] = groups['Other'] || []).push(ingredient);
    }
  }
  return groups;
}

function renderGroupedIngredients(ingredients) {
  const groups = groupIngredients(ingredients.filter(Boolean));
  const order = INGREDIENT_GROUPS.map(g => g.label).concat(['Other']);
  const presentGroups = order.filter(label => groups[label]);

  // Render flat if everything ended up in a single group
  if (presentGroups.length === 1) {
    return `<ul class="ingredients-list">
      ${ingredients.filter(Boolean).map(i => `<li>${esc(i)}</li>`).join('')}
    </ul>`;
  }

  return presentGroups.map(label => `
    <div class="ingredient-group">
      <div class="ingredient-group-label">${label}</div>
      <ul class="ingredients-list">
        ${groups[label].map(i => `<li>${esc(i)}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

// ── Photo handling ────────────────────────────────────────
let currentEditPhoto = null;

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  currentEditPhoto = await compressImage(file);
  document.getElementById('photo-preview').src = currentEditPhoto;
  document.getElementById('photo-preview').classList.add('visible');
  document.getElementById('photo-placeholder').style.display = 'none';
  document.getElementById('photo-remove-btn').style.display = 'inline-flex';
}

function removePhoto() {
  currentEditPhoto = null;
  document.getElementById('photo-preview').src = '';
  document.getElementById('photo-preview').classList.remove('visible');
  document.getElementById('photo-placeholder').style.display = 'flex';
  document.getElementById('photo-remove-btn').style.display = 'none';
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
  if (id) loadFormForEdit(id);
  showView('view-form');
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
    </div>

    ${r.photo ? `<img class="detail-photo" src="${r.photo}" alt="${esc(r.name)}" />` : ''}

    <div class="two-col">
      <div>
        <div class="section-title">Ingredients</div>
        ${renderGroupedIngredients(r.ingredients || [])}
      </div>
      <div>
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
function resetForm() {
  document.getElementById('recipe-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('form-title').textContent = 'Add New Recipe';
  document.getElementById('ingredients-list').innerHTML = '';
  document.getElementById('steps-list').innerHTML = '';
  addIngredient(); addIngredient(); addIngredient();
  addStep(); addStep();
  removePhoto();
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

  if (r.photo) {
    currentEditPhoto = r.photo;
    document.getElementById('photo-preview').src = r.photo;
    document.getElementById('photo-preview').classList.add('visible');
    document.getElementById('photo-placeholder').style.display = 'none';
    document.getElementById('photo-remove-btn').style.display = 'inline-flex';
  }

  const il = document.getElementById('ingredients-list');
  const sl = document.getElementById('steps-list');
  il.innerHTML = ''; sl.innerHTML = '';
  (r.ingredients || ['']).forEach(v => addIngredient(v));
  (r.steps || ['']).forEach(v => addStep(v));
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

function saveRecipe(e) {
  e.preventDefault();
  const ingredients = [...document.querySelectorAll('#ingredients-list input')].map(i => i.value.trim()).filter(Boolean);
  const steps = [...document.querySelectorAll('#steps-list textarea')].map(t => t.value.trim()).filter(Boolean);

  if (!ingredients.length) { alert('Add at least one ingredient.'); return; }
  if (!steps.length) { alert('Add at least one instruction step.'); return; }

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
    photo: currentEditPhoto || null,
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
