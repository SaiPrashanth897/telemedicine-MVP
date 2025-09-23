import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy
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
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Reference to prescriptions table body
const prescriptionsTable = document.getElementById("prescriptionsTable").querySelector("tbody");

// Load prescriptions
async function loadPrescriptionsForPatient(patientId) {
  console.log("👤 Fetching prescriptions for patient:", patientId);

  try {
    const prescriptionsRef = collection(db, "prescriptions");

    const q = query(
      prescriptionsRef,
      where("patientId", "==", patientId),
      where("status", "==", "Active"),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    prescriptionsTable.innerHTML = "";

    if (snapshot.empty) {
      console.log("📭 No prescriptions found for this patient.");
      prescriptionsTable.innerHTML = "<tr><td colspan='4'>No active prescriptions.</td></tr>";
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log("📄 Prescription:", data);

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${data.medicine || "-"}</td>
        <td>${data.dosage || "-"}</td>
        <td>${data.frequency || "-"}</td>
        <td>${data.status || "-"}</td>
      `;

      prescriptionsTable.appendChild(row);
    });

  } catch (error) {
    console.error("❌ Error fetching prescriptions:", error);
    prescriptionsTable.innerHTML = "<tr><td colspan='4'>❌ Failed to load prescriptions.</td></tr>";
  }
}

// Wait for login
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Logged in as:", user.uid);
    loadPrescriptionsForPatient(user.uid);
  } else {
    prescriptionsTable.innerHTML = "<tr><td colspan='4'>Please log in to view your prescriptions.</td></tr>";
  }
});
