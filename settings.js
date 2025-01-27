const themes = {
    default: {
        gradientStart: '#1a1a1a',
        gradientEnd: '#404040'
    },
    blue: {
        gradientStart: '#1a1a2a',
        gradientEnd: '#2a4060'
    },
    purple: {
        gradientStart: '#1a1a24',
        gradientEnd: '#403850'
    },
    green: {
        gradientStart: '#1a241a',
        gradientEnd: '#2a4030'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const themeButtons = document.querySelectorAll('.theme-btn');
    const customControls = document.querySelector('.custom-theme-controls');
    const primaryColorPicker = document.getElementById('primary-color');
    const secondaryColorPicker = document.getElementById('secondary-color');
    const applyCustomBtn = document.querySelector('.apply-custom');

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        applyTheme(theme.gradientStart, theme.gradientEnd);
        
        // Update active button
        themeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === theme.name) {
                btn.classList.add('active');
            }
        });
    }

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
                
                // Update active state
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
        
        // Update active state
        themeButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('.custom-theme').classList.add('active');
    });
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