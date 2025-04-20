export async function updateJsonDate(elementId = "json-update-date", jsonFilePath = "/diary/index.json") {
    const dateElement = document.getElementById(elementId);

    try {
        // Fetch the JSON file content
        const response = await fetch(jsonFilePath);

        if (!response.ok) {
            throw new Error(`Failed to fetch JSON file at ${jsonFilePath}: ${response.statusText}`);
        }

        // Parse the JSON content
        const jsonData = await response.json();

        // Extract the latest date from the JSON data
        const latestDate = jsonData
            .map(entry => new Date(entry.date)) // Convert date strings to Date objects
            .reduce((latest, current) => (current > latest ? current : latest), new Date(0)); // Find the latest date

        // Format the latest date
        const formattedDate = latestDate.toLocaleDateString("en-FI", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
        });

        // Update the HTML element with the latest date
        if (dateElement) {
            dateElement.textContent = `${formattedDate}`;
        } 
    } catch (error) {
        console.error("Error updating JSON date:", error);
    }
}