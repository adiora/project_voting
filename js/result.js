import { db, collection, getDocs } from '../firebase/firebase.js';

// Fetch results from Firestore
async function fetchResults() {
    const resultsSnapshot = await getDocs(collection(db, "result"));
    const results = [];

    resultsSnapshot.forEach(doc => {
        results.push(doc.data());
    });

    return results;
}

// Fetch all projects from Firestore (used to get projects with 0 points)
async function fetchProjects() {
    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const projects = [];

    projectsSnapshot.forEach(doc => {
        const projectData = doc.data();
        projects.push({
            projectId: doc.id,
            projectName: projectData.name
        });
    });

    return projects;
}

// Function to display the results in a chart
async function displayResults() {
    const results = await fetchResults();
    const projects = await fetchProjects();

    if (results.length === 0) {
        document.getElementById("chartContainer").innerHTML = "<p>No results available.</p>";
        return;
    }

    // Combine results and projects to get all projects (including those with 0 points)
    const allProjects = projects.map(project => {
        const result = results.find(r => r.projectName === project.projectName);
        return {
            projectName: project.projectName,
            points: result ? result.points : 0
        };
    });

    // Sort projects by points in descending order
    allProjects.sort((a, b) => b.points - a.points);

    // Extract top 5 projects for the bar chart
    const topProjects = allProjects.slice(0, 5);

    // Extract labels and data for the chart
    const labels = topProjects.map(r => r.projectName);
    const data = topProjects.map(r => r.points);

    // Highlight top 3 projects with different colors
    const backgroundColors = data.map((_, index) =>
        index < 3 ? "rgba(255, 99, 132, 0.8)" : "rgba(54, 162, 235, 0.6)"
    );

    // Create Chart
    const ctx = document.getElementById("resultsChart").getContext("2d");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Points",
                data: data,
                backgroundColor: backgroundColors,
                borderColor: "rgba(0, 0, 0, 0.3)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize
            scales: {
                y: {
                    beginAtZero: true,
                    stepSize: 1
                }
            },
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        font: {
                            family: "Arial, sans-serif",
                            weight: "bold"
                        }
                    }
                }
            }
        }
    });


    // Generate table for the remaining results
    const table = document.getElementById("resultsList");
    const tbody = document.createElement("tbody");

    allProjects.slice(5).forEach(result => {
        const row = document.createElement("tr");

        const projectNameCell = document.createElement("td");
        projectNameCell.textContent = result.projectName;

        const pointsCell = document.createElement("td");
        pointsCell.textContent = result.points;

        row.appendChild(projectNameCell);
        row.appendChild(pointsCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
}

// Run displayResults() when the page loads
window.onload = displayResults;
