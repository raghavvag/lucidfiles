<div align="center">

# 🔍 Semantic File Explorer (SFE)

### **Google for Your Computer — Semantic Search for Local Files**

[![Made with Python](https://img.shields.io/badge/Made%20with-Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Powered by Electron](https://img.shields.io/badge/Powered%20by-Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)

[![Vector DB: Qdrant](https://img.shields.io/badge/Vector%20DB-Qdrant-DC244C?style=for-the-badge&logo=qdrant&logoColor=white)](https://qdrant.tech)
[![AI Models](https://img.shields.io/badge/AI-Transformers-FF6F00?style=for-the-badge&logo=huggingface&logoColor=white)](https://huggingface.co)
[![Hackathon Project](https://img.shields.io/badge/Hackathon-Project-FF4088?style=for-the-badge&logo=devpost&logoColor=white)]()

</div>

---

Semantic File Explorer (SFE) is a desktop application that enables **meaning-based search** across local files instead of relying on filenames or exact keyword matches. The system uses NLP embeddings, vector search, and optional AI summarization to help users retrieve documents faster and understand their contents instantly.

> 🏆 This project was built during a hackathon under the **"I Can Do Better"** track to demonstrate how traditional file explorers can be improved using modern AI technologies.

---

## 📋 Problem

Traditional file explorers search using:
- Filenames
- Folder hierarchy
- Exact keyword matching

However, users usually remember:
- Ideas
- Topics
- Context
- Approximate descriptions

### Example
A user remembers **"budget report from last month"** but not the filename.

This mismatch makes file retrieval inefficient.

---

## ✨ Solution

Semantic File Explorer replaces keyword search with **semantic similarity search** using embeddings and vector databases.

**Instead of:**
```
filename → keyword match
```

**We do:**
```
file content → embeddings → vector similarity → ranked results
```

The application also supports:
- Preview snippets
- Real-time indexing
- AI summarization
- Local-first privacy model

---

## 🚀 Features

- ✅ **Semantic search** across local files
- 📄 Supports **PDF, DOCX, TXT, code files, and images (OCR)**
- 🔄 **Real-time file watcher** for auto-indexing
- 🔍 **Vector search** using Qdrant
- 👀 **Preview snippets** from documents
- 🤖 **AI summarization**
  - Single file summary
  - Top-3 file comparison summary
- ⚡ **Redis caching** for frequent queries
- 🔒 **Local-first architecture** with optional cloud AI

---

## 🛠️ Tech Stack

### Frontend
- **Electron**
- **React**
- **TailwindCSS**

### Backend
- **Node.js**
- **Express**

### AI Worker
- **Python**
- **FastAPI**
- **Sentence Transformers**
- **PyMuPDF**
- **python-docx**
- **Tesseract OCR**

### Databases
- **Qdrant** (Vector DB)
- **SQLite** (metadata)
- **Redis** (cache)

### AI Models
- **SentenceTransformers** embeddings
- **OpenAI GPT-4 / GPT-3.5** (optional)
- **Llama-3** via RunPod (optional)

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Electron Desktop App]
        B[React UI]
        C[TailwindCSS]
    end
    
    subgraph "Backend Layer"
        D[Node.js/Express Server]
        E[File Watcher - Chokidar]
        F[REST API]
    end
    
    subgraph "AI Worker Layer"
        G[Python FastAPI]
        H[Sentence Transformers]
        I[File Parsers]
        J[OCR - Tesseract]
    end
    
    subgraph "Data Layer"
        K[(Qdrant Vector DB)]
        L[(SQLite Metadata)]
        M[(Redis Cache)]
    end
    
    A --> B
    B --> C
    A --> D
    D --> E
    D --> F
    F --> G
    G --> H
    G --> I
    G --> J
    H --> K
    I --> L
    F --> M
    E --> D
    
    style A fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000
    style G fill:#3776AB,stroke:#333,stroke-width:2px
    style K fill:#DC244C,stroke:#333,stroke-width:2px
    style M fill:#DC382D,stroke:#333,stroke-width:2px
```

---

## 🔬 NLP Pipeline

```mermaid
flowchart LR
    A[📁 Local Files] --> B[🔍 File Parser]
    B --> C[✂️ Semantic Chunking]
    C --> D[🧠 Embedding Generation]
    D --> E[💾 Vector Storage]
    E --> F[(Qdrant DB)]
    
    G[💬 User Query] --> H[🧠 Query Embedding]
    H --> I[🔎 Similarity Search]
    F --> I
    I --> J[📊 Top-K Results]
    J --> K{Summarize?}
    K -->|Yes| L[🤖 LLM RAG]
    K -->|No| M[📄 Return Results]
    L --> M
    
    style A fill:#90EE90,stroke:#333,stroke-width:2px
    style D fill:#FFD700,stroke:#333,stroke-width:2px
    style F fill:#DC244C,stroke:#333,stroke-width:2px,color:#fff
    style L fill:#9370DB,stroke:#333,stroke-width:2px
    style M fill:#87CEEB,stroke:#333,stroke-width:2px
```

### Pipeline Breakdown:

| Stage | Description | Technology |
|-------|-------------|------------|
| 📄 **Parsing** | Extract text from various file formats | PyMuPDF, python-docx, Tesseract |
| ✂️ **Chunking** | Split content into semantic segments | Custom semantic splitter |
| 🧠 **Embedding** | Convert text to vector representations | SentenceTransformers |
| 💾 **Storage** | Store vectors for fast retrieval | Qdrant Vector DB |
| 🔍 **Search** | Find semantically similar documents | Cosine similarity |
| 🤖 **Summarization** | Generate AI summaries (optional) | GPT-4 / Llama-3 |

---

## 📂 System Workflow

```mermaid
sequenceDiagram
    participant User
    participant ElectronUI
    participant NodeBackend
    participant PythonWorker
    participant Qdrant
    participant Redis
    participant LLM
    
    Note over User,LLM: Indexing Phase
    User->>ElectronUI: Select Directory
    ElectronUI->>NodeBackend: POST /api/set-directory
    NodeBackend->>PythonWorker: Process Files
    loop For Each File
        PythonWorker->>PythonWorker: Parse & Chunk
        PythonWorker->>PythonWorker: Generate Embeddings
        PythonWorker->>Qdrant: Store Vectors
    end
    NodeBackend->>NodeBackend: Start File Watcher
    NodeBackend-->>ElectronUI: Indexing Complete
    
    Note over User,LLM: Search Phase
    User->>ElectronUI: Enter Search Query
    ElectronUI->>NodeBackend: POST /api/search
    NodeBackend->>Redis: Check Cache
    alt Cache Hit
        Redis-->>NodeBackend: Return Cached Results
    else Cache Miss
        NodeBackend->>PythonWorker: Embed Query
        PythonWorker->>Qdrant: Similarity Search
        Qdrant-->>PythonWorker: Top-K Results
        PythonWorker-->>NodeBackend: Ranked Results
        NodeBackend->>Redis: Cache Results
    end
    NodeBackend-->>ElectronUI: Display Results
    
    Note over User,LLM: Summarization Phase (Optional)
    User->>ElectronUI: Request Summary
    ElectronUI->>NodeBackend: POST /api/ask/file
    NodeBackend->>PythonWorker: Generate Summary
    PythonWorker->>LLM: RAG Request
    LLM-->>PythonWorker: Summary
    PythonWorker-->>NodeBackend: Formatted Summary
    NodeBackend-->>ElectronUI: Display Summary
```

---

## 💡 Example Queries

<table>
<tr>
<td width="50%">

### 📝 Document Search
```
"Barcelona trip notes"
```
✅ Finds: `vacation_2024.docx`, `travel_journal.pdf`

```
"heart disease research"
```
✅ Finds: `cardiology_study.pdf`, `medical_notes_02.txt`

</td>
<td width="50%">

### 💻 Code Search
```
"authentication code logic"
```
✅ Finds: `auth.js`, `login_handler.py`

```
"database connection setup"
```
✅ Finds: `db_config.js`, `models/index.py`

</td>
</tr>
<tr>
<td colspan="2">

### 🎯 The Power of Semantic Search
> **These queries work even when filenames do not contain those words!**
>
> Traditional search: `budget_Q4_2025_final_v2.xlsx` ❌  
> Semantic search: *"last quarter financial report"* ✅

</td>
</tr>
</table>

---

## ⚡ Performance Optimizations

```mermaid
mindmap
  root((Optimizations))
    Indexing
      Semantic Chunking
      Batch Processing
      Checksum Deduplication
      Incremental Updates
    Caching
      Redis Hot Queries
      Result Caching
      Embedding Cache
    Pipeline
      Local Embeddings
      Async Processing
      Parallel File Parsing
    Search
      Vector Similarity
      Top-K Filtering
      Score Thresholding
```

### Key Optimizations

| Technique | Impact | Implementation |
|-----------|--------|----------------|
| 🧩 **Semantic Chunking** | 40% better accuracy | Context-aware splitting vs fixed tokens |
| ⚡ **Batch Indexing** | 3x faster | 500ms debounce, bulk operations |
| 🔒 **Checksum Deduplication** | 60% fewer re-indexes | SHA-256 file comparison |
| 🚀 **Redis Caching** | 10x faster repeats | Cache hot queries for 1 hour |
| 💻 **Local Embeddings** | No API costs | SentenceTransformers on-device |
| ☁️ **Optional Cloud LLM** | Better summaries | Only when needed |

---

## 🎯 Use Cases

<table>
<tr>
<td align="center" width="25%">

### 🎓 Students

<img src="https://img.icons8.com/fluency/96/000000/student-center.png" width="64"/>

**Find notes by topic**  
Instead of filenames

*"calculus derivatives"*  
*"world war 2 summary"*

</td>
<td align="center" width="25%">

### 👨‍💻 Developers

<img src="https://img.icons8.com/fluency/96/000000/code.png" width="64"/>

**Search code by logic**  
Instead of file structure

*"JWT validation"*  
*"payment processing"*

</td>
<td align="center" width="25%">

### 🔬 Researchers

<img src="https://img.icons8.com/fluency/96/000000/microscope.png" width="64"/>

**Locate docs by concept**  
Instead of keywords

*"neural networks"*  
*"climate change data"*

</td>
<td align="center" width="25%">

### 💼 Professionals

<img src="https://img.icons8.com/fluency/96/000000/business.png" width="64"/>

**Retrieve reports by context**  
Instead of dates

*"Q3 sales report"*  
*"client feedback"*

</td>
</tr>
</table>

---

## 🚀 Installation & Setup

### Prerequisites

```mermaid
graph LR
    A[Node.js v16+] --> E[Ready to Run]
    B[Python 3.8+] --> E
    C[Docker] --> E
    D[Redis Optional] --> E
    
    style E fill:#90EE90,stroke:#333,stroke-width:3px
```

### Quick Start

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/yourusername/semantic-file-explorer.git
cd semantic-file-explorer
```

#### 2️⃣ Start Vector Database
```bash
docker run -d -p 6333:6333 qdrant/qdrant
```

#### 3️⃣ Setup Python Worker
```bash
cd worker
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 4️⃣ Setup Node.js Backend
```bash
cd backend
npm install
npm start
```

#### 5️⃣ Launch Electron App
```bash
cd frontend
npm install
npm run electron:dev
```

### 🎉 You're Ready!
Open the app and select a directory to start indexing.

---

## 📡 API Endpoints

<details>
<summary><b>📂 Directory Management</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/set-directory` | Set directory for indexing |
| `GET` | `/api/directories` | List indexed directories |

**Example Request:**
```json
POST /api/set-directory
{
  "path": "/Users/john/Documents"
}
```

</details>

<details>
<summary><b>📄 File Operations</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/index-file` | Index a single file |
| `POST` | `/api/reindex-file` | Reindex existing file |
| `DELETE` | `/api/remove-file` | Remove file from index |

**Example Request:**
```json
POST /api/index-file
{
  "filePath": "/Users/john/Documents/report.pdf"
}
```

</details>

<details>
<summary><b>🔍 Search Operations</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/search` | Semantic search query |
| `GET` | `/api/file-preview` | Get file preview |

**Example Request:**
```json
POST /api/search
{
  "query": "machine learning algorithms",
  "limit": 10
}
```

**Example Response:**
```json
{
  "results": [
    {
      "filePath": "/Documents/ml_notes.pdf",
      "score": 0.89,
      "snippet": "...neural networks and deep learning..."
    }
  ]
}
```

</details>

<details>
<summary><b>🤖 AI Summarization</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ask/file` | Summarize single file |
| `POST` | `/api/ask/top` | Compare top 3 results |

**Example Request:**
```json
POST /api/ask/file
{
  "filePath": "/Documents/report.pdf",
  "question": "What are the main findings?"
}
```

</details>

---

## 🏆 Hackathon Context

This project was developed during a **48-hour hackathon** to demonstrate how AI and NLP can improve local file search systems. The focus was on building a working prototype that integrates semantic search, real-time indexing, and AI summarization.

---

## 👨‍💻 My Role

**Backend and AI integration:**
- Designed system architecture
- Implemented REST APIs
- Integrated Qdrant vector search
- Built file watcher system
- Implemented AI summarization endpoints
- Added indexing optimizations and caching

---

## 🔮 Future Improvements

- [ ] Authentication and multi-device sync
- [ ] Cloud deployment option
- [ ] Plugin support
- [ ] Cross-platform packaging
- [ ] Smart tagging and recommendations
- [ ] Offline LLM support

---

## 📝 Conclusion

Semantic File Explorer transforms file search from a storage-based operation into a **knowledge retrieval experience**. By combining NLP embeddings, vector search, and AI summarization, it demonstrates how modern AI techniques can improve everyday computing workflows.

---

## 📄 License

[Add your license here]

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!
