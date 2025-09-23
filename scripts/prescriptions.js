import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

// DOM Elements
const patientSelect = document.getElementById("patientSelect");
const diseaseSelect = document.getElementById("diseaseSelect");
const medicineSelect = document.getElementById("medicineSelect");
const form = document.getElementById("prescriptionForm");
const interactionResult = document.getElementById("interactionResult");
const prescriptionsTable = document.getElementById("prescriptionsTable");

// Disease to medicine mapping
const diseaseMedicineMap = {
  Hypertension: ["Losartan", "Amlodipine", "Enalapril", "Warfarin", "Aspirin"],
  Diabetes: ["Metformin", "Insulin", "Glipizide", "Cimetidine"],
  Asthma: ["Salbutamol", "Budesonide", "Montelukast"],
  HeartDisease: ["Aspirin", "Clopidogrel", "Warfarin"]
};

// Load patients into dropdown
async function loadPatients() {
  const snapshot = await getDocs(collection(db, "patients"));
  snapshot.forEach(docSnap => {
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = docSnap.data().name;
    patientSelect.appendChild(option);
  });
}

// Populate medicine options based on disease
diseaseSelect.addEventListener("change", () => {
  const disease = diseaseSelect.value;
  medicineSelect.innerHTML = `<option value="">Select</option>`;
  if (diseaseMedicineMap[disease]) {
    diseaseMedicineMap[disease].forEach(med => {
      const option = document.createElement("option");
      option.value = med;
      option.textContent = med;
      medicineSelect.appendChild(option);
    });
  }
});

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const patientId = patientSelect.value;
  const disease = diseaseSelect.value;
  const medicine = medicineSelect.value;
  const dosage = document.getElementById("dosage").value;
  const frequency = document.getElementById("frequency").value;

  if (!patientId || !disease || !medicine || !dosage || !frequency) {
    interactionResult.textContent = "❗ All fields are required.";
    interactionResult.style.color = "red";
    interactionResult.classList.remove("hidden");
    return;
  }

  interactionResult.textContent = "🔄 Checking for interactions...";
  interactionResult.style.color = "black";
  interactionResult.classList.remove("hidden");

  const adr = await checkADR(patientId, medicine);

  if (adr.possible) {
    interactionResult.textContent = `⚠️ ${adr.reason}`;
    interactionResult.style.color = "red";

    await addDoc(collection(db, "adr_alerts"), {
      patientId,
      medicine,
      reason: adr.reason,
      severity: adr.severity || "moderate",
      timestamp: Date.now(),
      acknowledged: false
    });
  } else {
    interactionResult.textContent = "✅ No known interactions.";
    interactionResult.style.color = "green";
  }

  await addDoc(collection(db, "prescriptions"), {
    patientId,
    disease,
    medicine,
    dosage,
    frequency,
    status: "Active",
    timestamp: Date.now()
  });

  form.reset();
});

// ADR checker using RxNav
async function checkADR(patientId, newMedicine) {
  try {
    const cuiRes = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(newMedicine)}&search=2`);
    const cuiData = await cuiRes.json();
    const newRxCUI = cuiData.idGroup?.rxnormId?.[0];

    if (!newRxCUI) {
      console.warn("RxCUI not found for:", newMedicine);
      return { possible: false };
    }

    const q = query(collection(db, "prescriptions"),
      where("patientId", "==", patientId),
      where("status", "==", "Active"));

    const snapshot = await getDocs(q);
    const medNames = snapshot.docs.map(doc => doc.data().medicine);

    const cuiPromises = medNames.map(async name => {
      const res = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=2`);
      const data = await res.json();
      return data.idGroup?.rxnormId?.[0];
    });

    const existingCUIs = (await Promise.all(cuiPromises)).filter(Boolean);
    if (existingCUIs.length === 0) return { possible: false };

    const allCUIs = [newRxCUI, ...existingCUIs].join(",");
    const interactionRes = await fetch(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${allCUIs}`);
    const interactionData = await interactionRes.json();

    const interactions = interactionData?.fullInteractionTypeGroup?.[0]?.fullInteractionType || [];
    if (interactions.length > 0) {
      const firstPair = interactions[0].interactionPair?.[0];
      return {
        possible: true,
        reason: firstPair.description,
        severity: firstPair.severity || "moderate"
      };
    }

    return { possible: false };
  } catch (error) {
    console.error("ADR Check Error:", error);
    interactionResult.textContent = "Error checking interactions.";
    interactionResult.style.color = "orange";
    return { possible: false };
  }
}

// Real-time prescription list
function loadPrescriptions() {
  const q = collection(db, "prescriptions");

  onSnapshot(q, async (snapshot) => {
    prescriptionsTable.innerHTML = "";
    const patientDocs = await getDocs(collection(db, "patients"));
    const patientMap = {};
    patientDocs.forEach(doc => {
      patientMap[doc.id] = doc.data().name;
    });

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const patientName = patientMap[data.patientId] || "Unknown";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="p-2 border">${patientName}</td>
        <td class="p-2 border">${data.medicine}</td>
        <td class="p-2 border">${data.dosage} mg</td>
        <td class="p-2 border">${data.status}</td>
        <td class="p-2 border space-x-2">
          <button class="bg-green-600 text-white px-2 py-1 rounded" onclick="markCompleted('${docSnap.id}')">Complete</button>
          <button class="bg-yellow-500 text-white px-2 py-1 rounded" onclick="markModified('${docSnap.id}')">Modify</button>
        </td>
      `;
      prescriptionsTable.appendChild(tr);
    });
  });
}

// Mark prescription as Completed
window.markCompleted = async function (id) {
  const docRef = doc(db, "prescriptions", id);
  await updateDoc(docRef, { status: "Completed" });
};

// Mark prescription as Modified
window.markModified = async function (id) {
  const docRef = doc(db, "prescriptions", id);
  await updateDoc(docRef, { status: "Modified" });
};

// Init
loadPatients();
loadPrescriptions();
