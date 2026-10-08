# AURA LEARN — Simple Architecture Guide

This document explains how **Aura Learn** works under the hood in simple terms that a first-year computer science student can follow.

---

## 1. Grounded Question-Answering Pipeline (RAG)

Instead of letting the AI guess from general internet knowledge, Aura Learn uses **Retrieval-Augmented Generation (RAG)** so every answer comes strictly from your uploaded notes:

```text
USER UPLOADS PDF / TXT
         ↓
DOCUMENT PROCESSOR (src/services/documentProcessor.ts)
Extracts text page-by-page and cleans extra whitespace
         ↓
SEMANTIC TEXT CHUNKS
Splits pages into 350–620 char chunks with Topic + Page Number metadata
         ↓
EMBEDDINGS & KEYWORD INDEX (/api/embeddings)
Converts chunks into numerical vectors (gemini-embedding-2-preview)
         ↓
STUDENT ASKS QUESTION IN "ASK AURA"
         ↓
HYBRID SIMILARITY SEARCH (/api/ask)
Finds the Top 3–5 chunks matching the question's meaning & keywords
         ↓
GEMINI 3.8 FLASH (server.ts)
Reads ONLY the Top 3–5 chunks + conversation history
         ↓
GROUNDED ANSWER + CLICKABLE PAGE SOURCES
Displays answer + exact Document Name, Page Number, and Snippet
```

---

## 2. Quiz Arena & Weak-Topic Adaptive Loop

Aura Learn doesn't stop after answering questions. It turns your notes into a closed-loop learning game:

```text
UPLOADED DOCUMENT CHUNKS
         ↓
DETECTED TOPICS (e.g., Supervised Learning, Loops, Functions)
         ↓
QUIZ GENERATION (/api/quiz/generate)
Gemini creates MCQs, True/False, Fill-in-Blank & Concept questions
strictly from the document chunks
         ↓
STUDENT PLAYS QUIZ ARENA
(Quick Fire 60s | Survival 3 Lives | Boss Battle | Mix It Up)
         ↓
QUIZ RESULTS & SCORE CALCULATION
Tracks Accuracy, Streak, Time, and Per-Topic Performance
         ↓
WEAK TOPIC DETECTOR (Your Learning Map)
Flags topics < 55% accuracy as "🔴 Needs Practice"
         ↓
TARGETED ADAPTIVE PRACTICE
Clicking "Practice [Topic]" generates 5 focused questions
on that exact weak topic to turn weaknesses into strengths!
```

---

## 3. Folder Structure Overview

```text
/
├── server.ts                         # Express backend + Gemini API routes (/api/*)
├── src/
│   ├── App.tsx                       # Main state, sidebar navigation & persistence
│   ├── types/aura.ts                 # TypeScript interfaces for Docs, RAG, Quiz & Progress
│   ├── data/sampleDocuments.ts       # Pre-loaded sample study material (ML, Python, OS)
│   ├── services/
│   │   ├── documentProcessor.ts      # Real PDF (pdfjs-dist) & TXT extraction + chunking
│   │   └── auraApi.ts                # Frontend API client for RAG, Study, Exam & Quiz
│   └── components/
│       ├── LandingPage.tsx           # Hero, interactive preview, features & workflow
│       ├── DashboardHomeView.tsx     # Student dashboard, stats, weak-topic map
│       ├── DocumentsView.tsx         # Drag-and-drop upload, progress bar & chunk viewer
│       ├── AskAuraView.tsx           # RAG chat with clickable source citations
│       ├── StudyModeView.tsx         # Concept cards, definitions & revision flashcards
│       ├── ExamModeView.tsx          # Short/Long exam Q&A with "Show source" proofs
│       ├── QuizArenaView.tsx         # 4 game modes + adaptive weak-topic practice
│       ├── SearchView.tsx            # Instant passage search across uploaded notes
│       ├── ProgressView.tsx          # Topic mastery bars, learning map & badges
│       └── SettingsView.tsx          # Theme contrast, session reset & system info
├── README.md                         # Project documentation & setup guide
└── ARCHITECTURE.md                   # Beginner-friendly architecture diagram
```
