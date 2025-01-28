class LevelManager {
    constructor() {
        this.levels = [];
        // Use a more secure hash - this is just an example
        this.adminHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // This is 'password' hashed
    }

    saveLevel(levelData, levelNumber) {
        if (!this.isAdmin()) return;
        
        // Encrypt level data
        const encryptedData = this.encryptLevelData(levelData);
        localStorage.setItem(`level_${levelNumber}`, encryptedData);
    }

    loadLevel(levelNumber) {
        const encryptedData = localStorage.getItem(`level_${levelNumber}`);
        if (encryptedData) {
            return this.decryptLevelData(encryptedData);
        }
        return null;
    }

    async loginAsAdmin(password) {
        // Hash the password (in a real app, use a proper crypto library)
        const hashedPassword = await this.hashPassword(password);
        
        if (hashedPassword === this.adminHash) {
            // Store admin session securely
            const sessionToken = this.generateSessionToken();
            localStorage.setItem('adminSession', sessionToken);
            localStorage.setItem('adminExpiry', Date.now() + (24 * 60 * 60 * 1000)); // 24 hour expiry
            return true;
        }
        return false;
    }

    isAdmin() {
        const sessionToken = localStorage.getItem('adminSession');
        const expiry = localStorage.getItem('adminExpiry');
        
        if (!sessionToken || !expiry) return false;
        
        // Check if session has expired
        if (Date.now() > parseInt(expiry)) {
            this.logout();
            return false;
        }
        
        return true;
    }

    logout() {
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminExpiry');
    }

    // Helper methods
    async hashPassword(password) {
        // In a real app, use a proper crypto library
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    generateSessionToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
} 