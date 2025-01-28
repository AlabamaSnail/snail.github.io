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

    updateAchievements(result) {
        if (result === 'Win') {
            try {
                const difficulty = document.querySelector('.diff-btn.selected').dataset.difficulty;
                console.log('Current difficulty:', difficulty); // Debug log
                
                // Make sure achievements exists
                if (window.achievements) {
                    switch(difficulty) {
                        case 'easy':
                            window.achievements.updateProgress('ttt_easy', 1);
                            break;
                        case 'medium':
                            window.achievements.updateProgress('ttt_medium', 1);
                            break;
                        case 'hard':
                            window.achievements.updateProgress('ttt_hard', 1);
                            break;
                    }
                } else {
                    console.error('Achievements system not initialized');
                }
            } catch (error) {
                console.error('Achievement update failed:', error);
            }
        }
    }

    endGame(result) {
        this.gameActive = false;
        
        // Add game to history
        this.addGameToHistory(result, this.difficulty);
        
        // Update achievements
        this.updateAchievements(result);
        
        if (result === 'Win') {
            alert('You win!');
        } else if (result === 'Loss') {
            alert('AI wins!');
        } else {
            alert("It's a draw!");
        }
        
        // Reset after a short delay
        setTimeout(() => this.resetGame(), 500);
    }

    makeMove(cell) {
        const index = cell.dataset.index;
        if (this.board[index] === '' && this.gameActive) {
            this.board[index] = this.currentPlayer;
            cell.classList.add(this.currentPlayer.toLowerCase());
            
            // Add small delay to show the final move before showing result
            setTimeout(() => {
                const winner = this.checkWin();
                if (winner) {
                    this.gameActive = false;
                    this.endGame(winner === 'X' ? 'Win' : 'Loss');
                    return;
                }
                
                if (this.checkDraw()) {
                    this.gameActive = false;
                    this.endGame('Draw');
                    return;
                }
                
                this.currentPlayer = 'O';
                if (this.gameActive) {
                    setTimeout(() => this.makeAIMove(), 500);
                }
            }, 100);
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
            default:
                move = this.getRandomMove();
        }

        if (move !== null) {
            this.board[move] = 'O';
            document.querySelector(`[data-index="${move}"]`).classList.add('o');
            
            // Add small delay to show the final move before showing result
            setTimeout(() => {
                const winner = this.checkWin();
                if (winner) {
                    this.gameActive = false;
                    this.endGame(winner === 'X' ? 'Win' : 'Loss');
                    return;
                }
                
                if (this.checkDraw()) {
                    this.gameActive = false;
                    this.endGame('Draw');
                    return;
                }
                
                this.currentPlayer = 'X';
            }, 100);
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
        // Check win/draw conditions first
        const result = this.checkWinForMinimax(board);
        if (result === 'O') return 1;
        if (result === 'X') return -1;
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

    // Add a separate win check for minimax to avoid achievement triggers
    checkWinForMinimax(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                return this.board[a];
            }
        }
        return null;
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