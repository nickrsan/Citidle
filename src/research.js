import { RESEARCH_TREE, DEFAULT_VARS } from './config.js';

/**
 * Manages the research tree: levels, costs, prerequisites, and computed variables.
 */
export class ResearchSystem {
    constructor() {
        // Current level for each research item (keyed by id)
        this.levels = {};
        for (const item of RESEARCH_TREE) {
            this.levels[item.id] = 0;
        }

        // Cached computed variables
        this.vars = { ...DEFAULT_VARS };
        this._recompute();
    }

    /** Get the research item definition by id. */
    getItem(id) {
        return RESEARCH_TREE.find(r => r.id === id);
    }

    /** Current level of a research item. */
    getLevel(id) {
        return this.levels[id] || 0;
    }

    /** Cost to purchase the next level of a research item. */
    getCost(id) {
        const item = this.getItem(id);
        if (!item) return Infinity;
        const level = this.getLevel(id);
        if (level >= item.maxLevel) return Infinity;
        return Math.floor(item.baseCost * Math.pow(item.costScale, level));
    }

    /** Check if prerequisites are met for the next level of a research item. */
    canResearch(id) {
        const item = this.getItem(id);
        if (!item) return false;
        if (this.getLevel(id) >= item.maxLevel) return false;
        for (const [reqId, reqLevel] of Object.entries(item.requires)) {
            if (this.getLevel(reqId) < reqLevel) return false;
        }
        return true;
    }

    /**
     * Purchase the next level of a research item.
     * @param {string} id
     * @param {number} money — player's current money
     * @returns {{ success: boolean, cost: number, newLevel: number }}
     */
    purchase(id, money) {
        if (!this.canResearch(id)) return { success: false, cost: 0, newLevel: 0 };
        const cost = this.getCost(id);
        if (money < cost) return { success: false, cost, newLevel: 0 };
        this.levels[id]++;
        this._recompute();
        return { success: true, cost, newLevel: this.levels[id] };
    }

    /** Recompute all research variables from current levels. */
    _recompute() {
        // Start from defaults
        const v = { ...DEFAULT_VARS };

        for (const item of RESEARCH_TREE) {
            const level = this.getLevel(item.id);
            if (level === 0) continue;

            for (let l = 0; l < level; l++) {
                for (const effect of item.effects) {
                    switch (effect.operation) {
                        case 'set':
                            v[effect.variable] = effect.value;
                            break;
                        case 'add':
                            v[effect.variable] += effect.value;
                            break;
                        case 'multiply':
                            v[effect.variable] *= effect.value;
                            break;
                    }
                }
            }
        }

        this.vars = v;
    }

    /** Get all research items grouped by category for display. */
    getGrouped() {
        const groups = {};
        for (const item of RESEARCH_TREE) {
            const cat = item.category || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push({
                ...item,
                currentLevel: this.getLevel(item.id),
                nextCost: this.getCost(item.id),
                available: this.canResearch(item.id),
            });
        }
        return groups;
    }
}
