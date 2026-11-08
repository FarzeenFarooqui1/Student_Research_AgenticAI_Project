# Student Research Assistant 🎓

An agentic literature discovery, methodological critique, and evidence mapping tool built for academic researchers and students. This platform leverages LLMs and Semantic Scholar to discover academic papers, audit methodological quality, evaluate potential biases, and automatically map structured experimental evidence across any academic discipline.

---

## 🌟 Key Features

1. **Academic Paper Discovery**: Integrates directly with the Semantic Scholar Academic Graph API with built-in rate-limit handling and automatic retries.
2. **AI Critique Agent**: Evaluates quality scores, highlights methodological flaws, flags potential sample/analytical biases, and provides clear takeaways.
3. **Universal Evidence Mapper Agent**: Dynamically extracts relational, multi-condition experimental matrices (variables, setup, parameters, numeric metrics, and response directions) regardless of domain (CS, Biology, Chemistry, Economics, etc.).
4. **Interactive Dashboard**: Modern Next.js interface with real-time streaming, fallback handling for review articles, and dynamic matrix visualization.

---

## 🛠 System Architecture

```text
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py           # FastAPI REST API & routes
│   │   ├── agents/
│   │   │   ├── critique.py   # AI Methodological Critique Sub-Agent
│   │   │   └── evidence_mapper.py # Relational Evidence Mapper Agent
│   │   └── tools/
│   │       └── semantic_scholar.py # Semantic Scholar API Wrapper
│   └── requirements.txt
│
└── frontend/                 # Next.js Frontend Dashboard
    ├── src/
    │   └── app/
    │       └── page.tsx      # Interactive Student Research Dashboard
    └── .env.local            # Frontend API Config
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- **Python**: 3.10+ (tested through Python 3.14)
- **Node.js**: v18+ and npm
- **API Keys**:
  - `OPENAI_API_KEY`: Required for LangChain sub-agents (`gpt-4o` / `gpt-4o-mini`)
  - `S2_API_KEY` *(Optional)*: Semantic Scholar API key (helps increase rate limits)

---

### 2. Backend Setup (FastAPI)

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install fastapi uvicorn langchain langchain-openai pydantic python-dotenv httpx
   ```

4. Create a `.env` file inside the `backend/` directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   S2_API_KEY=your_semantic_scholar_api_key_here  # Optional
   ```

5. Launch the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend will start at `http://localhost:8000`. You can test the API docs directly at `http://localhost:8000/docs`.*

---

### 3. Frontend Setup (Next.js)

1. Open a new terminal tab and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file inside `frontend/`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 🔬 How to Use

1. **Search**: Enter any research topic into the search bar (e.g., `agentic workflows`, `quantum computing`, or `sludge ozonation`).
2. **Run AI Critique**: Click **"Run AI Critique & Analysis"** on any paper card to trigger the critique agent. It will generate a quality rating out of 10, point out potential sample/methodological flaws, and highlight student takeaways.
3. **Extract Evidence Matrix**: Click **"Generate Structured Evidence Matrix"** to run the evidence mapping agent. It will deconstruct the paper's abstract into a clean table containing experimental setups, intervention parameters, numeric outcome metrics, and reporting gaps.

---

## 🔮 Future Roadmap (Discussion Topics for Advisor Meeting)

- [ ] **PDF File Ingestion**: Upload custom PDF papers for full-text parsing instead of abstracts.
- [ ] **Cross-Paper Synthesis**: Aggregate evidence matrix rows across multiple papers into a single exportable synthesis file.
- [ ] **Export Options**: One-click download of evidence matrices as CSV / LaTeX tables.