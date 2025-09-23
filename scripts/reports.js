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

// No import for html2pdf here anymore

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

const summaryContainer = document.getElementById("summaryContainer");
const generateBtn = document.getElementById("generatePDF");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const roundsRef = collection(db, "rounds");
  const q = query(roundsRef, where("doctorId", "==", user.uid));
  const snapshot = await getDocs(q);

  const todayRounds = [];

  snapshot.forEach((doc) => {
    const round = doc.data();
    const roundDate = round.timestamp?.toDate();

    if (roundDate && roundDate >= today) {
      todayRounds.push({ id: doc.id, ...round });
    }
  });

  if (todayRounds.length === 0) {
    summaryContainer.innerHTML = "<p>No records found for today.</p>";
    return;
  }

  let html = "";
  todayRounds.forEach((round, index) => {
    html += `
      <div class="report-card">
        <h3>Round ${index + 1} - Patient: ${round.patientName || round.patientId}</h3>
        <p><strong>Time:</strong> ${round.timestamp.toDate().toLocaleTimeString()}</p>
        <p><strong>Vitals:</strong> BP: ${round.bp || '--'}, HR: ${round.hr || '--'}, SpO2: ${round.spo2 || '--'}, Temp: ${round.temp || '--'}, RR: ${round.rr || '--'}</p>
        <p><strong>Symptoms:</strong> ${Array.isArray(round.symptoms) ? round.symptoms.join(", ") : (round.symptoms || "--")}</p>
        <p><strong>Notes:</strong> ${round.notes || "--"}</p>
        <hr />
      </div>
    `;
  });

  summaryContainer.innerHTML = html;

  // PDF download
  generateBtn.addEventListener("click", () => {
    const opt = {
      margin: 0.5,
      filename: `round-summary-${today.toDateString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(summaryContainer).save();
  });
});
