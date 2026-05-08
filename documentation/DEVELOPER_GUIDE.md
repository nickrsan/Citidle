# Citidle Developer Guide

This guide describes the architecture and key components of Citidle for developers.

## Project Structure
- `index.html`: The main entry point and UI layout.
- `style.css`: Styles for the HUD, research tree, and animations.
- `src/`: Core logic and rendering code.
  - `main.js`: Game loop, input handling, and UI synchronization.
  - `grid.js`: Core simulation logic (spreading, densification, economy).
  - `renderer.js`: Isometric Canvas 2D rendering engine.
  - `research.js`: Research system and state management.
  - `config.js`: Centralized game configuration and constants.
- `tests/`: Unit and integration tests using Node.js.
- `cypress/`: End-to-end tests.

## Key Systems

### 1. Configuration (`src/config.js`)
Most game balance and definitions are stored here.
- `ZONE_TYPES`: Defines probabilities for spreading and mutation.
- `RESEARCH_TREE`: Defines all research items, their costs, prerequisites, and effects.
- `GAME_CONSTANTS`: Initial values for economy, camera, and grid settings.

### 2. Grid Simulation (`src/grid.js`)
The `GameMap` class manages the state of the grid.
- `tick(gameState)`: Main simulation step. Handles spreading and economy calculation.
- `tickDensify(gameState)`: Processes growth for all occupied cells.
- `calculateEconomy(gameState)`: Implements the "minimum of three" production logic.

### 3. Rendering (`src/renderer.js`)
The `Renderer` class handles the isometric projection and camera state.
- `gridToScreen(gx, gy)`: Converts grid coordinates to screen space.
- `screenToGrid(px, py)`: Converts screen coordinates back to grid coordinates.
- `render(map, placingZone)`: The main draw loop, optimized with frustum culling.
- `FloatingAnim`: A simple particle system for floating icons.

### 4. Input & Camera (`src/main.js`)
Handles user input and synchronization between the simulation and UI.
- **Camera State**: `camX`, `camY`, and `zoom` are managed within the `Renderer` instance.
- **Zooming**: Implemented via the `wheel` event. It uses a "zoom-to-cursor" algorithm that adjusts `camX` and `camY` to keep the grid point under the mouse stable during scale changes.
- **Camera Centering**: The `centerCamera()` function calculates the geometric center of the current usable map area and aligns it with the screen center.

### 5. Research (`src/research.js`)
The `ResearchManager` handles buying upgrades and applying their effects.
- `buy(id, gameState)`: Validates costs and prerequisites before applying effects.
- `applyEffect(effect, gameState)`: Dynamically modifies game variables based on research definitions (`set`, `add`, `multiply`).

## Adding New Features

### Adding a Research Item
To add a new research item, update `RESEARCH_TREE` in `src/config.js`. Ensure you specify:
- `id`: Unique identifier.
- `name`: Display name.
- `category`: Grouping for UI.
- `description`: Text shown in the research panel.
- `cost`: Initial cost for level 1.
- `costScale`: Multiplier for each subsequent level.
- `maxLevel`: Maximum levels available for purchase.
- `requires`: (Optional) Object mapping item IDs to required levels, e.g., `{ density_residential: 2 }`.
- `effects`: Array of `{ variable, operation, value }` objects.

### Adding a Zone Type
To add a new zone type, update `ZONE_TYPES` in `src/config.js`. You will also need to specify:
- `placementCost`: Base cost to place the first zone.
- `costScale`: Exponential multiplier per existing zone of this type.
You will also need to update `renderer.js` to define its visual representation and `grid.js` if it has unique economy contributions.

## Testing
- Run unit tests: `npm test`
- Run E2E tests: `npm run cypress:run`
