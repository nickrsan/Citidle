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
The `Renderer` class handles the isometric projection.
- `gridToScreen(q, r)`: Converts grid coordinates to screen space.
- `screenToGrid(x, y)`: Converts screen coordinates back to grid coordinates.
- `draw(gameState)`: The main draw loop, optimized with frustum culling.
- `FloatingAnim`: A simple particle system for floating icons.

### 4. Research (`src/research.js`)
The `ResearchManager` handles buying upgrades and applying their effects.
- `buy(id, gameState)`: Validates costs and prerequisites before applying effects.
- `applyEffect(effect, gameState)`: Dynamically modifies game variables based on research definitions (`set`, `add`, `multiply`).

## Adding New Features

### Adding a Research Item
To add a new research item, update `RESEARCH_TREE` in `src/config.js`. Ensure you specify:
- `id`: Unique identifier.
- `label`: Display name.
- `category`: Grouping for UI.
- `cost`: Initial cost.
- `costScale`: Multiplier for each level.
- `effects`: Array of `{ op, var, value }` objects.
- `prerequisites`: (Optional) Array of IDs.

### Adding a Zone Type
To add a new zone type, update `ZONE_TYPES` in `src/config.js`. You will also need to update `renderer.js` to define its visual representation and `grid.js` if it has unique economy contributions.

## Testing
- Run unit tests: `npm test`
- Run E2E tests: `npm run cypress:run`
