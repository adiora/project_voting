import { auth, db, GoogleAuthProvider, signInWithPopup, collection, getDocs, query, where, doc, getDoc } from '../firebase/firebase.js';

document.getElementById('login-btn').addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userEmail = user.email;

        // Check if the email exists in the "registeredUsers" collection in Firestore
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Email is registered, check if voting is processed
            const settingsRef = doc(db, 'settings', 'general'); // Assuming 'general' is the document
            const settingsSnapshot = await getDoc(settingsRef);

            if (settingsSnapshot.exists()) {
                const voteProcessed = settingsSnapshot.data().votesProcessed;
                if (voteProcessed) {
                    window.location.href = "../pages/result.html";
                } else {
                        window.location.href = "../pages/voting.html";
                }
            } else {
                console.error("Settings not found");
            }
        } else {
            // Email is not registered, sign the user out
            alert("Access denied: Your email is not pre-registered.");
            auth.signOut();
        }
    } catch (error) {
        console.error("Error signing in:", error);
    }
});
