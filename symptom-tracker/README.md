# MediCurve: Continuous Symptom Tracker & Clinical Triage

> **Closing the silence between visits.** Shifting healthcare from delayed, appointment-bound snapshots to proactive, real-time recovery monitoring.

---

## The Problem
Doctors currently rely on a single follow-up appointment—often a month later—to gauge whether an antibiotic treatment is working. In the silence between visits, side effects, allergic drug reactions, non-compliance, or outright antibiotic resistance can go unnoticed for weeks, risking severe complications and emergency room visits.

## The Solution
**MediCurve** provides continuous visibility into recovery during outpatient treatment. 

Instead of overwhelming doctors with raw logs, MediCurve is designed with **triage-first signal detection**: it quietly tracks recovering patients while immediately escalating high-risk deviations (drug allergies, Day 5 treatment failure, missed doses) so clinicians can intervene when it matters most.

### Clinical Cohort Focus
* **Condition:** Acute Bacterial Sinusitis
* **Standard Treatment:** Amoxicillin 875mg BID (10-Day Course)
* **Critical Efficacy Checkpoint:** Day 5 (Infectious disease guideline threshold for noticeable bacterial sinusitis improvement)

---

## Architecture & Features

```
symptom-tracker/
│
├── backend/
│   ├── main.py              # FastAPI REST API entrypoint
│   ├── models.py            # Pydantic schemas (Patient, CheckIn, Symptoms, SideEffects, Alert)
│   ├── baseline.py          # Expected clinical recovery trajectory & checkpoint definitions
│   ├── store.py             # In-memory clinical state manager & triage priority queue
│   ├── alert_engine.py      # 3-layer clinical signal evaluation (Allergy, Day 5 Checkpoint, Deviations)
│   ├── parser.py            # Groq Cloud LLM (llama-3.1-8b-instant) with regex fallback
│   └── seed_data.py         # Standardized 3 demo personas
│
├── frontend/
│   └── app.py                # Streamlit Clinician Dashboard & Day-Adaptive Patient Form
│
├── cli_simulator.py         # Terminal simulation & interactive CLI check-in runner
├── requirements.txt          # Dependencies (fastapi, uvicorn, streamlit, pydantic, groq, python-dotenv)
└── .gitignore               # Excludes virtualenvs, cache, and .env credentials
```

---

## The 3 Standard Demo Personas

| Persona | Day | Clinical Narrative | Computed Triage Status | Key Signals Surfaced |
| :--- | :---: | :--- | :---: | :--- |
| **Marcus Vance** (`P101`) | Day 5 | Responding normally to Amoxicillin. Facial pain dropped $4 \rightarrow 1$, fever resolved, energy back to $4/5$. | **`🟢 OK`** | `[OK] ON_TRACK`: Recovery aligns with expected clinical baseline. |
| **Elena Rostova** (`P102`) | Day 5 | Reached Day 5 checkpoint with severe pain ($4/5$), congestion ($4/5$), and active fever despite taking all doses. | **`🔴 CRITICAL`** | `[CRITICAL] TREATMENT_INEFFECTIVE`: Suspected antibiotic resistance. Consider switching to Augmentin or 2nd-line. |
| **David Kim** (`P103`) | Day 3 | Sinuses cleared up, but woke up on Day 3 with an itchy red rash and hives across chest. | **`🔴 CRITICAL`** | `[CRITICAL] ADVERSE_REACTION`: Amoxicillin hypersensitivity / drug allergy warning. Immediate review required. |

---

## Clinical Innovations

1. **Adherence vs. Resistance Differentiation**:
   - If Day 5 symptoms are high and patient took all doses $\longrightarrow$ Flagged as **`CRITICAL`** (Treatment Ineffective / Suspected Resistance).
   - If Day 5 symptoms are high but patient reports missed doses $\longrightarrow$ Flagged as **`WARNING`** (Non-Adherence Risk; counsel on compliance before switching antibiotics).
2. **Day 9 Course Completion Guard**:
   - Prevents premature discontinuation when patients feel better around Day 6–7, mitigating bacterial recurrence and resistance.
3. **Immediate Patient-Facing Safety Banner**:
   - If `Rash = True` is selected in the patient check-in form, an immediate warning advises the patient of a potential drug allergy.
4. **AI-Powered Note Parsing**:
   - Free-text patient notes are parsed with **Groq Cloud (Llama-3.1-8b-instant)** for sub-second symptom extraction, with automatic local keyword fallback if offline.

---

## How to Run

### 1. Setup Environment
```bash
cd "symptom-tracker"

# Create and activate virtual environment
uv venv .venv
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt
```

### 2. Configure Groq API Key (Optional for LLM Parsing)
Create or verify `.env` in `backend/.env` or root:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```
*(If no API key is provided, the local deterministic keyword fallback runs seamlessly).*

---

### 3. Run Options

#### Option A: Streamlit Web UI (Doctor Dashboard + Patient Form)
```bash
.venv/bin/streamlit run frontend/app.py
```
Opens an interactive dashboard with:
- **Doctor View:** Real-time priority triage queue, interactive recovery trajectory charts vs baseline curve, and clinician intervention triggers.
- **Patient View:** 45-second day-adaptive check-in form with anchored symptom scales, side effect toggles, and AI note analysis.
- **Manage Data:** Reset demo personas or register brand-new patients.

#### Option B: Terminal CLI Simulator (Interactive Console Mode)
```bash
# Automated step-by-step walkthrough
.venv/bin/python cli_simulator.py

# Interactive mode (enter custom patient & symptom inputs live)
.venv/bin/python cli_simulator.py --interactive
```

#### Option C: FastAPI REST Server
```bash
.venv/bin/uvicorn backend.main:app --reload --port 8000
```
Interactive Swagger API docs available at: `http://localhost:8000/docs`.
