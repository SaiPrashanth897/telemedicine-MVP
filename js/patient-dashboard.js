// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAg8FaGODfzzBdPxSdhFV9JD1k_K2e-m58",
  authDomain: "telemedicine156.firebaseapp.com",
  projectId: "telemedicine156",
  storageBucket: "telemedicine156.firebasestorage.app",
  messagingSenderId: "173266504564",
  appId: "1:173266504564:web:61f6371072cafb38fc3a21"
};

// ✅ Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Listen to a specific document in "rounds"
const roundDocId = "13hn3BnJTTmXLQD5QZdH"; // Replace with dynamic ID if needed
const roundRef = doc(db, "rounds", roundDocId);

onSnapshot(roundRef, (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();

    // Welcome message (optional: you can fetch patient's name too)
    document.getElementById("welcomeMsg").innerText = `Welcome back!`;

    // Last visit
    if (data.timestamp?.seconds) {
      const visitDate = new Date(data.timestamp.seconds * 1000);
      document.getElementById("lastVisit").innerText = `Last Visit: ${visitDate.toLocaleString()}`;
    }

    // Vitals
    const vitals = data.vitals || {};
    document.getElementById("vitals").innerText = `BP: ${vitals.bp || "--"} | HR: ${vitals.hr || "--"} | SpO2: ${vitals.spo2 || "--"} | Temp: ${vitals.temp || "--"}`;

    // Symptoms
    const symptomsList = document.getElementById("symptomsList");
    symptomsList.innerHTML = ""; // Clear existing
    if (data.symptoms) {
      data.symptoms.split(",").forEach(symptom => {
        const li = document.createElement("li");
        li.textContent = symptom.trim();
        symptomsList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "No recent symptoms";
      symptomsList.appendChild(li);
    }

    // Conditions (status)
    const conditionsList = document.getElementById("conditionsList");
    conditionsList.innerHTML = "";
    const conditionItem = document.createElement("li");
    conditionItem.textContent = `Status: ${data.status || "Unknown"}`;
    conditionsList.appendChild(conditionItem);
  } else {
    console.log("Document not found.");
  }
});
