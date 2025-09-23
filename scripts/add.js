import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 🔥 Firebase config
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

const patientSelect = document.getElementById("patientSelect");
const form = document.getElementById("roundNoteForm");
const statusMessage = document.getElementById("statusMessage");
const addTemplateBtn = document.getElementById("addTemplate");
const voiceBtn = document.getElementById("voiceBtn");

// Load patients
async function loadPatients() {
  const snapshot = await getDocs(collection(db, "patients"));
  patientSelect.innerHTML = '<option value="">Select Patient</option>';
  snapshot.forEach(doc => {
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = doc.data().name || "Unnamed";
    patientSelect.appendChild(option);
  });
}

// Save round note
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const patientId = patientSelect.value;
  if (!patientId) {
    statusMessage.textContent = "⚠️ Please select a patient.";
    return;
  }

  const roundData = {
    patientId,
    bp: document.getElementById("bp").value,
    hr: document.getElementById("hr").value,
    spo2: document.getElementById("spo2").value,
    temp: document.getElementById("temp").value,
    rr: document.getElementById("rr").value,
    symptoms: document.getElementById("symptoms").value.trim().split(",").map(s => s.trim()),
    note: document.getElementById("noteText").value,
    timestamp: new Date()
  };

  try {
    await addDoc(collection(db, "rounds"), roundData);

    // Reset pending rounds for the patient (if stored on patient doc)
    const patientDocRef = doc(db, "patients", patientId);
    await updateDoc(patientDocRef, {
      pendingRounds: 0
    });

    statusMessage.textContent = "✅ Round note saved successfully!";
    form.reset();
  } catch (err) {
    console.error("Error saving round:", err);
    statusMessage.textContent = "❌ Failed to save round note.";
  }
});

// Insert common symptoms
addTemplateBtn.addEventListener("click", () => {
  const commonSymptoms = ["Fever", "Cough", "Headache", "Fatigue"];
  const field = document.getElementById("symptoms");
  field.value = commonSymptoms.join(", ");
});

// Placeholder voice-to-text (browser speech API)
voiceBtn.addEventListener("click", () => {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("noteText").value += transcript + " ";
  };
  recognition.start();
});

// Auth + load patients
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadPatients();
  } else {
    alert("Please log in to use this feature.");
    window.location.href = "login.html";
  }
});
