class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.difficulty = 'easy';
        this.gameActive = true;

        this.cells = document.querySelectorAll('.cell');
        this.diffButtons = document.querySelectorAll('.diff-btn');
        this.resetButton = document.getElementById('reset-btn');

        this.initializeGame();
    }

    initializeGame() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.makeMove(cell));
        });

        this.diffButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.difficulty = button.dataset.difficulty;
                this.diffButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                this.resetGame();
            });
        });

        this.resetButton.addEventListener('click', () => this.resetGame());
    }

    makeMove(cell) {
        const index = cell.dataset.index;
        if (this.board[index] === '' && this.gameActive) {
            this.board[index] = this.currentPlayer;
            cell.classList.add(this.currentPlayer.toLowerCase());
            
            if (this.checkWin()) {
                this.gameActive = false;
                alert(`Player ${this.currentPlayer} wins!`);
                return;
            }

            if (this.checkDraw()) {
                this.gameActive = false;
                alert("It's a draw!");
                return;
            }

            this.currentPlayer = 'O';
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    makeAIMove() {
        if (!this.gameActive) return;

        let move;
        switch(this.difficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                move = Math.random() < 0.5 ? this.getBestMove() : this.getRandomMove();
                break;
            case 'hard':
                move = this.getBestMove();
                break;
        }

        this.board[move] = 'O';
        this.cells[move].classList.add('o');

        if (this.checkWin()) {
            this.gameActive = false;
            alert('AI wins!');
            return;
        }

        if (this.checkDraw()) {
            this.gameActive = false;
            alert("It's a draw!");
            return;
        }

        this.currentPlayer = 'X';
    }

    getRandomMove() {
        const emptyCells = this.board
            .map((cell, index) => cell === '' ? index : null)
            .filter(cell => cell !== null);
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    getBestMove() {
        let bestScore = -Infinity;
        let bestMove;

        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                let score = this.minimax(this.board, 0, false);
                this.board[i] = '';
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    minimax(board, depth, isMaximizing) {
        if (this.checkWin()) return isMaximizing ? -1 : 1;
        if (this.checkDraw()) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    bestScore = Math.max(bestScore, this.minimax(board, depth + 1, false));
                    board[i] = '';
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    bestScore = Math.min(bestScore, this.minimax(board, depth + 1, true));
                    board[i] = '';
                }
            }
            return bestScore;
        }
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] && 
                   this.board[a] === this.board[b] && 
                   this.board[a] === this.board[c];
        });
    }

    checkDraw() {
        return !this.board.includes('');
    }

    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.cells.forEach(cell => {
            cell.classList.remove('x', 'o');
        });
    }
}

new TicTacToe();