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
        // Initially, (0,0) is far outside the usable area (which is around 250,250)
        const lockedX = 0, lockedY = 0;
        
        assert.strictEqual(map.isUsable(lockedX, lockedY), false, 'Corner should be locked initially');
        assert.strictEqual(map.placeZone(lockedX, lockedY, 'residential'), false, 'Should not be able to place in locked zone');
        
        // "UI Interaction": Expand grid enough times to reach (0,0)
        // From 245 to 0 with 5 per expansion = 49 expansions.
        for (let i = 0; i < 50; i++) {
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
        // Ensure they are within the usable area (initially 10x10 around 250,250)
        const cx = map.usableMinX;
        const cy = map.usableMinY;
        
        for (let i = 0; i < 10; i++) {
            // Distribute across the 10x10 area to avoid going out of bounds
            map.placeZone(cx + (i % 5), cy + Math.floor(i / 5), 'residential');
        }
        for (let i = 0; i < 5; i++) {
            map.placeZone(cx + 5, cy + i, 'commercial');
        }
        for (let i = 0; i < 2; i++) {
            map.placeZone(cx + 6, cy + i, 'industrial');
        }
        
        const out = map.computeOutput(rs.vars);
        // workers=10, commerce=5, production=2
        assert.strictEqual(out.workers, 10, `Expected 10 workers, got ${out.workers}`);
        assert.strictEqual(out.commerce, 5, `Expected 5 commerce, got ${out.commerce}`);
        assert.strictEqual(out.production, 2, `Expected 2 production, got ${out.production}`);
        
        const minFactor = Math.min(out.workers, out.commerce, out.production);
        assert.strictEqual(minFactor, 2, 'Minimum output should be 2 (production)');
    });
});
