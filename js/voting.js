import { auth, db, collection, getDocs, addDoc, query, where } from '../firebase/firebase.js';

// Ensure user is authenticated
auth.onAuthStateChanged(user => {
    if (!user) {
        redirectToLogin();
    } else {
        initializeVoting(user.uid);
    }
});

function redirectToLogin() {
    window.location.href = "login.html";
}

function initializeVoting(userId) {
    checkIfVoted(userId);
    fetchProjects();
    startVoteTimer();

    document.getElementById("submitBtn").addEventListener("click", confirmSubmit);
    document.getElementById("closeSubmitMessageBtn").addEventListener("click", closeDialog);
    document.getElementById("closeErrorBtn").addEventListener("click", closeDialog);
    document.getElementById("closeConfirmationBtn").addEventListener("click", closeDialog);
    document.getElementById("confirmSubmitBtn").addEventListener("click", submitVote);
}

let selectedVotes = { first: null, second: null, third: null };
let voteTimer = 10 * 60;
let warningShown = false;
let projects = [];

function checkIfVoted(userId) {
    const votesRef = collection(db, "votes");
    const q = query(votesRef, where("userId", "==", userId)); 
    getDocs(q).then(snapshot => {
        if (!snapshot.empty) {
            showThankYouPage();
        }
    }).catch(error => console.error("Error checking vote status:", error));
}

function showThankYouPage() {
    window.location.href = "thankyou.html";
}

function fetchProjects() {
    const container = document.getElementById("projectCards");
    if (!container) return console.error("Error: #projectCards not found!");

    getDocs(collection(db, "projects")).then(snapshot => {
        snapshot.forEach(doc => {
            const project = doc.data().name;
            projects.push(project);
            const card = createProjectCard(project);
            container.appendChild(card);
        });
    }).catch(error => console.error("Error fetching projects:", error));
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.classList.add('col-md-4', 'mt-3');
    card.innerHTML = `
        <div class="card p-3">
            <h5>${project}</h5>
            <div class="choice-number" id="choice-${project}"></div>
        </div>
    `;
    card.addEventListener('click', () => selectVote(project));
    return card;
}

function selectVote(project) {
    if (selectedVotes.first === project) selectedVotes.first = null;
    else if (selectedVotes.second === project) selectedVotes.second = null;
    else if (selectedVotes.third === project) selectedVotes.third = null;
    else assignVote(project);
    updateChoiceNumbers();
    updateUI();
}

function assignVote(project) {
    if (!selectedVotes.first) selectedVotes.first = project;
    else if (!selectedVotes.second) selectedVotes.second = project;
    else if (!selectedVotes.third) selectedVotes.third = project;
}

function updateChoiceNumbers() {
    projects.forEach(project => {
        const choiceElement = document.getElementById(`choice-${project}`);
        choiceElement.innerText = '';
    });

    if (selectedVotes.first) document.getElementById(`choice-${selectedVotes.first}`).innerText = '1st';
    if (selectedVotes.second) document.getElementById(`choice-${selectedVotes.second}`).innerText = '2nd';
    if (selectedVotes.third) document.getElementById(`choice-${selectedVotes.third}`).innerText = '3rd';
}

function updateUI() {
    document.querySelectorAll(".card").forEach(card => {
        card.classList.remove("selected");
        if (card.innerText.includes(selectedVotes.first) || card.innerText.includes(selectedVotes.second) || card.innerText.includes(selectedVotes.third)) {
            card.classList.add("selected");
        }
    });
}

function confirmSubmit() {
    if (!selectedVotes.first || !selectedVotes.second || !selectedVotes.third) {
        showErrorMessage("Please select three projects before submitting your vote.");
        return;
    }
    document.getElementById("confirmationDialog").style.display = "block";
}

function submitVote() {
    auth.onAuthStateChanged(user => {
        if (!user) {
            redirectToLogin();
            return;
        }

        const votesRef = collection(db, "votes");
        const q = query(votesRef, where("userId", "==", user.uid)); 
        getDocs(q).then(snapshot => {
            if (!snapshot.empty) {
                showThankYouPage();
            } else {
                addDoc(collection(db, "votes"), {
                    userId: user.uid,
                    first: selectedVotes.first,
                    second: selectedVotes.second,
                    third: selectedVotes.third
                }).then(() => showThankYouPage())
                  .catch(err => console.error("Error submitting vote:", err));
            }
        }).catch(err => console.error("Error checking user vote:", err));
    });
}

function showErrorMessage(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.querySelector("p").innerText = message;
    errorMessage.style.display = "block";
}

function closeDialog() {
    document.getElementById("submitMessage").style.display = "none";
    document.getElementById("errorMessage").style.display = "none";
    document.getElementById("confirmationDialog").style.display = "none";
}

function startVoteTimer() {
    const timerElement = document.getElementById("timerBtn");
    setInterval(() => {
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

function autoSubmitVote() {
    const unselectedProjects = projects.filter(project => ![selectedVotes.first, selectedVotes.second, selectedVotes.third].includes(project));
    if (!selectedVotes.first && unselectedProjects.length) selectedVotes.first = unselectedProjects.pop();
    if (!selectedVotes.second && unselectedProjects.length) selectedVotes.second = unselectedProjects.pop();
    if (!selectedVotes.third && unselectedProjects.length) selectedVotes.third = unselectedProjects.pop();
    submitVote();
}
