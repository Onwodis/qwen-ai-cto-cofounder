# QWEN CO-FOUNDER ENGINE

> **Multi-Agent AI War Room for Technical Founders**  
> Built for the Alibaba Cloud × Qwen AI Hackathon

A high-leverage co-founder workspace powered by Qwen AI. Describe your product idea and watch 4 specialized AI agents — Atlas, Rex, Nova, and Cipher — debate it in real-time, produce production-ready code blueprints, and deliver a full market feasibility report.

---

## The War Room

Four agents with distinct voices, live on-screen:

| Agent | Persona | Role |
|-------|---------|------|
| **Atlas** | AI CTO | Sets architectural direction. Decisive, opinionated. |
| **Rex** | Infra Architect | Challenges Atlas on scale and distributed systems. |
| **Nova** | Product Strategist | Pushes back on over-engineering. User and market focused. |
| **Cipher** | Security SecOps | Audits every proposal. Zero-trust enforcer. |

Agents explicitly reference each other — Rex challenges Atlas by name, Nova calls out over-engineering, Cipher flags specific vulnerabilities in all prior proposals. It reads like a real founding team debate.

---

## Features

- **Multi-Agent Debate** — Sequential typing animation with `TypingBubble` indicators per agent; each agent appears one at a time with realistic delays
- **War Room Chat** — Discord-style message feed with colored avatar rings, right-aligned user messages, left-aligned agent bubbles
- **LIVE Banner** — Chat header switches to pulsing red `LIVE // WAR ROOM IN SESSION` during synthesis
- **Canvas Panel** — Three gated tabs unlocked after first response:
  - `Code Output` — AI-generated Next.js frontend + API route boilerplate with macOS-style copy blocks
  - `Agent Roadmap` — All 4 agent analyses + TAM/SAM/SOM market feasibility
  - `System Logs` — Real-time pipeline log with color-coded severity
- **Qwen3 Reasoning Toggle** — Activates `enable_thinking` chain-of-thought via DashScope `extra_body`
- **Auth Gate** — Founder identity stored in localStorage; fullscreen ambient-glow login screen
- **Session Management** — Sessions sidebar with MongoDB persistence + localStorage fallback; create, switch, and clear sessions
- **RAG Pipeline** — Jina embeddings v2 vector store with cosine similarity retrieval for founder context grounding
- **Dark / Light theme** — Persisted to localStorage

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5, Tailwind CSS 4 |
| Animation | Framer Motion 12 |
| AI Engine | Qwen (Alibaba Cloud DashScope, OpenAI-compatible) |
| Embeddings | Jina Embeddings v2 (`jina-embeddings-v2-base-en`) |
| Database | MongoDB / Mongoose (optional, graceful degradation) |
| Icons | react-icons/fi |
| Package Manager | pnpm |

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd cto
pnpm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required — get your key at https://dashscope.console.aliyun.com/
QWEN_API_KEY=your_dashscope_key_here

# Optional — defaults to qwen-plus
QWEN_MODEL=qwen-plus

# Required for RAG embeddings — https://jina.ai/
JINA_API_KEY=your_jina_key_here

# Optional — sessions work via localStorage if unset
# MONGODB_URI=mongodb+srv://...
```

### 3. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), enter your founder name, and describe your product idea in the war room.

---

## Project Structure

```
app/
├── api/
│   ├── cto/route.ts          # Main synthesis endpoint — structured JSON prompt + Qwen call
│   ├── history/route.ts      # GET/POST/DELETE session message history
│   └── sessions/route.ts     # GET list of all sessions for sidebar
├── ai/
│   └── rag.ts                # Qwen client, Jina embeddings, in-memory vector store
├── components/
│   └── CtoWorkspace.tsx      # Entire UI — AuthGate, SessionsSidebar, War Room, Canvas
├── lib/
│   └── db.js                 # Lazy MongoDB connection (returns null when URI absent)
├── models/
│   └── ChatHistory.ts        # Mongoose schema: sessionId (unique), messages[], timestamps
└── page.tsx                  # Entry — renders <CtoWorkspace />
```

---

## How It Works

1. **Founder logs in** via AuthGate — name stored in `localStorage`
2. **Product prompt submitted** → POST `/api/cto` with prompt, history, and optional context
3. **RAG pipeline** — Jina embeds the query, cosine similarity finds best knowledge match, injected into system prompt
4. **Qwen synthesizes** a structured JSON blob with code + 4 agent analyses + market feasibility in a single call
5. **War room animates** — 4 agent messages appear sequentially with typing indicators (700–1400 ms delays)
6. **Session saved** to MongoDB (or localStorage cache) via POST `/api/history`
7. **Canvas unlocks** — Code, Roadmap, and Logs tabs become interactive

---

## Author

**Samuel Onwodi** — Full-Stack AI Engineer & Senior Software Architect  
[samuelonwodi.netlify.app](https://samuelonwodi.netlify.app) · info@samuelonwodi.netlify.app

---

*Powered by Qwen AI · Alibaba Cloud DashScope · Built for the Qwen AI Hackathon*
