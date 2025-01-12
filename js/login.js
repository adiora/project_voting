import { auth, db, GoogleAuthProvider, signInWithPopup, collection, getDocs, query, where } from '../firebase/firebase.js';

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
            // Email is registered, allow login
            window.location.href = "../pages/voting.html";
        } else {
            // Email is not registered, sign the user out
            alert("Access denied: Your email is not pre-registered.");
            auth.signOut();
        }
    } catch (error) {
        console.error("Error signing in:", error);
    }
});
