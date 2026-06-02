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
      <div class="card-color ${catClass(r.category)}"></div>
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

    <div class="two-col">
      <div>
        <div class="section-title">Ingredients</div>
        <ul class="ingredients-list">
          ${(r.ingredients || []).filter(Boolean).map(i => `<li>${esc(i)}</li>`).join('')}
        </ul>
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
