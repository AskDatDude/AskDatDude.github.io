export function initLastModified() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", runLastModifiedLogic);
    } else {
        runLastModifiedLogic();
    }
}

function runLastModifiedLogic() {
    const myDate = "6-10-2025"; // Date of last modification
    const version = "V2.4.0"; // Version number
    
    const displayDateElement = document.getElementById("displayDate");
    if (displayDateElement) {
        displayDateElement.textContent = myDate;
    }

    const versionElement = document.getElementById("version");
    if (versionElement) {
        versionElement.textContent = version;
    }
}
