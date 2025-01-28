class Plinko {
    constructor() {
        this.canvas = document.getElementById('plinkoCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bet = 10;
        this.balls = [];
        this.ballCount = 1;  // Number of balls to drop
        this.isDropping = false;
        
        // Physics settings
        this.gravity = 0.5;
        this.bounce = 0.6;
        this.friction = 0.99;
        
        // Game elements
        this.pegs = [];
        this.slots = [];
        this.multipliers = [5, 2.5, 2, 1, 0.5, 0, 0.5, 1, 2, 2.5, 5];
        this.pendingResults = [];  // Track results for multiple balls
        
        // Setup
        this.setupCanvas();
        this.setupPegs();
        this.setupSlots();
        this.setupEventListeners();
        this.updateDisplay();
        
        // Animation loop
        requestAnimationFrame(() => this.gameLoop());
    }

    setupCanvas() {
        // Make canvas responsive
        const resize = () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = 500;
            this.pegRadius = this.canvas.width / 80;
            this.ballRadius = this.pegRadius * 0.8;
            
            // Recalculate positions
            this.setupPegs();
            this.setupSlots();
        };
        
        window.addEventListener('resize', resize);
        resize();
    }

    setupPegs() {
        this.pegs = [];
        const rows = 8;
        const spacing = this.canvas.width / 12;
        
        for (let row = 0; row < rows; row++) {
            const offset = row % 2 === 0 ? 0 : spacing / 2;
            const pegsInRow = row % 2 === 0 ? 11 : 10;
            
            for (let i = 0; i < pegsInRow; i++) {
                this.pegs.push({
                    x: offset + spacing + (i * spacing),
                    y: 100 + (row * spacing),
                    radius: this.pegRadius
                });
            }
        }
    }

    setupSlots() {
        this.slots = [];
        const slotWidth = this.canvas.width / 10;
        
        for (let i = 0; i < 10; i++) {
            this.slots.push({
                x: i * slotWidth,
                width: slotWidth,
                multiplier: this.multipliers[i]
            });
        }
    }

    setupEventListeners() {
        document.getElementById('dropButton').addEventListener('click', () => this.dropBalls());
        
        document.getElementById('decreaseBet').addEventListener('click', () => {
            if (this.bet > 10) {
                this.bet -= 10;
                this.updateDisplay();
            }
        });

        document.getElementById('increaseBet').addEventListener('click', () => {
            if (this.bet < window.coins.coins) {
                this.bet += 10;
                this.updateDisplay();
            }
        });

        document.getElementById('decreaseBalls').addEventListener('click', () => {
            if (this.ballCount > 1) {
                this.ballCount--;
                this.updateDisplay();
            }
        });

        document.getElementById('increaseBalls').addEventListener('click', () => {
            if (this.bet * (this.ballCount + 1) <= window.coins.coins) {
                this.ballCount++;
                this.updateDisplay();
            }
        });

        const addCoinsButton = document.getElementById('addCoinsTest');
        if (addCoinsButton) {
            addCoinsButton.addEventListener('click', () => {
                window.coins.addCoins(100);
                this.updateDisplay();
            });
        }
    }

    updateDisplay() {
        document.getElementById('betAmount').textContent = this.bet;
        document.getElementById('ballCount').textContent = this.ballCount;
        document.getElementById('dropButton').disabled = 
            this.isDropping || window.coins.coins < (this.bet * this.ballCount);
    }

    async dropBalls() {
        if (this.isDropping || window.coins.coins < (this.bet * this.ballCount)) return;

        this.isDropping = true;
        this.pendingResults = [];  // Reset pending results
        window.coins.addCoins(-(this.bet * this.ballCount));
        this.updateDisplay();

        // Drop balls with slight delay between each
        for (let i = 0; i < this.ballCount; i++) {
            const x = this.canvas.width / 2 + (Math.random() * 40 - 20);
            this.balls.push({
                x: x,
                y: 50,
                vx: 0,
                vy: 0,
                radius: this.ballRadius
            });
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    checkCollisions(ball) {
        // Check peg collisions
        this.pegs.forEach(peg => {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < ball.radius + peg.radius) {
                // Calculate collision response
                const angle = Math.atan2(dy, dx);
                const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                
                ball.x = peg.x + (ball.radius + peg.radius) * Math.cos(angle);
                ball.y = peg.y + (ball.radius + peg.radius) * Math.sin(angle);
                
                // Add some randomness to the bounce
                const bounceAngle = angle + (Math.random() * 0.5 - 0.25);
                ball.vx = Math.cos(bounceAngle) * speed * this.bounce;
                ball.vy = Math.sin(bounceAngle) * speed * this.bounce;
            }
        });

        // Check wall collisions
        if (ball.x < ball.radius) {
            ball.x = ball.radius;
            ball.vx *= -this.bounce;
        }
        if (ball.x > this.canvas.width - ball.radius) {
            ball.x = this.canvas.width - ball.radius;
            ball.vx *= -this.bounce;
        }

        // Check slot collision (bottom)
        if (ball.y > this.canvas.height - ball.radius) {
            const slotIndex = Math.floor(ball.x / (this.canvas.width / this.multipliers.length));
            const multiplier = this.multipliers[slotIndex];
            
            // Store result instead of showing immediately
            this.pendingResults.push({
                multiplier: multiplier,
                winnings: this.bet * multiplier
            });

            return true; // Remove ball
        }

        return false;
    }

    gameLoop() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pegs
        this.ctx.fillStyle = '#444';
        this.pegs.forEach(peg => {
            this.ctx.beginPath();
            this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw slots
        this.ctx.strokeStyle = '#444';
        this.slots.forEach(slot => {
            this.ctx.beginPath();
            this.ctx.moveTo(slot.x, this.canvas.height - 50);
            this.ctx.lineTo(slot.x + slot.width, this.canvas.height - 50);
            this.ctx.stroke();
        });

        // Update and draw balls
        this.balls = this.balls.filter(ball => {
            // Apply gravity
            ball.vy += this.gravity;
            
            // Apply friction
            ball.vx *= this.friction;
            ball.vy *= this.friction;
            
            // Update position
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Draw ball
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Check collisions
            return !this.checkCollisions(ball);
        });

        // Check if all balls are done and we have results to show
        if (this.balls.length === 0 && this.isDropping && this.pendingResults.length > 0) {
            this.showResults();
            this.isDropping = false;
            this.updateDisplay();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    showResults() {
        // Calculate total winnings
        let totalWinnings = 0;
        let multiplierText = '';
        
        // Sort results by multiplier for better display
        this.pendingResults.sort((a, b) => b.multiplier - a.multiplier);

        this.pendingResults.forEach(result => {
            totalWinnings += result.winnings;
            // Format multiplier with proper decimal places
            const formattedMultiplier = result.multiplier.toFixed(1).replace('.0', '');
            multiplierText += `x${formattedMultiplier} `;
        });

        // Show combined results with improved formatting
        if (totalWinnings > 0) {
            window.coins.showGameResult(
                'Winner!',
                null,
                Math.floor(totalWinnings), // Round down to whole coins
                this.formatMultiplierText(this.pendingResults)
            );
        } else {
            window.coins.showGameResult(
                'Try Again!',
                null,
                -this.bet * this.ballCount,
                this.formatMultiplierText(this.pendingResults)
            );
        }

        // Clear pending results
        this.pendingResults = [];
    }

    formatMultiplierText(results) {
        // Group identical multipliers
        const grouped = results.reduce((acc, result) => {
            const key = result.multiplier.toFixed(1);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        // Format as "2x5 1x2.5 3x1" etc.
        return Object.entries(grouped)
            .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
            .map(([mult, count]) => {
                const formattedMult = parseFloat(mult).toFixed(1).replace('.0', '');
                return count > 1 ? `${count}×${formattedMult}` : `x${formattedMult}`;
            })
            .join(' ');
    }
}

// Initialize game
const game = new Plinko(); 