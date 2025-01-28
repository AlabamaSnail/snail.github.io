class Sudoku {
    constructor() {
        this.board = document.getElementById('sudokuBoard');
        this.cells = [];
        this.solution = [];
        this.currentPuzzle = [];
        this.selectedCell = null;
        this.difficulty = 'easy';
        this.timerElement = document.getElementById('timer');
        this.timerInterval = null;
        this.timeElapsed = 0;

        this.setupBoard();
        this.setupControls();
        this.setupNumberPad();
        this.newGame('easy');
    }

    setupBoard() {
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            this.cells.push(cell);
            this.board.appendChild(cell);

            cell.addEventListener('click', () => this.selectCell(cell));
        }

        // Keyboard input
        document.addEventListener('keydown', (e) => {
            if (!this.selectedCell) return;
            
            if (e.key >= '1' && e.key <= '9') {
                this.fillNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                this.eraseNumber();
            }
        });
    }

    setupControls() {
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.newGame(btn.dataset.difficulty);
            });
        });

        document.getElementById('newGame').addEventListener('click', () => {
            this.newGame(this.difficulty);
        });

        document.getElementById('checkSolution').addEventListener('click', () => {
            this.checkSolution();
        });

        document.getElementById('showHint').addEventListener('click', () => {
            this.showHint();
        });
    }

    setupNumberPad() {
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('erase')) {
                    this.eraseNumber();
                } else {
                    this.fillNumber(parseInt(btn.textContent));
                }
            });
        });
    }

    generatePuzzle() {
        // Generate a solved puzzle
        this.solution = this.generateSolvedGrid();
        
        // Create puzzle by removing numbers
        this.currentPuzzle = this.solution.map(row => [...row]);
        const cellsToRemove = {
            'easy': 40,
            'medium': 50,
            'hard': 60
        }[this.difficulty];

        let removed = 0;
        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (this.currentPuzzle[row][col] !== 0) {
                this.currentPuzzle[row][col] = 0;
                removed++;
            }
        }
    }

    generateSolvedGrid() {
        const grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solveSudoku(grid);
        return grid;
    }

    solveSudoku(grid) {
        const empty = this.findEmpty(grid);
        if (!empty) return true;

        const [row, col] = empty;
        const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (let num of nums) {
            if (this.isValid(grid, row, col, num)) {
                grid[row][col] = num;
                if (this.solveSudoku(grid)) return true;
                grid[row][col] = 0;
            }
        }
        return false;
    }

    findEmpty(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) return [row, col];
            }
        }
        return null;
    }

    isValid(grid, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) return false;
        }

        // Check column
        for (let y = 0; y < 9; y++) {
            if (grid[y][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let y = boxRow; y < boxRow + 3; y++) {
            for (let x = boxCol; x < boxCol + 3; x++) {
                if (grid[y][x] === num) return false;
            }
        }

        return true;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    newGame(difficulty) {
        this.difficulty = difficulty;
        this.generatePuzzle();
        this.resetTimer();
        this.startTimer();
        this.displayPuzzle();
    }

    displayPuzzle() {
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.currentPuzzle[row][col];
            
            cell.textContent = value || '';
            cell.className = 'cell';
            if (value) cell.classList.add('fixed');
        });
    }

    selectCell(cell) {
        // Remove previous selections
        this.cells.forEach(c => {
            c.classList.remove('selected');
            c.classList.remove('highlighted');
            c.classList.remove('same-number');
        });

        // Add new selection
        cell.classList.add('selected');
        
        // Get cell position
        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        // Highlight row
        for (let x = 0; x < 9; x++) {
            const cellIndex = row * 9 + x;
            if (cellIndex !== index) {
                this.cells[cellIndex].classList.add('highlighted');
            }
        }
        
        // Highlight column
        for (let y = 0; y < 9; y++) {
            const cellIndex = y * 9 + col;
            if (cellIndex !== index) {
                this.cells[cellIndex].classList.add('highlighted');
            }
        }
        
        // Highlight 3x3 box
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartCol = Math.floor(col / 3) * 3;
        for (let y = boxStartRow; y < boxStartRow + 3; y++) {
            for (let x = boxStartCol; x < boxStartCol + 3; x++) {
                const cellIndex = y * 9 + x;
                if (cellIndex !== index) {
                    this.cells[cellIndex].classList.add('highlighted');
                }
            }
        }

        // Highlight same numbers
        const currentNumber = cell.textContent;
        if (currentNumber) {
            this.cells.forEach(c => {
                if (c.textContent === currentNumber && c !== cell) {
                    c.classList.add('same-number');
                }
            });
        }
        
        // Only set selectedCell if it's not fixed
        if (!cell.classList.contains('fixed')) {
            this.selectedCell = cell;
        } else {
            this.selectedCell = null;
        }
    }

    fillNumber(number) {
        if (!this.selectedCell || this.selectedCell.classList.contains('fixed')) return;

        const index = parseInt(this.selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;

        this.currentPuzzle[row][col] = number;
        this.selectedCell.textContent = number;
        this.selectedCell.classList.remove('error');

        // Highlight all cells with the same number
        this.cells.forEach(cell => {
            cell.classList.remove('same-number');
            if (cell.textContent === number.toString() && cell !== this.selectedCell) {
                cell.classList.add('same-number');
            }
        });

        // Check if the move is valid
        if (!this.isValid(this.currentPuzzle, row, col, number)) {
            this.selectedCell.classList.add('error');
        }

        // Check if puzzle is complete
        if (this.isPuzzleComplete()) {
            this.gameWon();
        }
    }

    eraseNumber() {
        if (!this.selectedCell || this.selectedCell.classList.contains('fixed')) return;

        const index = parseInt(this.selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;

        this.currentPuzzle[row][col] = 0;
        this.selectedCell.textContent = '';
        this.selectedCell.classList.remove('error');
    }

    showHint() {
        if (!this.selectedCell) return;

        const index = parseInt(this.selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;

        this.selectedCell.textContent = this.solution[row][col];
        this.currentPuzzle[row][col] = this.solution[row][col];
        this.selectedCell.classList.add('hint');
        setTimeout(() => this.selectedCell.classList.remove('hint'), 1000);
    }

    checkSolution() {
        let isComplete = true;
        this.cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            
            if (this.currentPuzzle[row][col] !== this.solution[row][col]) {
                cell.classList.add('error');
                isComplete = false;
            } else {
                cell.classList.remove('error');
            }
        });

        if (isComplete) this.gameWon();
    }

    isPuzzleComplete() {
        return this.cells.every((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            return this.currentPuzzle[row][col] === this.solution[row][col];
        });
    }

    gameWon() {
        clearInterval(this.timerInterval);
        alert(`Congratulations! You solved the puzzle in ${this.formatTime(this.timeElapsed)}!`);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.timerElement.textContent = this.formatTime(this.timeElapsed);
        }, 1000);
    }

    resetTimer() {
        clearInterval(this.timerInterval);
        this.timeElapsed = 0;
        this.timerElement.textContent = this.formatTime(0);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize game
const game = new Sudoku(); 