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

        // Usable bounds (centered square initially)
        const half = Math.floor(GRID.initialUsableSize / 2);
        const cx = Math.floor(width / 2);
        const cy = Math.floor(height / 2);
        this.usableMinX = cx - half;
        this.usableMinY = cy - half;
        this.usableMaxX = cx + half - 1;
        this.usableMaxY = cy + half - 1;
        this.tilePurchaseCount = 0;
    }

    placeStartingZones(){
        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);

        this.placeZone(cx, cy, 'residential');
        this.placeZone(cx-1, cy, 'residential');
        this.placeZone(cx + 3, cy, 'commercial');
        this.placeZone(cx - 3, cy + 3, 'industrial');

    }

    save(){
        return {
            "cells": this.cells,
            "usableMinX": this.usableMinX,
            "usableMinY": this.usableMinY,
            "usableMaxX": this.usableMaxX,
            "usableMaxY": this.usableMaxY,
            "tilePurchaseCount": this.tilePurchaseCount
        };
    }

    loadSave(data){
        this.cells = data.cells;
        this.usableMinX = data.usableMinX;
        this.usableMinY = data.usableMinY;
        this.usableMaxX = data.usableMaxX;
        this.usableMaxY = data.usableMaxY;
        this.tilePurchaseCount = data.tilePurchaseCount;
    }

    /** Check if a cell is within the usable (unlocked) area. */
    isUsable(x, y) {
        return x >= this.usableMinX && x <= this.usableMaxX &&
               y >= this.usableMinY && y <= this.usableMaxY;
    }

    /** Expand the usable area by the configured amount in each direction. */
    expandUsableArea() {
        const amt = GRID.tileExpansionAmount;
        this.usableMinX = Math.max(0, this.usableMinX - amt);
        this.usableMinY = Math.max(0, this.usableMinY - amt);
        this.usableMaxX = Math.min(this.width - 1, this.usableMaxX + amt);
        this.usableMaxY = Math.min(this.height - 1, this.usableMaxY + amt);
        this.tilePurchaseCount++;
    }

    /** Get the count of zones of a specific type. */
    getZoneCount(zoneType) {
        let count = 0;
        for (let i = 0; i < this.cells.length; i++) {
            if (this.cells[i].zone === zoneType) count++;
        }
        return count;
    }

    /** Get the cost for the next zone placement. */
    getZonePlacementCost(zoneType, researchVars = {}) {
        const zt = ZONE_TYPES[zoneType];
        if (!zt) return Infinity;
        const count = this.getZoneCount(zoneType);
        const multiplier = researchVars.placement_cost_multiplier || 1.0;
        return Math.floor(zt.placementCost * Math.pow(zt.costScale, count) * multiplier);
    }

    /** Get the cost for the next tile expansion. */
    getTileExpansionCost() {
        return Math.floor(GRID.tileBaseCost * Math.pow(GRID.tileCostScale, this.tilePurchaseCount));
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
        if (!this.isUsable(x, y)) return false;
        cell.zone = zoneType;
        cell.density = 1;
        cell.age = 0;
        return true;
    }

    /**
     * Count same-type neighbors for a cell.
     * @param {number} x
     * @param {number} y
     * @param {string} zoneType
     * @returns {number}
     */
    countSameNeighbors(x, y, zoneType) {
        let count = 0;
        for (const [dx, dy] of NEIGHBORS) {
            const neighbor = this.getCell(x + dx, y + dy);
            if (neighbor && neighbor.zone === zoneType) count++;
        }
        return count;
    }

    /**
     * Run one tick of zone spreading.
     * @param {number} spreadMultiplier — from research
     */
    tickSpread(spreadMultiplier = 1.0) {
        const spreadChance = SPREAD.baseChance * spreadMultiplier;
        const newZones = []; // collect changes to apply atomically

        for (let y = this.usableMinY; y <= this.usableMaxY; y++) {
            for (let x = this.usableMinX; x <= this.usableMaxX; x++) {
                const cell = this.getCell(x, y);
                if (!cell.zone) continue;

                cell.age++;

                // Try to spread to each empty neighbor
                for (const [dx, dy] of NEIGHBORS) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (!this.isUsable(nx, ny)) continue;
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
     * Neighbor bonus: if research provides neighbor_densify_<type>, each same-type
     * neighbor increases the densification chance by that fraction.
     * @param {object} vars — current research variables
     * @returns {Array<{x: number, y: number, zone: string}>} — cells that densified this tick
     */
    tickDensify(vars = {}) {
        const baseDensifyChance = 0.0001; // per cell per tick
        const maxDensity = 10;
        const densified = [];

        for (let y = this.usableMinY; y <= this.usableMaxY; y++) {
            for (let x = this.usableMinX; x <= this.usableMaxX; x++) {
                const cell = this.getCell(x, y);
                if (!cell.zone) continue;
                if (cell.density >= maxDensity) continue;

                // Calculate neighbor bonus
                const neighborBonus = vars[`neighbor_densify_${cell.zone}`] || 0;
                let chance = baseDensifyChance;
                if (neighborBonus > 0) {
                    const sameNeighbors = this.countSameNeighbors(x, y, cell.zone);
                    chance *= (1 + neighborBonus * sameNeighbors);
                }

                if (Math.random() < chance) {
                    cell.density += 1;
                    densified.push({ x, y, zone: cell.zone });
                }
            }
        }

        return densified;
    }
}
