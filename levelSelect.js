class LevelSelect {
    constructor() {
        this.createLevelSelect();
        this.loadLevels();
    }

    createLevelSelect() {
        const container = document.createElement('div');
        container.className = 'level-select';
        
        // Add level buttons
        for (let i = 1; i <= 20; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.onclick = () => this.selectLevel(i);
            container.appendChild(button);
        }

        document.body.appendChild(container);
    }

    selectLevel(levelNum) {
        // Load level data
        const levelData = this.getLevelData(levelNum);
        if (levelData) {
            game.loadCustomLevel(levelData);
        }
    }
} 