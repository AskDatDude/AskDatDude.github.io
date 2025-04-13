export function initClassTabs() {
    window.openClass = function (evt, className) {
        const x = document.getElementsByClassName("class");
        for (const element of x) {
            element.style.display = "none";
        }
        const tablinks = document.getElementsByClassName("tablink");
        for (const tablink of tablinks) {
            tablink.className = tablink.className.replace(" active", "");
        }
        document.getElementById(className).style.display = "block";
        evt.currentTarget.className += " active";
    };
}