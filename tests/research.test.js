import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ResearchSystem } from '../src/research.js';

describe('ResearchSystem', () => {
    test('initial state', () => {
        const rs = new ResearchSystem();
        assert.strictEqual(rs.vars.unlock_residential, true, 'Residential should be unlocked by default');
        assert.strictEqual(rs.vars.unlock_commercial, true);
        assert.strictEqual(rs.vars.unlock_industrial, true);
    });

    test('getCost increases with level', () => {
        const rs = new ResearchSystem();
        const cost0 = rs.getCost('spread_rate');
        assert.ok(cost0 > 0);
        
        // Purchase it
        const res = rs.purchase('spread_rate', 1000);
        assert.strictEqual(res.success, true);
        assert.strictEqual(rs.getLevel('spread_rate'), 1);
        
        const cost1 = rs.getCost('spread_rate');
        assert.ok(cost1 > cost0, 'Cost should increase with level');
    });

    test('canResearch respects prerequisites', () => {
        const rs = new ResearchSystem();
        // efficiency_residential requires density_residential: 2
        assert.strictEqual(rs.canResearch('efficiency_residential'), false, 'Should not be able to research efficiency without density');
        
        rs.purchase('density_residential', 1000);
        assert.strictEqual(rs.canResearch('efficiency_residential'), false, 'Still need one more level of density');
        
        rs.purchase('density_residential', 1000);
        assert.strictEqual(rs.canResearch('efficiency_residential'), true, 'Should be able to research efficiency after level 2 density');
    });

    test('purchase updates variables', () => {
        const rs = new ResearchSystem();
        
        // Purchase prerequisites for efficiency_residential
        rs.purchase('density_residential', 10000);
        rs.purchase('density_residential', 10000);
        
        const initialEfficiency = rs.vars.efficiency_residential;
        
        // Purchase residential efficiency upgrade
        const res = rs.purchase('efficiency_residential', 10000);
        assert.strictEqual(res.success, true, 'Should be able to purchase efficiency after density');
        assert.ok(rs.vars.efficiency_residential > initialEfficiency, 'Efficiency should increase after research');
    });

    test('insufficient funds', () => {
        const rs = new ResearchSystem();
        const cost = rs.getCost('density_residential');
        const res = rs.purchase('density_residential', cost - 1);
        assert.strictEqual(res.success, false, 'Purchase should fail with insufficient money');
        assert.strictEqual(rs.getLevel('density_residential'), 0);
    });
});
