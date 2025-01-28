class SlotMachine {
    constructor() {
        // Symbols and their weights
        this.symbols = ['🍒', '7️⃣', '💎', '🎰', '⭐', '🍀'];
        this.symbolWeights = [
            0.35,  // Cherry (common)
            0.05,  // Seven (rare)
            0.10,  // Diamond (uncommon)
            0.05,  // Slots (rare)
            0.20,  // Star (common)
            0.25   // Clover (common)
        ];

        // Game state
        this.bet = 10;
        this.isSpinning = false;
        this.autoSpinActive = false;
        this.heldReels = [false, false, false];
        this.jackpot = parseInt(localStorage.getItem('slotsJackpot')) || 5000;

        // DOM elements
        this.reels = Array.from(document.querySelectorAll('.reel'));
        this.reelStrips = this.reels.map(reel => reel.querySelector('.reel-strip'));
        this.holdButtons = Array.from(document.querySelectorAll('.hold-button'));
        this.betDisplay = document.getElementById('betAmount');
        this.spinButton = document.getElementById('spinButton');
        this.autoSpinButton = document.getElementById('autoSpinButton');
        this.jackpotDisplay = document.querySelector('.jackpot-amount');

        this.setupGame();
        this.updateDisplay();
    }

    setupGame() {
        // Initialize reel strips with more symbols for better randomization
        this.reelStrips.forEach(strip => {
            strip.innerHTML = ''; // Clear existing symbols
            // Add more symbols to create a longer strip
            for (let i = 0; i < 15; i++) {
                const symbol = document.createElement('div');
                symbol.className = 'symbol';
                symbol.textContent = this.getWeightedSymbol();
                strip.appendChild(symbol);
            }
        });

        // Event listeners
        this.spinButton.addEventListener('click', () => this.spin());
        this.autoSpinButton.addEventListener('click', () => this.toggleAutoSpin());
        
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

        // Hold button listeners
        this.holdButtons.forEach((button, index) => {
            button.addEventListener('click', () => this.toggleHold(index));
        });

        // Add test button functionality
        const addCoinsButton = document.getElementById('addCoinsTest');
        if (addCoinsButton) {
            addCoinsButton.addEventListener('click', () => {
                window.coins.addCoins(100);
                this.updateDisplay();
            });
        }
    }

    toggleHold(index) {
        if (!this.isSpinning) {
            this.heldReels[index] = !this.heldReels[index];
            this.holdButtons[index].classList.toggle('active');
        }
    }

    toggleAutoSpin() {
        this.autoSpinActive = !this.autoSpinActive;
        this.autoSpinButton.classList.toggle('active');
        if (this.autoSpinActive && !this.isSpinning) {
            this.spin();
        }
    }

    updateDisplay() {
        this.betDisplay.textContent = this.bet;
        this.jackpotDisplay.textContent = this.jackpot;
        this.spinButton.disabled = this.isSpinning || window.coins.coins < this.bet;
        this.autoSpinButton.disabled = window.coins.coins < this.bet;
    }

    async spin() {
        if (this.isSpinning || window.coins.coins < this.bet) return;

        this.isSpinning = true;
        window.coins.addCoins(-this.bet);
        
        // Add to jackpot
        this.jackpot += Math.floor(this.bet * 0.1);
        localStorage.setItem('slotsJackpot', this.jackpot);

        // Generate results first
        const results = this.reels.map((_, index) => 
            this.heldReels[index] ? 
                this.reelStrips[index].children[7].textContent : // Use middle of 15 symbols
                this.getWeightedSymbol()
        );

        // Reset non-held reels and start spinning
        this.reels.forEach((reel, index) => {
            if (!this.heldReels[index]) {
                reel.classList.remove('winner');
                reel.classList.add('spinning');
                
                // Randomize symbols during spin
                const strip = this.reelStrips[index];
                strip.style.transform = 'translateY(0)';
                const symbols = Array.from({length: 15}, () => this.getWeightedSymbol());
                symbols[7] = results[index]; // Set middle symbol to result
                symbols.forEach((symbol, i) => {
                    strip.children[i].textContent = symbol;
                });
            }
        });

        // Spin animation
        for (let i = 0; i < this.reels.length; i++) {
            if (!this.heldReels[i]) {
                await new Promise(resolve => setTimeout(resolve, 400 * (i + 1)));
                this.reels[i].classList.remove('spinning');
                
                // Set the final result
                const strip = this.reelStrips[i];
                strip.children[7].textContent = results[i];
                
                // Update surrounding symbols randomly
                for (let j = 0; j < strip.children.length; j++) {
                    if (j !== 7) { // Don't change the result symbol
                        strip.children[j].textContent = this.getWeightedSymbol();
                    }
                }
            }
        }

        // Calculate winnings
        const winnings = this.calculateWinnings(results);
        
        if (winnings > 0) {
            // Handle jackpot win
            if (winnings === 'JACKPOT') {
                const jackpotWin = this.jackpot;
                this.jackpot = 5000; // Reset jackpot
                localStorage.setItem('slotsJackpot', this.jackpot);
                window.coins.showGameResult('JACKPOT!', null, jackpotWin, results.join(''));
            } else {
                window.coins.showGameResult('Winner!', null, winnings, results.join(''));
            }
            this.reels.forEach(reel => reel.classList.add('winner'));
        } else {
            window.coins.showGameResult('Try Again!', null, -this.bet, results.join(''));
        }

        // Reset holds after spin
        this.heldReels.fill(false);
        this.holdButtons.forEach(btn => btn.classList.remove('active'));

        this.isSpinning = false;
        this.updateDisplay();

        // Continue auto-spin if active
        if (this.autoSpinActive && window.coins.coins >= this.bet) {
            setTimeout(() => this.spin(), 1500);
        } else {
            this.autoSpinActive = false;
            this.autoSpinButton.classList.remove('active');
        }
    }

    calculateWinnings(results) {
        const counts = {};
        results.forEach(symbol => counts[symbol] = (counts[symbol] || 0) + 1);
        
        const maxCount = Math.max(...Object.values(counts));
        const symbol = Object.keys(counts).find(key => counts[key] === maxCount);

        if (maxCount === 3) {
            switch(symbol) {
                case '🎰': return 'JACKPOT';
                case '7️⃣': return this.bet * 25;
                case '💎': return this.bet * 15;
                case '⭐': return this.bet * 10;
                case '🍀': return this.bet * 5;
                case '🍒': return this.bet * 3;
            }
        }
        return 0;
    }

    getWeightedSymbol() {
        const random = Math.random();
        let sum = 0;
        for (let i = 0; i < this.symbolWeights.length; i++) {
            sum += this.symbolWeights[i];
            if (random < sum) return this.symbols[i];
        }
        // If we somehow get here, return a random symbol instead of always cherries
        return this.symbols[Math.floor(Math.random() * this.symbols.length)];
    }
}

// Initialize game
const game = new SlotMachine(); 