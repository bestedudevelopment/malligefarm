// Firebase
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ------------------------------------
// FIREBASE CONFIG
// ------------------------------------

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain: "YOUR_PROJECT.firebaseapp.com",

    projectId: "YOUR_PROJECT_ID",

    storageBucket: "YOUR_PROJECT.firebasestorage.app",

    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",

    appId: "YOUR_APP_ID"
};


// ------------------------------------
// INITIALIZE FIREBASE
// ------------------------------------

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ------------------------------------
// HTML ELEMENTS
// ------------------------------------

const loginScreen =
    document.getElementById("loginScreen");

const appScreen =
    document.getElementById("appScreen");

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const loginMessage =
    document.getElementById("loginMessage");

const logoutBtn =
    document.getElementById("logoutBtn");

const adminName =
    document.getElementById("adminName");


// ------------------------------------
// LOGIN
// ------------------------------------

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = emailInput.value.trim();

    const password = passwordInput.value;

    loginMessage.textContent = "";

    loginBtn.disabled = true;

    loginBtn.textContent = "Checking...";


    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;


        // Get user document from Firestore
        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            await signOut(auth);

            throw new Error(
                "User profile not found."
            );
        }


        const userData =
            userSnap.data();


        // ------------------------------------
        // ROLE CHECK
        // ------------------------------------

        if (userData.role !== "admin") {

            await signOut(auth);

            throw new Error(
                "Access denied. Admin access required."
            );
        }


        // Admin approved
        showApplication(userData);

    }

    catch (error) {

        console.error(error);

        loginMessage.textContent =
            error.message;

    }

    finally {

        loginBtn.disabled = false;

        loginBtn.textContent = "Login";
    }

});


// ------------------------------------
// CHECK EXISTING LOGIN
// ------------------------------------

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        showLogin();

        return;
    }


    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            await signOut(auth);

            return;
        }


        const userData =
            userSnap.data();


        if (userData.role !== "admin") {

            await signOut(auth);

            return;
        }


        showApplication(userData);

    }

    catch (error) {

        console.error(error);

        await signOut(auth);

    }

});


// ------------------------------------
// SHOW APPLICATION
// ------------------------------------

function showApplication(userData) {

    loginScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");

    adminName.textContent =
        userData.name || "Admin";
}


// ------------------------------------
// SHOW LOGIN
// ------------------------------------

function showLogin() {

    loginScreen.classList.remove("hidden");

    appScreen.classList.add("hidden");
}


// ------------------------------------
// LOGOUT
// ------------------------------------

logoutBtn.addEventListener("click", async () => {

    try {

        await signOut(auth);

        showLogin();

        loginForm.reset();

    }

    catch (error) {

        console.error(error);

    }

});
