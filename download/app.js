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
    document.getElementById(
        "adminName"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const employeeSearch =
    document.getElementById(
        "employeeSearch"
    );

const searchResults =
    document.getElementById(
        "searchResults"
    );

const selectedEmployee =
    document.getElementById(
        "selectedEmployee"
    );

const employeeAvatar =
    document.getElementById(
        "employeeAvatar"
    );

const employeeCode =
    document.getElementById(
        "employeeCode"
    );

const employeeName =
    document.getElementById(
        "employeeName"
    );

const changeEmployee =
    document.getElementById(
        "changeEmployee"
    );

const fromDate =
    document.getElementById(
        "fromDate"
    );

const toDate =
    document.getElementById(
        "toDate"
    );

const viewReportButton =
    document.getElementById(
        "viewReportButton"
    );

const reportMessage =
    document.getElementById(
        "reportMessage"
    );

const reportCard =
    document.getElementById(
        "reportCard"
    );

const reportPeriod =
    document.getElementById(
        "reportPeriod"
    );

const reportEmployeeName =
    document.getElementById(
        "reportEmployeeName"
    );

const reportEmployeeCode =
    document.getElementById(
        "reportEmployeeCode"
    );

const totalDays =
    document.getElementById(
        "totalDays"
    );

const totalWeight =
    document.getElementById(
        "totalWeight"
    );

const totalPayment =
    document.getElementById(
        "totalPayment"
    );

const reportTable =
    document.getElementById(
        "reportTable"
    );

const downloadPdfButton =
    document.getElementById(
        "downloadPdfButton"
    );


// ============================================================
// VARIABLES
// ============================================================

let employees = [];

let currentEmployee = null;

let currentReport = [];


// ============================================================
// DATE HELPERS
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


function formatDate(
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
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// DEFAULT DATES
// ============================================================

const today =
    getTodayString();


fromDate.value =
    today;


toDate.value =
    today;


// ============================================================
// ADMIN AUTH
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
        item => {

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
// SEARCH EMPLOYEE
// ============================================================

employeeSearch.addEventListener(
    "input",
    () => {

        const search =
            employeeSearch.value
                .trim()
                .toLowerCase();


        searchResults.innerHTML =
            "";


        if (!search) {

            return;

        }


        const results =
            employees.filter(
                employee =>
                    employee.code
                        .toLowerCase()
                        .includes(search)

                    ||

                    employee.name
                        .toLowerCase()
                        .includes(search)
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

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "search-result";


                    row.innerHTML = `

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


                    row.addEventListener(
                        "click",
                        () => {

                            selectEmployee(
                                employee
                            );

                        }
                    );


                    searchResults.appendChild(
                        row
                    );

                }
            );

    }
);


// ============================================================
// SELECT EMPLOYEE
// ============================================================

function selectEmployee(
    employee
) {

    currentEmployee =
        employee;


    employeeSearch.value =
        "";


    searchResults.innerHTML =
        "";


    employeeSearch.parentElement
        .classList.add(
            "hidden"
        );


    selectedEmployee.classList.remove(
        "hidden"
    );


    employeeAvatar.textContent =
        employee.name
            .charAt(0)
            .toUpperCase();


    employeeCode.textContent =
        `CODE ${employee.code}`;


    employeeName.textContent =
        employee.name;


    reportCard.classList.add(
        "hidden"
    );

}


// ============================================================
// CHANGE EMPLOYEE
// ============================================================

changeEmployee.addEventListener(
    "click",
    () => {

        currentEmployee =
            null;


        selectedEmployee.classList.add(
            "hidden"
        );


        employeeSearch.parentElement
            .classList.remove(
                "hidden"
            );


        reportCard.classList.add(
            "hidden"
        );


        employeeSearch.focus();

    }
);


// ============================================================
// VIEW REPORT
// ============================================================

viewReportButton.addEventListener(
    "click",
    async () => {

        reportMessage.textContent =
            "";


        if (!currentEmployee) {

            reportMessage.textContent =
                "Please select an employee.";

            return;

        }


        const start =
            fromDate.value;

        const end =
            toDate.value;


        if (!start || !end) {

            reportMessage.textContent =
                "Please select both dates.";

            return;

        }


        if (start > end) {

            reportMessage.textContent =
                "From Date cannot be after To Date.";

            return;

        }


        viewReportButton.disabled =
            true;

        viewReportButton.textContent =
            "Loading...";


        try {

            await generateReport(
                start,
                end
            );

        }

        catch (error) {

            console.error(
                "Report error:",
                error
            );


            reportMessage.textContent =
                "Unable to load report.";

        }

        finally {

            viewReportButton.disabled =
                false;

            viewReportButton.textContent =
                "View Report";

        }

    }
);


// ============================================================
// GENERATE REPORT
// ============================================================

async function generateReport(
    start,
    end
) {

    const snapshot =
        await getDocs(
            collection(
                db,
                "dailyRecords"
            )
        );


    currentReport = [];


    snapshot.forEach(
        item => {

            const data =
                item.data();


            if (
                data.employeeCode ===
                    currentEmployee.code
                &&
                data.date >= start
                &&
                data.date <= end
            ) {

                currentReport.push(
                    data
                );

            }

        }
    );


    currentReport.sort(
        (a, b) =>
            a.date.localeCompare(
                b.date
            )
    );


    renderReport(
        start,
        end
    );

}


// ============================================================
// RENDER REPORT
// ============================================================

function renderReport(
    start,
    end
) {

    reportCard.classList.remove(
        "hidden"
    );


    reportEmployeeName.textContent =
        currentEmployee.name;


    reportEmployeeCode.textContent =
        `Employee ${currentEmployee.code}`;


    reportPeriod.textContent =
        `${formatDate(
            start
        )} – ${formatDate(
            end
        )}`;


    let weightTotal =
        0;

    let paymentTotal =
        0;


    reportTable.innerHTML =
        "";


    if (
        currentReport.length ===
        0
    ) {

        reportTable.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty-row"
                >
                    No flower entries found
                    for this employee
                    in the selected dates.
                </td>

            </tr>

        `;

    }

    else {

        currentReport.forEach(
            record => {

                const kg =
                    Number(
                        record.weightKg
                    ) || 0;


                const rate =
                    Number(
                        record.ratePerKg
                    ) || 0;


                const payment =
                    Number(
                        record.payment
                    ) ||
                    (
                        kg * rate
                    );


                weightTotal +=
                    kg;


                paymentTotal +=
                    payment;


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${formatDate(
                            record.date
                        )}
                    </td>

                    <td>
                        ${kg.toFixed(
                            3
                        )} KG
                    </td>

                    <td>
                        ₹${rate.toFixed(
                            2
                        )}
                    </td>

                    <td>
                        ₹${payment.toFixed(
                            2
                        )}
                    </td>

                `;


                reportTable.appendChild(
                    row
                );

            }
        );

    }


    totalDays.textContent =
        currentReport.length;


    totalWeight.textContent =
        `${weightTotal.toFixed(
            3
        )} KG`;


    totalPayment.textContent =
        `₹${paymentTotal.toFixed(
            2
        )}`;


    reportCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ============================================================
// PDF DOWNLOAD
// ============================================================

downloadPdfButton.addEventListener(
    "click",
    () => {

        if (
            !currentEmployee ||
            currentReport.length === 0
        ) {

            alert(
                "There is no data to download."
            );

            return;

        }


        createPdf();

    }
);


// ============================================================
// PDF CREATION
// ============================================================

function createPdf() {

    const start =
        fromDate.value;

    const end =
        toDate.value;


    let totalKg =
        0;

    let totalAmount =
        0;


    currentReport.forEach(
        record => {

            const kg =
                Number(
                    record.weightKg
                ) || 0;


            const amount =
                Number(
                    record.payment
                ) ||
                (
                    kg *
                    Number(
                        record.ratePerKg
                    )
                );


            totalKg +=
                kg;

            totalAmount +=
                amount;

        }
    );


    /*
     * Open a clean printable report.
     *
     * Browser print dialog allows
     * "Save as PDF".
     */

    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Please allow pop-ups to download the PDF."
        );

        return;

    }


    const rows =
        currentReport
            .map(
                record => {

                    const kg =
                        Number(
                            record.weightKg
                        ) || 0;


                    const rate =
                        Number(
                            record.ratePerKg
                        ) || 0;


                    const payment =
                        Number(
                            record.payment
                        ) ||
                        kg * rate;


                    return `

                        <tr>

                            <td>
                                ${formatDate(
                                    record.date
                                )}
                            </td>

                            <td>
                                ${kg.toFixed(
                                    3
                                )} KG
                            </td>

                            <td>
                                ₹${rate.toFixed(
                                    2
                                )}
                            </td>

                            <td>
                                ₹${payment.toFixed(
                                    2
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Mallige Farm - Employee Statement
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {

                    font-family:
                        Arial,
                        sans-serif;

                    color: #20251c;

                    padding: 40px;

                }

                .top {

                    border-bottom:
                        2px solid #596f36;

                    padding-bottom:
                        18px;

                    margin-bottom:
                        25px;

                }

                h1 {

                    margin: 0;

                    font-size:
                        24px;

                }

                h2 {

                    margin:
                        8px 0 0;

                    font-size:
                        18px;

                }

                .muted {

                    color:
                        #73796c;

                    font-size:
                        12px;

                    margin-top:
                        5px;

                }

                .employee {

                    margin:
                        25px 0;

                }

                .employee strong {

                    font-size:
                        17px;

                }

                table {

                    width:
                        100%;

                    border-collapse:
                        collapse;

                    margin-top:
                        20px;

                }

                th {

                    background:
                        #edf2e5;

                    text-align:
                        left;

                    padding:
                        10px;

                    font-size:
                        11px;

                }

                td {

                    padding:
                        10px;

                    border-bottom:
                        1px solid #dfe5d6;

                    font-size:
                        12px;

                }

                .totals {

                    margin-top:
                        25px;

                    padding:
                        18px;

                    background:
                        #edf2e5;

                }

                .total-line {

                    display:
                        flex;

                    justify-content:
                        space-between;

                    margin:
                        7px 0;

                    font-size:
                        13px;

                }

                .grand {

                    margin-top:
                        12px;

                    padding-top:
                        12px;

                    border-top:
                        1px solid #bfc9af;

                    font-size:
                        18px;

                    font-weight:
                        bold;

                    color:
                        #596f36;

                }

                .footer {

                    margin-top:
                        45px;

                    text-align:
                        center;

                    color:
                        #73796c;

                    font-size:
                        10px;

                }

                @media print {

                    body {
                        padding: 20px;
                    }

                }

            </style>

        </head>


        <body>


            <div class="top">

                <h1>
                    Mallige Farm
                </h1>

                <h2>
                    Flower Plucking Payment Statement
                </h2>

                <div class="muted">
                    ${formatDate(
                        start
                    )}
                    -
                    ${formatDate(
                        end
                    )}
                </div>

            </div>


            <div class="employee">

                <strong>
                    ${escapeHtml(
                        currentEmployee.name
                    )}
                </strong>

                <div class="muted">
                    Employee Code:
                    ${escapeHtml(
                        currentEmployee.code
                    )}
                </div>

            </div>


            <table>

                <thead>

                    <tr>

                        <th>
                            Date
                        </th>

                        <th>
                            Flower Weight
                        </th>

                        <th>
                            Rate / KG
                        </th>

                        <th>
                            Payment
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${rows}

                </tbody>

            </table>


            <div class="totals">

                <div class="total-line">

                    <span>
                        Total Working Days
                    </span>

                    <strong>
                        ${currentReport.length}
                    </strong>

                </div>


                <div class="total-line">

                    <span>
                        Total Flower
                    </span>

                    <strong>
                        ${totalKg.toFixed(
                            3
                        )} KG
                    </strong>

                </div>


                <div class="total-line grand">

                    <span>
                        TOTAL PAYMENT
                    </span>

                    <strong>
                        ₹${totalAmount.toFixed(
                            2
                        )}
                    </strong>

                </div>

            </div>


            <div class="footer">

                Mallige Farm
                •
                Agricultural Management

            </div>


        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        () => {

            printWindow.print();

        },
        500
    );

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
