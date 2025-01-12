import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getFirestore, collection, getDoc, getDocs, addDoc, writeBatch, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

// Firebase configuration
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
const db = getFirestore(app);

async function calculateAndStoreResults() {
    try {
        console.log("Processing votes...");

        const projectsSnapshot = await getDocs(collection(db, "projects"));
        const projects = [];
        projectsSnapshot.forEach(doc => {
            const projectData = doc.data();
            projects.push({
                projectId: doc.id,
                projectName: projectData.name
            });
        });

        const projectPoints = {};
        const votesSnapshot = await getDocs(collection(db, "votes"));

        votesSnapshot.forEach(doc => {
            const data = doc.data();
            const { first, second, third } = data;

            if (first) projectPoints[first] = (projectPoints[first] || 0) + 3;
            if (second) projectPoints[second] = (projectPoints[second] || 0) + 2;
            if (third) projectPoints[third] = (projectPoints[third] || 0) + 1;
        });

        for (const projectId in projectPoints) {
            if (projectPoints.hasOwnProperty(projectId)) {
                const project = projects.find(proj => proj.projectId === projectId);
                if (project) {
                    console.log(`${project.projectName}: ${projectPoints[projectId]} points`);
                    await addDoc(collection(db, "result"), {
                        projectId: project.projectId,
                        projectName: project.projectName,
                        points: projectPoints[projectId]
                    });
                }
            }
        }

        showStatusMessage("Results have been successfully stored!", "success");

    } catch (error) {
        console.error("Error calculating and storing results:", error);
        showStatusMessage("Error calculating and storing results. Please try again.", "error");
    }
}

async function toggleVotesProcessedStatus() {
    try {
        const settingsRef = doc(db, 'settings', 'general'); // Assuming 'general' is the document
        const settingsSnapshot = await getDoc(settingsRef);

        if (!settingsSnapshot.exists()) {
            console.log("Settings document not found!");
            return;
        }

        const currentStatus = settingsSnapshot.data().votesProcessed;

        await updateDoc(settingsRef, {
            votesProcessed: !currentStatus
        });

        showStatusMessage(`Votes processed status updated to: ${!currentStatus}`, "success");
    } catch (error) {
        console.error("Error updating vote processed status:", error);
        showStatusMessage("Error toggling votes processed status. Please try again.", "error");
    }
}

function showStatusMessage(message, type) {
    const statusMessageDiv = document.getElementById('statusMessage');
    statusMessageDiv.textContent = message;
    statusMessageDiv.classList.remove("success", "error");
    statusMessageDiv.classList.add(type);
    statusMessageDiv.style.display = "block";
}

// Wait for DOM content to load before attaching event listeners
window.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateBtn');
    const toggleVotesProcessedBtn = document.getElementById('toggleVotesProcessed');

    calculateBtn.addEventListener('click', () => {
        calculateAndStoreResults();
    });

    toggleVotesProcessedBtn.addEventListener('click', () => {
        toggleVotesProcessedStatus();
    });
});
