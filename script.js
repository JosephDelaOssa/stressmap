let step = 0;
let answers = [];

// Banco de preguntas (puedes agregar más)
let questionBank = [
    "¿Cómo fue tu nivel de energía hoy?",
    "¿Qué tan estresado te sentiste?",
    "¿Calificarías tu motivación como adecuada?",
    "¿Cómo calificas tu sueño?",
    "¿Qué tan sobrecargado te sentiste?",
    "¿Sentiste apoyo del equipo?",
    "¿Te costó concentrarte hoy?"
];

let selectedQuestions = [];

function pickRandomQuestions() {
    selectedQuestions = [];
    let clone = [...questionBank];

    for(let i = 0; i < 3; i++){
        let randomIndex = Math.floor(Math.random() * clone.length);
        selectedQuestions.push(clone[randomIndex]);
        clone.splice(randomIndex, 1);
    }
}

function startSurvey() {
    pickRandomQuestions();
    showBotMessage(selectedQuestions[step]);
    showEmojiOptions();
}

// ---- NUEVA UI DE EMOJIS ----
function showEmojiOptions() {
    const emojis = ["😞","😕","😐","🙂","😄"]; // 1 a 5
    let html = "<div class='emoji-buttons'>";
    emojis.forEach((emoji, index) => {
        html += `<button class="emoji-btn" onclick="registerAnswer(${index+1})">${emoji}</button>`;
    });
    html += "</div>";
    document.getElementById("chat-box").innerHTML += html;
}

function registerAnswer(value) {
    showUserMessage(value);

    answers.push(value);
    step++;

    if (step < selectedQuestions.length) {
        setTimeout(() => {
            showBotMessage(selectedQuestions[step]);
            showEmojiOptions();
        }, 500);

    } else {
        calculateRisk();
    }
}

function calculateRisk() {
    // Promedio simple de 3 preguntas
    let result = answers.reduce((a,b)=>a+b) / answers.length;

    showBotMessage("Tu índice de bienestar es: " + result.toFixed(2));

    saveToLocal(result);
    updateDashboard();

    step = 0;
    answers = [];
}

function saveToLocal(value) {
    let data = JSON.parse(localStorage.getItem("stressData")) || [];

    let now = new Date();

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
