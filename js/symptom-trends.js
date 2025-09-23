import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAg8FaGODfzzBdPxSdhFV9JD1k_K2e-m58",
  authDomain: "telemedicine156.firebaseapp.com",
  projectId: "telemedicine156",
  storageBucket: "telemedicine156.firebasestorage.app",
  messagingSenderId: "173266504564",
  appId: "1:173266504564:web:61f6371072cafb38fc3a21"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let symptomChart, vitalsChart;

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const patientSelect = document.getElementById("patientSelect");
  const patientsSnap = await getDocs(collection(db, "patients"));

  patientsSnap.forEach((doc) => {
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = doc.data().name || "Unnamed Patient";
    patientSelect.appendChild(option);
  });

  patientSelect.addEventListener("change", () => loadTrends(patientSelect.value));
  document.getElementById("chartType").addEventListener("change", () => loadTrends(patientSelect.value));

  if (patientSelect.options.length > 0) {
    loadTrends(patientSelect.value);
  }
});

async function loadTrends(patientId) {
  const roundsRef = collection(db, "rounds");
  const q = query(roundsRef, where("patientId", "==", patientId));
  const snapshot = await getDocs(q);

  const data = [];
  snapshot.forEach(doc => {
    const round = doc.data();
    data.push({
      date: new Date(round.timestamp.seconds * 1000).toLocaleDateString(),
      symptoms: round.symptoms || [],
      bp: round.bp || null,
      hr: round.hr || null,
      spo2: round.spo2 || null
    });
  });

  // 📊 Symptom frequency by date
  const symptomFrequency = {};
  const vitalsData = {};

  data.forEach(entry => {
    const day = entry.date;
    symptomFrequency[day] = (symptomFrequency[day] || 0) +
      (Array.isArray(entry.symptoms) ? entry.symptoms.length : (entry.symptoms?.trim() ? 1 : 0));

    vitalsData[day] = vitalsData[day] || { bp: [], hr: [], spo2: [] };
    if (entry.bp) vitalsData[day].bp.push(Number(entry.bp));
    if (entry.hr) vitalsData[day].hr.push(Number(entry.hr));
    if (entry.spo2) vitalsData[day].spo2.push(Number(entry.spo2));
  });

  const labels = Object.keys(symptomFrequency);

  // Averages for vitals per day
  const avgVitals = labels.map(day => {
    const vitals = vitalsData[day] || { bp: [], hr: [], spo2: [] };
    const average = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    return {
      bp: average(vitals.bp),
      hr: average(vitals.hr),
      spo2: average(vitals.spo2)
    };
  });

  const chartType = document.getElementById("chartType").value;

  // Destroy old charts
  if (symptomChart) symptomChart.destroy();
  if (vitalsChart) vitalsChart.destroy();

  // 📈 Symptom Chart
  symptomChart = new Chart(document.getElementById("symptomChart").getContext("2d"), {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        label: "Symptom Count",
        data: Object.values(symptomFrequency),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        fill: chartType === "line"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Symptom Entries" } },
        x: { title: { display: true, text: "Date" } }
      }
    }
  });

  // 📊 Vitals Chart
  vitalsChart = new Chart(document.getElementById("vitalsChart").getContext("2d"), {
    type: chartType,
    data: {
      labels: labels,
      datasets: [
        {
          label: "BP (mmHg)",
          data: avgVitals.map(v => v.bp),
          backgroundColor: "rgba(255, 99, 132, 0.4)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 2,
          fill: chartType === "line"
        },
        {
          label: "HR (bpm)",
          data: avgVitals.map(v => v.hr),
          backgroundColor: "rgba(54, 162, 235, 0.4)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 2,
          fill: chartType === "line"
        },
        {
          label: "SpO₂ (%)",
          data: avgVitals.map(v => v.spo2),
          backgroundColor: "rgba(75, 192, 75, 0.4)",
          borderColor: "rgba(75, 192, 75, 1)",
          borderWidth: 2,
          fill: chartType === "line"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Vitals" } },
        x: { title: { display: true, text: "Date" } }
      }
    }
  });
}
