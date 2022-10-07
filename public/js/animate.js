function animate() {
    var elements = document.querySelectorAll(".animate");

    for (var i = 0; i < elements.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = elements[i].getBoundingClientRect().top;
        var elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            elements[i].classList.add("active");
        } else {
            elements[i].classList.remove("active");
        }
    }
}

window.addEventListener("scroll", animate);
window.addEventListener("DOMContentLoaded", animate);