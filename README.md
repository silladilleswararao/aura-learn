# AURA LEARN

**Tagline:** *Learn. Play. Master.*

---

## 1. Problem & Solution

### The Problem
Students struggle to efficiently understand, synthesize, and revise large amounts of unstructured study material (lecture PDFs, lab manuals, and class notes). Standard AI chatbots either hallucinate outside information or stop after answering a single question—leaving students passive rather than actively tested.

### The Solution
**Aura Learn** transforms uploaded study material into a **grounded AI learning assistant, exam prep studio, and interactive Quiz Arena**. Every answer, study card, exam question, and quiz round is strictly grounded in the student's uploaded documents with verifiable page citations and adaptive weak-topic detection.

---

## 2. Key Features

1. **Multi-Document Upload & Management (`My Documents`)**
   - Drag-and-drop or file browser supporting `.pdf` and `.txt` files.
   - Real-time processing pipeline: *Uploading → Reading pages → Semantic chunking → Vector embedding → Ready to learn*.
   - View extracted chunks, rename documents, delete documents, or select specific documents for scoped querying.
   - Pre-loaded with 3 university sample documents (*Machine Learning Notes*, *Python Unit 1 Core Concepts*, and *OS Lab Manual*) plus a one-click test `.txt` downloader for immediate live evaluation.

2. **Grounded RAG Chat (`Ask Aura`)**
   - Multi-turn conversational Q&A grounded **exclusively** in your uploaded documents.
   - **Zero-Hallucination Guardrail:** If the answer cannot be found in the uploaded material, Aura explicitly replies: `"I couldn't find this information in your uploaded material."`
   - **Clickable Source Citations:** Every factual response displays the exact document name, page number, topic, and extracted text snippet.

3. **Study Mode (`Study Mode`)**
   - Scope by entire document bundle or filter by a specific detected topic.
   - Generates 7 structured study tools from your notes:
     1. *Quick Summary*
     2. *Key Concept Cards* (Definition, Remember, Important + source citation)
     3. *Important Definitions*
     4. *Important Points*
     5. *Topic Breakdown*
     6. *Important Questions*
     7. *Quick Revision Flashcards* (interactive tap-to-reveal cards)

4. **Exam Preparation Studio (`Exam Mode`)**
   - Select Difficulty (*Easy*, *Medium*, *Hard*) and Answer Style (*Very short*, *Exam-ready*, *Detailed*).
   - Generates Short-Answer Questions, Long-Answer Questions with examiner marking rubrics, Exam Definitions, and an interactive Revision Checklist.
   - Includes a **"Show source"** button on every generated answer and definition.

5. **Interactive Game Modes (`Quiz Arena`)**
   - **Mode 1 — Quick Fire:** 60-second timer, streak bonuses, rapid grounded recall.
   - **Mode 2 — Survival:** Start with 3 lives (`❤️ ❤️ ❤️`), lose a life on wrong answers, survive to the end.
   - **Mode 3 — Boss Battle:** 5 high-difficulty conceptual and reasoning questions with 2.5x score rewards.
   - **Mode 4 — Mix It Up:** Blends Multiple Choice, True/False, Fill in the Blank, and Concept-based questions.
   - **Adaptive Weak-Topic Practice:** Automatically generates a focused 5-question round targeting any topic marked as *Needs Practice*.

6. **Weak Topic Detection & Gamification (`Progress`)**
   - Tracks mastery per topic across quizzes and categorizes topics into:
     - 🟢 **Strong** (75%+ mastery)
     - 🟡 **Improving** (55%–74% mastery)
     - 🔴 **Needs Practice** (<55% mastery) with one-click `"Practice [Topic]"` button.
   - Includes XP, Levels, Streaks, and unlockable Student Badges.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express (`server.ts`)
- **AI & Embeddings:** Official `@google/genai` SDK (`gemini-3.8-flash` for grounded generation & structured JSON schemas; `gemini-embedding-2-preview` for semantic vector embeddings)
- **Document Parsing:** `pdfjs-dist` (client-side PDF page-by-page extraction) + UTF-8 text segmentation
- **Persistence:** Browser `localStorage` session persistence for documents, chunks, chat history, and mastery progress

---

## 4. How RAG, Document Processing, Quiz & Weak-Topic Detection Work

### Document Processing & Semantic Chunking
1. Uploaded PDFs are parsed page-by-page using `pdfjs-dist`, preserving page numbers.
2. Text is cleaned and segmented on paragraph/sentence boundaries into semantic chunks (~350–620 characters) with 1-sentence overlap so context is never cut mid-thought.
3. Each chunk stores metadata: `id`, `documentId`, `documentName`, `pageNumber`, `topic`, `keywords`, and `embedding`.

### Hybrid RAG Retrieval
1. When a student asks a question in `Ask Aura`, the backend (`/api/ask`) scores all active chunks using a hybrid of **Cosine Similarity** (via `gemini-embedding-2-preview` vectors) and **Lexical Keyword/Topic Matching** (with conversation history pronoun resolution).
2. The top 3–5 relevant chunks are sent to `gemini-3.8-flash` under a strict system instruction and JSON schema that forbids external facts.

### Weak-Topic Detection & Adaptive Practice
1. Every question in `Quiz Arena` is tagged with its source `topic`.
2. Upon completing a quiz, `App.tsx` updates cumulative `correct / attempts` per topic and recalculates `masteryPercent`.
3. Topics below 55% are flagged as **Needs Practice**. Clicking `"Practice [Topic]"` launches `Quiz Arena` in `weak_topic` mode, filtering RAG chunks to that specific topic and generating 5 targeted questions.

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Node.js 18+ installed
- A Google Gemini API Key

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (referencing `.env.example`):
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### 3. Run in Development Mode
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build & Run for Production
```bash
npm run build
npm start
```

---

## 6. Limitations & Future Improvements

- **Current Limitations:**
  - Scanned image-only PDFs without an OCR text layer cannot be extracted by standard text parsers (Aura displays a clear friendly error message if a PDF has no extractable text).
  - Data persistence currently uses browser `localStorage` for zero-friction demo testing without requiring account sign-up.
- **Future Improvements:**
  - Cloud database sync (Firestore / PostgreSQL) for multi-device student accounts.
  - Multimodal OCR for handwritten notes and diagrams.
  - Multiplayer live Quiz Arena rooms for study groups.
