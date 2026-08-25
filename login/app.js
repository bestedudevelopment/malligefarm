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
    getDoc
}
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    apiKey: "AIzaSyBWLGMTSEccqdnnSnqcuqnH2laPX33DX_k",

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
// INITIALIZE FIREBASE
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

const loginForm =
    document.getElementById(
        "loginForm"
    );

const emailInput =
    document.getElementById(
        "email"
    );

const passwordInput =
    document.getElementById(
        "password"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const loginMessage =
    document.getElementById(
        "loginMessage"
    );

const togglePassword =
    document.getElementById(
        "togglePassword"
    );


// ============================================================
// IF ALREADY LOGGED IN
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            return;

        }


        // User is already logged in.
        // Check whether they are actually an admin.

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
                userData.role === "admin"
            ) {

                window.location.href =
                    "../index.html";

                return;

            }


            // Logged in but not admin

            await signOut(auth);

            showMessage(
                "This account does not have administrator access."
            );

        }

        catch (error) {

            console.error(
                "Existing login check:",
                error
            );

            await signOut(auth);

        }

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


        if (!email || !password) {

            showMessage(
                "Please enter your email and password."
            );

            return;

        }


        loginMessage.textContent =
            "";


        loginButton.disabled =
            true;

        loginButton.textContent =
            "Signing in...";


        try {

            // --------------------------------------------
            // FIREBASE AUTHENTICATION
            // --------------------------------------------

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


            // --------------------------------------------
            // NO PROFILE
            // --------------------------------------------

            if (
                !userSnapshot.exists()
            ) {

                await signOut(auth);

                showMessage(
                    "Your account profile was not found."
                );

                return;

            }


            const userData =
                userSnapshot.data();


            // --------------------------------------------
            // ADMIN CHECK
            // --------------------------------------------

            if (
                userData.role !== "admin"
            ) {

                await signOut(auth);

                showMessage(
                    "Access denied. Administrator access only."
                );

                return;

            }


            // --------------------------------------------
            // ADMIN VERIFIED
            // --------------------------------------------

            loginButton.textContent =
                "Opening...";


            window.location.href =
                "../index.html";

        }

        catch (error) {

            console.error(
                "Login error:",
                error
            );


            showMessage(
                getLoginError(error)
            );

        }

        finally {

            loginButton.disabled =
                false;

            if (
                loginButton.textContent !==
                "Opening..."
            ) {

                loginButton.textContent =
                    "Login";

            }

        }

    }
);


// ============================================================
// SHOW / HIDE PASSWORD
// ============================================================

togglePassword.addEventListener(
    "click",
    () => {

        if (
            passwordInput.type ===
            "password"
        ) {

            passwordInput.type =
                "text";

            togglePassword.textContent =
                "Hide";

        }

        else {

            passwordInput.type =
                "password";

            togglePassword.textContent =
                "Show";

        }

    }
);


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    text
) {

    loginMessage.textContent =
        text;

}


// ============================================================
// FIREBASE LOGIN ERRORS
// ============================================================

function getLoginError(
    error
) {

    switch (error.code) {

        case "auth/invalid-credential":

            return "Incorrect email or password.";

        case "auth/invalid-email":

            return "Please enter a valid email address.";

        case "auth/user-disabled":

            return "This account has been disabled.";

        case "auth/too-many-requests":

            return "Too many login attempts. Please try again later.";

        case "auth/network-request-failed":

            return "Network error. Please check your internet connection.";

        default:

            return (
                error.message ||
                "Unable to sign in."
            );

    }

}
