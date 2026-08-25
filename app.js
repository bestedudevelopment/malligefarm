// ============================================================
// FIREBASE IMPORTS
// ============================================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc
}
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================
// PUT YOUR OWN FIREBASE CONFIG HERE
// ============================================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWLGMTSEccqdnnSnqcuqnH2laPX33DX_k",
  authDomain: "malligefarms.firebaseapp.com",
  projectId: "malligefarms",
  storageBucket: "malligefarms.firebasestorage.app",
  messagingSenderId: "182446233497",
  appId: "1:182446233497:web:761445d7236093cf602508",
  measurementId: "G-8DT0EFXGSN"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const db =
    getFirestore(firebaseApp);


// ============================================================
// ELEMENTS
// ============================================================

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

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");

const logoutButton =
    document.getElementById("logoutButton");

const adminName =
    document.getElementById("adminName");

const welcomeName =
    document.getElementById("welcomeName");

const todayDisplay =
    document.getElementById("todayDisplay");

const dailyRateInput =
    document.getElementById("dailyRate");

const saveRateButton =
    document.getElementById("saveRateButton");

const rateStatus =
    document.getElementById("rateStatus");


// ============================================================
// DATE FUNCTIONS
// ============================================================

function getTodayString() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


const today =
    getTodayString();


todayDisplay.textContent =
    formatDate(today);


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        loginMessage.textContent = "";

        loginButton.disabled = true;

        loginButton.textContent =
            "Signing in...";


        try {

            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                credential.user;


            // --------------------------------------------
            // GET FIRESTORE USER PROFILE
            // --------------------------------------------

            const userReference =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userReference
                );


            if (!userSnapshot.exists()) {

                await signOut(auth);

                throw new Error(
                    "Admin profile was not found."
                );
            }


            const userData =
                userSnapshot.data();


            // --------------------------------------------
            // ADMIN ONLY
            // --------------------------------------------

            if (
                userData.role !== "admin"
            ) {

                await signOut(auth);

                throw new Error(
                    "Access denied. Admin access only."
                );
            }


            showApplication(
                userData
            );

        }

        catch (error) {

            console.error(
                "Login error:",
                error
            );

            loginMessage.textContent =
                getFriendlyError(
                    error
                );

        }

        finally {

            loginButton.disabled = false;

            loginButton.textContent =
                "Login";
        }

    }
);


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            showLogin();

            return;
        }


        try {

            const userReference =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userReference
                );


            if (!userSnapshot.exists()) {

                await signOut(auth);

                return;
            }


            const userData =
                userSnapshot.data();


            if (
                userData.role !== "admin"
            ) {

                await signOut(auth);

                return;
            }


            showApplication(
                userData
            );

        }

        catch (error) {

            console.error(
                "Authentication check:",
                error
            );

            await signOut(auth);

        }

    }
);


// ============================================================
// SHOW APPLICATION
// ============================================================

function showApplication(
    userData
) {

    loginScreen.classList.add(
        "hidden"
    );

    appScreen.classList.remove(
        "hidden"
    );


    const name =
        userData.name ||
        "Admin";


    adminName.textContent =
        name;

    welcomeName.textContent =
        name;


    loadTodayRate();
}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLogin() {

    loginScreen.classList.remove(
        "hidden"
    );

    appScreen.classList.add(
        "hidden"
    );
}


// ============================================================
// LOGOUT
// ============================================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            loginForm.reset();

            showLogin();

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


// ============================================================
// LOAD TODAY'S RATE
// ============================================================

async function loadTodayRate() {

    rateStatus.textContent =
        "Checking today's rate...";


    try {

        const rateReference =
            doc(
                db,
                "dailyRates",
                today
            );


        const rateSnapshot =
            await getDoc(
                rateReference
            );


        if (
            rateSnapshot.exists()
        ) {

            const data =
                rateSnapshot.data();


            dailyRateInput.value =
                data.ratePerKg;


            rateStatus.textContent =
                `Today's rate is ₹${Number(
                    data.ratePerKg
                ).toFixed(2)} per KG.`;

            saveRateButton.textContent =
                "Update Today's Rate";

        }

        else {

            dailyRateInput.value =
                "";

            rateStatus.textContent =
                "Today's rate has not been entered yet.";

            saveRateButton.textContent =
                "Save Today's Rate";
        }

    }

    catch (error) {

        console.error(
            "Rate loading error:",
            error
        );

        rateStatus.textContent =
            "Unable to load today's rate.";

    }

}


// ============================================================
// SAVE TODAY'S RATE
// ============================================================

saveRateButton.addEventListener(
    "click",
    saveTodayRate
);


async function saveTodayRate() {

    const rate =
        Number(
            dailyRateInput.value
        );


    if (
        !rate ||
        rate <= 0
    ) {

        rateStatus.textContent =
            "Please enter a valid price per KG.";

        dailyRateInput.focus();

        return;
    }


    saveRateButton.disabled =
        true;

    saveRateButton.textContent =
        "Saving...";


    try {

        const rateReference =
            doc(
                db,
                "dailyRates",
                today
            );


        await setDoc(
            rateReference,
            {

                date: today,

                ratePerKg: rate,

                updatedAt:
                    new Date(),

                updatedBy:
                    auth.currentUser.uid

            },
            {
                merge: true
            }
        );


        rateStatus.textContent =
            `Saved: ₹${rate.toFixed(
                2
            )} per KG for ${formatDate(
                today
            )}.`;


        saveRateButton.textContent =
            "Update Today's Rate";

    }

    catch (error) {

        console.error(
            "Rate save error:",
            error
        );

        rateStatus.textContent =
            getFriendlyError(
                error
            );

        saveRateButton.textContent =
            "Save Today's Rate";

    }

    finally {

        saveRateButton.disabled =
            false;

    }

}


// ============================================================
// FRIENDLY FIREBASE ERRORS
// ============================================================

function getFriendlyError(
    error
) {

    if (
        error.code ===
        "auth/invalid-credential"
    ) {

        return "Invalid email or password.";

    }


    if (
        error.code ===
        "auth/invalid-email"
    ) {

        return "Please enter a valid email.";

    }


    if (
        error.code ===
        "auth/too-many-requests"
    ) {

        return "Too many attempts. Please try again later.";

    }


    if (
        error.code ===
        "permission-denied"
    ) {

        return "Firebase permission denied. Check Firestore rules.";

    }


    return error.message ||
        "Something went wrong.";
}
