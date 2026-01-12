// --- DEFAULTS ---
const defaultTargets = { p: 150, c: 350, f: 75 };

// Note: Added unique IDs to every item
const defaultIngredients = [
    { id: 'prot-pow', name: "Protein Powder", p: 27, c: 3, f: 2, unit: "scp", per: 1 },
    { id: 'paneer', name: "Paneer", p: 20, c: 3, f: 22, unit: "g", per: 100 },
    { id: 'eggs', name: "Eggs", p: 6, c: 0.5, f: 5, unit: "egg", per: 1 },
    { id: 'split-peas', name: "Split Peas (Dry)", p: 24, c: 60, f: 1, unit: "g", per: 100 },
    { id: 'prot-bread', name: "Protein Bread", p: 7, c: 12, f: 1.5, unit: "slc", per: 1 },
    { id: 'milk', name: "Milk", p: 8, c: 12, f: 5, unit: "ml", per: 250 },
    { id: 'oats', name: "Oats", p: 6, c: 27, f: 3, unit: "g", per: 40 },
    { id: 'pasta', name: "Pasta (Dry)", p: 12, c: 72, f: 2, unit: "g", per: 100 },
    { id: 'rice', name: "Brown Rice (Dry)", p: 8, c: 75, f: 2.5, unit: "g", per: 100 },
    { id: 'yogurt', name: "Yogurt", p: 4, c: 5, f: 3, unit: "g", per: 100 },
    { id: 'pb', name: "Peanut Butter", p: 4, c: 3, f: 8, unit: "tbsp", per: 1 },
    { id: 'blueberries', name: "Blueberries", p: 1, c: 14, f: 0, unit: "g", per: 100 },
    { id: 'veggies', name: "Veggies Mix", p: 2, c: 5, f: 0, unit: "g", per: 100 },
    { id: 'ice-cream', name: "Ice Cream", p: 4, c: 24, f: 11, unit: "g", per: 100 },
    // The Pinned Misc Item
    { id: 'misc-item', name: "Miscellaneous", p: 1, c: 1, f: 1, unit: "unit", per: 1 }
];

// --- STATE ---
let ingredients = [];
let dailyValues = {}; // Now stores { "id": amount } instead of index

// --- INIT ---
function init() {
    // 1. Load Ingredients Database (V5 key forces structure update)
    const savedIng = localStorage.getItem('my_ingredients_v5');
    ingredients = savedIng ? JSON.parse(savedIng) : JSON.parse(JSON.stringify(defaultIngredients));
    
    // 2. Load Daily Progress
    const savedDaily = localStorage.getItem('my_daily_progress_v5');
    dailyValues = savedDaily ? JSON.parse(savedDaily) : {};

    // Ensure Misc item always exists and is at the end
    ingredients = ingredients.filter(i => i.id !== 'misc-item'); // Remove if exists
    ingredients.push(defaultIngredients.find(i => i.id === 'misc-item')); // Add back to end

    renderTracker();
    renderEditor();
    setupListeners();
}

// --- RENDER TRACKER ---
function renderTracker() {
    const list = document.getElementById('tracker-list');
    list.innerHTML = '';
    
    ingredients.forEach((item) => {
        const val = dailyValues[item.id] || ''; // Look up by ID
        
        // Highlight Misc Item visually
        const isMisc = item.id === 'misc-item';
        const bgClass = isMisc ? 'style="border: 1px dashed #444; background: #1a1a1a;"' : '';

        const itemDiv = document.createElement('div');
        itemDiv.className = 'ingredient-item';
        if(isMisc) itemDiv.style.cssText = "border: 1px dashed #555; background-color: #151515;";

        itemDiv.innerHTML = `
            <div class="ing-info">
                <h3 class="${isMisc ? 'text-blue-400' : ''}">${item.name}</h3>
                <p>P:${item.p} C:${item.c} F:${item.f} <span style="color:#555">/ ${item.per}${item.unit}</span></p>
            </div>
            <div class="input-group">
                <input type="number" 
                       class="input-track" 
                       id="track-in-${item.id}" 
                       value="${val}" 
                       placeholder="0">
                <span class="unit">${item.unit}</span>
            </div>
        `;
        list.appendChild(itemDiv);

        const input = document.getElementById(`track-in-${item.id}`);
        input.addEventListener('input', (e) => updateCalculation(item.id, e.target.value));
    });
    recalcTotals(); 
}

// --- RENDER EDITOR ---
function renderEditor() {
    const list = document.getElementById('editor-list');
    list.innerHTML = '';

    ingredients.forEach((item) => {
        const isMisc = item.id === 'misc-item';
        
        const card = document.createElement('div');
        card.className = 'editor-card';
        if(isMisc) card.style.cssText = "border: 1px dashed #555; opacity: 0.9;";

        // Misc item cannot be deleted or renamed (optional, but safer)
        const deleteBtn = isMisc 
            ? `<span style="font-size:10px; color:#555;">(Pinned)</span>` 
            : `<button class="btn-trash" id="del-${item.id}">✕</button>`;

        card.innerHTML = `
            <div class="edit-row">
                <input type="text" class="edit-input name-input" 
                       style="font-weight:bold; color:${isMisc ? '#a3a3a3' : '#60a5fa'}" 
                       value="${item.name}">
                ${deleteBtn}
            </div>
            <div class="edit-row">
                <label>Prot</label>
                <input type="number" class="edit-input small-input p-input" value="${item.p}">
                <label style="margin-left:10px">Carb</label>
                <input type="number" class="edit-input small-input c-input" value="${item.c}">
                <label style="margin-left:10px">Fat</label>
                <input type="number" class="edit-input small-input f-input" value="${item.f}">
            </div>
            <div class="edit-row">
                <label>Per</label>
                <input type="number" class="edit-input small-input per-input" value="${item.per}">
                <label style="margin-left:10px">Unit</label>
                <input type="text" class="edit-input small-input unit-input" value="${item.unit}">
            </div>
        `;
        list.appendChild(card);

        // Attach listeners
        card.querySelector('.name-input').addEventListener('change', (e) => editItem(item.id, 'name', e.target.value));
        card.querySelector('.p-input').addEventListener('change', (e) => editItem(item.id, 'p', e.target.value));
        card.querySelector('.c-input').addEventListener('change', (e) => editItem(item.id, 'c', e.target.value));
        card.querySelector('.f-input').addEventListener('change', (e) => editItem(item.id, 'f', e.target.value));
        card.querySelector('.per-input').addEventListener('change', (e) => editItem(item.id, 'per', e.target.value));
        card.querySelector('.unit-input').addEventListener('change', (e) => editItem(item.id, 'unit', e.target.value));
        
        if(!isMisc) {
            card.querySelector('.btn-trash').addEventListener('click', () => deleteItem(item.id));
        }
    });
}

// --- LOGIC: TRACKER ---
function updateCalculation(id, value) {
    dailyValues[id] = value; // Store by Unique ID
    localStorage.setItem('my_daily_progress_v5', JSON.stringify(dailyValues));
    recalcTotals();
}

function recalcTotals() {
    let totalP = 0, totalC = 0, totalF = 0;

    ingredients.forEach((item) => {
        const inputVal = parseFloat(dailyValues[item.id]) || 0;
        if (inputVal > 0) {
            const ratio = inputVal / item.per;
            totalP += item.p * ratio;
            totalC += item.c * ratio;
            totalF += item.f * ratio;
        }
    });

    updateUI('p', totalP, defaultTargets.p);
    updateUI('c', totalC, defaultTargets.c);
    updateUI('f', totalF, defaultTargets.f);
}

function updateUI(type, current, max) {
    const disp = document.getElementById(`disp-${type}`);
    const bar = document.getElementById(`bar-${type}`);
    
    disp.innerText = Math.round(current) + "/" + max + "g";
    const pct = Math.min((current / max) * 100, 100);
    bar.style.width = pct + "%";

    if(current >= max) {
        disp.classList.add('hit');
        bar.classList.add('bg-hit');
    } else {
        disp.classList.remove('hit');
        bar.classList.remove('bg-hit');
    }
}

function resetDaily() {
    if(confirm("Start a new day?")) {
        dailyValues = {};
        localStorage.removeItem('my_daily_progress_v5'); 
        renderTracker();
    }
}

// --- LOGIC: EDITOR ---
function editItem(id, field, value) {
    const idx = ingredients.findIndex(i => i.id === id);
    if(idx === -1) return;

    if (field === 'name' || field === 'unit') {
        ingredients[idx][field] = value;
    } else {
        ingredients[idx][field] = parseFloat(value) || 0;
    }
    saveIngredients();
    renderTracker(); 
}

function deleteItem(id) {
    const item = ingredients.find(i => i.id === id);
    if(confirm(`Delete "${item.name}"?`)) {
        ingredients = ingredients.filter(i => i.id !== id);
        
        // Cleanup daily value for this deleted item
        delete dailyValues[id];
        localStorage.setItem('my_daily_progress_v5', JSON.stringify(dailyValues));
        
        saveIngredients();
        renderEditor();
        renderTracker();
    }
}

function addNewItem() {
    const name = document.getElementById('new-name').value;
    const p = parseFloat(document.getElementById('new-p').value) || 0;
    const c = parseFloat(document.getElementById('new-c').value) || 0;
    const f = parseFloat(document.getElementById('new-f').value) || 0;
    const per = parseFloat(document.getElementById('new-per').value) || 100;
    const unit = document.getElementById('new-unit').value || 'g';

    if(!name) { alert("Please enter a name"); return; }

    // Generate Unique ID
    const newId = 'custom-' + Date.now();

    // 1. Remove Misc
    const misc = ingredients.pop();
    // 2. Add New Item
    ingredients.push({ id: newId, name, p, c, f, per, unit });
    // 3. Add Misc Back (So it stays last)
    ingredients.push(misc);

    saveIngredients();
    
    // Clear form
    document.getElementById('new-name').value = '';
    document.getElementById('new-p').value = '';
    document.getElementById('new-c').value = '';
    document.getElementById('new-f').value = '';
    document.getElementById('add-form').classList.add('hidden');
    
    renderEditor();
    renderTracker();
}

function saveIngredients() {
    localStorage.setItem('my_ingredients_v5', JSON.stringify(ingredients));
}

function resetDefaults() {
    if(confirm("Reset database to defaults? (This deletes custom items)")) {
        localStorage.removeItem('my_ingredients_v5');
        init();
    }
}

function switchView(viewName) {
    const trackView = document.getElementById('view-tracker');
    const editView = document.getElementById('view-editor');
    const navTrack = document.getElementById('nav-track');
    const navEdit = document.getElementById('nav-edit');

    if (viewName === 'tracker') {
        trackView.classList.remove('hidden');
        editView.classList.add('hidden');
        navTrack.classList.add('active');
        navEdit.classList.remove('active');
    } else {
        trackView.classList.add('hidden');
        editView.classList.remove('hidden');
        navTrack.classList.remove('active');
        navEdit.classList.add('active');
    }
}

function setupListeners() {
    document.getElementById('nav-track').addEventListener('click', () => switchView('tracker'));
    document.getElementById('nav-edit').addEventListener('click', () => switchView('editor'));
    document.getElementById('btn-reset-day').addEventListener('click', resetDaily);
    document.getElementById('btn-reset-db').addEventListener('click', resetDefaults);
    document.getElementById('btn-toggle-add').addEventListener('click', () => {
        document.getElementById('add-form').classList.toggle('hidden');
    });
    document.getElementById('btn-save-new').addEventListener('click', addNewItem);
}

init();
