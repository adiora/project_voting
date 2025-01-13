import { db, collection, getDoc, getDocs, writeBatch, doc, updateDoc } from "../firebase/firebase.js";

async function clearResults() {
    try {
        console.log("Clearing previous results...");

        const resultCollection = collection(db, "result");
        const resultsSnapshot = await getDocs(resultCollection);

        if (resultsSnapshot.empty) {
            console.log("No previous results to clear.");
            return;
        }

        const batch = writeBatch(db);

        resultsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log("Previous results cleared successfully.");
    } catch (error) {
        console.error("Error clearing previous results:", error);
    }
}

async function calculateAndStoreResults() {
    try {
        await clearResults(); // First, clear all previous results

        console.log("Processing votes...");

        const projectsSnapshot = await getDocs(collection(db, "projects"));
        const projects = [];
        projectsSnapshot.forEach(doc => {
            const projectData = doc.data();
            projects.push(projectData.name); // Only store projectName
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

        const batch = writeBatch(db);
        const resultCollection = collection(db, "result");

        for (const projectName in projectPoints) {
            if (projectPoints.hasOwnProperty(projectName)) {
                if (projects.includes(projectName)) { // Ensure project exists
                    console.log(`${projectName}: ${projectPoints[projectName]} points`);
                    batch.set(doc(resultCollection), {
                        projectName: projectName,
                        points: projectPoints[projectName]
                    });
                }
            }
        }

        await batch.commit();
        showStatusMessage("Results have been successfully stored!", "success");

    } catch (error) {
        console.error("Error calculating and storing results:", error);
        showStatusMessage("Error calculating and storing results. Please try again.", "error");
    }
}


async function toggleVotesProcessedStatus() {
    try {
        const settingsRef = doc(db, "settings", "general"); // Assuming 'general' is the document
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
    const statusMessageDiv = document.getElementById("statusMessage");
    if (statusMessageDiv) {
        statusMessageDiv.textContent = message;
        statusMessageDiv.classList.remove("success", "error");
        statusMessageDiv.classList.add(type);
        statusMessageDiv.style.display = "block";
    }
}

// Wait for DOM content to load before attaching event listeners
window.addEventListener("DOMContentLoaded", () => {
    const calculateBtn = document.getElementById("calculateBtn");
    const toggleVotesProcessedBtn = document.getElementById("toggleVotesProcessed");

    if (calculateBtn) {
        calculateBtn.addEventListener("click", calculateAndStoreResults);
    }

    if (toggleVotesProcessedBtn) {
        toggleVotesProcessedBtn.addEventListener("click", toggleVotesProcessedStatus);
    }
});