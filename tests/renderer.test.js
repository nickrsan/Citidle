import { test, describe, before } from 'node:test';
import assert from 'node:assert';

// Mock Canvas and Context
class MockContext {
    setTransform() {}
    clearRect() {}
    fillRect() {}
    beginPath() {}
    moveTo() {}
    lineTo() {}
    closePath() {}
    fill() {}
    stroke() {}
    fillText() {}
    measureText() { return { width: 10 }; }
}

class MockCanvas {
    constructor() {
        this.width = 800;
        this.height = 600;
        this.ctx = new MockContext();
    }
    getContext() { return this.ctx; }
}

// Mock window and performance
globalThis.window = {
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    addEventListener: () => {}
};
globalThis.performance = {
    now: () => Date.now()
};

// Now import Renderer after mocks are set up
import { Renderer } from '../src/renderer.js';

describe('Renderer Math', () => {
    test('gridToScreen and screenToGrid are inverse', () => {
        const canvas = new MockCanvas();
        const renderer = new Renderer(canvas);
        
        const gx = 10, gy = 5;
        const screen = renderer.gridToScreen(gx, gy);
        const grid = renderer.screenToGrid(screen.x, screen.y);
        
        assert.strictEqual(grid.x, gx);
        assert.strictEqual(grid.y, gy);
    });

    test('camera offset affects gridToScreen', () => {
        const canvas = new MockCanvas();
        const renderer = new Renderer(canvas);
        
        const initial = renderer.gridToScreen(0, 0);
        renderer.camX += 100;
        const shifted = renderer.gridToScreen(0, 0);
        
        assert.strictEqual(shifted.x, initial.x + 100);
    });

    test('zoom affects gridToScreen', () => {
        const canvas = new MockCanvas();
        const renderer = new Renderer(canvas);
        
        const gx = 1, gy = 1;
        const initial = renderer.gridToScreen(gx, gy);
        renderer.zoom = 2.0;
        const zoomed = renderer.gridToScreen(gx, gy);
        
        assert.notStrictEqual(zoomed.y, initial.y);
    });
});
