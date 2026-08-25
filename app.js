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
// SAME FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyBWLGMTSEccqdnnSnqcuqnH2laPX33DX_k",

    authDomain:
        "malligefarms.firebaseapp.com",

    projectId:
        "malligefarms",

    storageBucket:
        "malligefarms.firebasestorage.app",

    messagingSenderId:
        "182446233497",

    appId:
        "1:182446233497:web:761445d7236093cf602508",

    measurementId:
        "G-8DT0EFXGSN"

};


// ============================================================
// INITIALIZE
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

const adminName =
    document.getElementById(
        "adminName"
    );

const welcomeName =
    document.getElementById(
        "welcomeName"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const selectedDateInput =
    document.getElementById(
        "selectedDate"
    );

const selectedDateText =
    document.getElementById(
        "selectedDateText"
    );

const dailyRateInput =
    document.getElementById(
        "dailyRate"
    );

const rateStatus =
    document.getElementById(
        "rateStatus"
    );

const saveRateButton =
    document.getElementById(
        "saveRateButton"
    );


// ============================================================
// DATE HELPERS
// ============================================================

function getTodayString() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function formatDate(
    dateString
) {

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


// ============================================================
// INITIAL DATE
// ============================================================

let selectedDate =
    getTodayString();


selectedDateInput.value =
    selectedDate;


selectedDateText.textContent =
    formatDate(
        selectedDate
    );


// ============================================================
// ADMIN SECURITY GUARD
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
            // USER PROFILE
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
            // NO PROFILE
            // ----------------------------------------

            if (
                !userSnapshot.exists()
            ) {

                await signOut(
                    auth
                );

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
                userData.role !==
                "admin"
            ) {

                await signOut(
                    auth
                );

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


            // Load selected date rate

            await loadRate();

        }

        catch (error) {

            console.error(
                "Admin verification error:",
                error
            );


            await signOut(
                auth
            );


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


        selectedDateText.textContent =
            formatDate(
                selectedDate
            );


        await loadRate();

    }
);


// ============================================================
// LOAD RATE FOR SELECTED DATE
// ============================================================

async function loadRate() {

    rateStatus.textContent =
        "Checking saved rate...";


    dailyRateInput.disabled =
        true;


    saveRateButton.disabled =
        true;


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


        // ----------------------------------------
        // RATE EXISTS
        // ----------------------------------------

        if (
            snapshot.exists()
        ) {

            const data =
                snapshot.data();


            const rate =
                Number(
                    data.ratePerKg
                );


            dailyRateInput.value =
                rate;


            rateStatus.textContent =
                `Saved rate for ${formatDate(
                    selectedDate
                )}: ₹${rate.toFixed(
                    2
                )} / KG`;


            saveRateButton.textContent =
                "Update Rate";

        }


        // ----------------------------------------
        // NO RATE
        // ----------------------------------------

        else {

            dailyRateInput.value =
                "";


            rateStatus.textContent =
                `No rate saved for ${formatDate(
                    selectedDate
                )}. Enter the rate below.`;


            saveRateButton.textContent =
                "Save Rate";

        }


        dailyRateInput.disabled =
            false;

        saveRateButton.disabled =
            false;

    }

    catch (error) {

        console.error(
            "Load rate error:",
            error
        );


        rateStatus.textContent =
            "Unable to load the rate. Check Firebase permissions.";


        dailyRateInput.disabled =
            false;

        saveRateButton.disabled =
            false;

    }

}


// ============================================================
// SAVE / UPDATE RATE
// ============================================================

saveRateButton.addEventListener(
    "click",
    async () => {

        if (!auth.currentUser) {

            window.location.href =
                "./login/";

            return;

        }


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
            !Number.isFinite(rate) ||
            rate <= 0
        ) {

            rateStatus.textContent =
                "Please enter a valid price per KG.";

            dailyRateInput.focus();

            return;

        }


        saveRateButton.disabled =
            true;

        dailyRateInput.disabled =
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

                    updatedBy:
                        auth.currentUser.uid,

                    updatedAt:
                        new Date()

                },
                {
                    merge: true
                }
            );


            rateStatus.textContent =
                `₹${rate.toFixed(
                    2
                )} / KG saved for ${formatDate(
                    selectedDate
                )}.`;


            saveRateButton.textContent =
                "Update Rate";

        }

        catch (error) {

            console.error(
                "Save rate error:",
                error
            );


            rateStatus.textContent =
                "Unable to save. Check Firestore permissions.";


            saveRateButton.textContent =
                "Save Rate";

        }

        finally {

            saveRateButton.disabled =
                false;

            dailyRateInput.disabled =
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

            await signOut(
                auth
            );

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
