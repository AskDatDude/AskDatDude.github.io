export function initCursorEffect() {
    const div = document.querySelector(".cursor");
    window.addEventListener("mousemove", (e) => {
        const x = e.pageX - 25;
        const y = e.pageY - 15;
        div.style.transform = `translate(${x}px, ${y}px)`;
        div.style.opacity = 1;
    });

    window.addEventListener("mouseout", () => {
        div.style.opacity = 0;
    });
}