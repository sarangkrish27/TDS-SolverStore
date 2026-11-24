# 🧩 TDS Solver Store

A central place for students of the **Tools in Data Science (TDS)** course to upload, find, and use solvers for assignment and take-home project questions, without digging through WhatsApp.

---

## 😩 The Problem

In TDS, every graded assignment and every take-home project has many questions, and students build a solver for each one.

These solver links usually get shared in WhatsApp groups, where they:

- get buried under dozens of unrelated messages
- are hard to search for later
- have no way to report a problem with a specific solver

## 💡 The Solution

**TDS Solver Store** puts all solvers in one organised website.

| Who | Login needed? | What they can do |
| --- | --- | --- |
| Visitor / solver user | No | Browse the site and open any solver link |
| Contributor | Yes (student email ID) | Upload a solver for a question |
| Reporter | Yes (student email ID) | Raise an issue on a specific solver |

Using a solver is frictionless: open the site, find your question, get the solver link. Login is only required when you want to **contribute** or **report a problem**.

## ✨ Features

- 📚 Solvers organised by assignment / project and question
- 🔓 Open access for anyone who just wants to use a solver
- 🔐 Student email login for uploading solvers
- 🚩 Issue reporting tied to a particular solver
- ☁️ Firebase-backed storage

## 🛠️ Tech Stack

- **Frontend:** JavaScript, built and run with npm
- **Backend / Storage:** Firebase
- **Authentication:** Firebase Authentication (student email login)

## 🚀 Getting Started

### 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended) and npm
- A Firebase project

### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/sarangkrish27/TDS-SolverStore.git
cd TDS-SolverStore

# Install dependencies
npm install
```

### 🔥 Firebase Setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and the sign-in method you use for student login.
3. Enable the storage / database services the app uses.
4. Copy your Firebase config into your environment file (for example `.env`):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> Variable names may differ depending on your setup. Match them to what the code reads.

### ▶️ Run Locally

```bash
npm run dev
```

Then open the local URL shown in the terminal (usually `http://localhost:5173`).

## 📖 How to Use

**🔍 To use a solver**
1. Open the website.
2. Pick the assignment or project, then the question.
3. Open the solver link. No login required.

**⬆️ To upload a solver**
1. Log in with your student email ID.
2. Choose the assignment or project and question.
3. Add your solver and submit.

**🐞 To report an issue**
1. Log in with your student email ID.
2. Open the solver that has the problem.
3. Raise an issue describing what went wrong.


## ⚠️ Disclaimer

This is a student-built project and is not officially affiliated with the TDS course or IIT Madras. Solvers are shared by students for learning purposes. Please follow your course's academic integrity guidelines.