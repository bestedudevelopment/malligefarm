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
    setDoc,
    collection,
    getDocs
}
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// USE THE EXACT SAME CONFIG FROM YOUR HOME PAGE
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


const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


// ============================================================
// ELEMENTS
// ============================================================

const form =
    document.getElementById("employeeForm");

const codeInput =
    document.getElementById("employeeCode");

const nameInput =
    document.getElementById("employeeName");

const saveButton =
    document.getElementById("saveButton");

const message =
    document.getElementById("message");

const employeeList =
    document.getElementById("employeeList");

const employeeCount =
    document.getElementById("employeeCount");

const searchInput =
    document.getElementById("searchInput");

const logoutButton =
    document.getElementById("logoutButton");


// Store employees locally for search
let employees = [];


// ============================================================
// ADMIN AUTH CHECK
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../index.html";

            return;
        }


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );

            const userSnap =
                await getDoc(userRef);


            if (!userSnap.exists()) {

                await signOut(auth);

                window.location.href =
                    "../index.html";

                return;
            }


            const userData =
                userSnap.data();


            if (
                userData.role !== "admin"
            ) {

                await signOut(auth);

                window.location.href =
                    "../index.html";

                return;
            }


            loadEmployees();

        }

        catch (error) {

            console.error(error);

            await signOut(auth);

            window.location.href =
                "../index.html";

        }

    }
);


// ============================================================
// ADD EMPLOYEE
// ============================================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // Remove unnecessary spaces
        const code =
            codeInput.value.trim();

        const name =
            nameInput.value.trim();


        if (!code) {

            showMessage(
                "Please enter employee code.",
                "error"
            );

            return;
        }


        if (!name) {

            showMessage(
                "Please enter employee name.",
                "error"
            );

            return;
        }


        saveButton.disabled = true;

        saveButton.textContent =
            "Saving...";


        try {

            // Employee code = Firestore document ID

            const employeeRef =
                doc(
                    db,
                    "employees",
                    code
                );


            // Check duplicate code

            const existing =
                await getDoc(
                    employeeRef
                );


            if (existing.exists()) {

                showMessage(
                    `Employee ${code} already exists.`,
                    "error"
                );

                return;
            }


            // Save employee

            await setDoc(
                employeeRef,
                {

                    code: code,

                    name: name,

                    status: "active",

                    createdAt:
                        new Date(),

                    createdBy:
                        auth.currentUser.uid

                }
            );


            showMessage(
                `Employee ${code} - ${name} added successfully.`,
                "success"
            );


            form.reset();


            // Reload list

            await loadEmployees();


            codeInput.focus();

        }

        catch (error) {

            console.error(
                "Save employee error:",
                error
            );


            showMessage(
                error.message,
                "error"
            );

        }

        finally {

            saveButton.disabled = false;

            saveButton.textContent =
                "Add Employee";

        }

    }
);


// ============================================================
// LOAD EMPLOYEES
// ============================================================

async function loadEmployees() {

    employeeList.innerHTML = `
        <div class="loading">
            Loading employees...
        </div>
    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "employees"
                )
            );


        employees = [];


        snapshot.forEach(
            (item) => {

                const data =
                    item.data();


                employees.push({

                    code:
                        data.code ||
                        item.id,

                    name:
                        data.name ||
                        "",

                    status:
                        data.status ||
                        "active"

                });

            }
        );


        // Sort employee codes numerically

        employees.sort(
            (a, b) =>
                a.code.localeCompare(
                    b.code,
                    undefined,
                    {
                        numeric: true
                    }
                )
        );


        employeeCount.textContent =
            employees.length;


        renderEmployees(
            employees
        );

    }

    catch (error) {

        console.error(
            "Load employees error:",
            error
        );


        employeeList.innerHTML = `
            <div class="empty">
                Unable to load employees.
                <br><br>
                ${error.message}
            </div>
        `;

    }

}


// ============================================================
// RENDER
// ============================================================

function renderEmployees(
    list
) {

    employeeList.innerHTML = "";


    if (list.length === 0) {

        employeeList.innerHTML = `
            <div class="empty">
                No employees added yet.
            </div>
        `;

        return;
    }


    list.forEach(
        (employee) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "employee";


            const firstLetter =
                employee.name
                    .charAt(0)
                    .toUpperCase();


            item.innerHTML = `

                <div class="employee-left">

                    <div class="avatar">
                        ${escapeHtml(
                            firstLetter
                        )}
                    </div>

                    <div>

                        <div class="code">
                            CODE ${escapeHtml(
                                employee.code
                            )}
                        </div>

                        <div class="name">
                            ${escapeHtml(
                                employee.name
                            )}
                        </div>

                    </div>

                </div>


                <span class="status">
                    ${escapeHtml(
                        employee.status
                    )}
                </span>

            `;


            employeeList.appendChild(
                item
            );

        }
    );

}


// ============================================================
// SEARCH
// ============================================================

searchInput.addEventListener(
    "input",
    () => {

        const search =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!search) {

            renderEmployees(
                employees
            );

            return;
        }


        const filtered =
            employees.filter(
                (employee) => {

                    return (

                        employee.code
                            .toLowerCase()
                            .includes(search)

                        ||

                        employee.name
                            .toLowerCase()
                            .includes(search)

                    );

                }
            );


        renderEmployees(
            filtered
        );

    }
);


// ============================================================
// LOGOUT
// ============================================================

logoutButton.addEventListener(
    "click",
    async () => {

        await signOut(auth);

        window.location.href =
            "../index.html";

    }
);


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    text,
    type
) {

    message.textContent =
        text;


    if (type === "success") {

        message.style.color =
            "#527b3a";

    }

    else {

        message.style.color =
            "#c94b43";

    }

}


// ============================================================
// HTML SAFETY
// ============================================================

function escapeHtml(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
