// --- DEFAULTS ---
const defaultTargets = { p: 150, c: 350, f: 75 };
const defaultIngredients = [
    { name: "Protein Powder", p: 27, c: 3, f: 2, unit: "scp", per: 1 },
    { name: "Paneer", p: 20, c: 3, f: 22, unit: "g", per: 100 },
    { name: "Eggs", p: 6, c: 0.5, f: 5, unit: "egg", per: 1 },
    { name: "Split Peas (Dry)", p: 24, c: 60, f: 1, unit: "g", per: 100 },
    { name: "Protein Bread", p: 7, c: 12, f: 1.5, unit: "slc", per: 1 },
    { name: "Milk", p: 8, c: 12, f: 5, unit: "ml", per: 250 },
    { name: "Oats", p: 6, c: 27, f: 3, unit: "g", per: 40 },
    { name: "Pasta (Dry)", p: 12, c: 72, f: 2, unit: "g", per: 100 },
    { name: "Brown Rice (Dry)", p: 8, c: 75, f: 2.5, unit: "g", per: 100 },
    { name: "Yogurt", p: 4, c: 5, f: 3, unit: "g", per: 100 },
    { name: "Peanut Butter", p: 4, c: 3, f: 8, unit: "tbsp", per: 1 },
    { name: "Blueberries", p: 1, c: 14, f: 0, unit: "g", per: 100 },
    { name: "Veggies Mix", p: 2, c: 5, f: 0, unit: "g", per: 100 },
    { name: "Ice Cream", p: 4, c: 24, f: 11, unit: "g", per: 100 }
];

// --- STATE ---
let ingredients = [];
let dailyValues = {}; 

// --- INIT ---
function init() {
    // 1. Load Ingredients Database
    const savedIng = localStorage.getItem('my_ingredients_v3');
    ingredients = savedIng ? JSON.parse(savedIng) : JSON.parse(JSON.stringify(defaultIngredients));
    
    // 2. Load Daily Progress
    const savedDaily = localStorage.getItem('my_daily_progress_v3');
    dailyValues = savedDaily ? JSON.parse(savedDaily) : {};

    renderTracker();
    renderEditor();
    setupListeners();
}

// --- RENDER TRACKER ---
function renderTracker() {
    const list = document.getElementById('tracker-list');
    list.innerHTML = '';
    
    ingredients.forEach((item, idx) => {
        const val = dailyValues[idx] || ''; 
        // Create elements properly to avoid inline event string issues
        const itemDiv = document.createElement('div');
        itemDiv.className = 'ingredient-item';
        itemDiv.innerHTML = `
            <div class="ing-info">
                <h3>${item.name}</h3>
                <p>P:${item.p} C:${item.c} F:${item.f} <span style="color:#555">/ ${item.per}${item.unit}</span></p>
            </div>
            <div class="input-group">
                <input type="number" 
                       class="input-track" 
                       id="track-in-${idx}" 
                       value="${val}" 
                       placeholder="0">
                <span class="unit">${item.unit}</span>
            </div>
        `;
        list.appendChild(itemDiv);

        // Add event listener manually
        const input = document.getElementById(`track-in-${idx}`);
        input.addEventListener('input', (e) => updateCalculation(idx, e.target.value));
    });
    recalcTotals(); 
}

// --- RENDER EDITOR ---
function renderEditor() {
    const list = document.getElementById('editor-list');
    list.innerHTML = '';

    ingredients.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'editor-card';
        card.innerHTML = `
            <div class="edit-row">
                <input type="text" class="edit-input name-input" style="font-weight:bold; color:#60a5fa" value="${item.name}">
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

        // Attach listeners for this card
        card.querySelector('.name-input').addEventListener('change', (e) => editItem(idx, 'name', e.target.value));
        card.querySelector('.p-input').addEventListener('change', (e) => editItem(idx, 'p', e.target.value));
        card.querySelector('.c-input').addEventListener('change', (e) => editItem(idx, 'c', e.target.value));
        card.querySelector('.f-input').addEventListener('change', (e) => editItem(idx, 'f', e.target.value));
        card.querySelector('.per-input').addEventListener('change', (e) => editItem(idx, 'per', e.target.value));
        card.querySelector('.unit-input').addEventListener('change', (e) => editItem(idx, 'unit', e.target.value));
    });
}

// --- LOGIC: TRACKER ---
function updateCalculation(idx, value) {
    dailyValues[idx] = value;
    localStorage.setItem('my_daily_progress_v3', JSON.stringify(dailyValues));
    recalcTotals();
}

function recalcTotals() {
    let totalP = 0, totalC = 0, totalF = 0;

    ingredients.forEach((item, idx) => {
        const inputVal = parseFloat(dailyValues[idx]) || 0;
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
    if(confirm("Start a new day? (This clears your progress)")) {
        dailyValues = {};
        localStorage.removeItem('my_daily_progress_v3'); 
        renderTracker();
    }
}

// --- LOGIC: EDITOR ---
function editItem(idx, field, value) {
    if (field === 'name' || field === 'unit') {
        ingredients[idx][field] = value;
    } else {
        ingredients[idx][field] = parseFloat(value) || 0;
    }
    localStorage.setItem('my_ingredients_v3', JSON.stringify(ingredients));
    renderTracker(); 
}

function resetDefaults() {
    if(confirm("Reset entire ingredient database to defaults?")) {
        localStorage.removeItem('my_ingredients_v3');
        init();
    }
}

// --- VIEW SWITCHING ---
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

// --- SETUP LISTENERS ---
function setupListeners() {
    document.getElementById('nav-track').addEventListener('click', () => switchView('tracker'));
    document.getElementById('nav-edit').addEventListener('click', () => switchView('editor'));
    document.getElementById('btn-reset-day').addEventListener('click', resetDaily);
    document.getElementById('btn-reset-db').addEventListener('click', resetDefaults);
}

// Start App
init();
