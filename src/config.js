// ── Zone type definitions ──
export const ZONE_TYPES = {
    residential: {
        id: 'residential',
        label: 'Residential',
        emoji: '🏠',
        // Base color (HSL) — hue, saturation %, lightness %
        baseColor: { h: 120, s: 45, l: 55 },   // green
        placementCost: 50,
        costScale: 1.5,
        // Per-cell base output
        baseOutput: { workers: 1, commerce: 0, production: 0 },
        // Spread probabilities: when this zone spreads, what does neighbor become?
        spreadWeights: { residential: 0.95, commercial: 0.04, industrial: 0.01 },
    },
    commercial: {
        id: 'commercial',
        label: 'Commercial',
        emoji: '🏪',
        baseColor: { h: 210, s: 55, l: 55 },   // blue
        placementCost: 75,
        costScale: 2,
        baseOutput: { workers: 0, commerce: 1, production: 0 },
        spreadWeights: { commercial: 0.95, residential: 0.025, industrial: 0.025 },
    },
    industrial: {
        id: 'industrial',
        label: 'Industrial',
        emoji: '🏭',
        baseColor: { h: 35, s: 60, l: 50 },    // orange/amber
        placementCost: 100,
        costScale: 2,
        baseOutput: { workers: 0, commerce: 0, production: 1 },
        spreadWeights: { industrial: 0.95, commercial: 0.04, residential: 0.01 },
    },
};

// ── Grid settings ──
export const GRID = {
    width: 50,
    height: 50,
    cellSize: 32,           // logical pixel size of one cell
    initialUsableSize: 10,  // initial usable area (centered square)
    tileExpansionAmount: 5,  // cells to expand in each direction per purchase
    tileBaseCost: 1000000,
    tileCostScale: 5,
};

// ── Isometric settings ──
export const ISO = {
    tileWidth: 32,
    tileHeight: 16,         // half of tileWidth for standard 2:1 iso
    maxBuildingHeight: 40,   // max extrusion in pixels for densified cells
};

// ── Economy ──
export const ECONOMY = {
    baseTickMs: 100,         // starting tick interval
    incomePerOutput: 1,      // $ per unit of min(workers, commerce, production)
    startingMoney: 500,
};

// ── Spread mechanics ──
export const SPREAD = {
    baseChance: 0.0000008,       // base probability per neighbor per tick that a zone spreads
};

// ── Animation settings ──
export const ANIMATIONS = {
    commercialShipChance: 0.005,  // chance per commercial cell per tick to show $ animation
    animationDuration: 1200,      // ms for floating animations
    animationRiseSpeed: 30,       // pixels per second the animation floats up
};

export const CATCHUP_SHOW_DIALOG_TICKS = 1000;  // if we are behind by more than this many ticks, show catchup dialog

// ── Research tree (JSON-style config) ──
// Each item: id, name, description, maxLevel, baseCost, costScale,
//   requires (prerequisite research ids with min level),
//   effects: array of { variable, operation, value } per level
export const RESEARCH_TREE = [
    // ── Spread Rate ──
    {
        id: 'spread_rate',
        name: 'Urban Sprawl',
        description: 'Increase zone spread chance by 10% per level.',
        maxLevel: 50,
        baseCost: 500,
        costScale: 2,
        requires: {},
        effects: [{ variable: 'spread_multiplier', operation: 'multiply', value: 1.1 }],
        category: 'spread',
    },
    {
        id: 'spread_rate2',
        name: 'Exurban Car Culture',
        description: 'Increase zone spread chance by 5x per level.',
        maxLevel: 6,
        baseCost: 10000,
        costScale: 500,
        requires: {'spread_rate': 3},
        effects: [{ variable: 'spread_multiplier', operation: 'multiply', value: 5 }],
        category: 'spread',
    },


    // ── Density ──
    {
        id: 'density_residential',
        name: 'Residential Density',
        description: 'Each residential cell produces +1 worker per level.',
        maxLevel: 20,
        baseCost: 600,
        costScale: 5,
        requires: {},
        effects: [{ variable: 'density_residential', operation: 'add', value: 1 }],
        category: 'density',
    },
    {
        id: 'density_commercial',
        name: 'Commercial Density',
        description: 'Each commercial cell produces +1 commerce per level.',
        maxLevel: 20,
        baseCost: 800,
        costScale: 5,
        requires: {},
        effects: [{ variable: 'density_commercial', operation: 'add', value: 1 }],
        category: 'density',
    },
    {
        id: 'density_industrial',
        name: 'Industrial Density',
        description: 'Each industrial cell produces +1 production per level.',
        maxLevel: 20,
        baseCost: 1000,
        costScale: 5,
        requires: {},
        effects: [{ variable: 'density_industrial', operation: 'add', value: 1 }],
        category: 'density',
    },
    {
        id: 'neighbor_densify_residential',
        name: 'High Rise Housing',
        description: 'Residential cells are 25% more likely to densify per neighboring residential cell per level.',
        maxLevel: 10,
        baseCost: 750,
        costScale: 8,
        requires: { density_residential: 2 },
        effects: [{ variable: 'neighbor_densify_residential', operation: 'add', value: 0.25 }],
        category: 'density',
    },
    {
        id: 'neighbor_densify_commercial',
        name: 'Commercial Clusters',
        description: 'Commercial cells are 25% more likely to densify per neighboring commercial cell per level.',
        maxLevel: 10,
        baseCost: 1000,
        costScale: 8,
        requires: { density_commercial: 2 },
        effects: [{ variable: 'neighbor_densify_commercial', operation: 'add', value: 0.25 }],
        category: 'density',
    },
    {
        id: 'neighbor_densify_industrial',
        name: 'Industrial Parks',
        description: 'Industrial cells are 25% more likely to densify per neighboring industrial cell per level.',
        maxLevel: 10,
        baseCost: 2000,
        costScale: 8,
        requires: { density_industrial: 2 },
        effects: [{ variable: 'neighbor_densify_industrial', operation: 'add', value: 0.25 }],
        category: 'density',
    },

    // ── Efficiency ──
    {
        id: 'efficiency_residential',
        name: 'Residential Efficiency',
        description: 'Residential output +10% per level.',
        maxLevel: 20,
        baseCost: 5000,
        costScale: 10,
        requires: { density_residential: 2 },
        effects: [{ variable: 'efficiency_residential', operation: 'multiply', value: 1.1 }],
        category: 'efficiency',
    },
    {
        id: 'efficiency_commercial',
        name: 'Commercial Efficiency',
        description: 'Commercial output +10% per level.',
        maxLevel: 20,
        baseCost: 6000,
        costScale: 10,
        requires: { density_commercial: 2 },
        effects: [{ variable: 'efficiency_commercial', operation: 'multiply', value: 1.11 }],
        category: 'efficiency',
    },
    {
        id: 'efficiency_industrial',
        name: 'Industrial Efficiency',
        description: 'Industrial output +10% per level.',
        maxLevel: 20,
        baseCost: 7500,
        costScale: 10,
        requires: { density_industrial: 2 },
        effects: [{ variable: 'efficiency_industrial', operation: 'multiply', value: 1.1 }],
        category: 'efficiency',
    },

    // ── Cost Reduction ──
    {
        id: 'cost_reduction',
        name: 'Community Meeting Facilitation',
        description: 'Reduce zone placement cost by 10% per level.',
        maxLevel: 20,
        baseCost: 120,
        costScale: 5,
        requires: {},
        effects: [{ variable: 'placement_cost_multiplier', operation: 'multiply', value: 0.9 }],
        category: 'economy',
    },

    // ── Tick Speed ──
    {
        id: 'tick_speed',
        name: 'Permit Streamlining',
        description: 'Reduce tick interval by 5% per level (faster economy).',
        maxLevel: 10,
        baseCost: 300,
        costScale: 1000,
        requires: {},
        effects: [{ variable: 'tick_speed_multiplier', operation: 'multiply', value: 0.95 }],
        category: 'economy',
    },

    // ── Income multiplier ──
    {
        id: 'income_multiplier',
        name: 'Trade Agreements',
        description: 'Increase income per output by 20% per level.',
        maxLevel: 20,
        baseCost: 200,
        costScale: 10,
        requires: {},
        effects: [{ variable: 'income_multiplier', operation: 'multiply', value: 1.2 }],
        category: 'economy',
    },
];

// Default research variable values (before any research is applied)
export const DEFAULT_VARS = {
    unlock_residential: true,
    unlock_commercial: true,
    unlock_industrial: true,
    spread_multiplier: 1.5,
    density_residential: 0,
    density_commercial: 0,
    density_industrial: 0,
    neighbor_densify_residential: 0,
    neighbor_densify_commercial: 0,
    neighbor_densify_industrial: 0,
    efficiency_residential: 1.0,
    efficiency_commercial: 1.0,
    efficiency_industrial: 1.0,
    placement_cost_multiplier: 1,
    tick_speed_multiplier: 1,
    income_multiplier: 1,
};
