import { auth, db, collection, getDocs, addDoc, query, where } from '../firebase/firebase.js';

// Check if user is authenticated
auth.onAuthStateChanged((user) => {
    if (!user) {
        sendToLoginPage(); // Redirect to login page if not authenticated
    } else {
        checkIfVoted(user.uid);
    }
});

function sendToLoginPage() {
    window.location.href = "login.html";
}

function showThankYouPage() {
    window.location.href = "thankyou.html";
}

// ✅ Check if the user has already voted
function checkIfVoted(userId) {
    const votesRef = collection(db, "votes");
    const q = query(votesRef, where("userId", "==", userId)); 
    getDocs(q)
        .then(snapshot => {
            if (!snapshot.empty) {
                // User has already voted
                showThankYouPage();
            }
        })
        .catch(error => console.error("Error checking vote status:", error));
}

// ✅ List of Project Ideas
const projects = [];

let selectedVotes = { first: null, second: null, third: null };
let voteTimer = 10 * 60; // 10 minutes in seconds
let timerInterval;
let warningShown = false;

// ✅ Wait until the page loads to create cards and start the timer
document.addEventListener("DOMContentLoaded", () => {
    
    fetchProjects();
    startVoteTimer();

    // Add event listener to submit button
    document.getElementById("submitBtn").addEventListener("click", confirmSubmit);
    document.getElementById("closeSubmitMessageBtn").addEventListener("click", closeDialog);
    document.getElementById("closeErrorBtn").addEventListener("click", closeDialog);
    document.getElementById("closeConfirmationBtn").addEventListener("click", closeDialog);
    document.getElementById("confirmSubmitBtn").addEventListener("click", submitVote);
});

function fetchProjects() {
    const container = document.getElementById("projectCards");
    if (!container) {
        console.error("Error: #projectCards not found!");
        return;
    }
    container.innerHTML = "";  // Clear the container

    // Fetch projects from Firestore
    getDocs(collection(db, "projects")).then(snapshot => {
        snapshot.forEach(doc => {
            const project = doc.data().name;  // Assuming each project has a "name" field
            projects.push(project);  // Add project name to the array
            const card = document.createElement('div');
            card.classList.add('col-md-4', 'mt-3');
            card.innerHTML = `
                <div class="card p-3">
                    <h5>${project}</h5>
                    <div class="choice-number" id="choice-${project}"></div>
                </div>
            `;
            card.addEventListener('click', () => selectVote(project));
            container.appendChild(card);
        });
    }).catch(error => console.error("Error fetching projects:", error));
}

// ✅ Handle Vote Selection and Update Choice Numbers
function selectVote(project) {
    // Deselect the project if already selected
    if (selectedVotes.first === project) {
        selectedVotes.first = null;
    } else if (selectedVotes.second === project) {
        selectedVotes.second = null;
    } else if (selectedVotes.third === project) {
        selectedVotes.third = null;
    } else {
        // Assign first choice if no choice is made
        if (!selectedVotes.first) {
            selectedVotes.first = project;
        } 
        // Assign second choice if first is selected
        else if (!selectedVotes.second) {
            selectedVotes.second = project;
        } 
        // Assign third choice if first and second are selected
        else if (!selectedVotes.third) {
            selectedVotes.third = project;
        }
    }
    updateChoiceNumbers();
    updateUI();
}

// ✅ Update choice numbers on the cards dynamically
function updateChoiceNumbers() {
    // Reset all choice numbers first
    projects.forEach(project => {
        const choiceElement = document.getElementById(`choice-${project}`);
        choiceElement.innerText = '';
    });

    // Update with the correct choice numbers
    if (selectedVotes.first) {
        document.getElementById(`choice-${selectedVotes.first}`).innerText = '1st';
    }
    if (selectedVotes.second) {
        document.getElementById(`choice-${selectedVotes.second}`).innerText = '2nd';
    }
    if (selectedVotes.third) {
        document.getElementById(`choice-${selectedVotes.third}`).innerText = '3rd';
    }
}

// ✅ Highlight Selected Votes
function updateUI() {
    document.querySelectorAll(".card").forEach(card => {
        card.classList.remove("selected");
        if (card.innerText.includes(selectedVotes.first) || 
            card.innerText.includes(selectedVotes.second) || 
            card.innerText.includes(selectedVotes.third)) {
            card.classList.add("selected");
        }
    });
}

// ✅ Ask for confirmation before submitting vote
function confirmSubmit() {
    if (!selectedVotes.first || !selectedVotes.second || !selectedVotes.third) {
        showErrorMessage("Please select three projects before submitting your vote.");
        return;
    }
    document.getElementById("confirmationDialog").style.display = "block";
}

// ✅ Submit Vote & Store User ID to Prevent Duplicate Votes
function submitVote() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            sendToLoginPage();
            return; // No user logged in
        }

        // Store vote along with user ID
        addDoc(collection(db, "votes"), {
            userId: user.uid,  // Store unique user ID
            first: selectedVotes.first,
            second: selectedVotes.second,
            third: selectedVotes.third
        }).then(() => {
            showThankYouPage();
        }).catch(err => console.error("Error submitting vote:", err));
    });
}

// ✅ Show Error Message
function showErrorMessage(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.querySelector("p").innerText = message;
    errorMessage.style.display = "block";
}

// ✅ Close Dialog
function closeDialog() {
    document.getElementById("submitMessage").style.display = "none";
    document.getElementById("errorMessage").style.display = "none";
    document.getElementById("confirmationDialog").style.display = "none";
}

// ✅ Start the vote timer (10 minutes)
function startVoteTimer() {
    const timerElement = document.getElementById("timer");
    timerInterval = setInterval(() => {
        if (voteTimer > 0) {
            voteTimer--;
            const minutes = Math.floor(voteTimer / 60);
            const seconds = voteTimer % 60;
            timerElement.innerText = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            if (voteTimer < 60 && !warningShown) {
                showWarningDialog();
                warningShown = true;
            }
        } else {
            clearInterval(timerInterval);
            autoSubmitVote();
        }
    }, 1000);
}

function showWarningDialog() {
    document.getElementById("submitMessage").style.display = "block";
}

// ✅ Automatically submit a random vote for unselected projects
// ✅ Automatically submit a random vote for unselected projects
function autoSubmitVote() {
    // Step 1: Identify the selected projects
    const selectedProjects = [selectedVotes.first, selectedVotes.second, selectedVotes.third];

    // Step 2: Filter out the unselected projects (null values in selectedVotes)
    const unselectedProjects = projects.filter(project => 
        !selectedProjects.includes(project)
    );

    // Select projects only for the unselected slots
    if (!selectedVotes.first && unselectedProjects.length > 0) {
        const randomIndex = Math.floor(Math.random() * unselectedProjects.length);
        selectedVotes.first = unselectedProjects.splice(randomIndex, 1)[0]; // Remove selected project
    }
    
    if (!selectedVotes.second && unselectedProjects.length > 0) {
        const randomIndex = Math.floor(Math.random() * unselectedProjects.length);
        selectedVotes.second = unselectedProjects.splice(randomIndex, 1)[0]; // Remove selected project
    }
    
    if (!selectedVotes.third && unselectedProjects.length > 0) {
        const randomIndex = Math.floor(Math.random() * unselectedProjects.length);
        selectedVotes.third = unselectedProjects.splice(randomIndex, 1)[0]; // Remove selected project
    }

    // Step 4: After selecting all three projects, submit the vote
    if (selectedVotes.first && selectedVotes.second && selectedVotes.third) {
        submitVote();
    } else {
        console.error("Error: Could not complete the selection of three projects.");
    }
}


// ✅ Fetch & Display Results when voting ends
function showResults() {
    document.getElementById("results").style.display = "block";
    getDocs(collection(db, "votes")).then(snapshot => {
        let votes = {};
        snapshot.docs.forEach(doc => {
            let data = doc.data();
            votes[data.first] = (votes[data.first] || 0) + 3;
            votes[data.second] = (votes[data.second] || 0) + 2;
            votes[data.third] = (votes[data.third] || 0) + 1;
        });

        displayResults(votes);
    });
}

// ✅ Display Results Sorted by Points
function displayResults(votes) {
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";
    Object.entries(votes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([project, points]) => {
            resultList.innerHTML += `<li class="list-group-item">${project} - ${points} points</li>`;
        });
}
