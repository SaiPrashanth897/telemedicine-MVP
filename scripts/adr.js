import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase config
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

// Fetch and display ADR alerts
const tableBody = document.querySelector("#adrTable tbody");
const statusMsg = document.getElementById("statusMessage");

async function loadADRAlerts() {
  tableBody.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "adr_alerts"));
  let found = false;

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.status === "unconfirmed") {
      found = true;
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${data.patientName}</td>
        <td>${data.drug}</td>
        <td>${data.symptom}</td>
        <td>${data.severity}</td>
        <td>${data.status}</td>
        <td>
          <button class="confirmBtn" data-id="${docSnap.id}">✅ Confirm</button>
          <button class="dismissBtn" data-id="${docSnap.id}">❌ Dismiss</button>
        </td>
      `;

      tableBody.appendChild(row);
    }
  });

  if (!found) {
    statusMsg.textContent = "✅ No pending ADR alerts.";
  }

  // Event listeners
  document.querySelectorAll(".confirmBtn").forEach(btn => {
    btn.addEventListener("click", () => updateStatus(btn.dataset.id, "confirmed"));
  });

  document.querySelectorAll(".dismissBtn").forEach(btn => {
    btn.addEventListener("click", () => updateStatus(btn.dataset.id, "dismissed"));
  });
}

async function updateStatus(id, newStatus) {
  const ref = doc(db, "adr_alerts", id);
  await updateDoc(ref, { status: newStatus });
  loadADRAlerts();
}

loadADRAlerts();
