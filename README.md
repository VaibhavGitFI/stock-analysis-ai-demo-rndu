# Research Terminal — Setup

## Project structure

```
StockAI/
├── backend/          Express server (port 3001)
│   ├── server.js
│   ├── .env.example  → copy to .env, add keys
│   └── package.json
│
└── frontend/         React app (port 3000)
    ├── src/
    │   ├── App.js
    │   ├── api/
    │   └── components/
    └── package.json
```

## Step 1 — API keys

```bash
cd backend
cp .env.example .env
# Edit .env and fill in:
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
```

## Step 2 — Start backend

```bash
cd backend
npm install
npm start
# → http://localhost:3001
```

## Step 3 — Start frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

## Features

- **Text query** — type the client question
- **Record** — capture live call via mic → Whisper transcribes → Claude analyzes
- **Upload** — drag and drop MP3/WAV/OGG/WebM/M4A/FLAC → same pipeline
