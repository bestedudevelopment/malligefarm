
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

const selectedDateInput =
    document.getElementById("selectedDate");

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


// ============================================================
// SELECTED DATE
// ============================================================

// Default to today's date for convenience.
// Admin can manually change it.

let selectedDate =
    getTodayString();


// Put today's date into date picker

selectedDateInput.value =
    selectedDate;


// Show date on page

if (todayDisplay) {

    todayDisplay.textContent =
        formatDate(selectedDate);

}


// ============================================================
// DATE CHANGE
// ============================================================

selectedDateInput.addEventListener(
    "change",
    async () => {

        selectedDate =
            selectedDateInput.value;


        if (!selectedDate) {

            return;
        }


        if (todayDisplay) {

            todayDisplay.textContent =
                formatDate(selectedDate);

        }


        await loadSelectedDateRate();

    }
);


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


        loginMessage.textContent =
            "";


        loginButton.disabled =
            true;

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


            // Get admin profile

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


            if (
                !userSnapshot.exists()
            ) {

                await signOut(auth);

                throw new Error(
                    "Admin profile was not found."
                );

            }


            const userData =
                userSnapshot.data();


            // Admin only

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
                getFriendlyError(error);

        }

        finally {

            loginButton.disabled =
                false;

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


            if (
                !userSnapshot.exists()
            ) {

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


    // Load rate for currently selected date

    loadSelectedDateRate();

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
// LOAD RATE FOR SELECTED DATE
// ============================================================

async function loadSelectedDateRate() {

    if (!selectedDate) {

        return;

    }


    rateStatus.textContent =
        "Checking saved rate...";


    try {

        const rateReference =
            doc(
                db,
                "dailyRates",
                selectedDate
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
                `Saved rate for ${formatDate(
                    selectedDate
                )}: ₹${Number(
                    data.ratePerKg
                ).toFixed(2)} per KG.`;


            saveRateButton.textContent =
                "Update Rate";

        }

        else {

            dailyRateInput.value =
                "";


            rateStatus.textContent =
                `No rate saved for ${formatDate(
                    selectedDate
                )}.`;


            saveRateButton.textContent =
                "Save Rate";

        }

    }

    catch (error) {

        console.error(
            "Rate loading error:",
            error
        );


        rateStatus.textContent =
            getFriendlyError(error);

    }

}


// ============================================================
// SAVE RATE FOR SELECTED DATE
// ============================================================

saveRateButton.addEventListener(
    "click",
    saveSelectedDateRate
);


async function saveSelectedDateRate() {

    // Get current selected date

    selectedDate =
        selectedDateInput.value;


    if (!selectedDate) {

        rateStatus.textContent =
            "Please select a date.";

        return;

    }


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


    // Make sure admin is logged in

    if (!auth.currentUser) {

        rateStatus.textContent =
            "Please login again.";

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
                selectedDate
            );


        await setDoc(
            rateReference,
            {

                date:
                    selectedDate,

                ratePerKg:
                    rate,

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
            `Saved ₹${rate.toFixed(
                2
            )}/KG for ${formatDate(
                selectedDate
            )}.`;


        saveRateButton.textContent =
            "Update Rate";

    }

    catch (error) {

        console.error(
            "Rate save error:",
            error
        );


        rateStatus.textContent =
            getFriendlyError(error);


        saveRateButton.textContent =
            "Save Rate";

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

