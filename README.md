# Semantic File Explorer

A desktop application that enables semantic search across your local files using AI embeddings and vector search. Built with Electron, React, Node.js, and Python.

## 🚀 Features

- **Semantic Search**: Find files based on meaning, not just keywords
- **Desktop App**: Native Electron application with modern React UI
- **Multi-format Support**: PDF, DOCX, TXT, MD files
- **Real-time Indexing**: Automatic file watching and reindexing
- **AI-Powered**: Uses sentence transformers for semantic understanding
- **Vector Search**: Qdrant vector database for fast similarity search
- **File Preview**: In-app file content preview and external app opening

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │     Worker      │
│ Electron+React  │◄──►│  Node.js+API    │◄──►│ Python+FastAPI  │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     SQLite      │    │     Qdrant      │
                       │   (Metadata)    │    │  (Embeddings)   │
                       └─────────────────┘    └─────────────────┘
```

## 📂 Project Structure

```
semantic-file-explorer/
├── frontend/                 # Electron + React app
│   ├── public/
│   │   ├── electron.js      # Main Electron process
│   │   ├── preload.js       # Secure IPC bridge
│   │   └── index.html
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.js          # Main React app
│   │   └── index.js        # React entry point
│   └── package.json
│
├── backend/                  # Node.js API server
│   ├── server.js            # Express server
│   └── package.json
│
├── worker/                   # Python AI worker
│   ├── api_server.py        # FastAPI server
│   ├── document_processor.py # Text extraction & embeddings
│   └── requirements.txt
│
├── docker-compose.yml        # Qdrant database
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** (v18+)
- **Python** (3.9+)
- **Docker** (for Qdrant)
- **Git**

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd semantic-file-explorer
```

### 2. Start Qdrant Database

```bash
docker-compose up -d
```

Verify Qdrant is running: http://localhost:6333/dashboard

### 3. Setup Backend (Node.js)

```bash
cd backend
npm install
npm run dev
```

Backend will run on http://localhost:3001

### 4. Setup Worker (Python)

```bash
cd worker
pip install -r requirements.txt
python api_server.py
```

Worker will run on http://localhost:8000

### 5. Setup Frontend (Electron + React)

```bash
cd frontend
npm install
npm run electron-dev
```

This will start both React dev server and Electron app.

## 📱 Usage

1. **Launch the App**: The Electron app will open automatically
2. **Add Folders**: Click "Add Folder" to select directories to index
3. **Wait for Indexing**: The system will process your files in the background
4. **Search**: Type semantic queries like "budget reports from last month"
5. **Browse Results**: Click on results to preview file content
6. **Open Files**: Use "Open" button to launch files in their default applications

## 🔧 Development

### Running in Development Mode

1. Start Qdrant: `docker-compose up -d`
2. Start backend: `cd backend && npm run dev`
3. Start worker: `cd worker && python api_server.py`
4. Start frontend: `cd frontend && npm run electron-dev`

### Building for Production

```bash
cd frontend
npm run build
npm run electron-pack
```

### Environment Variables

Create a `.env` file in each directory as needed:

**Backend (.env)**
```
PORT=3001
DATABASE_PATH=./database.sqlite
WORKER_API_URL=http://localhost:8000
```

**Worker (.env)**
```
QDRANT_URL=http://localhost:6333
MODEL_NAME=all-MiniLM-L6-v2
```

## 🧪 Testing

### Test Backend API
```bash
curl http://localhost:3001/health
```

### Test Worker API
```bash
curl http://localhost:8000/health
```

### Test Search
```bash
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test search"}'
```

## 📊 Supported File Types

- **PDF**: Full text extraction + OCR for images
- **DOCX/DOC**: Text and table extraction  
- **TXT/MD**: Plain text files
- **RTF**: Rich text format

## ⚙️ Configuration

### Embedding Model
The default model is `all-MiniLM-L6-v2`. To change it, modify `document_processor.py`:

```python
self.model = SentenceTransformer('your-preferred-model')
```

### Chunk Size
Adjust text chunking in `document_processor.py`:

```python
def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50):
```

## 🐛 Troubleshooting

### Qdrant Connection Issues
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker-compose restart qdrant
```

### Python Dependencies
```bash
# If sentence-transformers fails to install
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install sentence-transformers
```

### Electron Issues
```bash
# Clear Electron cache
cd frontend
rm -rf node_modules/.cache
npm start
```

## 🚀 Deployment

### Desktop App Distribution

1. Build the app: `npm run electron-pack`
2. Find installers in `frontend/dist/`
3. Distribute the appropriate installer for each platform

### Server Deployment

For production deployment, consider:
- Using PM2 for Node.js process management
- Docker containers for all services
- Nginx reverse proxy
- SSL certificates

## 📈 Performance Tips

1. **Indexing**: Index files during off-peak hours
2. **Memory**: Qdrant memory usage scales with document count
3. **Search**: Limit search results (default: 20)
4. **Chunking**: Smaller chunks = more precise but slower search

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙋‍♂️ Support

- Create an issue for bugs/feature requests
- Check logs in:
  - Backend: Console output
  - Worker: Console output  
  - Frontend: Developer Tools (F12)

## 🔮 Roadmap

- [ ] AI-powered Q&A with documents
- [ ] More file format support (PowerPoint, Excel)
- [ ] Cloud storage integration
- [ ] Multi-language support
- [ ] Advanced filtering and sorting
- [ ] Collaborative features

---

**Built for the hackathon with ❤️**
