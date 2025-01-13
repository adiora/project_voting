import { auth, db, collection, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, doc, addDoc, getDoc } from "../firebase/firebase.js";

const loginBtn = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const addUserBtn = document.getElementById("addUserBtn");
const messageBox = document.getElementById("message");

loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, GoogleAuthProvider).catch(error => displayMessage("Error: " + error.message, true));
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data().role === "admin") {
            document.getElementById("adminSection").style.display = "block";
            loginBtn.style.display = "none";
        } else {
            displayMessage("Access Denied: You are not an admin", true);
        }
    }
});

addUserBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
        displayMessage("Please enter an email.", true);
        return;
    }
    await addDoc(collection(db, "users"), { email: email });
    displayMessage("User successfully added!", false);
    emailInput.value = "";
});

function displayMessage(msg, isError) {
    messageBox.textContent = msg;
    messageBox.style.color = isError ? "red" : "green";
}