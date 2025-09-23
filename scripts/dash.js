import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase Config
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
const auth = getAuth(app);
const db = getFirestore(app);

// Format timestamp to readable date
function formatDate(timestamp) {
  if (!timestamp || !timestamp.seconds) return "N/A";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString();
}

// Get how many hours ago from a timestamp
function formatLastLogin(timestamp) {
  if (!timestamp || !timestamp.seconds) return "Unknown";
  const hoursAgo = Math.floor((Date.now() - timestamp.seconds * 1000) / 3600000);
  return `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
}

// Load Dashboard Data
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("You are not logged in.");
    window.location.href = "login.html";
    return;
  }

  try {
    const doctorId = user.uid;
    const userDocRef = doc(db, "users", doctorId);
    const userSnap = await getDoc(userDocRef);

    const doctorName = userSnap.exists() ? userSnap.data().username : "Doctor";
    document.getElementById("welcomeText").innerText = `Welcome, Dr. ${doctorName} 👩‍⚕️`;

    // Fetch patients assigned to doctor
    const patientsQuery = query(collection(db, "patients"), where("doctorId", "==", doctorId));
    const patientsSnapshot = await getDocs(patientsQuery);
    const patientList = document.getElementById("patientList");

    document.getElementById("patientCount").innerText = patientsSnapshot.size;
    patientList.innerHTML = "";

    if (patientsSnapshot.empty) {
      patientList.innerHTML = `<tr><td colspan="4">No patients assigned.</td></tr>`;
    } else {
      patientsSnapshot.forEach((doc) => {
        const data = doc.data();
        const row = `<tr>
          <td>${data.name || "N/A"}</td>
          <td>${data.age || "--"}</td>
          <td>${data.condition || "--"}</td>
          <td>${formatDate(data.lastVisit)}</td>
        </tr>`;
        patientList.innerHTML += row;
      });
    }

    // Fetch pending rounds
    const roundsQuery = query(
      collection(db, "rounds"),
      where("doctorId", "==", doctorId),
      where("status", "==", "pending")
    );
    const roundsSnapshot = await getDocs(roundsQuery);
    document.getElementById("pendingCount").innerText = roundsSnapshot.size;

    // Fetch ADR alerts
    const adrQuery = query(collection(db, "adrAlerts"), where("doctorId", "==", doctorId));
    const adrSnapshot = await getDocs(adrQuery);
    document.getElementById("adrCount").innerText = adrSnapshot.size;

    // Last login time
    if (userSnap.exists()) {
      const lastLogin = userSnap.data().lastLogin;
      document.getElementById("lastLogin").innerText = formatLastLogin(lastLogin);
    }

  } catch (err) {
    console.error("Error loading dashboard:", err);
    document.getElementById("patientList").innerHTML = `<tr><td colspan="4">Error loading patients.</td></tr>`;
  }
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("active");
});

