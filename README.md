# GITCHAT — AI-Powered Developer Collaboration & Repository Intelligence Platform

![GitHub Stars](https://img.shields.io/github/stars/yourusername/gitchat?style=flat&color=yellow)
![GitHub Forks](https://img.shields.io/github/forks/yourusername/gitchat?style=flat&color=blue)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

---

## 🚀 Overview

**GitChat** is an AI-powered SaaS platform designed to make software collaboration faster, clearer, and more intelligent.

It enhances developer productivity by combining:

- Automated documentation  
- Semantic code search  
- Intelligent commit summarization  
- Real-time meeting transcription  
- RAG-powered AI chat assistant  
- GitHub repository integration  

GitChat helps teams onboard faster, understand codebases effortlessly, and maintain full transparency across commits, discussions, and meetings.

---

## 🧠 Why GitChat?

Modern engineering teams face real pain points:

- Hard-to-understand codebases  
- Poor commit history clarity  
- Scattered meeting notes and decisions  
- Slow onboarding times  
- Missing project context  
- Manual documentation overhead  

GitChat solves these using **AI, automation, and real-time collaboration tools** — all in one unified platform.

---

# 🌟 Key Features

## 📄 1. Automated Code Documentation
GitChat analyzes the entire repository and generates:

- Module summaries  
- Function and class explanations  
- Code intent descriptions  
- File-level overviews  

Perfect for onboarding new developers or refreshing context.

---

## 🔍 2. Semantic Codebase Search
Search your repo using natural language:

> “Where is the authentication logic implemented?”  
> “Find the error-handling pipeline.”  

GitChat uses **custom embeddings + semantic search** to fetch relevant code instantly.

---

## 📝 3. AI-Generated Commit Summaries
GitChat converts raw commit messages into clear summaries:

- Understand changes faster  
- Improve pull request reviews  
- Track repository evolution  

---

## 🎙️ 4. Real-Time Meeting Transcription
Powered by **GetStream**:

- Live transcription  
- Speaker detection  
- Topic extraction  
- Meeting summaries  
- Real-time chat + audio streaming  

Never lose track of decisions again.

---

## ⚡ 5. Real-Time Contextual Search in Meetings
Search across meeting transcripts instantly:

> “What did we decide about API versioning?”  
> “Show me all discussion about database schemas.”

Your team’s **project memory** is searchable.

---

## 🤖 6. AI Chat Assistant (RAG + Custom Embeddings)
Grounded AI assistance that understands:

- Your codebase  
- Your documentation  
- Your commit history  
- Your meeting transcripts  

Ask anything, anytime — with accurate, contextual responses.

---

## 🤝 7. Team Collaboration Hub
A shared workspace for:

- Documentation  
- Commit summaries  
- Meeting transcripts  
- Real-time chat  
- Code insights  

Enhances team alignment & clarity.

---

## 💳 8. Credit System (Pay-As-You-Go)

| Task | Credits Used |
|------|--------------|
| Importing a repository | 1 credit per file |
| Additional imports | Depends on file count |

Buy more credits through **Stripe Billing**.

---

# 🏗️ System Architecture

GitChat is built using a scalable microservice architecture.

### **Frontend**
- Next.js  
- React  
- TailwindCSS  
- Streaming UI components  

### **Backend**
- Node.js  
- Prisma ORM  
- REST APIs  
- Worker queues  
- Real-time audio + chat (GetStream)

### **AI Engine**
- Code embeddings  
- RAG-based responses  
- Commit summarization  
- Live transcription  
- Topic clustering  

### **Integrations**
- GitHub API  
- Stripe Payments  
- GetStream  

---

# 📁 Project Structure (Example)

```
/app
  /api
  /components
  /hooks
/backend
  /routes
  /controllers
  /workers
  /prisma
/ai-engine
  /embeddings
  /rag
  /summarization
  /transcription
/docs
```

---

# ⚙️ Installation & Setup

## 1. Clone the Repository
```bash
git clone https://github.com/prnshjh/gitchat.git
cd gitchat
```

## 2. Install Dependencies

```bash
npm install
npm run dev
```

---

## 3. Environment Variables

Create `.env` for both frontend and backend:

```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL='/sync-user'
GITHUB_TOKEN=
GEMINI_API_KEY=
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=
ASSEMBLY_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://localhost:3000
```

---

## 4. Run Development Servers

### Frontend
```bash
npm run dev
```

### Backend
```bash
npm run start
```

---

# 🧪 How GitChat Works

1. User connects GitHub repository  
2. GitChat imports files + metadata  
3. AI engine generates embeddings & documentation  
4. Commit history is summarized  
5. Meetings are streamed + transcribed  
6. Data becomes searchable via semantic search  
7. Credits deducted based on file count  

---

# 🧗 Challenges We Solved

- Scaling repo imports  
- Multi-language documentation consistency  
- Low-latency semantic search  
- Accurate transcription in real time  
- Designing a friendly UI for a complex product  

---

# 🏆 Achievements

- High-quality AI documentation  
- Accurate semantic search  
- Real-time transcription + topic clustering  
- RAG-powered context-aware assistant  
- Fully functional credit-based SaaS model  

---

# 🎓 What We Learned

- AI dramatically helps reduce developer cognitive load  
- RAG-based systems outperform standard LLM chat  
- Clean UI/UX drives tool adoption  
- Meeting intelligence is essential for distributed teams  

---

# 🔮 Roadmap

- [ ] GitLab & Bitbucket support  
- [ ] Collaborative online IDE  
- [ ] One-click GitHub push from IDE  
- [ ] VS Code extension  
- [ ] Improved embeddings for all languages  
- [ ] Mobile app for repo insights  
- [ ] Fully automated CI/CD assistant  

---

# 🤝 Contributing

1. Fork the repository  
2. Create a feature branch  
3. Commit your changes  
4. Submit a PR  

---

# 📝 License

MIT License — free to modify and distribute.

---

# ⭐ Support the Project

If GitChat helps your workflow:

- ⭐ Star the repo  
- 🍴 Fork to contribute  
- 🚀 Share with your team  
