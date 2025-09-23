// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyAg8FaGODfzzBdPxSdhFV9JD1k_K2e-m58",
  authDomain: "telemedicine156.firebaseapp.com",
  projectId: "telemedicine156",
  storageBucket: "telemedicine156.firebasestorage.app",
  messagingSenderId: "173266504564",
  appId: "1:173266504564:web:61f6371072cafb38fc3a21"
};
// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const exportBtn = document.getElementById("exportDataBtn");
const deleteBtn = document.getElementById("deleteAccountBtn");
const settingsStatusMsg = document.getElementById("settingsStatusMsg");

// On Auth State Change
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("email").value = user.email;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      document.getElementById("name").value = data.name || "";
      document.getElementById("phone").value = data.phone || "";
      document.getElementById("specialty").value = data.specialty || "";
      document.getElementById("clinic").value = data.clinic || "";
      document.getElementById("emailNotif").checked = data.emailNotif || false;
      document.getElementById("pushNotif").checked = data.pushNotif || false;
      document.getElementById("adrNotif").checked = data.adrNotif || false;
    }

    // Export Data
    exportBtn.addEventListener("click", async () => {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const json = JSON.stringify(userData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "smartcare_user_data.json";
        a.click();
        URL.revokeObjectURL(url);
        settingsStatusMsg.textContent = "✅ Data exported successfully.";
      }
    });

    // Delete Account
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        try {
          await deleteUser(user);
          settingsStatusMsg.textContent = "❌ Account deleted.";
          window.location.href = "login.html";
        } catch (error) {
          console.error("Account deletion failed:", error);
          settingsStatusMsg.textContent = "⚠️ Error deleting account. Please re-authenticate.";
        }
      }
    });

    // Save Profile Info
    document.getElementById("settingsForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value;
      const phone = document.getElementById("phone").value;
      const specialty = document.getElementById("specialty").value;
      const clinic = document.getElementById("clinic").value;
      const emailNotif = document.getElementById("emailNotif").checked;
      const pushNotif = document.getElementById("pushNotif").checked;
      const adrNotif = document.getElementById("adrNotif").checked;

      await setDoc(userRef, {
        name,
        phone,
        specialty,
        clinic,
        email: user.email,
        emailNotif,
        pushNotif,
        adrNotif,
      }, { merge: true });

      settingsStatusMsg.textContent = "✅ Profile updated!";
    });

  } else {
    // Redirect if not logged in
    window.location.href = "login.html";
  }
});
