const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');
const scoreElement = document.getElementById('score');

let snake = [];
let apples = [];
let direction = 'right';
let gameInterval;
let score = 0;
let cellSize = 20;
let gameStarted = false;

// Key state tracking
let lastKeyTime = 0;
const keyDelay = 50; // Minimum delay between key presses in milliseconds
let queuedDirection = null;

// Game settings
const speedSlider = document.getElementById('speed');
const boardSizeSlider = document.getElementById('boardSize');
const applesSlider = document.getElementById('apples');
const startButton = document.getElementById('startButton');

// Update value displays
function updateValues() {
    console.log("Updating values");
    const speedValue = document.getElementById('speedValue');
    const boardSizeValue = document.getElementById('boardSizeValue');
    const applesValue = document.getElementById('applesValue');
    
    if (speedValue) speedValue.textContent = speedSlider.value;
    if (boardSizeValue) boardSizeValue.textContent = boardSizeSlider.value;
    if (applesValue) applesValue.textContent = applesSlider.value;
}

speedSlider.addEventListener('input', updateValues);
boardSizeSlider.addEventListener('input', updateValues);
applesSlider.addEventListener('input', updateValues);
updateValues();

function initGame() {
    cellSize = Math.floor(Math.min(400, window.innerWidth - 40) / parseInt(boardSizeSlider.value));
    gameCanvas.width = parseInt(boardSizeSlider.value) * cellSize;
    gameCanvas.height = parseInt(boardSizeSlider.value) * cellSize;
    
    snakeInstance.reset();
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    
    apples = [];
    const appleCount = parseInt(applesSlider.value);
    for (let i = 0; i < appleCount; i++) {
        addApple();
    }
}

function addApple() {
    const boardSize = parseInt(boardSizeSlider.value);
    let newApple;
    do {
        newApple = {
            x: Math.floor(Math.random() * boardSize),
            y: Math.floor(Math.random() * boardSize)
        };
    } while (isCollision(newApple));
    apples.push(newApple);
}

function isCollision(pos) {
    return snake.some(segment => segment.x === pos.x && segment.y === pos.y) ||
           apples.some(apple => apple.x === pos.x && apple.y === pos.y);
}

function gameOver() {
    clearInterval(gameInterval);
    gameStarted = false;
    startButton.textContent = 'Start Game';
    
    // Calculate coins (1 coin per 10 score)
    const coinsEarned = Math.floor(score / 10);
    
    // Show game result with score and coins
    window.coins.showGameResult(
        'Game Over!',
        score,
        coinsEarned,
        `Coins earned: 1 per 10 points`
    );
}

class Snake {
    constructor() {
        this.reset();
        this.lastKeyTime = 0;
        this.keyDelay = 50;  // Minimum delay between direction changes
        this.queuedDirection = null;
    }

    reset() {
        const boardSize = parseInt(boardSizeSlider.value);
        const startX = Math.floor(boardSize / 4);
        const startY = Math.floor(boardSize / 2);
        this.snake = [{x: startX, y: startY}];
        this.direction = 'right';
        this.lastValidDirection = 'right';
        this.queuedDirection = null;
    }

    changeDirection(newDirection) {
        const now = Date.now();
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        // If it's too soon since last direction change, queue the new direction
        if (now - this.lastKeyTime < this.keyDelay) {
            this.queuedDirection = newDirection;
            return;
        }

        // Only change direction if it's not opposite to the last valid move
        if (newDirection !== opposites[this.lastValidDirection]) {
            this.direction = newDirection;
            this.lastValidDirection = newDirection;
            this.lastKeyTime = now;
        }
    }

    update() {
        // Process any queued direction change
        if (this.queuedDirection) {
            this.changeDirection(this.queuedDirection);
            this.queuedDirection = null;
        }

        const boardSize = parseInt(boardSizeSlider.value);
        const head = {...this.snake[0]};
        
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // Check wall collision
        if (head.x < 0 || head.x >= boardSize || head.y < 0 || head.y >= boardSize) {
            gameOver();
            return;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check apple collision
        const appleIndex = apples.findIndex(apple => apple.x === head.x && apple.y === head.y);
        if (appleIndex >= 0) {
            apples.splice(appleIndex, 1);
            score++;
            scoreElement.textContent = `Score: ${score}`;
            addApple();
        } else {
            this.snake.pop();
        }
    }

    draw() {
        gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Draw grid background
        gameCtx.fillStyle = '#111';
        gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            gameCtx.fillStyle = index === 0 ? '#4CAF50' : '#2E7D32';
            gameCtx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize - 1, cellSize - 1);
        });
        
        // Draw apples
        apples.forEach(apple => {
            gameCtx.fillStyle = '#FF0000';
            gameCtx.fillRect(apple.x * cellSize, apple.y * cellSize, cellSize - 1, cellSize - 1);
        });
    }
}

const snakeInstance = new Snake();

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameStarted) return;
    
    let newDirection = null;
    switch(e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            newDirection = 'up';
            break;
        case 'arrowdown':
        case 's':
            newDirection = 'down';
            break;
        case 'arrowleft':
        case 'a':
            newDirection = 'left';
            break;
        case 'arrowright':
        case 'd':
            newDirection = 'right';
            break;
    }
    
    if (newDirection) {
        snakeInstance.changeDirection(newDirection);
    }
});

// Add event listener to prevent scrolling with arrow keys during gameplay
window.addEventListener('keydown', (e) => {
    if (gameStarted && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

startButton.addEventListener('click', () => {
    if (gameStarted) {
        clearInterval(gameInterval);
        gameStarted = false;
        startButton.textContent = 'Start Game';
        document.body.style.overflow = 'auto';
    } else {
        initGame();
        gameStarted = true;
        startButton.textContent = 'Stop Game';
        document.body.style.overflow = 'hidden';
        const speed = parseInt(speedSlider.value);
        gameInterval = setInterval(() => {
            snakeInstance.update();
            snakeInstance.draw();
        }, 1000 / speed);
    }
});

// Initial setup
initGame();
snakeInstance.draw();