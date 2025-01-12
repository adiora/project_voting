import { db, collection, getDocs } from "firebase/firestore";

// Display results on the webpage with a bar chart
async function displayResults() {
    try {
        const resultSnapshot = await getDocs(collection(db, "result"));

        // Create an array of results to sort
        const results = [];
        resultSnapshot.forEach(doc => {
            const data = doc.data();
            results.push({
                projectId: doc.id,
                points: data.points
            });
        });

        // Sort projects by points (descending order)
        results.sort((a, b) => b.points - a.points);

        // Get the top 3 projects
        const topProjects = results.slice(0, 3);

        // Prepare data for Chart.js
        const projectNames = topProjects.map(project => project.projectId);
        const projectPoints = topProjects.map(project => project.points);

        // Get the canvas context to render the chart
        const ctx = document.getElementById("resultsChart").getContext("2d");

        // Create the bar chart using Chart.js
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: projectNames,  // Project names (X-axis)
                datasets: [{
                    label: "Project Points",
                    data: projectPoints,  // Points for each project (Y-axis)
                    backgroundColor: "rgba(75, 192, 192, 0.6)",  // Bar color
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error displaying results:", error);
    }
}

// Call this function to display results when the page is loaded
document.addEventListener("DOMContentLoaded", displayResults);
