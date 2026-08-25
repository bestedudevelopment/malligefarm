// ============================================================
// FIREBASE
// ============================================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
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
// INITIALIZE
// ============================================================

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


// ============================================================
// ELEMENTS
// ============================================================

const adminName =
    document.getElementById("adminName");

const welcomeName =
    document.getElementById("welcomeName");

const logoutButton =
    document.getElementById("logoutButton");

const selectedDateInput =
    document.getElementById("selectedDate");

const todayDisplay =
    document.getElementById("todayDisplay");

const dailyRateInput =
    document.getElementById("dailyRate");

const saveRateButton =
    document.getElementById("saveRateButton");

const rateStatus =
    document.getElementById("rateStatus");


// ============================================================
// DATE
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

let selectedDate =
    getTodayString();


selectedDateInput.value =
    selectedDate;


todayDisplay.textContent =
    formatDate(selectedDate);


// ============================================================
// AUTHENTICATION GUARD
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // --------------------------------------------
        // NOT LOGGED IN
        // --------------------------------------------

        if (!user) {

            window.location.href =
                "./login/";

            return;
        }


        try {

            // ----------------------------------------
            // GET USER PROFILE
            // ----------------------------------------

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


            // ----------------------------------------
            // PROFILE DOES NOT EXIST
            // ----------------------------------------

            if (
                !userSnapshot.exists()
            ) {

                await signOut(auth);

                window.location.href =
                    "./login/";

                return;
            }


            const userData =
                userSnapshot.data();


            // ----------------------------------------
            // ADMIN ONLY
            // ----------------------------------------

            if (
                userData.role !== "admin"
            ) {

                await signOut(auth);

                window.location.href =
                    "./login/";

                return;
            }


            // ----------------------------------------
            // ADMIN VERIFIED
            // ----------------------------------------

            const name =
                userData.name ||
                "Admin";


            adminName.textContent =
                name;


            welcomeName.textContent =
                name;


            // Load rate for selected date

            await loadSelectedDateRate();

        }

        catch (error) {

            console.error(
                "Admin verification error:",
                error
            );


            await signOut(auth);

            window.location.href =
                "./login/";

        }

    }
);


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


        todayDisplay.textContent =
            formatDate(selectedDate);


        await loadSelectedDateRate();

    }
);


// ============================================================
// LOAD RATE
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


        const snapshot =
            await getDoc(
                rateReference
            );


        if (snapshot.exists()) {

            const data =
                snapshot.data();


            dailyRateInput.value =
                data.ratePerKg;


            rateStatus.textContent =
                `Saved rate for ${formatDate(
                    selectedDate
                )}: ₹${Number(
                    data.ratePerKg
                ).toFixed(2)} / KG`;


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
            "Unable to load rate.";

    }

}


// ============================================================
// SAVE RATE
// ============================================================

saveRateButton.addEventListener(
    "click",
    async () => {

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


        if (!auth.currentUser) {

            window.location.href =
                "./login/";

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
                )} / KG for ${formatDate(
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
                error.message;


            saveRateButton.textContent =
                "Save Rate";

        }

        finally {

            saveRateButton.disabled =
                false;

        }

    }
);


// ============================================================
// LOGOUT
// ============================================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "./login/";

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);
