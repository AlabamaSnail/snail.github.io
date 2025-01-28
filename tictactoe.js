class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.difficulty = 'easy';
        this.gameActive = true;

        this.cells = document.querySelectorAll('.cell');
        this.diffButtons = document.querySelectorAll('.diff-btn');
        this.resetButton = document.getElementById('reset-btn');

        this.gameHistory = JSON.parse(localStorage.getItem('tictactoeHistory')) || [];
        this.updateLeaderboard();

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

    endGame(result) {
        this.gameActive = false;
        
        // Add game to history
        this.addGameToHistory(result, this.difficulty);
        
        // Show result
        setTimeout(() => {
            if (result === 'Win') {
                alert('You win!');
            } else if (result === 'Loss') {
                alert('AI wins!');
            } else {
                alert("It's a draw!");
            }
            
            // Auto-reset after a short delay
            setTimeout(() => this.resetGame(), 500);
        }, 100);
    }

    makeMove(cell) {
        const index = cell.dataset.index;
        if (this.board[index] === '' && this.gameActive) {
            this.board[index] = this.currentPlayer;
            cell.classList.add(this.currentPlayer.toLowerCase());
            
            if (this.checkWin()) {
                this.endGame('Win');
                return;
            }
            
            if (this.checkDraw()) {
                this.endGame('Draw');
                return;
            }
            
            this.currentPlayer = 'O';
            if (this.gameActive) {
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    makeAIMove() {
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
            default:
                move = this.getRandomMove(); // Default to easy
        }

        if (move !== null && this.gameActive) {
            this.board[move] = 'O';
            document.querySelector(`[data-index="${move}"]`).classList.add('o');
            
            if (this.checkWin()) {
                this.endGame('Loss');
                return;
            }
            
            if (this.checkDraw()) {
                this.endGame('Draw');
                return;
            }
            
            this.currentPlayer = 'X';
        }
    }

    getRandomMove() {
        const availableMoves = this.board
            .map((cell, index) => cell === '' ? index : null)
            .filter(cell => cell !== null);
        
        if (availableMoves.length === 0) return null;
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
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
        
        // Clear the board
        document.querySelectorAll('.cell').forEach(cell => {
            cell.className = 'cell';
        });
    }

    addGameToHistory(result, difficulty) {
        const game = {
            result: result,
            difficulty: difficulty,
            date: new Date().toLocaleString()
        };
        
        this.gameHistory.unshift(game); // Add to start of array
        if (this.gameHistory.length > 10) {
            this.gameHistory.pop(); // Keep only last 10 games
        }
        
        localStorage.setItem('tictactoeHistory', JSON.stringify(this.gameHistory));
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        const leaderboardList = document.querySelector('.leaderboard-list');
        leaderboardList.innerHTML = '';
        
        this.gameHistory.forEach(game => {
            const record = document.createElement('div');
            record.className = 'game-record';
            record.innerHTML = `
                <span class="difficulty">${game.difficulty}</span>
                <span class="result ${game.result.toLowerCase()}">${game.result}</span>
            `;
            leaderboardList.appendChild(record);
        });
    }
}

new TicTacToe();