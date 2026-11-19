# Project 2: MintLedger — Personal Expense & Budget Tracker (Full-Stack MEVN)

A 2026 Fintech-grade **Full-Stack MEVN (MongoDB, Express.js, Vue.js 3, Node.js)** Personal Expense & Budget Tracker inspired by **Mercury**, **Copilot Money**, and **Monarch**, built using the vanilla patterns from **CST3144 Full Stack Development**.

---

## 1. UI/UX Theme: "Mercury Carbon Mint" (2026 Fintech Dashboard)

* **Color Palette:**
  * Deep Obsidian Canvas (`#090A0F`) and Slate Card Surfaces (`#12141C`, `#181B26`).
  * **Carbon Mint (`#00FFC2`):** Primary highlights, utilization progress bars, and action buttons.
  * **Financial State Colors:** Emerald (`#10B981`) for Under-Budget indicators and Rose (`#F43F5E`) for Over-Budget alerts.
* **Core Features:**
  1. **"Am I Okay?" Verdict KPI Row:** Live Total Spent, Inline-Editable Monthly Budget Target (`£`), and Remaining Balance with an animated utilization progress bar.
  2. **Dual-View Workspace:** Toggle between the **Transactions Feed** and the **Category Analytics Breakdown** (`v-if` / `v-else`).
  3. **Log Expense Command Bar (`POST /expenses`):** Supports pressing `Enter` (`v-on:keyup.enter`), recurring subscription tags, payment method selection (`Card`, `Apple Pay`, `Bank Transfer`, `Cash`), and form validation.
  4. **Inline Expense Editing (`PUT /expenses/:_id`) & Deletion (`DELETE /expenses/:_id`):** Edit any transaction's title, category, amount, payment method, or date directly in the feed.
  5. **Full-Stack Search (`watch` + `GET /search?q=...`), Multi-Filtering, Multi-Attribute Sorting, and `localStorage` Offline Persistence.**

---

## 2. Line-by-Line Code Explanation

### A. Back-End (`backend/server.js`)
* **Lines 1–18:** Loads `express`, `cors`, `path`, `fs`, `dotenv` (`config.env`), and the native `mongodb` driver (`MongoClient`, `ObjectId`), plus `expenses.json` as an automatic local fallback.
* **Lines 22–37 (Middleware Stack):**
  * `app.use(cors())` and `app.use(express.json())`.
  * **Logger Middleware** logs every incoming request's HTTP method, URL, and timestamp.
  * **Static File Middleware** serves `/images` from `staticFiles/` with a `404` `"Image not found!"` fallback.
* **Lines 48–137 (REST API Routes):**
  * `GET /expenses` — Returns all expenses from `db.collection("expenses").find({}).toArray()`.
  * `GET /search?q=...` — Searches expenses across `title`, `category`, `amount`, `paymentMethod`, and `date`.
  * `POST /expenses` — Inserts a new expense document via `collection.insertOne(body)`.
  * `PUT /expenses/:_id` — Updates any expense attribute via `collection.updateOne({ _id: new ObjectId(tempid) }, { $set: request.body })`.
  * `DELETE /expenses/:_id` — Removes an expense document via `collection.deleteOne({ _id: new ObjectId(tempid) })`.

### B. Front-End (`frontend/index.html`)
* **Hero KPI Verdict Row (Lines 325–379):**
  * Binds `totalSpent`, `recurringTotal`, `monthlyBudget` (`v-model.number`), `remainingBudget`, and `budgetUsedPercent` computed properties.
* **Quick-Add Expense Form (Lines 382–425):**
  * Uses `v-model` and `v-model.number` with `v-on:keyup.enter` and `v-bind:disabled="!isValidExpense"`.
* **Transactions Feed & Inline Edit Drawer (Lines 461–513):**
  * Renders `v-for="exp in sortedExpenses"` with dynamic Font Awesome category icons (`categoryIcon(exp.category)`), recurring badges, inline editing drawer (`saveEdit(exp)` -> `PUT /expenses/:_id`), and delete button (`deleteExpense(exp)` -> `DELETE /expenses/:_id`).
* **Category Breakdown Analytics View (Lines 516–539):**
  * Uses `v-for="stat in categoryBreakdown"` to render per-category transaction counts, total spend (`£`), and percentage progress bars.
