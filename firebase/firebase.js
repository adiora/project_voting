// Import the necessary modules from the Firebase SDK (modular style)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc,updateDoc, addDoc, query, where, writeBatch } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

// Your Firebase configuration object (replace with your actual Firebase project credentials)
const firebaseConfig = {
    apiKey: "AIzaSyAJfrreyoM9E4o8MNJ5kpP5OSmLmoO5JCI",
    authDomain: "project-ideas-ce66a.firebaseapp.com",
    projectId: "project-ideas-ce66a",
    storageBucket: "project-ideas-ce66a.firebasestorage.app",
    messagingSenderId: "508031794242",
    appId: "1:508031794242:web:ab31a43b4644f45c6401db",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Auth and Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase Auth and Firestore instances for use in other files
export { auth, db, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, writeBatch };
