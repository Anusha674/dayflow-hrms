# 🌊 Dayflow HRMS — Human Resource Management System

Dayflow HRMS is a modern, full-featured enterprise Human Resource Management System featuring a **Liquid Glass Design System**, dynamic looping video background, offline-first data sync, role-enforced security, and an interactive PDF Document Vault.

---

## ✨ Key Features

### 🎨 1. Liquid Glass UI & Dynamic Video Background
- Fullscreen ambient looping video background with radial gradient overlays (`#00223a` deep navy canvas).
- Frosted liquid-glass component cards (`backdrop-filter: blur(20px)`), subtle light borders, and glowing hover elevations.
- High-contrast typography optimized for both dark and light modes.

### ⏱️ 2. Attendance & Presence Tracking
- Real-time check-in and check-out recording with automatic working hours computation.
- Color-coded status badges:
  - **Present & Verified**: Green badge (`dark:bg-emerald-600`) with crisp white text in dark mode.
  - **Pending & Unverified**: Yellow badge (`dark:bg-amber-500`) with crisp white text in dark mode.

### 📄 3. Interactive Document Vault & PDF Viewer
- View official employee documents (*Offer Letter.pdf*, *ID Proof.pdf*, *Latest Payslip.pdf*) directly inside an embedded PDF preview modal.
- Includes digital cryptographic verification seals, document reference IDs, text record downloads, and single-click **Save / Print to PDF** support.

### 🏖️ 4. Leave Management & Approvals
- Employee leave requests with date pickers, leave type selection (Paid, Sick, Unpaid), and reason tracking.
- One-click HR approval and rejection workflow with instant reactive dashboard updates.

### 💰 5. Automated Payroll & Salary Slips
- Automated monthly payroll engine computing basic salary, allowances, statutory deductions, and net salary.
- Printable PDF payslips for employees and HR officers.

### 🔄 6. Offline-First Architecture & Audit Logging
- IndexedDB outbox system that queues attendance check-ins and leave requests offline and synchronizes automatically upon reconnecting.
- Immutable audit log tracking every user action for compliance.

---

## 🔐 Sign-In Credentials

> **Universal Password for ALL pre-seeded accounts:** `Dayflow@2026`

### 👑 HR Officer (Full Admin Access)
| Name | Email | Employee ID | Role | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Priya Raghavan** | `hr@dayflow.io` | `HRM001` | HR Officer | `Dayflow@2026` |

### 👤 Employee Accounts
| Name | Email | Employee ID | Department | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Arjun Mehta** | `arjun@dayflow.io` | `EMP001` | Engineering | `Dayflow@2026` |
| **Neha Kulkarni** | `neha@dayflow.io` | `EMP002` | Engineering | `Dayflow@2026` |
| **Daniel Okafor** | `daniel@dayflow.io` | `EMP003` | Design | `Dayflow@2026` |
| **Sara Lindqvist** | `sara@dayflow.io` | `EMP004` | Finance | `Dayflow@2026` |
| **Rahul Verma** | `rahul@dayflow.io` | `EMP005` | Sales | `Dayflow@2026` |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Anusha674/dayflow-hrms.git
   cd dayflow-hrms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS, Tailwind CSS, Framer Motion
- **Icons**: Lucide React
- **Storage & Database**: IndexedDB (Browser Local DB), LocalStorage
- **Notifications**: Sonner

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
