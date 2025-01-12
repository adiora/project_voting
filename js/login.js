import { auth, GoogleAuthProvider, signInWithPopup } from '../firebase/firebase.js';

document.getElementById('login-btn').addEventListener('click', () => {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
        .then(() => {
            window.location.href = "../pages/voting.html";
        })
        .catch((error) => {
            console.error("Error signing in:", error);
        });
});
