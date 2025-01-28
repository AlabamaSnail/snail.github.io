import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

class AdminAuth {
    constructor() {
        this.auth = getAuth();
        this.db = getFirestore();
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Check if user has admin role
            const userDoc = await getDoc(doc(this.db, 'admins', user.uid));
            if (!userDoc.exists()) {
                await signOut(this.auth);
                throw new Error('Not authorized as admin');
            }

            // Store admin session token securely
            const token = await user.getIdToken();
            sessionStorage.setItem('adminToken', token);
            
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    async logout() {
        try {
            await signOut(this.auth);
            sessionStorage.removeItem('adminToken');
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    async isAdmin() {
        try {
            const user = getAuth().currentUser;
            if (!user) return false;

            const token = await user.getIdToken(true);
            const storedToken = sessionStorage.getItem('adminToken');
            
            if (token !== storedToken) {
                await this.logout();
                return false;
            }

            const userDoc = await getDoc(doc(this.db, 'admins', user.uid));
            return userDoc.exists();
        } catch (error) {
            console.error('Admin check error:', error);
            return false;
        }
    }
}

export default AdminAuth; 