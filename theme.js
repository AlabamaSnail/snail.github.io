import AdminAuth from './adminAuth.js';

const themes = {
    default: {
        gradientStart: '#000000',
        gradientEnd: '#303030'
    },
    blue: {
        gradientStart: '#0a1a3a',
        gradientEnd: '#1e90ff'
    },
    purple: {
        gradientStart: '#2a0a3a',
        gradientEnd: '#9932cc'
    },
    green: {
        gradientStart: '#0a3a1a',
        gradientEnd: '#32cd32'
    }
};

// Add this function to load theme immediately
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        applyTheme(theme.gradientStart, theme.gradientEnd);
    }
}

// Call it immediately before DOM content loaded
loadSavedTheme();

document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const closeSettings = document.getElementById('closeSettings');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const customControls = document.querySelector('.custom-theme-controls');
    const primaryColorPicker = document.getElementById('primary-color');
    const secondaryColorPicker = document.getElementById('secondary-color');
    const applyCustomBtn = document.querySelector('.apply-custom');

    // Settings overlay controls
    settingsIcon.addEventListener('click', () => {
        settingsOverlay.classList.add('active');
    });

    closeSettings.addEventListener('click', () => {
        settingsOverlay.classList.remove('active');
    });

    settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
            settingsOverlay.classList.remove('active');
        }
    });

    // Theme button clicks
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('custom-theme')) {
                customControls.style.display = 'block';
                return;
            }

            const themeName = btn.dataset.theme;
            const theme = themes[themeName];
            
            if (theme) {
                applyTheme(theme.gradientStart, theme.gradientEnd);
                saveTheme(themeName, theme.gradientStart, theme.gradientEnd);
                
                themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    // Apply custom theme
    applyCustomBtn.addEventListener('click', () => {
        const primary = primaryColorPicker.value;
        const secondary = secondaryColorPicker.value;
        
        applyTheme(primary, secondary);
        saveTheme('custom', primary, secondary);
        
        themeButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('.custom-theme').classList.add('active');
    });

    new AdminPanel();
});

function applyTheme(gradientStart, gradientEnd) {
    document.documentElement.style.setProperty('--gradient-start', gradientStart);
    document.documentElement.style.setProperty('--gradient-end', gradientEnd);
}

function saveTheme(name, gradientStart, gradientEnd) {
    const theme = {
        name,
        gradientStart,
        gradientEnd
    };
    localStorage.setItem('theme', JSON.stringify(theme));
}

// Add this to your existing theme.js file
document.getElementById('submitBug').addEventListener('click', function() {
    const game = document.getElementById('bugGameSelect').value;
    const description = document.getElementById('bugDescription').value;
    const message = document.getElementById('bugSubmitMessage');

    if (!game || !description) {
        message.textContent = 'Please fill out all fields';
        message.className = 'bug-message error';
        return;
    }

    // Here you would typically send this to a server
    // For now, we'll just create a mailto link
    const subject = `Bug Report: ${game}`;
    const body = `Game/Page: ${game}%0D%0A%0D%0ADescription: ${description}`;
    window.location.href = `mailto:Austinjr2006@gmail.com?subject=${subject}&body=${body}`;

    // Clear form and show success message
    document.getElementById('bugGameSelect').value = '';
    document.getElementById('bugDescription').value = '';
    message.textContent = 'Bug report sent!';
    message.className = 'bug-message success';

    // Clear message after 3 seconds
    setTimeout(() => {
        message.style.display = 'none';
    }, 3000);
});

// Add to existing theme.js
class AdminPanel {
    constructor() {
        this.adminAuth = new AdminAuth();
        this.setupAdminPanel();
    }

    setupAdminPanel() {
        const adminSection = document.createElement('div');
        adminSection.className = 'setting-group admin-section';
        adminSection.innerHTML = `
            <h3>Admin Panel</h3>
            <div class="admin-login-form">
                <input type="email" id="adminEmail" placeholder="Email" />
                <input type="password" id="adminPassword" placeholder="Password" />
                <button class="button login-btn">Login</button>
                <div class="login-message"></div>
            </div>
            <div class="admin-controls" style="display: none;">
                <button class="button logout-btn">Logout</button>
                <div class="admin-actions">
                    <button class="button edit-levels">Edit Levels</button>
                    <button class="button manage-coins">Manage Coins</button>
                    <button class="button view-stats">View Stats</button>
                </div>
            </div>
        `;

        const settingsPanel = document.querySelector('.settings-panel');
        if (settingsPanel) {
            settingsPanel.appendChild(adminSection);
            this.bindEvents();
        }
    }

    async bindEvents() {
        const loginBtn = document.querySelector('.login-btn');
        const logoutBtn = document.querySelector('.logout-btn');
        const messageDiv = document.querySelector('.login-message');
        
        loginBtn?.addEventListener('click', async () => {
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            
            try {
                const success = await this.adminAuth.login(email, password);
                if (success) {
                    this.showAdminControls();
                    messageDiv.textContent = 'Login successful!';
                    messageDiv.style.color = '#4CAF50';
                } else {
                    messageDiv.textContent = 'Invalid credentials';
                    messageDiv.style.color = '#f44336';
                }
            } catch (error) {
                messageDiv.textContent = 'Login failed: ' + error.message;
                messageDiv.style.color = '#f44336';
            }
        });

        logoutBtn?.addEventListener('click', async () => {
            await this.adminAuth.logout();
            this.hideAdminControls();
            messageDiv.textContent = 'Logged out successfully';
            messageDiv.style.color = '#4CAF50';
        });

        // Check admin status on page load
        this.checkAdminStatus();
    }

    async checkAdminStatus() {
        const isAdmin = await this.adminAuth.isAdmin();
        if (isAdmin) {
            this.showAdminControls();
        } else {
            this.hideAdminControls();
        }
    }

    showAdminControls() {
        document.querySelector('.admin-login-form').style.display = 'none';
        document.querySelector('.admin-controls').style.display = 'block';
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    hideAdminControls() {
        document.querySelector('.admin-login-form').style.display = 'block';
        document.querySelector('.admin-controls').style.display = 'none';
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
} 