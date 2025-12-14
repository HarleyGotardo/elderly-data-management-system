**System Design Document: Senior Citizen Benefit EDMS (R.A. 11982)**

Date: December 14, 2025

Architecture Type: 2-Tier Hybrid (Offline Desktop Client + Cloud Admin)

System Goal: To provide LGUs (Clients) a platform to submit senior
citizen data to a Central Authority (Admin) for cross-matching,
cleanlisting, and payroll generation, capable of operating without an
active internet connection.

**1. User Roles & Permissions**

+-----+---------------------+-----------------------------------------+
| **  | **System Access     | **Key Responsibility**                  |
| Rol | Level**             |                                         |
| e** |                     |                                         |
+=====+=====================+=========================================+
| **  | **Restricted        | **Data Intake:** Encoding applicants,   |
| Cli | Scope**             | uploading requirements, and performing  |
| ent |                     | local duplicate checks. **Must operate  |
| (   | Can only view/edit  | offline.**                              |
| LGU | data for their      |                                         |
| )** | specific            |                                         |
|     | Municipality/City.  |                                         |
+-----+---------------------+-----------------------------------------+
| **A | **Global Scope**    | **Cleanlisting:** Performing global     |
| dmi |                     | cross-matching (finding duplicates      |
| n** | Full access to all  | between different LGUs), auditing, and  |
|     | records from all    | generating the final payroll.           |
|     | LGUs.               |                                         |
+-----+---------------------+-----------------------------------------+

**2. Database Schema (Data Dictionary)**

Derived from the Application Form and Masterlist Spreadsheet.

**A. Applicant Profile (Input by Client)**

-   **Core IDs:**

    -   OSCA ID Number.

    -   NCSC Registration Reference Number (RRN).

-   **Personal Information:**

    -   Full Name (Last, First, Middle, Ext).

    -   Date of Birth (Month, Day, Year) & Auto-calculated Age.

    -   Sex, Civil Status.

    -   Citizenship (Filipino/Dual + Details).

-   **Vulnerable Sector Markers:**

    -   **IP:** Indigenous People Status (Dropdown).

    -   **PWD:** Person with Disability Status (Dropdown).

-   **Location:**

    -   Region, Province, Municipality, Barangay.

    -   Specific Address (House No., Street).

-   **Relationships:**

    -   Spouse Name.

    -   Authorized Representatives (Max 3: Name & Relationship).

    -   Beneficiaries (Primary & Contingent).

**B. Admin/System Fields (Read-Only for Client)**

-   **Validation Status:**

    -   Compliance Check (Pass/Fail).

    -   **Global Duplicate Status:** (Clean / Duplicate / Suspected).

    -   **Admin Assessment:** (Approved / Hold / Denied).

-   **Payment Data:**

    -   Payment Status (Unpaid / Paid).

    -   Payment Date.

    -   Date of Death (for Audit).

    -   Remarks.

**3. Functional Workflow**

**Step 1: Client Data Entry (The Local Gate)**

-   **Action:** LGU Client logs in and encodes a new applicant.

-   **System Check (Local):** The system checks if the Name + Birthdate
    already exists **within the local offline database**.

    -   If Match: Prevents entry. Error: \"Applicant already exists in
        your list.\"

    -   If Unique: Allows saving to the local drive.

-   **Submission:** Client uploads scanned requirements (ID, Form) and
    clicks **\"Submit to Admin\"**.

-   **Status Change:** Record locks. Status to PENDING ADMIN REVIEW.

**Step 2: Admin Cross-Matching (The Global Gate)**

-   **Trigger:** Admin receives data from multiple LGUs (via Auto-Sync
    or File Import).

-   **System Check (Global):** The system compares the new LGU
    submission against **ALL** records in the database.

    -   Scenario: \"Juan Cruz\" applies in **LGU A**. System finds a
        \"Juan Cruz\" with the same birthday in **LGU B**.

    -   Result: System flags both records as **\"Cross-LGU
        Duplicate\"**.

-   **Action:** Admin reviews the flag.

    -   If Fraud: Admin marks the new application as DENIED.

    -   If Valid (Different Person): Admin marks as CLEAN.

**Step 3: Cleanlisting & Payment Generation**

-   **Action:** Admin filters for all CLEAN records.

-   **Death Audit:** Admin runs a check against the \"Date of Death\"
    registry (if available).

-   **Finalization:** Admin changes status to APPROVED / FOR PAYMENT.

-   **Output:** System generates the Payroll File.

**Step 4: The Feedback Loop (Returning Status to LGU)**

Objective: To update the LGU\'s local database so they know who was
approved, who was denied, and who was paid.

-   **Scenario A: Auto-Sync (With Internet):**

    -   The LGU Desktop App polls the server.

    -   Server responds with ID updates (e.g., ID: 101 = APPROVED).

    -   App automatically updates the local database status icons
        (Green/Red).

-   **Scenario B: Manual Import (No Internet):**

    -   Admin generates a **\"Status Update File\"** (e.g., .enc file)
        on the Web Portal.

    -   LGU User downloads this file at an internet cafe to a USB drive.

    -   LGU User plugs USB into offline PC and clicks **\"Import
        Updates\"**.

    -   System bulk-updates all local records with the new decisions and
        payment details.

**4. Reporting Requirements**

**Client (LGU) Reports**

1.  **LGU Masterlist:** A list of all applicants submitted by the LGU
    and their current status (Pending/Approved/Denied).

2.  **Deficiency Report:** List of applicants returned by Admin for
    corrections (e.g., blurred ID).

**Admin Reports**

1.  **Global Deduplication Report:** Lists all \"Cross-LGU\" duplicates
    detected (e.g., Applicants claiming in two different cities).

2.  **National Accomplishment Report:** Total beneficiaries paid per
    Region/Province.

3.  **Vulnerable Sector Summary:** Breakdown of IP and PWD
    beneficiaries.

4.  **Utilization Audit:** Summary of \"Cash Gift Utilization\" (Food
    vs. Meds) for liquidation purposes.

**5. Logic Specifications for Programmer**

1.  **Duplicate Logic:**

    -   **Scope LGU:** WHERE (Name + DOB match) AND (LGU_ID ==
        Current_User_LGU_ID)

    -   **Scope Admin:** WHERE (Name + DOB match) AND (LGU_ID !=
        Current_User_LGU_ID)

2.  **Validation Rules:**

    -   **Milestone Age Only:** System must strictly accept ages 60 and
        beyond

    -   **Representative Limit:** Maximum of 3 representatives per
        senior.

3.  **Downstream Logic (Server \$\\to\$ Client):**

    -   The update packet must contain: Status Change, Admin Remarks,
        Payment Status, and Payment Date.

    -   **Locking:** Once a local record receives an APPROVED signal,
        the LGU App must **LOCK** that record (Read-Only) to prevent
        tampering.

4.  **Security:**

    -   LGU Client A **must never** see LGU Client B\'s data.

**6. Technical Architecture (Crucial: Offline Support)**

Rationale: Many LGUs in remote areas do not have reliable internet. A
purely web-based system (website) is not viable.

**A. The LGU Application (Desktop Client)**

-   **Recommended Tech:** **Electron JS + React JS with vite MVC
    (Windows Presentation Foundation - WPF)**.

    -   Why: Native Windows application, high stability, easy to install
        via USB.

-   **Local Database:** **SQLite**.

    -   Why: Embedded database file. Does not require a server
        installation. Stores all data locally on the LGU computer,
        allowing full encoding and searching even with **zero
        internet**.

-   **Sync Mechanism:**

    1.  **Auto-Sync:** Background service detects internet and uploads
        records automatically.

    2.  **Manual Export (The \"USB Mode\"):** For LGUs with no internet,
        the app must generate an **Encrypted Sync File**. The Data
        Manager copies this to a USB, travels to the Provincial
        Office/City, and uploads it via the Admin Portal.

**B. The Admin Application (Cloud Server)**

-   **Recommended Tech:** **ASP.NET Core Web API**.

    -   for handling synchronization requests from thousands of desktop
        clients.

-   **Central Database:** **Supabase**.

    -   Enterprise-grade relational database to handle complex
        cross-matching queries across millions of records, more or less
