
export function saveGame(gameState, gameMap, research) {

    let researchState = research.save()
    let gameMapState = gameMap.save()
    const saveData = {
        gameState,
        gameMapState,
        researchState
    };

    localStorage.setItem('saveData', JSON.stringify(saveData));
}

export function loadGame() {
    const saveData = localStorage.getItem('saveData');
    if (saveData) {
        return JSON.parse(saveData);
    }
    return null;
}

export function resetGame() {
    localStorage.removeItem('saveData');
    window.location.reload();
    navigator.reload();
}