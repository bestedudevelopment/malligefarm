// ======================================================
// FIREBASE IMPORTS
// ======================================================

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
    setDoc,
    collection,
    addDoc,
    getDocs,
    query,
    where
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ======================================================
// FIREBASE CONFIG
// ======================================================

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain: "YOUR_PROJECT.firebaseapp.com",

    projectId: "YOUR_PROJECT_ID",

    storageBucket: "YOUR_PROJECT.firebasestorage.app",

    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",

    appId: "YOUR_APP_ID"
};


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ======================================================
// ELEMENTS
// ======================================================

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


// Daily entry
const entryDate =
    document.getElementById("entryDate");

const dailyRate =
    document.getElementById("dailyRate");

const entryTableBody =
    document.getElementById("entryTableBody");

const addRowBtn =
    document.getElementById("addRowBtn");

const totalEmployees =
    document.getElementById("totalEmployees");

const totalWeight =
    document.getElementById("totalWeight");

const totalPayment =
    document.getElementById("totalPayment");

const saveDailyBtn =
    document.getElementById("saveDailyBtn");

const dailyMessage =
    document.getElementById("dailyMessage");


// Employee
const employeeForm =
    document.getElementById("employeeForm");

const employeeTableBody =
    document.getElementById("employeeTableBody");

const employeeMessage =
    document.getElementById("employeeMessage");


// ======================================================
// TODAY'S DATE
// ======================================================

function getToday() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    const day =
        String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

entryDate.value = getToday();


// ======================================================
// LOGIN
// ======================================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    loginMessage.textContent = "";

    loginBtn.disabled = true;

    loginBtn.textContent = "Checking...";


    try {

        const result =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user =
            result.user;


        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            await signOut(auth);

            throw new Error(
                "Admin profile not found in Firestore."
            );
        }


        const userData =
            userSnap.data();


        if (userData.role !== "admin") {

            await signOut(auth);

            throw new Error(
                "Access denied. Admin only."
            );
        }


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


// ======================================================
// AUTH STATE
// ======================================================

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


// ======================================================
// SHOW APP
// ======================================================

function showApplication(userData) {

    loginScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");

    adminName.textContent =
        userData.name || "Admin";

    loadEmployees();

    addEntryRow();

}


// ======================================================
// SHOW LOGIN
// ======================================================

function showLogin() {

    loginScreen.classList.remove("hidden");

    appScreen.classList.add("hidden");
}


// ======================================================
// LOGOUT
// ======================================================

logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    showLogin();

    loginForm.reset();

});


// ======================================================
// NAVIGATION
// ======================================================

const navButtons =
    document.querySelectorAll(".nav-btn");

const pages =
    document.querySelectorAll(".page");


navButtons.forEach(button => {

    button.addEventListener("click", () => {

        const pageId =
            button.dataset.page;


        navButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");


        pages.forEach(page =>
            page.classList.add("hidden")
        );

        document
            .getElementById(pageId)
            .classList.remove("hidden");


        if (pageId === "employeePage") {

            loadEmployees();

        }

    });

});


// ======================================================
// ADD EMPLOYEE
// ======================================================

employeeForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const code =
        document
            .getElementById("employeeCode")
            .value
            .trim();

    const name =
        document
            .getElementById("employeeName")
            .value
            .trim();


    if (!code || !name) {

        return;
    }


    try {

        const employeeRef =
            doc(db, "employees", code);


        const existing =
            await getDoc(employeeRef);


        if (existing.exists()) {

            employeeMessage.textContent =
                "Employee code already exists.";

            return;
        }


        await setDoc(employeeRef, {

            code: code,

            name: name,

            status: "active",

            createdAt: new Date()

        });


        employeeMessage.textContent =
            "Employee saved successfully ✓";


        employeeForm.reset();

        loadEmployees();

    }

    catch (error) {

        console.error(error);

        employeeMessage.textContent =
            error.message;

    }

});


// ======================================================
// LOAD EMPLOYEES
// ======================================================

async function loadEmployees() {

    employeeTableBody.innerHTML = "";

    try {

        const snapshot =
            await getDocs(
                collection(db, "employees")
            );


        snapshot.forEach(docSnap => {

            const employee =
                docSnap.data();


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>${employee.code}</td>

                <td>${employee.name}</td>

                <td>${employee.status}</td>

            `;


            employeeTableBody.appendChild(row);

        });

    }

    catch (error) {

        console.error(error);

    }

}


// ======================================================
// ADD DAILY ENTRY ROW
// ======================================================

addRowBtn.addEventListener(
    "click",
    addEntryRow
);


function addEntryRow() {

    const row =
        document.createElement("tr");


    const rowNumber =
        entryTableBody.children.length + 1;


    row.innerHTML = `

        <td>${rowNumber}</td>

        <td>

            <input
                type="text"
                class="employee-code-input"
                placeholder="Code"
            >

        </td>

        <td>

            <span class="employee-name">
                —
            </span>

        </td>

        <td>

            <input
                type="number"
                class="weight-input"
                placeholder="KG"
                min="0"
                step="0.001"
            >

        </td>

        <td>

            <span class="row-payment">
                ₹0.00
            </span>

        </td>

        <td>

            <button
                class="remove-row"
                type="button"
            >
                ✕
            </button>

        </td>

    `;


    entryTableBody.appendChild(row);


    const codeInput =
        row.querySelector(
            ".employee-code-input"
        );

    const weightInput =
        row.querySelector(
            ".weight-input"
        );


    codeInput.addEventListener(
        "change",
        async () => {

            await findEmployee(
                row,
                codeInput.value.trim()
            );

        }
    );


    weightInput.addEventListener(
        "input",
        calculateDailyTotals
    );


    row.querySelector(
        ".remove-row"
    ).addEventListener(
        "click",
        () => {

            row.remove();

            updateRowNumbers();

            calculateDailyTotals();

        }
    );

}


// ======================================================
// FIND EMPLOYEE
// ======================================================

async function findEmployee(row, code) {

    if (!code) return;


    const nameElement =
        row.querySelector(
            ".employee-name"
        );


    try {

        const employeeRef =
            doc(db, "employees", code);

        const employeeSnap =
            await getDoc(employeeRef);


        if (!employeeSnap.exists()) {

            nameElement.textContent =
                "Not found";

            nameElement.style.color =
                "red";

            return;
        }


        const employee =
            employeeSnap.data();


        nameElement.textContent =
            employee.name;

        nameElement.style.color =
            "#1f2937";

    }

    catch (error) {

        console.error(error);

    }

}


// ======================================================
// CALCULATE PAYMENTS
// ======================================================

dailyRate.addEventListener(
    "input",
    calculateDailyTotals
);


function calculateDailyTotals() {

    const rate =
        Number(dailyRate.value) || 0;


    let weightTotal = 0;

    let paymentTotal = 0;

    let employeeCount = 0;


    const rows =
        entryTableBody.querySelectorAll("tr");


    rows.forEach(row => {

        const weightInput =
            row.querySelector(
                ".weight-input"
            );


        const paymentElement =
            row.querySelector(
                ".row-payment"
            );


        const weight =
            Number(weightInput.value) || 0;


        const payment =
            weight * rate;


        if (weight > 0) {

            employeeCount++;

        }


        weightTotal += weight;

        paymentTotal += payment;


        paymentElement.textContent =
            `₹${payment.toFixed(2)}`;

    });


    totalEmployees.textContent =
        employeeCount;

    totalWeight.textContent =
        `${weightTotal.toFixed(3)} KG`;

    totalPayment.textContent =
        `₹${paymentTotal.toFixed(2)}`;

}


// ======================================================
// UPDATE ROW NUMBERS
// ======================================================

function updateRowNumbers() {

    const rows =
        entryTableBody.querySelectorAll("tr");


    rows.forEach((row, index) => {

        row.children[0].textContent =
            index + 1;

    });

}


// ======================================================
// SAVE DAILY COLLECTION
// ======================================================

saveDailyBtn.addEventListener(
    "click",
    saveDailyCollection
);


async function saveDailyCollection() {

    const date =
        entryDate.value;

    const rate =
        Number(dailyRate.value);


    if (!date) {

        dailyMessage.textContent =
            "Please select a date.";

        return;

    }


    if (!rate || rate <= 0) {

        dailyMessage.textContent =
            "Please enter today's price per KG.";

        return;

    }


    const rows =
        entryTableBody.querySelectorAll("tr");


    if (rows.length === 0) {

        dailyMessage.textContent =
            "Add at least one employee.";

        return;

    }


    saveDailyBtn.disabled = true;

    saveDailyBtn.textContent =
        "Saving...";


    try {

        for (const row of rows) {

            const code =
                row.querySelector(
                    ".employee-code-input"
                ).value.trim();


            const weight =
                Number(
                    row.querySelector(
                        ".weight-input"
                    ).value
                );


            if (!code || !weight || weight <= 0) {

                continue;

            }


            const employeeRef =
                doc(db, "employees", code);


            const employeeSnap =
                await getDoc(employeeRef);


            if (!employeeSnap.exists()) {

                continue;

            }


            const employee =
                employeeSnap.data();


            const payment =
                weight * rate;


            await addDoc(
                collection(db, "dailyRecords"),
                {

                    date: date,

                    employeeCode: code,

                    employeeName:
                        employee.name,

                    weightKg: weight,

                    ratePerKg: rate,

                    payment: payment,

                    createdAt: new Date()

                }
            );

        }


        dailyMessage.textContent =
            "Today's collection saved successfully ✓";


        // Reset rows
        entryTableBody.innerHTML = "";

        addEntryRow();

        calculateDailyTotals();

    }

    catch (error) {

        console.error(error);

        dailyMessage.textContent =
            error.message;

    }

    finally {

        saveDailyBtn.disabled = false;

        saveDailyBtn.textContent =
            "Save Today's Collection";

    }

}
