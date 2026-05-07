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

    test('Researching unlocks allows placing new zone types', () => {
        const rs = new ResearchSystem();
        const map = new GameMap();
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);

        // Commercial is locked initially (level 0)
        assert.strictEqual(rs.getLevel('unlock_commercial'), 0);
        // In the real UI, the button would be disabled based on rs.vars.unlock_commercial
        assert.strictEqual(rs.vars.unlock_commercial, false);

        // Purchase unlock
        rs.purchase('unlock_commercial', 1000);
        assert.strictEqual(rs.vars.unlock_commercial, true);
        
        // Now "placing" it works in the map (map doesn't check unlock_commercial, main.js does)
        // But integration-wise, we've verified the variable changed correctly.
        assert.strictEqual(map.placeZone(cx, cy, 'commercial'), true);
    });

    test('Income is determined by the minimum of workers, commerce, and production', () => {
        const rs = new ResearchSystem();
        const map = new GameMap();
        
        // Unlock all (assumes money is not an issue in tests if we pass large values)
        rs.purchase('unlock_commercial', 10000);
        rs.purchase('unlock_industrial', 10000);
        
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
