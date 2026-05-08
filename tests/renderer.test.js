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

    test('screenToGrid inverts gridToScreen with zoom and offset', () => {
        const canvas = new MockCanvas();
        const renderer = new Renderer(canvas);
        
        renderer.zoom = 2.5;
        renderer.camX = 150;
        renderer.camY = -75;
        
        const gx = 12, gy = 8;
        const screen = renderer.gridToScreen(gx, gy);
        const grid = renderer.screenToGrid(screen.x, screen.y);
        
        assert.strictEqual(grid.x, gx);
        assert.strictEqual(grid.y, gy);
    });

    test('zoom towards a point maintains that point', () => {
        const canvas = new MockCanvas();
        const renderer = new Renderer(canvas);
        
        // Initial state
        renderer.zoom = 1.0;
        renderer.camX = 0;
        renderer.camY = 0;
        
        const px = 400, py = 300; // screen point (center)
        const initialGrid = renderer.screenToGrid(px, py);
        
        // Zoom in by factor 2
        const factor = 2.0;
        const oldZoom = renderer.zoom;
        renderer.zoom *= factor;
        
        // Math from main.js zooming logic:
        const offX = px - renderer.screenW / 2;
        const offY = py - renderer.screenH / 4;
        renderer.camX = offX - (offX - renderer.camX) * factor;
        renderer.camY = offY - (offY - renderer.camY) * factor;
        
        const finalGrid = renderer.screenToGrid(px, py);
        
        assert.strictEqual(finalGrid.x, initialGrid.x, 'Grid X should remain same under mouse');
        assert.strictEqual(finalGrid.y, initialGrid.y, 'Grid Y should remain same under mouse');
    });
});
