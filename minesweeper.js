class Minesweeper {
    constructor() {
        this.board = [];
        this.mineLocations = new Set();
        this.isFirstClick = true;
        this.gameActive = false;
        this.flagMode = false;
        this.timer = 0;
        this.timerInterval = null;
        this.currentDifficulty = 'beginner';
        
        // Difficulty presets
        this.difficulties = {
            beginner: { width: 9, height: 9, mines: 10 },
            intermediate: { width: 16, height: 16, mines: 40 },
            expert: { width: 30, height: 16, mines: 99 },
            infinite: { width: 50, height: 50, mines: 400 }  // Initial size for infinite mode
        };

        this.initializeElements();
        this.setupEventListeners();
        this.setDifficulty('beginner');
    }

    initializeElements() {
        this.boardElement = document.getElementById('minesweeperBoard');
        this.mineCountElement = document.getElementById('mineCount');
        this.timerElement = document.getElementById('timer');
        this.difficultyButtons = document.querySelectorAll('.diff-btn');
        this.customSettings = document.querySelector('.custom-settings');
    }

    setupEventListeners() {
        // Difficulty selection
        this.difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const difficulty = button.dataset.difficulty;
                
                this.difficultyButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');

                if (difficulty === 'custom') {
                    this.customSettings.style.display = 'flex';
                } else {
                    this.customSettings.style.display = 'none';
                    this.setDifficulty(difficulty);
                }
            });
        });

        // Right click for flag mode
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('cell')) {
                e.preventDefault();
                this.toggleFlag(e.target);
            }
        });

        // Custom settings apply button
        document.getElementById('applyCustom').addEventListener('click', () => {
            const width = parseInt(document.getElementById('customWidth').value);
            const height = parseInt(document.getElementById('customHeight').value);
            const mines = parseInt(document.getElementById('customMines').value);

            if (this.validateCustomSettings(width, height, mines)) {
                this.difficulties.custom = { width, height, mines };
                this.setDifficulty('custom');
                this.customSettings.style.display = 'none';
            }
        });

        // Reset button
        document.querySelector('.reset-btn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    validateCustomSettings(width, height, mines) {
        if (width < 8 || width > 50 || height < 8 || height > 50) {
            alert('Board dimensions must be between 8 and 50');
            return false;
        }
        
        const maxMines = Math.floor((width * height) * 0.85);
        if (mines < 1 || mines > maxMines) {
            alert(`Mine count must be between 1 and ${maxMines}`);
            return false;
        }
        
        return true;
    }

    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.resetGame();
    }

    resetGame() {
        clearInterval(this.timerInterval);
        this.timer = 0;
        this.timerElement.textContent = '0';
        this.isFirstClick = true;
        this.gameActive = true;
        this.mineLocations.clear();
        
        const settings = this.difficulties[this.currentDifficulty];
        this.createBoard(settings.width, settings.height);
        this.mineCountElement.textContent = settings.mines;
    }

    createBoard(width, height) {
        this.board = Array(height).fill().map(() => Array(width).fill(0));
        this.boardElement.style.gridTemplateColumns = `repeat(${width}, 30px)`;
        this.boardElement.innerHTML = '';
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                cell.addEventListener('click', (e) => this.handleClick(e, x, y));
                this.boardElement.appendChild(cell);
            }
        }

        if (this.currentDifficulty === 'infinite') {
            this.setupInfiniteMode();
        }
    }

    placeMines(firstClickX, firstClickY) {
        const settings = this.difficulties[this.currentDifficulty];
        const width = settings.width;
        const height = settings.height;
        const totalCells = width * height;
        
        // Create array of all possible positions except first click and its surroundings
        const safeZone = this.getSurroundingCells(firstClickX, firstClickY)
            .concat([[firstClickX, firstClickY]]);
        
        const possiblePositions = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!safeZone.some(([sx, sy]) => sx === x && sy === y)) {
                    possiblePositions.push([x, y]);
                }
            }
        }

        // Randomly place mines
        for (let i = 0; i < settings.mines; i++) {
            if (possiblePositions.length === 0) break;
            const index = Math.floor(Math.random() * possiblePositions.length);
            const [x, y] = possiblePositions.splice(index, 1)[0];
            this.mineLocations.add(`${x},${y}`);
            this.board[y][x] = -1;
        }

        // Calculate numbers for all cells
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.board[y][x] !== -1) {
                    this.board[y][x] = this.countSurroundingMines(x, y);
                }
            }
        }
    }

    handleClick(event, x, y) {
        if (!this.gameActive) return;
        
        const cell = event.target;
        if (cell.classList.contains('flagged')) return;

        if (this.isFirstClick) {
            this.isFirstClick = false;
            this.placeMines(x, y);
            this.startTimer();
        }

        if (this.mineLocations.has(`${x},${y}`)) {
            this.gameOver(false);
            return;
        }

        this.revealCell(x, y);
        if (this.checkWin()) {
            this.gameOver(true);
        }
    }

    revealCell(x, y) {
        if (!this.isValidCell(x, y)) return;
        
        const cell = this.getCellElement(x, y);
        if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;
        
        cell.classList.add('revealed');
        
        if (this.board[y][x] === 0) {
            // If cell is empty, reveal all surrounding cells
            this.getSurroundingCells(x, y).forEach(([nx, ny]) => {
                this.revealCell(nx, ny);
            });
        } else if (this.board[y][x] > 0) {
            // Show number
            cell.textContent = this.board[y][x];
            this.setCellColor(cell, this.board[y][x]);
        }
    }

    setCellColor(cell, number) {
        const colors = [
            null,
            '#1976D2', // 1: blue
            '#388E3C', // 2: green
            '#D32F2F', // 3: red
            '#7B1FA2', // 4: purple
            '#FF8F00', // 5: orange
            '#0097A7', // 6: cyan
            '#424242', // 7: dark gray
            '#9E9E9E'  // 8: light gray
        ];
        cell.style.color = colors[number] || 'white';
    }

    toggleFlag(cell) {
        if (!this.gameActive || cell.classList.contains('revealed')) return;
        
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        if (cell.classList.contains('flagged')) {
            cell.classList.remove('flagged');
            this.mineCountElement.textContent = 
                parseInt(this.mineCountElement.textContent) + 1;
        } else {
            cell.classList.add('flagged');
            this.mineCountElement.textContent = 
                parseInt(this.mineCountElement.textContent) - 1;
        }
    }

    getSurroundingCells(x, y) {
        const surrounding = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const newX = x + dx;
                const newY = y + dy;
                if (this.isValidCell(newX, newY)) {
                    surrounding.push([newX, newY]);
                }
            }
        }
        return surrounding;
    }

    countSurroundingMines(x, y) {
        return this.getSurroundingCells(x, y)
            .filter(([nx, ny]) => this.mineLocations.has(`${nx},${ny}`))
            .length;
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.difficulties[this.currentDifficulty].width &&
               y >= 0 && y < this.difficulties[this.currentDifficulty].height;
    }

    getCellElement(x, y) {
        return this.boardElement.children[y * this.difficulties[this.currentDifficulty].width + x];
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.timer;
        }, 1000);
    }

    gameOver(won) {
        this.gameActive = false;
        clearInterval(this.timerInterval);

        // Reveal all mines
        this.mineLocations.forEach(pos => {
            const [x, y] = pos.split(',').map(Number);
            const cell = this.getCellElement(x, y);
            cell.classList.add('revealed', 'mine');
            cell.textContent = '💣';
        });

        setTimeout(() => {
            alert(won ? 'You Win! 🎉' : 'Game Over! 💥');
        }, 100);
    }

    checkWin() {
        const totalCells = this.difficulties[this.currentDifficulty].width * 
                          this.difficulties[this.currentDifficulty].height;
        const revealedCount = this.boardElement.querySelectorAll('.revealed').length;
        return revealedCount === totalCells - this.mineLocations.size;
    }

    setupInfiniteMode() {
        this.boardElement.classList.add('infinite');
        this.viewportOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        // Add drag functionality
        this.boardElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click only
                this.isDragging = true;
                this.lastMousePos = { x: e.clientX, y: e.clientY };
                this.boardElement.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMousePos.x;
                const dy = e.clientY - this.lastMousePos.y;
                
                this.viewportOffset.x += dx;
                this.viewportOffset.y += dy;
                
                this.boardElement.style.transform = 
                    `translate(${this.viewportOffset.x}px, ${this.viewportOffset.y}px)`;
                
                this.lastMousePos = { x: e.clientX, y: e.clientY };
                this.checkBoundaryAndExpand();
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.boardElement.style.cursor = 'grab';
        });
    }

    checkBoundaryAndExpand() {
        const threshold = 200; // pixels from edge to trigger expansion
        const viewportRect = this.boardElement.getBoundingClientRect();
        const containerRect = this.boardElement.parentElement.getBoundingClientRect();
        
        if (viewportRect.right - containerRect.right < threshold) {
            this.expandBoard('right');
        }
        if (viewportRect.bottom - containerRect.bottom < threshold) {
            this.expandBoard('bottom');
        }
        if (containerRect.left - viewportRect.left < threshold) {
            this.expandBoard('left');
        }
        if (containerRect.top - viewportRect.top < threshold) {
            this.expandBoard('top');
        }
    }

    expandBoard(direction) {
        const expansion = 5; // Number of cells to add
        const currentWidth = this.board[0].length;
        const currentHeight = this.board.length;
        
        switch(direction) {
            case 'right':
                this.board.forEach(row => {
                    row.push(...Array(expansion).fill(0));
                });
                break;
            case 'bottom':
                this.board.push(...Array(expansion).fill().map(() => 
                    Array(currentWidth).fill(0)));
                break;
            case 'left':
                this.board.forEach(row => {
                    row.unshift(...Array(expansion).fill(0));
                });
                this.viewportOffset.x += expansion * 30;
                break;
            case 'top':
                this.board.unshift(...Array(expansion).fill().map(() => 
                    Array(currentWidth).fill(0)));
                this.viewportOffset.y += expansion * 30;
                break;
        }
        
        this.rebuildBoard();
    }

    rebuildBoard() {
        const width = this.board[0].length;
        const height = this.board.length;
        this.boardElement.style.gridTemplateColumns = `repeat(${width}, 30px)`;
        
        // Save revealed cells state
        const revealedCells = new Set();
        const flaggedCells = new Set();
        this.boardElement.querySelectorAll('.cell').forEach(cell => {
            const key = `${cell.dataset.x},${cell.dataset.y}`;
            if (cell.classList.contains('revealed')) revealedCells.add(key);
            if (cell.classList.contains('flagged')) flaggedCells.add(key);
        });
        
        this.boardElement.innerHTML = '';
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                const key = `${x},${y}`;
                if (revealedCells.has(key)) {
                    cell.classList.add('revealed');
                    if (this.board[y][x] > 0) {
                        cell.textContent = this.board[y][x];
                        this.setCellColor(cell, this.board[y][x]);
                    }
                }
                if (flaggedCells.has(key)) {
                    cell.classList.add('flagged');
                }
                
                cell.addEventListener('click', (e) => this.handleClick(e, x, y));
                this.boardElement.appendChild(cell);
            }
        }
        
        this.boardElement.style.transform = 
            `translate(${this.viewportOffset.x}px, ${this.viewportOffset.y}px)`;
    }

    saveGame() {
        const gameState = {
            board: this.board,
            mineLocations: Array.from(this.mineLocations),
            timer: this.timer,
            difficulty: this.currentDifficulty,
            revealed: Array.from(this.boardElement.querySelectorAll('.revealed'))
                .map(cell => `${cell.dataset.x},${cell.dataset.y}`),
            flagged: Array.from(this.boardElement.querySelectorAll('.flagged'))
                .map(cell => `${cell.dataset.x},${cell.dataset.y}`)
        };
        
        localStorage.setItem('minesweeperSave', JSON.stringify(gameState));
        this.showNotification('Game saved! 💾');
    }

    loadGame() {
        const savedState = localStorage.getItem('minesweeperSave');
        if (!savedState) {
            this.showNotification('No saved game found! 🤔');
            return;
        }

        try {
            const gameState = JSON.parse(savedState);
            
            // Clear existing state
            clearInterval(this.timerInterval);
            
            // Restore game state
            this.board = gameState.board;
            this.mineLocations = new Set(gameState.mineLocations);
            this.timer = gameState.timer;
            this.currentDifficulty = gameState.difficulty;
            this.isFirstClick = false;
            this.gameActive = true;

            // Update difficulty buttons
            this.difficultyButtons.forEach(btn => {
                btn.classList.remove('selected');
                if (btn.dataset.difficulty === this.currentDifficulty) {
                    btn.classList.add('selected');
                }
            });

            // Update timer display
            this.timerElement.textContent = this.timer;
            
            // Update mine count
            this.mineCountElement.textContent = this.mineLocations.size;

            // Rebuild board
            this.createBoard(this.board[0].length, this.board.length);
            
            // Restore revealed and flagged cells
            gameState.revealed.forEach(pos => {
                const [x, y] = pos.split(',').map(Number);
                const cell = this.getCellElement(x, y);
                if (cell) {
                    cell.classList.add('revealed');
                    const value = this.board[y][x];
                    if (value > 0) {
                        cell.textContent = value;
                        this.setCellColor(cell, value);
                    } else if (value === -1) {
                        cell.textContent = '💣';
                        cell.classList.add('mine');
                    }
                }
            });

            // Restore flags
            gameState.flagged.forEach(pos => {
                const [x, y] = pos.split(',').map(Number);
                const cell = this.getCellElement(x, y);
                if (cell) {
                    cell.classList.add('flagged');
                    this.mineCountElement.textContent = 
                        parseInt(this.mineCountElement.textContent) - 1;
                }
            });

            // Restart timer if game is not over
            if (this.gameActive) {
                this.startTimer();
            }
            
            this.showNotification('Game loaded! 🎮');
        } catch (error) {
            console.error('Error loading game:', error);
            this.showNotification('Error loading game! 😕');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    addVisualFeedback() {
        // Add ripple effect on click
        this.boardElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('cell')) return;
            
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            e.target.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 1000);
        });

        // Add hover effect for numbers
        this.boardElement.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('revealed') && e.target.textContent) {
                this.highlightSurroundingCells(e.target);
            }
        });

        this.boardElement.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('revealed') && e.target.textContent) {
                this.removeHighlight();
            }
        });
    }

    highlightSurroundingCells(cell) {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        this.getSurroundingCells(x, y).forEach(([nx, ny]) => {
            const neighborCell = this.getCellElement(nx, ny);
            if (!neighborCell.classList.contains('revealed')) {
                neighborCell.classList.add('highlight');
            }
        });
    }

    removeHighlight() {
        this.boardElement.querySelectorAll('.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
    }
}

// Initialize game
const game = new Minesweeper(); 