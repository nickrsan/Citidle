# Citidle Features

## Core Gameplay
- **Isometric City Building**: A grid-based city builder with an isometric perspective.
- **Zoning Types**: Three main zoning types that drive the economy (all available from the start):
  - **Residential**: Provides workers.
  - **Commercial**: Sells goods produced by industry.
  - **Industrial**: Produces goods using workers.
- **Scaling Placement Costs**: Zone placement costs scale based on the number of existing zones of that type, similar to research and expansion costs.
- **Dynamic Spreading**: Zones have a probability to spread to neighboring cells (including diagonals) and a small chance to mutate into other zone types.
- **Densification**: Zones automatically densify over time, increasing their capacity (population, jobs, or production). Visualized by taller buildings and deeper colors.
- **Economy System**: A production loop where output is determined by the minimum of workers, commercial sales capacity, and industrial production.
- **Tick-based Simulation**: Economy and spreading logic run on a configurable tick rate (default 100ms).

## Research & Progression
- **Research Tree**: A graphical research tree with multi-level upgrades.
- **Enhanced Research UI**:
  - Visual feedback for unaffordable items (faded out).
  - Progress bars for multi-level research items.
  - Explicit prerequisite text on research items (e.g., "Requires Research Item Level X").
- **Prerequisite System**: Research items can require other research to be completed first, visualized with connecting lines in the UI.
- **Variable Modifiers**: Research can modify various game parameters:
  - Production/Efficiency bonuses.
  - Cost reductions for placing zones.
  - Spread rate increases.
  - Tick speed acceleration.
  - Density bonuses based on neighboring zones.
  - Direct income bonuses.
- **Neighbor Bonuses**: Specific research allows zones to densify faster when surrounded by zones of the same type.

## Map & UI
- **Camera Controls**:
  - Pan (mouse drag/WASD/arrows).
  - Zoom (scroll) with smooth zoom-to-mouse cursor logic.
  - Zoom Reset button to quickly return to default zoom and center the city.
- **Usable Grid Area**: The game starts with a limited usable area (20x20) on a larger 100x100 grid.
- **Grid Expansion**: Players can purchase tile expansions to increase the usable area of the map.
- **Visual Feedback**:
  - Floating "$" icons above commercial zones when sales occur.
  - Floating "⬆" icons when a zone densifies.
  - Toast notifications for purchases and research.
  - HUD displaying money, population, and output.

## Technical
- **Vanilla JavaScript/Canvas**: Built without heavy external frameworks for core logic and rendering.
- **JSON Configuration**: Game balance, zone types, and research items are defined in a central configuration file.
- **Test Suite**: Comprehensive unit, integration, and E2E tests using Node.js and Cypress.
