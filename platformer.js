class PlatformerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game settings
        this.currentLevel = 1;
        this.maxLevels = 20;
        this.gravity = 0.5;
        this.friction = 0.8;
        
        // Player properties
        this.player = {
            x: 100,
            y: 100,
            width: 32,
            height: 48,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpForce: -12,
            isJumping: false
        };
        
        // Game state
        this.gameStarted = true;
        this.platforms = [];
        this.collectibles = [];
        
        this.setupCanvas();
        this.setupControls();
        this.loadLevel(1);
        this.gameLoop();

        // Add level select controls
        this.setupLevelSelect();
        
        // Setup admin login
        this.setupAdminLogin();
    }

    setupCanvas() {
        const resize = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientWidth * (9/16);
            this.loadLevel(this.currentLevel); // Reload level when canvas resizes
        };
        
        window.addEventListener('resize', resize);
        resize();
    }

    setupControls() {
        this.keys = {};
        
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for game controls
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
            
            this.keys[e.code] = true;
            
            if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.player.isJumping) {
                this.player.velocityY = this.player.jumpForce;
                this.player.isJumping = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    setupLevelSelect() {
        document.getElementById('prevLevel').addEventListener('click', () => {
            if (this.currentLevel > 1) {
                this.currentLevel--;
                this.loadLevel(this.currentLevel);
            }
        });

        document.getElementById('nextLevel').addEventListener('click', () => {
            if (this.currentLevel < this.maxLevels) {
                this.currentLevel++;
                this.loadLevel(this.currentLevel);
            }
        });

        document.getElementById('restartLevel').addEventListener('click', () => {
            this.loadLevel(this.currentLevel);
        });
    }

    setupAdminLogin() {
        const loginButton = document.getElementById('adminLogin');
        loginButton.addEventListener('click', async () => {
            const password = prompt('Enter admin password:');
            if (!password) return;

            const levelManager = new LevelManager();
            const success = await levelManager.loginAsAdmin(password);
            
            if (success) {
                alert('Admin login successful!');
                document.getElementById('editorLink').style.display = 'block';
                // Show any other admin controls
            } else {
                alert('Invalid password');
            }
        });
    }

    checkAdmin() {
        const levelManager = new LevelManager();
        if (levelManager.isAdmin()) {
            document.getElementById('editorLink').style.display = 'block';
            // Show other admin controls
        }
    }

    loadLevel(levelNum) {
        // Try to load custom level first
        const levelManager = new LevelManager();
        const customLevel = levelManager.loadLevel(levelNum);
        
        if (customLevel) {
            // Load custom level data
            this.loadCustomLevel(customLevel);
        } else {
            // Load default level
            this.loadDefaultLevel(levelNum);
        }
        
        // Update level display
        document.getElementById('currentLevel').textContent = levelNum;
    }

    loadCustomLevel(levelData) {
        this.platforms = levelData.platforms || [];
        this.collectibles = levelData.collectibles || [];
        this.enemies = levelData.enemies || [];
        // ... load other level elements
    }

    loadDefaultLevel(levelNum) {
        this.currentLevel = levelNum;
        document.getElementById('currentLevel').textContent = levelNum;
        
        // Reset player position
        this.player.x = 100;
        this.player.y = 100;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        
        // Clear existing arrays
        this.platforms = [];
        this.collectibles = [];
        
        const levelHeight = this.canvas.height;
        const levelWidth = this.canvas.width;
        
        // Add level-specific layouts
        switch(levelNum) {
            case 1: // Tutorial Level - Basic jumping
                this.platforms = [
                    { x: 0, y: levelHeight - 40, width: levelWidth, height: 40 },
                    { x: 300, y: levelHeight - 150, width: 200, height: 20 },
                    { x: 600, y: levelHeight - 250, width: 200, height: 20 }
                ];
                this.addCoins(350, levelHeight - 200, 3, 50);
                break;

            case 2: // Gentle Stairway
                for(let i = 0; i < 5; i++) {
                    this.platforms.push({
                        x: 100 + (i * 180),
                        y: levelHeight - 100 - (i * 60), // Reduced height difference
                        width: 150,
                        height: 20
                    });
                }
                this.platforms.push({ x: 0, y: levelHeight - 40, width: levelWidth, height: 40 });
                // Place coins along the stairway
                for(let i = 0; i < 4; i++) {
                    this.addCoins(150 + (i * 180), levelHeight - 160 - (i * 60), 2, 40);
                }
                break;

            case 3: // Platforms with Safe Gaps
                this.platforms = [
                    { x: 0, y: levelHeight - 40, width: 250, height: 40 },
                    { x: 350, y: levelHeight - 40, width: 250, height: 40 },
                    { x: 700, y: levelHeight - 40, width: 250, height: 40 },
                    { x: 150, y: levelHeight - 150, width: 150, height: 20 },
                    { x: 400, y: levelHeight - 200, width: 150, height: 20 },
                    { x: 650, y: levelHeight - 150, width: 150, height: 20 }
                ];
                // Place coins in reachable locations
                this.addCoins(200, levelHeight - 200, 2, 50);
                this.addCoins(450, levelHeight - 250, 2, 50);
                this.addCoins(700, levelHeight - 200, 2, 50);
                break;

            case 4: // Vertical Challenge (Made Easier)
                // Main platforms alternating sides
                for(let i = 0; i < 3; i++) {
                    // Left platform
                    this.platforms.push({
                        x: 100,
                        y: levelHeight - 100 - (i * 120),
                        width: 200,
                        height: 20
                    });
                    // Right platform
                    this.platforms.push({
                        x: levelWidth - 300,
                        y: levelHeight - 160 - (i * 120),
                        width: 200,
                        height: 20
                    });
                    // Middle stepping stone
                    this.platforms.push({
                        x: (levelWidth - 100) / 2,
                        y: levelHeight - 130 - (i * 120),
                        width: 100,
                        height: 20
                    });
                }
                // Ground platform
                this.platforms.push({ x: 0, y: levelHeight - 40, width: levelWidth, height: 40 });
                
                // Add coins in achievable positions
                this.addCoins(150, levelHeight - 150, 2, 40);
                this.addCoins(levelWidth - 250, levelHeight - 210, 2, 40);
                this.addCoins(levelWidth/2 - 25, levelHeight - 180, 2, 40);
                break;

            case 5: // Zigzag Challenge
                // Create a zigzag pattern of platforms
                for(let i = 0; i < 4; i++) {
                    const xPos = i % 2 === 0 ? 100 : levelWidth - 300;
                    this.platforms.push({
                        x: xPos,
                        y: levelHeight - 100 - (i * 100),
                        width: 200,
                        height: 20
                    });
                    // Add connecting platforms
                    if (i < 3) {
                        this.platforms.push({
                            x: Math.min(xPos + 200, levelWidth - 300),
                            y: levelHeight - 150 - (i * 100),
                            width: 100,
                            height: 20
                        });
                    }
                }
                this.platforms.push({ x: 0, y: levelHeight - 40, width: levelWidth, height: 40 });
                
                // Add coins along the zigzag path
                for(let i = 0; i < 3; i++) {
                    const xPos = i % 2 === 0 ? 150 : levelWidth - 250;
                    this.addCoins(xPos, levelHeight - 150 - (i * 100), 2, 40);
                }
                break;

            default: // Random platform layout for higher levels
                const platformCount = 5 + Math.floor(levelNum/2);
                for(let i = 0; i < platformCount; i++) {
                    this.platforms.push({
                        x: Math.random() * (levelWidth - 200),
                        y: levelHeight - 100 - (Math.random() * (levelHeight - 200)),
                        width: 100 + Math.random() * 100,
                        height: 20
                    });
                }
                this.platforms.push({ x: 0, y: levelHeight - 40, width: levelWidth, height: 40 });
                this.addCoins(200, levelHeight - 200, levelNum + 2, 80);
                break;
        }
    }

    // Helper method to add coins in a row
    addCoins(startX, startY, count, spacing) {
        for(let i = 0; i < count; i++) {
            this.collectibles.push({
                x: startX + (i * spacing),
                y: startY,
                width: 20,
                height: 20,
                value: 1
            });
        }
    }

    update() {
        // Handle movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX *= this.friction;
        }
        
        // Apply gravity
        this.player.velocityY += this.gravity;
        
        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Handle collisions
        this.handleCollisions();
        
        // Check collectibles
        this.checkCollectibles();
        
        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));

        // Check if level is complete (all coins collected)
        if (this.collectibles.length === 0) {
            if (this.currentLevel < this.maxLevels) {
                this.currentLevel++;
                this.loadLevel(this.currentLevel);
            } else {
                // Game complete!
                this.gameStarted = false;
                if (window.coins) {
                    window.coins.showGameResult(
                        'Game Complete!',
                        null,
                        20, // Bonus coins for completing the game
                        'You beat all levels!'
                    );
                }
            }
        }
    }

    handleCollisions() {
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                // Vertical collision
                if (this.player.velocityY > 0) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                } else if (this.player.velocityY < 0) {
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
            }
        });
    }

    checkCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y);
    }

    checkCollectibles() {
        this.collectibles = this.collectibles.filter(coin => {
            if (this.checkCollision(this.player, coin)) {
                // Add to global coins
                if (window.coins) {
                    window.coins.addCoins(coin.value);
                }
                return false;
            }
            return true;
        });
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw platforms
        this.ctx.fillStyle = '#555';
        this.platforms.forEach(platform => {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Draw collectibles
        this.ctx.fillStyle = '#FFD700';
        this.collectibles.forEach(coin => {
            this.ctx.beginPath();
            this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw player
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }

    gameLoop() {
        if (this.gameStarted) {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const game = new PlatformerGame();
    const adminKey = localStorage.getItem('adminKey');
    const editorLinks = document.querySelectorAll('.admin-only');
    
    if (adminKey === 'your_admin_key') {
        editorLinks.forEach(link => link.style.display = 'block');
    }
});