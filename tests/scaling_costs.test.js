import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GameMap } from '../src/grid.js';
import { ZONE_TYPES } from '../src/config.js';

describe('Zone Placement Scaling Costs', () => {
    test('getZonePlacementCost increases as zones are placed', () => {
        const map = new GameMap();
        const vars = { placement_cost_multiplier: 1 };
        
        const initialCost = map.getZonePlacementCost('residential', vars);
        assert.strictEqual(initialCost, ZONE_TYPES.residential.placementCost);
        
        // Place a zone
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);
        map.placeZone(cx, cy, 'residential');
        
        const secondCost = map.getZonePlacementCost('residential', vars);
        assert.ok(secondCost > initialCost, `Cost should increase after placement (was ${initialCost}, now ${secondCost})`);
        
        const expectedSecondCost = Math.floor(ZONE_TYPES.residential.placementCost * ZONE_TYPES.residential.costScale);
        assert.strictEqual(secondCost, expectedSecondCost);
    });

    test('getZonePlacementCost respects research multiplier', () => {
        const map = new GameMap();
        const vars1 = { placement_cost_multiplier: 1 };
        const vars2 = { placement_cost_multiplier: 0.5 }; // 50% discount
        
        const cost1 = map.getZonePlacementCost('residential', vars1);
        const cost2 = map.getZonePlacementCost('residential', vars2);
        
        assert.strictEqual(cost2, Math.floor(cost1 * 0.5), 'Research multiplier should be applied to zone cost');
    });

    test('getZonePlacementCost scales exponentially', () => {
        const map = new GameMap();
        const vars = { placement_cost_multiplier: 1 };
        const baseCost = ZONE_TYPES.residential.placementCost;
        const scale = ZONE_TYPES.residential.costScale;
        
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);
        
        // Place 5 zones
        for (let i = 0; i < 5; i++) {
            map.placeZone(cx + i, cy, 'residential');
        }
        
        const costAfter5 = map.getZonePlacementCost('residential', vars);
        const expectedCost = Math.floor(baseCost * Math.pow(scale, 5));
        assert.strictEqual(costAfter5, expectedCost);
    });
});
