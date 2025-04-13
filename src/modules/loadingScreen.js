export async function initLoadingScreen() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            runLoadingScreenLogic();
        });
    } else {
        runLoadingScreenLogic();
    }
}

function runLoadingScreenLogic() {
    setTimeout(function () {
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) {
            loadingScreen.classList.add("hidden");
        } else {
            console.error("Element with id 'loading-screen' not found.");
        }

        const mainContent = document.getElementsByClassName("main-content")[0];
        if (mainContent) {
            mainContent.classList.add("visible");
        } else {
            console.error("Element with class 'main-content' not found.");
        }
    }, 1000); // 1000 milliseconds = 1 second
}