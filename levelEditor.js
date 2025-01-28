class LevelEditor {
    constructor() {
        // Check admin status first
        const levelManager = new LevelManager();
        if (!levelManager.isAdmin()) {
            alert('Admin access required');
            window.location.href = 'platformer.html';
            return;
        }

        this.currentTool = 'platform';
        this.selectedElement = null;
        this.isAdmin = false;
        this.elements = {
            platforms: [],
            coins: [],
            enemies: [],
            powerups: [],
            spikes: [],
            movingPlatforms: [],
            checkpoints: []
        };
        
        // Check admin status
        this.checkAdminStatus();
        this.setupEditor();
    }

    checkAdminStatus() {
        // You can implement this with a password system or server-side verification
        const adminPassword = prompt("Enter admin password (leave blank for player mode):");
        this.isAdmin = adminPassword === "your_secret_password"; // Replace with secure verification
        
        if (this.isAdmin) {
            document.getElementById('adminControls').style.display = 'block';
        }
    }

    setupEditor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Add editor toolbar
        this.createToolbar();
        
        // Add event listeners for editor
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        
        const tools = [
            { id: 'platform', icon: '⬛', name: 'Platform' },
            { id: 'movingPlatform', icon: '↔️', name: 'Moving Platform' },
            { id: 'coin', icon: '🪙', name: 'Coin' },
            { id: 'enemy', icon: '👾', name: 'Enemy' },
            { id: 'spike', icon: '△', name: 'Spike' },
            { id: 'powerup', icon: '⭐', name: 'Power-up' },
            { id: 'checkpoint', icon: '🚩', name: 'Checkpoint' }
        ];

        tools.forEach(tool => {
            const button = document.createElement('button');
            button.innerHTML = `${tool.icon} ${tool.name}`;
            button.onclick = () => this.selectTool(tool.id);
            toolbar.appendChild(button);
        });

        // Add save/load buttons for admin
        if (this.isAdmin) {
            const saveButton = document.createElement('button');
            saveButton.innerHTML = '💾 Save Level';
            saveButton.onclick = () => this.saveLevel();
            toolbar.appendChild(saveButton);
        }

        document.body.insertBefore(toolbar, this.canvas);
    }
} 