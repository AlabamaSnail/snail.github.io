class BlobWars {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Game settings
        this.worldSize = 4000;
        this.minScale = 0.1;  // Allow much smaller scale for bigger view
        this.maxScale = 0.8;  // Keep max scale the same
        this.viewportScale = 0.8;
        this.gameSpeed = 0.4; // Increased from 0.3 to 0.4
        
        // Game objects
        this.player = null;
        this.blobs = new Map(); // All blobs including player and AI
        this.food = new Set();
        this.aiEnabled = true;
        
        // Colors
        this.colors = [
            '#FF5733', '#33FF57', '#3357FF', '#FF33F5',
            '#33FFF5', '#F5FF33', '#FF3333', '#33FF33'
        ];

        // Add AI names array
        this.aiNames = [
            'Blob Bob', 'Cell Master', 'Hungry Blob', 'Ninja Cell', 
            'Pro Blob', 'Sneaky Cell', 'Big Eater', 'Tiny Terror',
            'Blob Ross', 'Cell Fighter', 'Mass King', 'Silent Hunter',
            'Quick Blob', 'Smart Cell', 'Pixel Eater', 'Dot Muncher'
        ];

        this.sprintCost = 0.1; // Mass loss per frame while sprinting
        this.sprintSpeed = 1.8; // Sprint speed multiplier

        this.setupEventListeners();
        this.initGame();
        this.lastAIUpdate = Date.now();
        this.lastPerformanceCheck = Date.now();
        this.frameCount = 0;
        this.gameLoop();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    initGame() {
        // Create player
        this.spawnPlayer();
        
        // Create AI blobs
        for (let i = 0; i < 20; i++) {
            this.spawnAI();
        }
        
        // Create initial food
        for (let i = 0; i < 500; i++) {
            this.spawnFood();
        }
    }

    spawnPlayer() {
        const x = Math.random() * this.worldSize;
        const y = Math.random() * this.worldSize;
        this.player = new Blob(x, y, 20, 'Player', this.colors[0], true);
        this.blobs.set('player', this.player);
    }

    spawnAI() {
        const x = Math.random() * this.worldSize;
        const y = Math.random() * this.worldSize;
        const id = 'ai_' + Date.now() + Math.random();
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const name = this.aiNames[Math.floor(Math.random() * this.aiNames.length)];
        const ai = new Blob(x, y, 20, name, color, false);
        this.blobs.set(id, ai);
    }

    spawnFood() {
        const x = Math.random() * this.worldSize;
        const y = Math.random() * this.worldSize;
        const type = this.randomFoodType();
        this.food.add(new Food(x, y, type));
    }

    randomFoodType() {
        const types = [
            { chance: 0.7, type: 'normal' },    // 70% chance
            { chance: 0.2, type: 'special' },   // 20% chance
            { chance: 0.1, type: 'rare' }       // 10% chance
        ];
        
        const roll = Math.random();
        let cumulative = 0;
        
        for (const type of types) {
            cumulative += type.chance;
            if (roll <= cumulative) {
                return type.type;
            }
        }
        return 'normal';
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Track mouse state
        this.isMouseDown = false;
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click only
                this.isMouseDown = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isMouseDown = false;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.player) return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / this.viewportScale + this.player.x - this.canvas.width / 2 / this.viewportScale;
            const mouseY = (e.clientY - rect.top) / this.viewportScale + this.player.y - this.canvas.height / 2 / this.viewportScale;
            this.player.setTarget(mouseX, mouseY);
        });

        document.getElementById('respawnBtn').addEventListener('click', () => {
            if (this.player) this.blobs.delete('player');
            this.spawnPlayer();
        });

        document.getElementById('toggleAI').addEventListener('click', () => {
            this.aiEnabled = !this.aiEnabled;
            document.getElementById('toggleAI').textContent = this.aiEnabled ? 'Disable AI' : 'Enable AI';
        });
    }

    updateAI() {
        if (!this.aiEnabled) return;

        const now = Date.now();
        
        // Spawn new AI blobs every 2 seconds instead of continuously
        if (now - this.lastAIUpdate > 2000) {
            const aiCount = Array.from(this.blobs.values()).filter(blob => !blob.isPlayer).length;
            if (aiCount < 20) {
                this.spawnAI();
            }
            this.lastAIUpdate = now;
        }

        this.blobs.forEach((blob, id) => {
            if (id === 'player') return;

            // Always keep AI moving
            const state = this.analyzeEnvironment(blob);
            
            if (state.danger) {
                // Run away from danger
                const escapeX = blob.x + (blob.x - state.danger.x) * 2;
                const escapeY = blob.y + (blob.y - state.danger.y) * 2;
                blob.setTarget(escapeX, escapeY);
            } else if (state.prey) {
                // Chase prey if we're significantly bigger
                blob.setTarget(state.prey.x, state.prey.y);
            } else if (state.food) {
                // Go for food
                blob.setTarget(state.food.x, state.food.y);
            } else {
                // Always move in some direction
                if (!blob.hasTarget || this.distance(blob, {x: blob.targetX, y: blob.targetY}) < 50) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 500 + Math.random() * 500;
                    blob.setTarget(
                        blob.x + Math.cos(angle) * distance,
                        blob.y + Math.sin(angle) * distance
                    );
                    blob.hasTarget = true;
                }
            }
        });
    }

    update() {
        // Handle sprinting for player
        if (this.player && this.isMouseDown && this.player.radius > 20) {
            this.player.isSprinting = true;
            this.player.radius -= this.sprintCost;
        } else if (this.player) {
            this.player.isSprinting = false;
        }

        // Update all blobs with sprint state
        this.blobs.forEach(blob => blob.update(this.gameSpeed));
        
        // Check collisions
        this.checkCollisions();
        
        // Update AI
        this.updateAI();
        
        // Maintain food supply
        while (this.food.size < 500) {
            this.spawnFood();
        }

        // Update leaderboard
        this.updateLeaderboard();

        // Update viewport scale based on player size
        if (this.player) {
            // Adjust scale based on player size - larger player = smaller scale = wider view
            this.viewportScale = Math.max(
                this.minScale,
                Math.min(this.maxScale, (400 / this.player.radius))
            );
        }
    }

    checkCollisions() {
        // Optimize collision checks by using a grid system
        const gridSize = 100;
        const grid = new Map();

        // Add blobs to grid
        this.blobs.forEach((blob, id) => {
            const gridX = Math.floor(blob.x / gridSize);
            const gridY = Math.floor(blob.y / gridSize);
            const key = `${gridX},${gridY}`;
            if (!grid.has(key)) grid.set(key, new Set());
            grid.get(key).add({blob, id});
        });

        // Check collisions only with nearby blobs
        this.blobs.forEach((blob1, id1) => {
            const gridX = Math.floor(blob1.x / gridSize);
            const gridY = Math.floor(blob1.y / gridSize);

            // Check surrounding grid cells
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const key = `${gridX + dx},${gridY + dy}`;
                    if (grid.has(key)) {
                        grid.get(key).forEach(({blob: blob2, id: id2}) => {
                            if (id1 < id2) {  // Check each pair only once
                                const dist = this.distance(blob1, blob2);
                                const minDist = Math.max(blob1.radius, blob2.radius);
                                
                                if (dist < minDist) {
                                    // Determine which blob is larger
                                    if (blob1.radius > blob2.radius * 1.1) {
                                        blob1.grow(blob2.radius * 0.8);
                                        this.blobs.delete(id2);
                                        if (id2 === 'player') this.player = null;
                                    } else if (blob2.radius > blob1.radius * 1.1) {
                                        blob2.grow(blob1.radius * 0.8);
                                        this.blobs.delete(id1);
                                        if (id1 === 'player') this.player = null;
                                    }
                                }
                            }
                        });
                    }
                }
            }

            // Check food collisions with improved distance check
            this.food.forEach(food => {
                const dist = this.distance(blob1, food);
                if (dist < blob1.radius) {  // Changed from blob1.radius + food.radius
                    blob1.grow(food.value);
                    this.food.delete(food);
                    this.spawnFood();
                }
            });
        });
    }

    draw() {
        // Clear canvas with transparent background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Add a semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set viewport transform
        this.ctx.save();
        if (this.player) {
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.scale(this.viewportScale, this.viewportScale);
            this.ctx.translate(-this.player.x, -this.player.y);
        }

        // Draw grid
        this.drawGrid();

        // Draw food
        this.food.forEach(food => food.draw(this.ctx));

        // Sort blobs by size before drawing
        const sortedBlobs = Array.from(this.blobs.values())
            .sort((a, b) => a.radius - b.radius);  // Smaller blobs first

        // Draw blobs in order of size
        sortedBlobs.forEach(blob => blob.draw(this.ctx));

        this.ctx.restore();
    }

    drawGrid() {
        if (!this.player) return;

        const gridSize = 100;
        const startX = Math.floor(this.player.x / gridSize) * gridSize - (this.canvas.width / this.viewportScale);
        const startY = Math.floor(this.player.y / gridSize) * gridSize - (this.canvas.height / this.viewportScale);
        const endX = startX + (this.canvas.width / this.viewportScale) * 2;
        const endY = startY + (this.canvas.height / this.viewportScale) * 2;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Made grid more visible
        this.ctx.lineWidth = 1;

        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    updateLeaderboard() {
        const leaderboard = Array.from(this.blobs.values())
            .sort((a, b) => b.radius - a.radius)
            .slice(0, 10);

        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = '';
        
        leaderboard.forEach(blob => {
            const li = document.createElement('li');
            li.textContent = `${blob.name} (${Math.floor(blob.radius)})`;
            if (blob === this.player) li.style.color = '#4CAF50';
            leaderboardElement.appendChild(li);
        });

        if (this.player) {
            document.getElementById('mass').textContent = Math.floor(this.player.radius);
        }
    }

    distance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    gameLoop() {
        this.frameCount++;
        const now = Date.now();

        // Performance monitoring
        if (now - this.lastPerformanceCheck > 1000) {
            const fps = this.frameCount;
            this.frameCount = 0;
            this.lastPerformanceCheck = now;

            // If performance is poor, reduce some AI blobs
            if (fps < 30 && this.blobs.size > 10) {
                let count = 0;
                this.blobs.forEach((blob, id) => {
                    if (!blob.isPlayer && count < 5) {
                        this.blobs.delete(id);
                        count++;
                    }
                });
            }
        }

        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    analyzeEnvironment(blob) {
        const state = {
            danger: null,
            prey: null,
            food: null
        };

        // Detection ranges
        const dangerRange = 300;
        const preyRange = 200;
        const foodRange = 150;

        // Check for dangers (bigger blobs)
        this.blobs.forEach(otherBlob => {
            if (otherBlob === blob) return;
            const dist = this.distance(blob, otherBlob);

            if (otherBlob.radius > blob.radius * 1.1) {
                if (dist < dangerRange) {
                    state.danger = otherBlob;
                }
            } else if (blob.radius > otherBlob.radius * 1.1) {
                if (dist < preyRange && (!state.prey || dist < this.distance(blob, state.prey))) {
                    state.prey = otherBlob;
                }
            }
        });

        // Only look for food if no immediate threats or prey
        if (!state.danger && !state.prey) {
            this.food.forEach(food => {
                const dist = this.distance(blob, food);
                if (dist < foodRange && (!state.food || dist < this.distance(blob, state.food))) {
                    // Prefer rare food
                    if (!state.food || food.value > state.food.value) {
                        state.food = food;
                    }
                }
            });
        }

        return state;
    }
}

class Blob {
    constructor(x, y, radius, name, color, isPlayer) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.name = name;
        this.color = color;
        this.isPlayer = isPlayer;
        this.targetX = x;
        this.targetY = y;
        this.speed = 2;
        this.hasTarget = false;
        this.isSprinting = false;
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    update(gameSpeed = 1) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 1) {
            let speed = this.speed * Math.pow(100 / this.radius, 0.3) * gameSpeed;
            
            // Apply sprint multiplier if sprinting
            if (this.isSprinting) {
                speed *= 1.8;
            }
            
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
        }
    }

    grow(amount) {
        // Direct radius increase instead of area-based calculation
        this.radius += amount;
        
        // Update mass display if this is the player
        if (this.isPlayer) {
            document.getElementById('mass').textContent = Math.floor(this.radius);
        }
    }

    draw(ctx) {
        // Draw blob with sprint effect
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add sprint visual effect
        if (this.isSprinting) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw name
        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(12, this.radius / 2)}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y);
    }
}

class Food {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Different properties based on type
        switch(type) {
            case 'special':
                this.radius = 6;
                this.value = 2;  // Gold orbs give 2 mass
                this.color = 'rgba(255, 215, 0, 0.8)'; // Gold
                this.pulseSpeed = 0.05;
                break;
            case 'rare':
                this.radius = 8;
                this.value = 4;  // Purple orbs give 4 mass
                this.color = 'rgba(148, 0, 211, 0.8)'; // Purple
                this.pulseSpeed = 0.1;
                break;
            default: // normal
                this.radius = 4;
                this.value = 1;  // White orbs give 1 mass
                this.color = 'rgba(255, 255, 255, 0.8)';
                this.pulseSpeed = 0;
        }
        this.originalRadius = this.radius;
        this.time = Math.random() * Math.PI * 2;
    }

    draw(ctx) {
        // Update pulse animation
        if (this.pulseSpeed > 0) {
            this.time += this.pulseSpeed;
            this.radius = this.originalRadius * (1 + 0.2 * Math.sin(this.time));
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add glow effect for special and rare orbs
        if (this.type !== 'normal') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
                this.x, this.y, this.radius,
                this.x, this.y, this.radius * 1.5
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
}

// Change initialization to make game instance global
let game;
window.addEventListener('load', () => {
    game = new BlobWars();
}); 