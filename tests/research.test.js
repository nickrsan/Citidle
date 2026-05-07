import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ResearchSystem } from '../src/research.js';

describe('ResearchSystem', () => {
    test('initial state', () => {
        const rs = new ResearchSystem();
        assert.strictEqual(rs.getLevel('unlock_residential'), 1, 'Residential should be unlocked by default');
        assert.strictEqual(rs.getLevel('unlock_commercial'), 0);
        assert.strictEqual(rs.vars.unlock_residential, true);
        assert.strictEqual(rs.vars.unlock_commercial, false);
    });

    test('getCost increases with level', () => {
        const rs = new ResearchSystem();
        const cost0 = rs.getCost('unlock_commercial');
        assert.ok(cost0 >= 0);
        
        // Purchase it
        const res = rs.purchase('unlock_commercial', 1000);
        assert.strictEqual(res.success, true);
        assert.strictEqual(rs.getLevel('unlock_commercial'), 1);
        
        const cost1 = rs.getCost('unlock_commercial');
        // Since maxLevel for unlock_commercial is 1, it should be Infinity now
        assert.strictEqual(cost1, Infinity);
    });

    test('canResearch respects prerequisites', () => {
        const rs = new ResearchSystem();
        // unlock_industrial requires unlock_commercial: 1
        assert.strictEqual(rs.canResearch('unlock_industrial'), false, 'Should not be able to research industrial without commercial');
        
        rs.purchase('unlock_commercial', 1000);
        assert.strictEqual(rs.canResearch('unlock_industrial'), true, 'Should be able to research industrial after commercial');
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
        const cost = rs.getCost('unlock_commercial');
        const res = rs.purchase('unlock_commercial', cost - 1);
        assert.strictEqual(res.success, false, 'Purchase should fail with insufficient money');
        assert.strictEqual(rs.getLevel('unlock_commercial'), 0);
    });
});
