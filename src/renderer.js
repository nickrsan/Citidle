import { ISO, ZONE_TYPES, GRID } from './config.js';

/**
 * Isometric renderer using HTML Canvas 2D.
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Camera
        this.camX = 0;
        this.camY = 0;
        this.zoom = 1.0;

        // Hover highlight
        this.hoverGridX = -1;
        this.hoverGridY = -1;

        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.screenW = window.innerWidth;
        this.screenH = window.innerHeight;
    }

    /** Convert grid (x, y) to isometric screen coordinates. */
    gridToScreen(gx, gy) {
        const tw = ISO.tileWidth * this.zoom;
        const th = ISO.tileHeight * this.zoom;
        const sx = (gx - gy) * (tw / 2) + this.camX + this.screenW / 2;
        const sy = (gx + gy) * (th / 2) + this.camY + this.screenH / 4;
        return { x: sx, y: sy };
    }

    /** Convert screen (px, py) to grid coordinates. */
    screenToGrid(px, py) {
        const tw = ISO.tileWidth * this.zoom;
        const th = ISO.tileHeight * this.zoom;
        const sx = px - this.camX - this.screenW / 2;
        const sy = py - this.camY - this.screenH / 4;
        const gx = (sx / (tw / 2) + sy / (th / 2)) / 2;
        const gy = (sy / (th / 2) - sx / (tw / 2)) / 2;
        return { x: Math.floor(gx), y: Math.floor(gy) };
    }

    /**
     * Render the full map.
     * @param {import('./grid.js').GameMap} map
     * @param {string|null} placingZone — zone type being placed (for cursor highlight)
     */
    render(map, placingZone) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.screenW, this.screenH);

        // Fill background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.screenW, this.screenH);

        const tw = ISO.tileWidth * this.zoom;
        const th = ISO.tileHeight * this.zoom;
        const maxH = ISO.maxBuildingHeight * this.zoom;

        // Determine visible range (rough culling)
        const margin = 4;
        const topLeft = this.screenToGrid(0, 0);
        const topRight = this.screenToGrid(this.screenW, 0);
        const botLeft = this.screenToGrid(0, this.screenH);
        const botRight = this.screenToGrid(this.screenW, this.screenH);

        const minGX = Math.max(0, Math.min(topLeft.x, botLeft.x) - margin);
        const maxGX = Math.min(map.width - 1, Math.max(topRight.x, botRight.x) + margin);
        const minGY = Math.max(0, Math.min(topLeft.y, topRight.y) - margin);
        const maxGY = Math.min(map.height - 1, Math.max(botLeft.y, botRight.y) + margin);

        // Draw cells in painter's order (back to front)
        for (let gy = minGY; gy <= maxGY; gy++) {
            for (let gx = minGX; gx <= maxGX; gx++) {
                const cell = map.getCell(gx, gy);
                if (!cell) continue;

                const { x: sx, y: sy } = this.gridToScreen(gx, gy);

                // Draw ground tile
                this._drawDiamond(ctx, sx, sy, tw, th, cell.zone ? null : '#2a2a40', '#222238');

                if (cell.zone) {
                    const zt = ZONE_TYPES[cell.zone];
                    const densityFrac = Math.min(cell.density / 10, 1);
                    const buildH = densityFrac * maxH;

                    // Color deepens with density
                    const { h, s, l } = zt.baseColor;
                    const adjL = l - densityFrac * 20; // darker with density
                    const topColor = `hsl(${h}, ${s}%, ${adjL}%)`;
                    const leftColor = `hsl(${h}, ${s}%, ${adjL - 10}%)`;
                    const rightColor = `hsl(${h}, ${s}%, ${adjL - 18}%)`;

                    if (buildH > 1) {
                        // Draw extruded building (3 visible faces)
                        this._drawIsoBox(ctx, sx, sy, tw, th, buildH, topColor, leftColor, rightColor);
                    } else {
                        // Flat zone
                        this._drawDiamond(ctx, sx, sy, tw, th, topColor, leftColor);
                    }
                }

                // Hover highlight
                if (gx === this.hoverGridX && gy === this.hoverGridY) {
                    if (placingZone) {
                        const canPlace = !cell.zone;
                        const hlColor = canPlace ? 'rgba(100,255,100,0.35)' : 'rgba(255,80,80,0.35)';
                        this._drawDiamond(ctx, sx, sy, tw, th, hlColor, null);
                    } else {
                        this._drawDiamond(ctx, sx, sy, tw, th, 'rgba(255,255,255,0.12)', null);
                    }
                }
            }
        }

        // Draw subtle grid lines on empty cells (optional light grid)
        // Skipped for performance — the diamonds already delineate tiles.
    }

    /** Draw a flat isometric diamond. */
    _drawDiamond(ctx, cx, cy, w, h, fillColor, strokeColor) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - h / 2);        // top
        ctx.lineTo(cx + w / 2, cy);        // right
        ctx.lineTo(cx, cy + h / 2);        // bottom
        ctx.lineTo(cx - w / 2, cy);        // left
        ctx.closePath();
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }

    /** Draw an isometric box (extruded diamond). */
    _drawIsoBox(ctx, cx, cy, tw, th, height, topColor, leftColor, rightColor) {
        const topY = cy - height;

        // Top face
        ctx.beginPath();
        ctx.moveTo(cx, topY - th / 2);
        ctx.lineTo(cx + tw / 2, topY);
        ctx.lineTo(cx, topY + th / 2);
        ctx.lineTo(cx - tw / 2, topY);
        ctx.closePath();
        ctx.fillStyle = topColor;
        ctx.fill();

        // Left face
        ctx.beginPath();
        ctx.moveTo(cx - tw / 2, topY);
        ctx.lineTo(cx, topY + th / 2);
        ctx.lineTo(cx, cy + th / 2);
        ctx.lineTo(cx - tw / 2, cy);
        ctx.closePath();
        ctx.fillStyle = leftColor;
        ctx.fill();

        // Right face
        ctx.beginPath();
        ctx.moveTo(cx + tw / 2, topY);
        ctx.lineTo(cx, topY + th / 2);
        ctx.lineTo(cx, cy + th / 2);
        ctx.lineTo(cx + tw / 2, cy);
        ctx.closePath();
        ctx.fillStyle = rightColor;
        ctx.fill();
    }
}
