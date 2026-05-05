import { GRID, SPREAD, ZONE_TYPES } from './config.js';

// Neighbor offsets (8-directional including diagonals)
const NEIGHBORS = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
];

/**
 * Represents a single cell on the grid.
 */
export class Cell {
    constructor() {
        this.zone = null;       // null | 'residential' | 'commercial' | 'industrial'
        this.density = 1;       // density level (starts at 1 when zoned)
        this.age = 0;           // ticks since placed/spread
    }
}

/**
 * The game map — a 2D grid of cells with spreading logic.
 */
export class GameMap {
    constructor(width = GRID.width, height = GRID.height) {
        this.width = width;
        this.height = height;
        this.cells = [];
        for (let i = 0; i < width * height; i++) {
            this.cells.push(new Cell());
        }
    }

    /** Get cell at (x, y). Returns null if out of bounds. */
    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.cells[y * this.width + x];
    }

    /** Place a zone at (x, y). Returns true if successful. */
    placeZone(x, y, zoneType) {
        const cell = this.getCell(x, y);
        if (!cell || cell.zone) return false;
        cell.zone = zoneType;
        cell.density = 1;
        cell.age = 0;
        return true;
    }

    /**
     * Run one tick of zone spreading.
     * @param {number} spreadMultiplier — from research
     */
    tickSpread(spreadMultiplier = 1.0) {
        const spreadChance = SPREAD.baseChance * spreadMultiplier;
        const newZones = []; // collect changes to apply atomically

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.getCell(x, y);
                if (!cell.zone) continue;

                cell.age++;

                // Try to spread to each empty neighbor
                for (const [dx, dy] of NEIGHBORS) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const neighbor = this.getCell(nx, ny);
                    if (!neighbor || neighbor.zone) continue;

                    if (Math.random() < spreadChance) {
                        // Determine what zone type spreads using weights
                        const weights = ZONE_TYPES[cell.zone].spreadWeights;
                        const roll = Math.random();
                        let cumulative = 0;
                        let resultZone = cell.zone;
                        for (const [zt, prob] of Object.entries(weights)) {
                            cumulative += prob;
                            if (roll < cumulative) {
                                resultZone = zt;
                                break;
                            }
                        }
                        newZones.push({ x: nx, y: ny, zone: resultZone });
                    }
                }
            }
        }

        // Apply all spreads (first-come if multiple target same cell)
        const applied = new Set();
        for (const { x, y, zone } of newZones) {
            const key = `${x},${y}`;
            if (applied.has(key)) continue;
            const cell = this.getCell(x, y);
            if (cell.zone) continue; // could have been filled by earlier entry
            cell.zone = zone;
            cell.density = 1;
            cell.age = 0;
            applied.add(key);
        }

        return applied.size; // number of new zones created this tick
    }

    /**
     * Count zones and compute raw totals (before efficiency multipliers).
     * @param {object} vars — current research variables
     * @returns {{ workers, commerce, production, counts }}
     */
    computeOutput(vars) {
        let workers = 0;
        let commerce = 0;
        let production = 0;
        const counts = { residential: 0, commercial: 0, industrial: 0 };

        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            if (!cell.zone) continue;

            counts[cell.zone]++;
            const zt = ZONE_TYPES[cell.zone];
            const densityBonus = cell.density - 1; // base density is 1

            if (cell.zone === 'residential') {
                workers += (zt.baseOutput.workers + vars.density_residential) * (1 + densityBonus * 0.5);
            } else if (cell.zone === 'commercial') {
                commerce += (zt.baseOutput.commerce + vars.density_commercial) * (1 + densityBonus * 0.5);
            } else if (cell.zone === 'industrial') {
                production += (zt.baseOutput.production + vars.density_industrial) * (1 + densityBonus * 0.5);
            }
        }

        // Apply efficiency multipliers
        workers *= vars.efficiency_residential;
        commerce *= vars.efficiency_commercial;
        production *= vars.efficiency_industrial;

        return {
            workers: Math.floor(workers),
            commerce: Math.floor(commerce),
            production: Math.floor(production),
            counts,
        };
    }

    /**
     * Slowly densify existing zones each tick (small chance per cell).
     */
    tickDensify() {
        const densifyChance = 0.001; // per cell per tick
        const maxDensity = 10;
        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            if (!cell.zone) continue;
            if (cell.density >= maxDensity) continue;
            if (Math.random() < densifyChance) {
                cell.density += 1;
            }
        }
    }
}
