class CoinManager {
    constructor() {
        this.coins = parseInt(localStorage.getItem('globalCoins')) || 100;
        this.setupDisplay();
    }

    setupDisplay() {
        // Create coin display if it doesn't exist
        if (!document.querySelector('.coin-display')) {
            const display = document.createElement('div');
            display.className = 'coin-display';
            display.innerHTML = `<i class="fas fa-coins"></i> <span>${this.coins}</span>`;
            document.body.appendChild(display);
        }
        this.updateDisplay();
    }

    updateDisplay() {
        const display = document.querySelector('.coin-display span');
        if (display) {
            display.textContent = this.coins;
        }
    }

    addCoins(amount, reason = '') {
        this.coins += amount;
        localStorage.setItem('globalCoins', this.coins);
        this.updateDisplay();
    }

    showGameResult(result, score = null, coins = 0, extraInfo = '') {
        const popup = document.createElement('div');
        popup.className = 'result-popup';
        
        let content = `
            <div class="result-popup-content ${result.toLowerCase()}">
                <h2>${result}</h2>
        `;

        if (score !== null) {
            content += `<p class="score">Score: ${score}</p>`;
        }

        if (extraInfo) {
            content += `<p class="extra-info">${extraInfo}</p>`;
        }

        if (coins > 0) {
            content += `
                <div class="coin-reward">
                    <div class="coin-sprite"></div>
                    <span>+${coins}</span>
                    <i class="fas fa-coins"></i>
                    <div class="coin-particles"></div>
                </div>
            `;
        }

        content += `<button class="continue-btn">Continue</button>`;
        content += `</div>`;

        popup.innerHTML = content;
        document.body.appendChild(popup);

        // Create coin particle effects if there are coins
        if (coins > 0) {
            const particlesContainer = popup.querySelector('.coin-particles');
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'coin-particle';
                particle.style.setProperty('--delay', `${Math.random() * 0.5}s`);
                particle.style.setProperty('--angle', `${Math.random() * 360}deg`);
                particle.style.setProperty('--distance', `${50 + Math.random() * 50}px`);
                particlesContainer.appendChild(particle);
            }
        }

        popup.offsetHeight; // Force reflow
        popup.classList.add('show');

        // Track total coins for achievements
        if (coins > 0) {
            const totalCoins = parseInt(localStorage.getItem('totalCoinsEarned') || '0');
            localStorage.setItem('totalCoinsEarned', totalCoins + coins);

            if (window.achievements) {
                const total = totalCoins + coins;
                window.achievements.updateProgress('coin_collector', total);
                window.achievements.updateProgress('high_roller', total);
                if (coins >= 100) {
                    window.achievements.updateProgress('jackpot', 1);
                }
            }

            this.addCoins(coins);
        }

        // Handle continue button
        popup.querySelector('.continue-btn').addEventListener('click', () => {
            popup.classList.remove('show');
            setTimeout(() => {
                popup.remove();
                // Find and reset the game
                const gameInstance = window.game || document.querySelector('.game-board')?.__game;
                if (gameInstance && typeof gameInstance.resetGame === 'function') {
                    gameInstance.resetGame();
                }
            }, 300);
        });
    }
}

// Initialize globally
window.coins = new CoinManager(); 