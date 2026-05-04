const professorOption = document.querySelector(".option-professor");
const studentOption = document.querySelector(".option-student");

if (professorOption) {
    professorOption.addEventListener("click", () => {
        window.location.href = "../teacher/t.profiling.html";
    });
}

if (studentOption) {
    studentOption.addEventListener("click", () => {
        window.location.href = "../student/s.profiling.html";
    });
}
