let step = 0;
let answers = [];
let questions = [
    "1️⃣ ¿Cómo fue tu nivel de energía hoy? (1–5)",
    "2️⃣ ¿Qué tan estresado te sentiste? (1–5)",
    "3️⃣ ¿Cómo calificarías tu nivel de motivación hoy? (1–5)",
    "4️⃣ ¿Cómo calificas tu sueño? (1–5)",
    "5️⃣ ¿Qué tan sobrecargado te sentiste? (1–5)"
];

function startSurvey() {
    showBotMessage(questions[step]);
}

document.addEventListener("keydown", function(e) {
    if (e.key >= 1 && e.key <= 5) {
        registerAnswer(Number(e.key));
    }
});

function registerAnswer(value) {
    showUserMessage(value);

    answers.push(value);
    step++;

    if (step < questions.length) {
        setTimeout(() => showBotMessage(questions[step]), 500);
    } else {
        calculateRisk();
    }
}

function calculateRisk() {
    // ponderación equivalente
    let result = (answers[0]*0.25)+(answers[1]*0.25)+(answers[2]*0.20)+(answers[3]*0.15)+(answers[4]*0.15);

    showBotMessage("Tu índice de bienestar es: " + result.toFixed(2));

    saveToLocal(result);

    updateDashboard();

    step = 0;
    answers = [];
}

function saveToLocal(value) {
    let data = JSON.parse(localStorage.getItem("stressData")) || [];

    // Fecha actual
    let now = new Date();

    // Guardar fecha de inicio si no existe
    if(!localStorage.getItem("startDate")){
        localStorage.setItem("startDate", now);
    }

    data.push(value);
    localStorage.setItem("stressData", JSON.stringify(data));

    checkMonthReset();
}

function checkMonthReset() {
    let start = new Date(localStorage.getItem("startDate"));
    let now = new Date();

    let diff = now - start;
    let days = diff / (1000 * 60 * 60 * 24);

    if (days >= 30) {
        localStorage.clear();
        alert("Nuevo mes 💡 Los datos anteriores se han reseteado.");
        location.reload();
    }
}


function updateDashboard() {
    let data = JSON.parse(localStorage.getItem("stressData")) || [];

    let ctx = document.getElementById("stressChart").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map((v,i)=>"Día "+(i+1)),
            datasets: [{
                label: "Nivel de Bienestar",
                data: data,
                borderWidth: 2
            }]
        }
    });
}

function showBotMessage(msg) {
    document.getElementById("chat-box").innerHTML += `<p class="bot">${msg}</p>`;
}
function showUserMessage(msg) {
    document.getElementById("chat-box").innerHTML += `<p class="user">${msg}</p>`;
}

function resetData() {
    localStorage.clear();
    alert("Datos borrados correctamente");
    location.reload();
}

