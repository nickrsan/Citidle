import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ResearchSystem } from '../src/research.js';
import { GameMap } from '../src/grid.js';

describe('Integration / UI Interaction consequences', () => {
    test('Researching efficiency increases income from existing zones', () => {
        const rs = new ResearchSystem();
        const map = new GameMap();
        
        // Purchase prerequisites for efficiency_residential
        rs.purchase('density_residential', 10000);
        rs.purchase('density_residential', 10000);
        
        // Setup: Place multiple residential zones to avoid floor() issues
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);
        for (let i = 0; i < 10; i++) {
            map.placeZone(cx + i, cy, 'residential');
        }
        
        // Calculate initial output
        const initialOut = map.computeOutput(rs.vars);
        
        // "UI Interaction": Purchase Residential Efficiency (efficiency_residential)
        const purchaseResult = rs.purchase('efficiency_residential', 10000);
        assert.strictEqual(purchaseResult.success, true, 'Research purchase should succeed');
        
        // Verify output increased
        const finalOut = map.computeOutput(rs.vars);
        assert.ok(finalOut.workers > initialOut.workers, `Workers output should increase after research (was ${initialOut.workers}, now ${finalOut.workers})`);
    });

    test('Expanding grid allows placement in previously locked tiles', () => {
        const map = new GameMap();
        const lockedX = 0, lockedY = 0;
        
        assert.strictEqual(map.isUsable(lockedX, lockedY), false, 'Corner should be locked initially');
        assert.strictEqual(map.placeZone(lockedX, lockedY, 'residential'), false, 'Should not be able to place in locked zone');
        
        // "UI Interaction": Expand grid multiple times to reach (0,0)
        // Each expansion adds 5 tiles in each direction.
        // Center is (50,50), initial size is 20 (so 40 to 59).
        // To reach 0, we need to cover 40 tiles, which is 8 expansions.
        for (let i = 0; i < 10; i++) {
            map.expandUsableArea();
        }
        
        assert.strictEqual(map.isUsable(lockedX, lockedY), true, 'Corner should be usable after expansion');
        assert.strictEqual(map.placeZone(lockedX, lockedY, 'residential'), true, 'Should be able to place in newly unlocked zone');
    });

    test('Zoning types are unlocked by default', () => {
        const rs = new ResearchSystem();
        const map = new GameMap();
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);

        // All zoning types should be unlocked initially
        assert.strictEqual(rs.vars.unlock_residential, true);
        assert.strictEqual(rs.vars.unlock_commercial, true);
        assert.strictEqual(rs.vars.unlock_industrial, true);
        
        // Should be able to place all zone types immediately
        assert.strictEqual(map.placeZone(cx, cy, 'residential'), true);
        assert.strictEqual(map.placeZone(cx + 1, cy, 'commercial'), true);
        assert.strictEqual(map.placeZone(cx + 2, cy, 'industrial'), true);
    });

    test('Income is determined by the minimum of workers, commerce, and production', () => {
        const rs = new ResearchSystem();
        const map = new GameMap();
        
        // Place 10 residential, 5 commercial, 2 industrial
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);
        for (let i = 0; i < 10; i++) map.placeZone(cx + i, cy, 'residential');
        for (let i = 0; i < 5; i++) map.placeZone(cx, cy + i + 1, 'commercial');
        for (let i = 0; i < 2; i++) map.placeZone(cx + 1, cy + i + 1, 'industrial');
        
        const out = map.computeOutput(rs.vars);
        // workers=10, commerce=5, production=2 (base output is 1 each)
        assert.strictEqual(out.workers, 10);
        assert.strictEqual(out.commerce, 5);
        assert.strictEqual(out.production, 2);
        
        const minFactor = Math.min(out.workers, out.commerce, out.production);
        assert.strictEqual(minFactor, 2, 'Minimum output should be 2 (production)');
    });
});
