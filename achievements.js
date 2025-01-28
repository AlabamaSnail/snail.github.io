class AchievementsManager {
    constructor() {
        this.achievements = {};
        this.initializeAchievements();
        this.loadProgress();
        this.setupPageTracking();
        
        // Update display if we're on the achievements page
        if (window.location.pathname.includes('achievements.html')) {
            this.updateDisplay();
        }
    }

    initializeAchievements() {
        this.achievements = {
            // Game achievements
            'ttt_easy': {
                name: 'Baby Steps',
                description: 'Win against the Easy bot in Tic Tac Toe',
                game: 'Tic Tac Toe',
                progress: 0,
                target: 1,
                unlocked: false
            },
            'ttt_medium': {
                name: 'Getting Better',
                description: 'Win against the Medium bot in Tic Tac Toe',
                game: 'Tic Tac Toe',
                progress: 0,
                target: 1,
                unlocked: false
            },
            'ttt_hard': {
                name: 'Master Tactician',
                description: 'Win against the Hard bot in Tic Tac Toe',
                game: 'Tic Tac Toe',
                progress: 0,
                target: 1,
                unlocked: false
            },
            // Page visit achievements
            'explorer': {
                name: 'Explorer',
                description: 'Visit all main pages',
                category: 'Navigation',
                progress: 0,
                target: 4,  // Home, About, Games, Projects
                unlocked: false
            },
            'game_enthusiast': {
                name: 'Game Enthusiast',
                description: 'Try all available games',
                category: 'Games',
                progress: 0,
                target: 6,  // Number of games
                unlocked: false
            }
        };
    }

    setupPageTracking() {
        // Track page visits
        const currentPage = window.location.pathname;
        const visitedPages = new Set(JSON.parse(localStorage.getItem('visitedPages') || '[]'));
        
        visitedPages.add(currentPage);
        localStorage.setItem('visitedPages', JSON.stringify([...visitedPages]));

        // Update explorer achievement
        const mainPages = ['/index.html', '/about.html', '/games.html', '/projects.html'];
        const visitedMainPages = mainPages.filter(page => visitedPages.has(page));
        this.updateProgress('explorer', visitedMainPages.length);

        // Update game enthusiast achievement
        const gamePages = ['/tictactoe.html', '/snake.html', '/minesweeper.html', 
                          '/flappybird.html', '/sudoku.html', '/agario.html'];
        const visitedGames = gamePages.filter(page => visitedPages.has(page));
        this.updateProgress('game_enthusiast', visitedGames.length);
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('gameAchievements');
        if (savedProgress) {
            const saved = JSON.parse(savedProgress);
            for (const id in saved) {
                if (this.achievements[id]) {
                    this.achievements[id].progress = saved[id].progress;
                    this.achievements[id].unlocked = saved[id].unlocked;
                }
            }
        }
    }

    saveProgress() {
        const progress = {};
        for (const id in this.achievements) {
            progress[id] = {
                progress: this.achievements[id].progress,
                unlocked: this.achievements[id].unlocked
            };
        }
        localStorage.setItem('gameAchievements', JSON.stringify(progress));
    }

    updateProgress(achievementId, progress) {
        if (this.achievements[achievementId]) {
            const achievement = this.achievements[achievementId];
            achievement.progress = Math.min(progress, achievement.target);
            achievement.unlocked = achievement.progress >= achievement.target;
            this.saveProgress();
            this.updateDisplay();
            
            if (achievement.unlocked) {
                this.showUnlockNotification(achievement);
            }
        }
    }

    showUnlockNotification(achievement) {
        // Create popup element
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="icon">
                <i class="fas fa-trophy"></i>
            </div>
            <div class="content">
                <h4 class="title">Achievement Unlocked!</h4>
                <p class="description">${achievement.name}</p>
                <div class="achievement-progress-animation">
                    <div class="achievement-progress-bar"></div>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Trigger animations
        setTimeout(() => {
            popup.classList.add('show');
            const progressBar = popup.querySelector('.achievement-progress-bar');
            progressBar.style.width = '100%';
        }, 100);

        // Remove popup after animation
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 3000);
    }

    updateDisplay() {
        const grid = document.getElementById('achievementsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        // Group achievements by category
        const categories = {};
        for (const id in this.achievements) {
            const achievement = this.achievements[id];
            const category = achievement.category || achievement.game || 'Other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({ id, ...achievement });
        }

        // Create category sections
        for (const category in categories) {
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'achievement-category';
            categoryHeader.textContent = category;
            grid.appendChild(categoryHeader);

            categories[category].forEach(achievement => {
                const card = document.createElement('div');
                card.className = `achievement-card ${achievement.unlocked ? '' : 'locked'}`;
                
                card.innerHTML = `
                    <div class="icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h3>${achievement.name}</h3>
                    <p class="description">${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="achievement-progress-bar" style="width: ${(achievement.progress / achievement.target) * 100}%"></div>
                    </div>
                    <p class="achievement-stats">${achievement.progress}/${achievement.target}</p>
                `;

                grid.appendChild(card);
            });
        }
    }
}

// Initialize achievements globally
window.achievements = new AchievementsManager(); 