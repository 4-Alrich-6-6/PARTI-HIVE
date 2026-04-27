const professorOption = document.querySelector(".option-professor");
const studentOption = document.querySelector(".option-student");

if (professorOption) {
    professorOption.addEventListener("click", () => {
        window.location.href = "t.profiling.html";
    });
}

if (studentOption) {
    studentOption.addEventListener("click", () => {
        window.location.href = "s.profiling.html";
    });
}
