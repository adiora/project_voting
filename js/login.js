import { auth, db, GoogleAuthProvider, signInWithPopup, collection, getDocs, query, where, doc, getDoc } from '../firebase/firebase.js';

document.getElementById('login-btn').addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const { email } = result.user;

        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
            const settingsRef = doc(db, 'settings', 'general');
            const settingsSnapshot = await getDoc(settingsRef);

            if (settingsSnapshot.exists()) {
                const { votesProcessed } = settingsSnapshot.data();
                window.location.href = votesProcessed ? "../pages/result.html" : "../pages/voting.html";
            } else {
                console.error("Settings not found");
            }
        } else {
            alert("Access denied: Your email is not pre-registered.");
            auth.signOut();
        }
    } catch (error) {
        console.error("Error signing in:", error);
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('error-dialog').showModal();
    }
});
