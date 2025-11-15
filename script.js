const SUPABASE_URL = "https://dflxsuqiwuqjmmmfsmlp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmbHhzdXFpd3Vxam1tbWZzbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjk5NzQsImV4cCI6MjA3ODgwNTk3NH0.iHNSEok6mLv7Tt3vV_dQgmuXlUFRDFTtJVoY1GIwGLo";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let step = 0;
let answers = [];

// Banco de preguntas (puedes agregar más)
let questionBank = [
    // Alta importancia (peso 3)
    { text: "¿Qué tan sobrecargado te sentiste?", weight: 3 },
    { text: "¿Sentiste apoyo del equipo?", weight: 3 },
    { text: "¿Qué tan estresado te sentiste?", weight: 3 },

    // Media importancia (peso 2)
    { text: "¿Sentiste que tu trabajo fue valorado?", weight: 2 },
    { text: "¿Qué tan bien manejaste los desafíos hoy?", weight: 2 },
    { text: "¿Cómo fue tu nivel de energía hoy?", weight: 2 },

    // Baja importancia (peso 1)
    { text: "¿Calificarías tu motivación como adecuada?", weight: 1 },
    { text: "¿Cómo calificas tu sueño?", weight: 1 },
    { text: "¿Te costó concentrarte hoy?", weight: 1 }
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
    showBotMessage(selectedQuestions[step].text);
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
            showBotMessage(selectedQuestions[step].text);
            showEmojiOptions();
        }, 500);

    } else {
        calculateRisk();
    }
}

function calculateRisk() {
    let totalWeight = 0;
    let weightedSum = 0;

    for(let i=0; i<answers.length; i++){
        weightedSum += answers[i] * selectedQuestions[i].weight;
        totalWeight += selectedQuestions[i].weight;
    }

    let result = weightedSum / totalWeight;

    showBotMessage("Tu índice de bienestar es: " + result.toFixed(2));

    saveToLocal(result);
    saveToSupabase(result);
    updateDashboard(result);
    showRecommendations(result);

    step = 0;
    answers = [];
}

async function saveToSupabase(score) {

    // 1. Guardamos la encuesta
    const { data: encuesta, error: e1 } = await db
        .from("encuestas")
        .insert([{ resultado: score }])
        .select("id")
        .single();

    if (e1) {
        console.error("Error guardando encuesta:", e1);
        return;
    }

    let encuesta_id = encuesta.id;

    // 2. Guardar cada pregunta, peso y respuesta
    for (let i = 0; i < answers.length; i++) {

        const { error: e2 } = await db
            .from("preguntas_respuestas")
            .insert([{
                encuesta_id,
                pregunta: selectedQuestions[i].text,
                peso: selectedQuestions[i].weight,
                respuesta: answers[i]
            }]);

        if (e2) console.error("Error guardando pregunta:", e2);
    }

    console.log("Encuesta guardada exitosamente ✔");
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
                label: "Nivel de Bienestar Laboral",
                data: data,
                borderWidth: 2
            }]
        }
    });
}

function showBotMessage(msg) {
    showTypingAnimation();
    setTimeout(() => {
        removeTypingAnimation();
        document.getElementById("chat-box").innerHTML += `<p class="bot">${msg}</p>`;
    }, 900);
}

function showUserMessage(msg) {
    document.getElementById("chat-box").innerHTML += `<p class="user">${msg}</p>`;
}

function resetData() {
    localStorage.clear();
    alert("Datos borrados correctamente");
    location.reload();
}

function showTypingAnimation() {
    const chat = document.getElementById("chat-box");
    chat.innerHTML += `<p class="typing">StressMap está escribiendo<span class="dots">...</span></p>`;
}

function removeTypingAnimation() {
    const typingEl = document.querySelector(".typing");
    if (typingEl) typingEl.remove();
}

function showRecommendations(score){
    let box = document.getElementById("recommendations");

    if (score < 2.5) {
        box.innerHTML = `
            <h3 style="color:#c1121f;">🔴 Riesgo Alto</h3>
            <p>Recomendaciones:</p>
            <ul>
                <li>Realizar pausas activas cada 1–2 horas</li>
                <li>Evitar sobrecarga laboral hoy</li>
                <li>Hablar con un líder o compañero de confianza</li>
                <li>Espacios de respiración guiada 3–5 min</li>
            </ul>`;
    }
    else if (score < 3.8) {
        box.innerHTML = `
            <h3 style="color:#ff8c00;">🟠 Riesgo Medio</h3>
            <p>Recomendaciones:</p>
            <ul>
                <li>Tomar un descanso corto de 5 minutos</li>
                <li>Organizar tareas según prioridad</li>
                <li>Evitar multitarea excesiva</li>
            </ul>`;
    }
    else {
        box.innerHTML = `
            <h3 style="color:#2d6a4f;">🟢 Estado Positivo</h3>
            <p>Recomendaciones:</p>
            <ul>
                <li>Mantén tu rutina saludable</li>
                <li>Comparte buenas prácticas con tu equipo</li>
                <li>Realiza pausas activas para mantener equilibrio</li>
            </ul>`;
    }
}

