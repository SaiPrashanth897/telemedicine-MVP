import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where
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

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Load patients registered as users (for dropdown)
async function loadRegisteredPatients() {
  const patientSelect = document.getElementById("patientSelect");
  patientSelect.innerHTML = `<option value="">-- Choose Registered Patient --</option>`;

  try {
    const q = query(collection(db, "users"), where("role", "==", "patient"));
    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = `${data.name} (${data.email})`;
      patientSelect.appendChild(option);
    });

    if (snapshot.empty) {
      const option = document.createElement("option");
      option.textContent = "No patients found";
      option.disabled = true;
      patientSelect.appendChild(option);
    }

  } catch (error) {
    console.error("Error loading registered patients:", error);
    alert("Failed to load registered patients.");
  }
}

// Handle form submission
document.getElementById("addPatientForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const selectedPatientId = document.getElementById("patientSelect").value;
  const name = document.getElementById("name").value.trim();
  const age = parseInt(document.getElementById("age").value);
  const condition = document.getElementById("condition").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const statusMsg = document.getElementById("statusMsg");

  if (!selectedPatientId || !name || !condition || isNaN(age)) {
    statusMsg.textContent = "❌ Please fill all required fields.";
    return;
  }

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    await setDoc(doc(db, "patients", selectedPatientId), {
      patientId: selectedPatientId,
      name,
      age,
      condition,
      contact,
      doctorId: user.uid,
      lastVisit: new Date(),
      createdAt: new Date()
    });

    statusMsg.textContent = "✅ Patient added successfully.";
    document.getElementById("addPatientForm").reset();
  } catch (error) {
    console.error("Error adding patient:", error);
    statusMsg.textContent = "❌ Failed to add patient.";
  }
});

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// Auth state check
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadRegisteredPatients();
  } else {
    window.location.href = "login.html";
  }
});
