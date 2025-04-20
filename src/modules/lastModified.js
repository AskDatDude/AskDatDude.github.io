export function initLastModified() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            runLastModifiedLogic();
        });
    } else {
        runLastModifiedLogic();
    }
}

function runLastModifiedLogic() {
    const myDate = "2025-20-04"; // Date of last modification
    const displayDateElement = document.getElementById("displayDate");
    if (displayDateElement) {
        displayDateElement.innerText = myDate;
    } else {
        console.error("Element with id 'displayDate' not found.");
    }

    const version = "V2.3.0"; // Version number
    const versionElement = document.getElementById("version");
    if (versionElement) {
        versionElement.innerText = version;
    } else {
        console.error("Element with id 'version' not found.");
    }
}