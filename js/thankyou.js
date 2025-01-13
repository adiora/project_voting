import { auth } from '../firebase/firebase.js';

document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = "../pages/login.html";
    }).catch((error) => {
        console.error("Error logging out: ", error);
    });
});
