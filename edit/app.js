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
// FIREBASE
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

const logoutButton =
    document.getElementById("logoutButton");

const selectedDate =
    document.getElementById("selectedDate");

const selectedDateText =
    document.getElementById("selectedDateText");

const rateDisplay =
    document.getElementById("rateDisplay");

const rateMessage =
    document.getElementById("rateMessage");

const employeeSearch =
    document.getElementById("employeeSearch");

const searchResults =
    document.getElementById("searchResults");

const employeeCard =
    document.getElementById("employeeCard");

const employeeAvatar =
    document.getElementById("employeeAvatar");

const employeeCode =
    document.getElementById("employeeCode");

const employeeName =
    document.getElementById("employeeName");

const changeEmployee =
    document.getElementById("changeEmployee");

const weight =
    document.getElementById("weight");

const calculationRate =
    document.getElementById("calculationRate");

const calculationWeight =
    document.getElementById("calculationWeight");

const calculationPayment =
    document.getElementById("calculationPayment");

const saveButton =
    document.getElementById("saveButton");

const saveMessage =
    document.getElementById("saveMessage");

const recordsCard =
    document.getElementById("recordsCard");

const recordsList =
    document.getElementById("recordsList");


// ============================================================
// VARIABLES
// ============================================================

let currentDate =
    getTodayString();

let currentRate =
    0;

let employees =
    [];

let currentEmployee =
    null;


// ============================================================
// DATE
// ============================================================

function getTodayString() {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function displayDate(
    value
) {

    const date =
        new Date(
            `${value}T00:00:00`
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
// INITIAL DATE
// ============================================================

selectedDate.value =
    currentDate;

selectedDateText.textContent =
    displayDate(
        currentDate
    );


// ============================================================
// ADMIN AUTHENTICATION
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login/";

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
                await getDoc(
                    userRef
                );


            if (
                !userSnap.exists()
            ) {

                await signOut(auth);

                window.location.href =
                    "../login/";

                return;

            }


            const userData =
                userSnap.data();


            if (
                userData.role !==
                "admin"
            ) {

                await signOut(auth);

                window.location.href =
                    "../login/";

                return;

            }


            adminName.textContent =
                userData.name ||
                "Admin";


            await loadRate();

            await loadEmployees();

        }

        catch (error) {

            console.error(error);

            await signOut(auth);

            window.location.href =
                "../login/";

        }

    }
);


// ============================================================
// DATE CHANGE
// ============================================================

selectedDate.addEventListener(
    "change",
    async () => {

        currentDate =
            selectedDate.value;


        if (!currentDate) {

            return;

        }


        selectedDateText.textContent =
            displayDate(
                currentDate
            );


        await loadRate();


        updateCalculation();

    }
);


// ============================================================
// LOAD DATE RATE
// ============================================================

async function loadRate() {

    rateMessage.textContent =
        "Checking saved rate...";


    try {

        const rateRef =
            doc(
                db,
                "dailyRates",
                currentDate
            );


        const rateSnap =
            await getDoc(
                rateRef
            );


        if (
            rateSnap.exists()
        ) {

            const data =
                rateSnap.data();


            currentRate =
                Number(
                    data.ratePerKg
                );


            rateDisplay.textContent =
                `₹${currentRate.toFixed(
                    2
                )}`;


            rateMessage.textContent =
                `Rate for ${displayDate(
                    currentDate
                )}`;

        }

        else {

            currentRate =
                0;


            rateDisplay.textContent =
                "₹0.00";


            rateMessage.textContent =
                `No rate has been entered for ${displayDate(
                    currentDate
                )}.`;

        }


        updateCalculation();

    }

    catch (error) {

        console.error(
            "Rate error:",
            error
        );


        currentRate =
            0;


        rateMessage.textContent =
            "Unable to load rate.";

    }

}


// ============================================================
// LOAD EMPLOYEES
// ============================================================

async function loadEmployees() {

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


            if (
                data.status !==
                "inactive"
            ) {

                employees.push({

                    id:
                        item.id,

                    code:
                        data.code ||
                        item.id,

                    name:
                        data.name ||
                        ""

                });

            }

        }
    );


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

}


// ============================================================
// SEARCH
// ============================================================

employeeSearch.addEventListener(
    "input",
    () => {

        const value =
            employeeSearch.value
                .trim()
                .toLowerCase();


        searchResults.innerHTML =
            "";


        if (!value) {

            return;

        }


        const results =
            employees.filter(
                employee =>
                    employee.code
                        .toLowerCase()
                        .includes(value)

                    ||

                    employee.name
                        .toLowerCase()
                        .includes(value)
            );


        if (
            results.length === 0
        ) {

            searchResults.innerHTML = `
                <div class="search-result">
                    No employee found.
                </div>
            `;

            return;

        }


        results
            .slice(0, 10)
            .forEach(
                employee => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "search-result";


                    item.innerHTML = `

                        <div class="result-avatar">
                            ${escapeHtml(
                                employee.name
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>

                        <div>

                            <div class="result-code">
                                CODE ${escapeHtml(
                                    employee.code
                                )}
                            </div>

                            <div class="result-name">
                                ${escapeHtml(
                                    employee.name
                                )}
                            </div>

                        </div>
                    `;


                    item.addEventListener(
                        "click",
                        () => {

                            selectEmployee(
                                employee
                            );

                        }
                    );


                    searchResults.appendChild(
                        item
                    );

                }
            );

    }
);


// ============================================================
// SELECT EMPLOYEE
// ============================================================

async function selectEmployee(
    employee
) {

    currentEmployee =
        employee;


    employeeSearch.value =
        "";

    searchResults.innerHTML =
        "";


    employeeCard.classList.remove(
        "hidden"
    );


    employeeCode.textContent =
        `CODE ${employee.code}`;


    employeeName.textContent =
        employee.name;


    employeeAvatar.textContent =
        employee.name
            .charAt(0)
            .toUpperCase();


    weight.value =
        "";


    updateCalculation();


    await loadEmployeeRecords();

}


// ============================================================
// CHANGE EMPLOYEE
// ============================================================

changeEmployee.addEventListener(
    "click",
    () => {

        currentEmployee =
            null;


        employeeCard.classList.add(
            "hidden"
        );


        recordsCard.classList.add(
            "hidden"
        );


        employeeSearch.focus();

    }
);


// ============================================================
// CALCULATION
// ============================================================

weight.addEventListener(
    "input",
    updateCalculation
);


function updateCalculation() {

    const kg =
        Number(
            weight.value
        ) || 0;


    const payment =
        kg * currentRate;


    calculationRate.textContent =
        `₹${currentRate.toFixed(
            2
        )} / KG`;


    calculationWeight.textContent =
        `${kg.toFixed(
            3
        )} KG`;


    calculationPayment.textContent =
        `₹${payment.toFixed(
            2
        )}`;

}


// ============================================================
// SAVE
// ============================================================

saveButton.addEventListener(
    "click",
    async () => {

        if (!currentEmployee) {

            showMessage(
                "Please select an employee.",
                false
            );

            return;

        }


        if (currentRate <= 0) {

            showMessage(
                "No plucking rate is available for this date.",
                false
            );

            return;

        }


        const kg =
            Number(
                weight.value
            );


        if (
            !Number.isFinite(kg) ||
            kg <= 0
        ) {

            showMessage(
                "Please enter the flower weight.",
                false
            );

            weight.focus();

            return;

        }


        const payment =
            kg * currentRate;


        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";


        try {

            /*
             * One employee + one date
             * = one document.
             */

            const recordId =
                `${currentEmployee.code}_${currentDate}`;


            const recordRef =
                doc(
                    db,
                    "dailyRecords",
                    recordId
                );


            await setDoc(
                recordRef,
                {

                    employeeCode:
                        currentEmployee.code,

                    employeeName:
                        currentEmployee.name,

                    date:
                        currentDate,

                    weightKg:
                        kg,

                    ratePerKg:
                        currentRate,

                    payment:
                        payment,

                    enteredBy:
                        auth.currentUser.uid,

                    updatedAt:
                        new Date()

                },
                {
                    merge: true
                }
            );


            showMessage(
                `${kg.toFixed(
                    3
                )} KG saved. Payment ₹${payment.toFixed(
                    2
                )}.`,
                true
            );


            weight.value =
                "";


            updateCalculation();


            await loadEmployeeRecords();

        }

        catch (error) {

            console.error(
                "Save error:",
                error
            );


            showMessage(
                error.message,
                false
            );

        }

        finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Flower Data";

        }

    }
);


// ============================================================
// LOAD EMPLOYEE RECORDS
// ============================================================

async function loadEmployeeRecords() {

    if (!currentEmployee) {

        return;

    }


    recordsCard.classList.remove(
        "hidden"
    );


    recordsList.innerHTML =
        "<p>Loading...</p>";


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "dailyRecords"
                )
            );


        const records =
            [];


        snapshot.forEach(
            item => {

                const data =
                    item.data();


                if (
                    data.employeeCode ===
                    currentEmployee.code
                ) {

                    records.push(
                        data
                    );

                }

            }
        );


        records.sort(
            (a, b) =>
                b.date.localeCompare(
                    a.date
                )
        );


        renderRecords(
            records
        );

    }

    catch (error) {

        console.error(
            error
        );


        recordsList.innerHTML =
            "<p>Unable to load records.</p>";

    }

}


// ============================================================
// SHOW RECORDS
// ============================================================

function renderRecords(
    records
) {

    recordsList.innerHTML =
        "";


    if (
        records.length === 0
    ) {

        recordsList.innerHTML = `
            <p style="padding:15px 0;color:#73796c;font-size:12px;">
                No previous records.
            </p>
        `;

        return;

    }


    records.forEach(
        record => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "record";


            row.innerHTML = `

                <div>

                    <span>
                        DATE
                    </span>

                    <strong>
                        ${displayDate(
                            record.date
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        FLOWER
                    </span>

                    <strong>
                        ${Number(
                            record.weightKg
                        ).toFixed(
                            3
                        )} KG
                    </strong>

                </div>


                <div>

                    <span>
                        PAYMENT
                    </span>

                    <strong>
                        ₹${Number(
                            record.payment
                        ).toFixed(
                            2
                        )}
                    </strong>

                </div>

            `;


            recordsList.appendChild(
                row
            );

        }
    );

}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    text,
    success
) {

    saveMessage.textContent =
        text;


    saveMessage.style.color =
        success
            ? "#527b3a"
            : "#c84b43";

}


// ============================================================
// LOGOUT
// ============================================================

logoutButton.addEventListener(
    "click",
    async () => {

        await signOut(
            auth
        );

        window.location.href =
            "../login/";

    }
);


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
