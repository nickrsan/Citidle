import { ISO, ECONOMY, ZONE_TYPES, GRID, ANIMATIONS, RESEARCH_TREE } from './config.js';
import { GameMap } from './grid.js';
import { ResearchSystem } from './research.js';
import { Renderer } from './renderer.js';

// ── Game State ──
const state = {
    money: ECONOMY.startingMoney,
    placingZone: null,          // null | 'residential' | 'commercial' | 'industrial'
    lastOutput: { workers: 0, commerce: 0, production: 0, counts: {} },
    incomePerTick: 0,
    tickCount: 0,
};

// ── Systems ──
const map = new GameMap();
const research = new ResearchSystem();
const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);

function centerCamera() {
    const centerX = (map.usableMinX + map.usableMaxX + 1) / 2;
    const centerY = (map.usableMinY + map.usableMaxY + 1) / 2;
    
    // We want grid (centerX, centerY) to be at screen center (screenW/2, screenH/2)
    // screenX = (gx - gy) * (tw / 2) + camX + screenW / 2
    // screenY = (gx + gy) * (th / 2) + camY + screenH / 4
    
    // Setting screenX = screenW / 2:
    // 0 = (centerX - centerY) * (tw / 2) + camX
    // camX = -(centerX - centerY) * (tw / 2)
    
    // Setting screenY = screenH / 2:
    // screenH / 2 = (centerX + centerY) * (th / 2) + camY + screenH / 4
    // camY = screenH / 4 - (centerX + centerY) * (th / 2)
    
    const tw = ISO.tileWidth * renderer.zoom;
    const th = ISO.tileHeight * renderer.zoom;
    
    renderer.camX = -(centerX - centerY) * (tw / 2);
    renderer.camY = (renderer.screenH / 4) - (centerX + centerY) * (th / 2);
}

// ── DOM references ──
const dom = {
    money: document.getElementById('money-display'),
    pop: document.getElementById('population-display'),
    workers: document.getElementById('workers-display'),
    commerce: document.getElementById('commerce-display'),
    output: document.getElementById('output-display'),
    tick: document.getElementById('tick-display'),
    btnRes: document.getElementById('btn-residential'),
    btnCom: document.getElementById('btn-commercial'),
    btnInd: document.getElementById('btn-industrial'),
    btnTiles: document.getElementById('btn-tiles'),
    btnResearch: document.getElementById('btn-research'),
    btnZoomReset: document.getElementById('btn-zoom-reset'),
    btnHelp: document.getElementById('btn-help'),
    researchPanel: document.getElementById('research-panel'),
    researchContent: document.getElementById('research-content'),
    researchSvg: document.getElementById('research-svg'),
    closeResearch: document.getElementById('btn-close-research'),
    helpPanel: document.getElementById('help-panel'),
    closeHelp: document.getElementById('btn-close-help'),
    toastContainer: document.getElementById('toast-container'),
};

// ── Helpers ──
function formatMoney(n) {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${Math.floor(n)}`;
}

function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    dom.toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function getTickMs() {
    return Math.max(20, Math.floor(ECONOMY.baseTickMs * research.vars.tick_speed_multiplier));
}

function getPlacementCost(zoneType) {
    return map.getZonePlacementCost(zoneType, research.vars);
}

// ── Zone Placement Buttons ──
function updateZoneButtons() {
    const vars = research.vars;
    const zones = [
        { btn: dom.btnRes, type: 'residential', unlocked: vars.unlock_residential },
        { btn: dom.btnCom, type: 'commercial', unlocked: vars.unlock_commercial },
        { btn: dom.btnInd, type: 'industrial', unlocked: vars.unlock_industrial },
    ];
    for (const { btn, type, unlocked } of zones) {
        btn.classList.toggle('locked', !unlocked);
        btn.classList.toggle('active', state.placingZone === type);
        const cost = getPlacementCost(type);
        const emoji = ZONE_TYPES[type].emoji;
        const label = ZONE_TYPES[type].label;
        btn.textContent = `${emoji} ${label} (${formatMoney(cost)})`;
        btn.title = unlocked ? `Place ${type} zone (${formatMoney(cost)})` : 'Locked — research required';
    }
    updateTileButton();
}

function updateTileButton() {
    const cost = map.getTileExpansionCost();
    const size = (map.usableMaxX - map.usableMinX + 1);
    dom.btnTiles.textContent = `🗺 Expand (${formatMoney(cost)})`;
    dom.btnTiles.title = `Expand usable area (current: ${size}×${size})`;
}

function selectZone(type) {
    const vars = research.vars;
    const key = `unlock_${type}`;
    if (!vars[key]) {
        showToast(`🔒 Research "${type}" zoning first!`);
        return;
    }
    state.placingZone = state.placingZone === type ? null : type;
    canvas.classList.toggle('placing', !!state.placingZone);
    updateZoneButtons();
}

dom.btnRes.addEventListener('click', () => selectZone('residential'));
dom.btnCom.addEventListener('click', () => selectZone('commercial'));
dom.btnInd.addEventListener('click', () => selectZone('industrial'));

// ── Tile Purchase ──
dom.btnTiles.addEventListener('click', () => {
    const cost = map.getTileExpansionCost();
    if (state.money < cost) {
        showToast('💸 Not enough money to expand!');
        return;
    }
    state.money -= cost;
    map.expandUsableArea();
    const size = (map.usableMaxX - map.usableMinX + 1);
    showToast(`🗺 Expanded to ${size}×${size} tiles!`);
    updateTileButton();
    updateHUD();
});

// ── Research Panel ──
function renderResearchPanel() {
    const grouped = research.getGrouped();
    let html = '';
    const categoryLabels = {
        unlock: '🔓 Unlocks',
        spread: '🌱 Spread',
        density: '🏗 Density',
        efficiency: '⚡ Efficiency',
        economy: '💰 Economy',
    };
    for (const [cat, items] of Object.entries(grouped)) {
        html += `<div class="research-category-label">${categoryLabels[cat] || cat}</div>`;
        for (const item of items) {
            const maxed = item.currentLevel >= item.maxLevel;
            const affordable = !maxed && item.available && state.money >= item.nextCost;
            let cls = 'research-item';
            if (maxed) cls += ' maxed';
            else if (!item.available) cls += ' locked';
            else if (affordable) cls += ' affordable';
            else if (!maxed && item.available && state.money < item.nextCost) cls += ' unaffordable';

            // Prerequisites text
            let reqHtml = '';
            if (!maxed && !research.canResearch(item.id) && Object.keys(item.requires).length > 0) {
                const reqs = Object.entries(item.requires).map(([reqId, reqLevel]) => {
                    const reqItem = research.getItem(reqId);
                    return `Requires ${reqItem.name} Level ${reqLevel}`;
                });
                reqHtml = reqs.map(r => `<div class="ri-requires">${r}</div>`).join('');
            }

            // Progress bar
            const progress = (item.currentLevel / item.maxLevel) * 100;
            const progressBar = item.maxLevel > 1 ? `
                <div class="ri-progress-container">
                    <div class="ri-progress-fill" style="width: ${progress}%"></div>
                </div>
            ` : '';

            html += `<div class="${cls}" data-id="${item.id}">
                <div class="ri-name">${item.name}</div>
                <div class="ri-desc">${item.description}</div>
                <div class="ri-level">Level ${item.currentLevel} / ${item.maxLevel}</div>
                ${progressBar}
                ${!maxed ? `<div class="ri-cost">Cost: ${formatMoney(item.nextCost)}</div>` : '<div class="ri-cost" style="color:#8f8">MAX</div>'}
                ${item.effects.map(e => `<div class="ri-effect">${e.variable} ${e.operation} ${e.value}</div>`).join('')}
                ${reqHtml}
            </div>`;
        }
    }
    dom.researchContent.innerHTML = html;

    // Attach click handlers
    dom.researchContent.querySelectorAll('.research-item:not(.maxed):not(.locked)').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.id;
            const result = research.purchase(id, state.money);
            if (result.success) {
                state.money -= result.cost;
                showToast(`🔬 Researched ${research.getItem(id).name} (Lv ${result.newLevel})`);
                renderResearchPanel();
                updateZoneButtons();
                updateHUD();
            } else {
                showToast('💸 Not enough money!');
            }
        });
    });

    updateResearchPanel()

    // Draw prerequisite lines after DOM settles
    // requestAnimationFrame(() => drawResearchLines());
}

function updateResearchPanel() {
    setTimeout(function(){ // make it re-render every 100ms so that as we get more money, the panel updates with available items
        if (!dom.researchPanel.classList.contains('hidden')) {
            updateResearchPanel();
        }
    }, 500);
    // updates the research panel items with classes based on whether they're purchasable now
    const grouped = research.getGrouped();
    for (const [cat, items] of Object.entries(grouped)) {
        for (const item of items) {
            const maxed = item.currentLevel >= item.maxLevel;
            const affordable = !maxed && item.available && state.money >= item.nextCost;
            const el = document.querySelector(`.research-item[data-id="${item.id}"]`);
            if (el) {
                el.classList.toggle('affordable', affordable);
                el.classList.toggle('unaffordable', !affordable);
            }
        }
    }


}

function drawResearchLines() {
    const svg = dom.researchSvg;
    const container = dom.researchPanel;
    if (!svg || !container) return;

    // Clear existing lines
    svg.innerHTML = '';

    // Get container bounds for coordinate offset
    const containerRect = container.getBoundingClientRect();

    // Build map of item elements by id
    const itemEls = {};
    dom.researchContent.querySelectorAll('.research-item').forEach(el => {
        itemEls[el.dataset.id] = el;
    });

    // Size SVG to match scrollable content
    const scrollW = container.scrollWidth;
    const scrollH = container.scrollHeight;
    svg.setAttribute('width', scrollW);
    svg.setAttribute('height', scrollH);
    svg.style.width = scrollW + 'px';
    svg.style.height = scrollH + 'px';

    // Draw lines for each research item to its prerequisites
    for (const item of RESEARCH_TREE) {
        const toEl = itemEls[item.id];
        if (!toEl) continue;

        for (const reqId of Object.keys(item.requires)) {
            const fromEl = itemEls[reqId];
            if (!fromEl) continue;

            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            // Compute positions relative to the scroll container
            const scrollTop = container.scrollTop;
            const scrollLeft = container.scrollLeft;

            const x1 = fromRect.left - containerRect.left + scrollLeft + fromRect.width / 2;
            const y1 = fromRect.top - containerRect.top + scrollTop + fromRect.height / 2;
            const x2 = toRect.left - containerRect.left + scrollLeft + toRect.width / 2;
            const y2 = toRect.top - containerRect.top + scrollTop + toRect.height / 2;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', 'rgba(100, 200, 255, 0.4)');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-dasharray', '4,4');
            svg.appendChild(line);
        }
    }
}

dom.btnResearch.addEventListener('click', () => {
    dom.researchPanel.classList.toggle('hidden');
    if (!dom.researchPanel.classList.contains('hidden')) {
        renderResearchPanel();
    }
});
dom.closeResearch.addEventListener('click', () => dom.researchPanel.classList.add('hidden'));

dom.btnZoomReset.addEventListener('click', () => {
    renderer.zoom = 1.0;
    centerCamera();
});

dom.btnHelp.addEventListener('click', () => dom.helpPanel.classList.toggle('hidden'));
dom.closeHelp.addEventListener('click', () => dom.helpPanel.classList.add('hidden'));

// ── Input: Mouse / Pan / Zoom ──
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let camStartX = 0, camStartY = 0;

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    camStartX = renderer.camX;
    camStartY = renderer.camY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        renderer.camX = camStartX + (e.clientX - dragStartX);
        renderer.camY = camStartY + (e.clientY - dragStartY);
    }
    // Update hover grid position
    const grid = renderer.screenToGrid(e.clientX, e.clientY);
    renderer.hoverGridX = grid.x;
    renderer.hoverGridY = grid.y;
});

canvas.addEventListener('mouseup', (e) => {
    const dx = Math.abs(e.clientX - dragStartX);
    const dy = Math.abs(e.clientY - dragStartY);
    // If barely moved, treat as click
    if (dx < 4 && dy < 4 && state.placingZone) {
        const grid = renderer.screenToGrid(e.clientX, e.clientY);
        tryPlaceZone(grid.x, grid.y);
    }
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const oldZoom = renderer.zoom;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    renderer.zoom = Math.max(0.3, Math.min(4.0, renderer.zoom * factor));
    
    const actualFactor = renderer.zoom / oldZoom;
    
    // Zoom towards mouse:
    // Adjust camX/camY so that the grid point under the mouse stays there.
    // camX_new = px - screenW/2 - (px - screenW/2 - camX_old) * actualFactor
    
    const px = e.clientX;
    const py = e.clientY;
    const offX = px - renderer.screenW / 2;
    const offY = py - renderer.screenH / 4;
    
    renderer.camX = offX - (offX - renderer.camX) * actualFactor;
    renderer.camY = offY - (offY - renderer.camY) * actualFactor;
    
    // Update hover grid position after zoom
    const grid = renderer.screenToGrid(px, py);
    renderer.hoverGridX = grid.x;
    renderer.hoverGridY = grid.y;
}, { passive: false });

// Keyboard panning
const keysDown = new Set();
window.addEventListener('keydown', (e) => keysDown.add(e.key));
window.addEventListener('keyup', (e) => keysDown.delete(e.key));

function handleKeyPan() {
    const speed = 6;
    if (keysDown.has('ArrowLeft') || keysDown.has('a')) renderer.camX += speed;
    if (keysDown.has('ArrowRight') || keysDown.has('d')) renderer.camX -= speed;
    if (keysDown.has('ArrowUp') || keysDown.has('w')) renderer.camY += speed;
    if (keysDown.has('ArrowDown') || keysDown.has('s')) renderer.camY -= speed;
}

// ── Zone Placement ──
function tryPlaceZone(gx, gy) {
    if (!state.placingZone) return;
    if (!map.isUsable(gx, gy)) {
        showToast('🔒 This area is locked — purchase more tiles!');
        return;
    }
    const cost = getPlacementCost(state.placingZone);
    if (state.money < cost) {
        showToast('💸 Not enough money!');
        return;
    }
    if (map.placeZone(gx, gy, state.placingZone)) {
        state.money -= cost;
        showToast(`✅ Placed ${state.placingZone} zone at (${gx}, ${gy})`);
        updateHUD();
        updateZoneButtons();
    } else {
        showToast('❌ Cannot place there.');
    }
}

// ── HUD Update ──
function updateHUD() {
    const o = state.lastOutput;
    const tickMs = getTickMs();
    const ticksPerSec = 1000 / tickMs;
    const incomePerSec = state.incomePerTick * ticksPerSec;

    dom.money.textContent = `💰 ${formatMoney(state.money)}`;
    dom.pop.textContent = `🏠 Pop: ${o.workers}`;
    dom.commerce.textContent = `🏪 Commercial Sales: ${o.commerce}`;
    dom.workers.textContent = `🏭 Ind. Production: ${o.production}`;
    dom.output.textContent = `📊 Output: ${formatMoney(incomePerSec)}/s`;
    dom.tick.textContent = `⏱ Tick: ${tickMs}ms`;
}

// ── Economy Tick ──
function economyTick() {
    const vars = research.vars;

    // Spread zones
    map.tickSpread(vars.spread_multiplier);

    // Densify — returns list of cells that densified
    const densified = map.tickDensify(vars);

    // Add densification animations
    for (const { x, y, zone } of densified) {
        renderer.addDensifyAnim(x, y, zone);
    }

    // Spawn commercial $ animations
    for (let y = map.usableMinY; y <= map.usableMaxY; y++) {
        for (let x = map.usableMinX; x <= map.usableMaxX; x++) {
            const cell = map.getCell(x, y);
            if (cell && cell.zone === 'commercial') {
                if (Math.random() < ANIMATIONS.commercialShipChance) {
                    renderer.addCommercialAnim(x, y);
                }
            }
        }
    }

    // Compute output
    const output = map.computeOutput(vars);
    state.lastOutput = output;

    // Income = min(workers/2, commerce, production) × income multiplier
    // workers/2 because they need to run the factory and the sales
    const minOutput = Math.min(output.workers/2, output.commerce, output.production);
    const income = minOutput * ECONOMY.incomePerOutput * vars.income_multiplier;
    state.incomePerTick = income;
    state.money += income;
    state.tickCount++;
}

// ── Game Loop ──
let lastTickTime = 0;
let lastRenderTime = 0;

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    // Keyboard panning
    handleKeyPan();

    // Economy tick at configured interval
    const tickMs = getTickMs();
    if (timestamp - lastTickTime >= tickMs) {
        economyTick();
        lastTickTime = timestamp;
        // Update HUD every few ticks (not every frame)
        if (state.tickCount % 5 === 0) {
            updateHUD();
            updateZoneButtons();
        }
    }

    // Render at ~60fps
    if (timestamp - lastRenderTime >= 16) {
        renderer.render(map, state.placingZone);
        lastRenderTime = timestamp;
    }
}

// ── Start ──
centerCamera();
updateZoneButtons();
updateHUD();
requestAnimationFrame(gameLoop);
