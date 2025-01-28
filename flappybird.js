class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('gameOverlay');
        this.currentScoreElement = document.getElementById('currentScore');
        this.highScoreElement = document.getElementById('highScore');

        // Game settings
        this.gravity = 0.5;
        this.jumpForce = -8;
        this.pipeGap = 150;
        this.pipeWidth = 60;
        this.pipeSpawnInterval = 1500;
        this.gameSpeed = 3;

        // Load high score from localStorage
        this.highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
        this.highScoreElement.textContent = this.highScore;

        // Add animation properties
        this.birdRotation = 0;
        this.wingFrame = 0;
        this.wingFrameCount = 3;
        this.wingAnimationSpeed = 0.15;
        this.cloudPositions = this.generateClouds();
        
        // Load images
        this.loadImages();

        this.setupCanvas();
        this.setupEventListeners();
        this.resetGame();
    }

    setupCanvas() {
        // Make canvas responsive
        const resize = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        };
        
        window.addEventListener('resize', resize);
        resize();
    }

    setupEventListeners() {
        // Jump controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.gameActive) {
                    this.resetGame();
                    this.startGame();
                } else {
                    this.jump();
                }
            }
        });

        this.canvas.addEventListener('click', () => {
            if (!this.gameActive) {
                this.resetGame();
                this.startGame();
            } else {
                this.jump();
            }
        });
    }

    resetGame() {
        this.bird = {
            x: this.canvas.width / 4,
            y: this.canvas.height / 2,
            velocity: 0,
            size: 30
        };

        this.pipes = [];
        this.score = 0;
        this.gameActive = false;
        this.currentScoreElement.textContent = '0';
        this.overlay.classList.remove('hidden');
        this.overlay.querySelector('.message').textContent = 
            'Press Space or Click to Start';

        // Draw initial state
        this.draw();
    }

    startGame() {
        this.gameActive = true;
        this.overlay.classList.add('hidden');
        this.lastPipeSpawn = Date.now();
        this.gameLoop();
    }

    jump() {
        this.bird.velocity = this.jumpForce;
    }

    update() {
        if (!this.gameActive) return;

        // Update bird
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        // Spawn new pipes
        if (Date.now() - this.lastPipeSpawn > this.pipeSpawnInterval) {
            this.spawnPipe();
            this.lastPipeSpawn = Date.now();
        }

        // Update pipes
        this.pipes.forEach(pipe => {
            pipe.x -= this.gameSpeed;
        });

        // Remove off-screen pipes
        this.pipes = this.pipes.filter(pipe => pipe.x + this.pipeWidth > 0);

        // Check collisions
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }

        // Update score
        this.pipes.forEach(pipe => {
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.currentScoreElement.textContent = this.score;
            }
        });

        // Update clouds
        this.cloudPositions.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.size < 0) {
                cloud.x = this.canvas.width;
                cloud.y = Math.random() * (this.canvas.height / 2);
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds (simple circles)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.cloudPositions.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size/2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(cloud.x + cloud.size/3, cloud.y, cloud.size/3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(cloud.x - cloud.size/3, cloud.y, cloud.size/3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw pipes
        this.pipes.forEach(pipe => {
            // Pipe body
            this.ctx.fillStyle = '#43a047';
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            // Bottom pipe
            this.ctx.fillRect(
                pipe.x,
                pipe.topHeight + this.pipeGap,
                this.pipeWidth,
                this.canvas.height - (pipe.topHeight + this.pipeGap)
            );

            // Pipe caps
            this.ctx.fillStyle = '#2e7d32';
            // Top pipe cap
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, this.pipeWidth + 10, 20);
            // Bottom pipe cap
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight + this.pipeGap, this.pipeWidth + 10, 20);
        });

        // Draw bird
        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        
        // Bird rotation based on velocity
        this.birdRotation = Math.max(-0.5, Math.min(Math.PI / 4, this.bird.velocity * 0.1));
        this.ctx.rotate(this.birdRotation);

        // Bird body
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bird.size/2, 0, Math.PI * 2);
        this.ctx.fill();

        // Wing (animated)
        this.wingFrame = (this.wingFrame + this.wingAnimationSpeed) % Math.PI;
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.arc(
            -5, 
            0, 
            this.bird.size/3, 
            0 + this.wingFrame, 
            Math.PI + this.wingFrame
        );
        this.ctx.fill();

        // Eye
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(5, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Beak
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.moveTo(10, 0);
        this.ctx.lineTo(20, -3);
        this.ctx.lineTo(20, 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();

        // Draw ground
        const groundGradient = this.ctx.createLinearGradient(0, this.canvas.height - 20, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#81C784');
        groundGradient.addColorStop(1, '#66BB6A');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);
    }

    spawnPipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

        this.pipes.push({
            x: this.canvas.width,
            topHeight,
            passed: false
        });
    }

    checkCollision() {
        // Check floor/ceiling
        if (this.bird.y < 0 || this.bird.y > this.canvas.height) {
            return true;
        }

        // Check pipes
        return this.pipes.some(pipe => {
            const birdRight = this.bird.x + this.bird.size/2;
            const birdLeft = this.bird.x - this.bird.size/2;
            const pipeRight = pipe.x + this.pipeWidth;
            
            if (birdLeft > pipeRight || birdRight < pipe.x) {
                return false;
            }

            const birdTop = this.bird.y - this.bird.size/2;
            const birdBottom = this.bird.y + this.bird.size/2;

            return birdTop < pipe.topHeight || 
                   birdBottom > pipe.topHeight + this.pipeGap;
        });
    }

    gameOver() {
        this.gameActive = false;
        const coinsEarned = Math.floor(this.score / 5);
        
        // Update high score if current score is higher
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('flappyHighScore', this.highScore);
        }
        
        // Show coin popup first
        window.coins.showGameResult(
            'Game Over!',
            this.score,
            coinsEarned,
            `Coins earned: 1 per 5 points\nHigh Score: ${this.highScore}`
        );

        // Show restart message in game overlay
        this.overlay.classList.remove('hidden');
        this.overlay.querySelector('.message').textContent = 'Press Space or Click to Start';
        this.overlay.querySelector('.controls').textContent = 'Space/Click to Jump';
    }

    gameLoop() {
        if (!this.gameActive) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    loadImages() {
        this.images = {};
        const imageNames = ['bird', 'pipeTop', 'pipeBottom', 'cloud'];
        
        imageNames.forEach(name => {
            this.images[name] = new Image();
            this.images[name].src = `Pictures/${name}.png`;
        });
    }

    generateClouds() {
        const clouds = [];
        for (let i = 0; i < 5; i++) {
            clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height / 2),
                speed: 0.5 + Math.random() * 0.5,
                size: 50 + Math.random() * 30
            });
        }
        return clouds;
    }
}

// Initialize game
const game = new FlappyBird(); 