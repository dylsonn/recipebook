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
let savedPhoto = null;    // existing saved photo when editing
let cropDragCleanup = null;

function loadImageForCrop(dataUrl) {
  const img = new Image();
  img.onload = () => {
    cropState.src = dataUrl;
    cropState.naturalW = img.naturalWidth;
    cropState.naturalH = img.naturalHeight;

    const container = document.getElementById('crop-container');
    const size = container.offsetWidth;
    cropState.containerSize = size;

    // minScale fills the container with no gaps
    const minScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    cropState.minScale = minScale;
    cropState.scale = minScale;
    // Center the image
    cropState.offsetX = (size - img.naturalWidth * minScale) / 2;
    cropState.offsetY = (size - img.naturalHeight * minScale) / 2;

    document.getElementById('crop-zoom').value = 100;
    document.getElementById('crop-image').src = dataUrl;
    applyCropTransform();

    document.getElementById('photo-empty').style.display = 'none';
    document.getElementById('photo-editor').style.display = 'block';
    setupCropDrag();
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
  // Keep the image point currently at the center fixed during zoom
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
  const resized = await resizeForCrop(file);
  loadImageForCrop(resized);
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
      // Derive the source rect: what portion of the original image is visible
      const srcX = -offsetX / scale;
      const srcY = -offsetY / scale;
      const srcW = containerSize / scale;
      const srcH = containerSize / scale;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT, OUTPUT);
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
    savedPhoto = r.photo;
    loadImageForCrop(r.photo);
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

async function saveRecipe(e) {
  e.preventDefault();
  const ingredients = [...document.querySelectorAll('#ingredients-list input')].map(i => i.value.trim()).filter(Boolean);
  const steps = [...document.querySelectorAll('#steps-list textarea')].map(t => t.value.trim()).filter(Boolean);

  if (!ingredients.length) { alert('Add at least one ingredient.'); return; }
  if (!steps.length) { alert('Add at least one instruction step.'); return; }

  // Render the crop to a square JPEG if an image is loaded; otherwise keep existing
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
