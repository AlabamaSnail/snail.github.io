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
    // Set canvas size based on board size
    const boardSize = parseInt(boardSizeSlider.value);
    cellSize = Math.floor(Math.min(400, window.innerWidth - 40) / boardSize);
    gameCanvas.width = boardSize * cellSize;
    gameCanvas.height = boardSize * cellSize;
    
    // Initialize snake in the middle of the board
    const startX = Math.floor(boardSize / 4);
    const startY = Math.floor(boardSize / 2);
    snake = [{x: startX, y: startY}];
    direction = 'right';
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    
    // Initialize apples
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
    document.body.style.overflow = 'auto';
    alert(`Game Over! Score: ${score}`);
}

function update() {
    const boardSize = parseInt(boardSizeSlider.value);
    
    // Process queued direction change if it exists and is valid
    if (queuedDirection) {
        const isValidQueued = (
            (queuedDirection === 'up' && direction !== 'down') ||
            (queuedDirection === 'down' && direction !== 'up') ||
            (queuedDirection === 'left' && direction !== 'right') ||
            (queuedDirection === 'right' && direction !== 'left')
        );
        
        if (isValidQueued) {
            direction = queuedDirection;
        }
        queuedDirection = null;
    }
    
    const head = {...snake[0]};
    
    switch(direction) {
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
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // Check apple collision
    const appleIndex = apples.findIndex(apple => apple.x === head.x && apple.y === head.y);
    if (appleIndex >= 0) {
        apples.splice(appleIndex, 1);
        score++;
        scoreElement.textContent = `Score: ${score}`;
        addApple();
    } else {
        snake.pop();
    }
}

function draw() {
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw grid background
    gameCtx.fillStyle = '#111';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw snake
    snake.forEach((segment, index) => {
        gameCtx.fillStyle = index === 0 ? '#4CAF50' : '#2E7D32';
        gameCtx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize - 1, cellSize - 1);
    });
    
    // Draw apples
    apples.forEach(apple => {
        gameCtx.fillStyle = '#FF0000';
        gameCtx.fillRect(apple.x * cellSize, apple.y * cellSize, cellSize - 1, cellSize - 1);
    });
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameStarted) return;
    
    const currentTime = Date.now();
    let newDirection = null;
    
    switch(e.key.toLowerCase()) { // Convert to lowercase to handle both cases
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
    
    if (!newDirection) return;
    
    // Check if the new direction is valid (not opposite of current direction)
    const isValidDirection = (
        (newDirection === 'up' && direction !== 'down') ||
        (newDirection === 'down' && direction !== 'up') ||
        (newDirection === 'left' && direction !== 'right') ||
        (newDirection === 'right' && direction !== 'left')
    );
    
    if (!isValidDirection) return;
    
    // If enough time has passed since last key press, update direction immediately
    if (currentTime - lastKeyTime > keyDelay) {
        direction = newDirection;
        lastKeyTime = currentTime;
    } else {
        // Otherwise, queue the direction change
        queuedDirection = newDirection;
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
            update();
            draw();
        }, 1000 / speed);
    }
});

// Initial setup
initGame();
draw();