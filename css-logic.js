window.onscroll = function() {scrollFunction()};

function scrollFunction() {
    if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
        document.getElementsByClassName("top-nav").style.padding = "30px 10px";
        document.getElementsByClassName("menu").style.fontSize = "25px";

    } else {
        document.getElementsByClassName("top-nav").style.padding = "80px 10px";
        document.getElementsByClassName("menu").style.fontSize = "2vw"
    }
}