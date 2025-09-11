from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
from pathlib import Path
from indexer import index_files, semantic_search, parse_file_to_text
from qdrant_client_util import search, delete_points, search_by_file_path
from utils import sha256_file
from chunker import chunk_text
from config import get_settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Semantic Worker API", 
    version="0.1.0",
    description="API for indexing documents and performing semantic search"
)

@app.on_event("startup")
async def startup_event():
    """Initialize the embedding model on startup."""
    try:
        logger.info("Loading embedding model on startup...")
        from indexer import get_model
        model = get_model()
        logger.info(f"Model loaded successfully: {model.get_sentence_embedding_dimension()} dimensions")
    except Exception as e:
        logger.error(f"Failed to load model on startup: {e}")
        # Don't fail startup, let individual endpoints handle the error

class IndexRequest(BaseModel):
    paths: List[str]

class IndexDirectoryRequest(BaseModel):
    path: str

class IndexFileRequest(BaseModel):
    path: str

class ReindexFileRequest(BaseModel):
    path: str

class RemoveFileRequest(BaseModel):
    path: str

class FileContentRequest(BaseModel):
    path: str

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = None

class IndexResponse(BaseModel):
    files_indexed: int
    chunks_indexed: int
    points: int

class SearchResponse(BaseModel):
    query: str
    top_k: int
    results: List[dict]
    total_results: int

@app.get("/")
def root():
    """Health check endpoint."""
    return {"message": "Semantic Worker API is running", "status": "healthy"}

@app.get("/health")
def health_check():
    """Detailed health check endpoint."""
    try:
        from indexer import get_model_info
        model_info = get_model_info()
        return {
            "status": "healthy",
            "model_info": model_info
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.post("/index", response_model=IndexResponse)
def index_api(req: IndexRequest):
    """
    Index multiple files by parsing, chunking, embedding, and storing in Qdrant.
    
    Args:
        req: IndexRequest containing list of file paths
        
    Returns:
        IndexResponse with indexing statistics
    """
    try:
        logger.info(f"Indexing request for {len(req.paths)} files")
        result = index_files(req.paths)
        return result
    except Exception as e:
        logger.error(f"Indexing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

@app.post("/search")
def search_api(req: SearchRequest):
    """
    Perform semantic search using query embedding and Qdrant vector search.
    
    Args:
        req: SearchRequest containing query and optional top_k
        
    Returns:
        Search results with scores and metadata
    """
    try:
        logger.info(f"Search request for query: '{req.query}' with top_k: {req.top_k}")
        result = semantic_search(req.query, req.top_k)
        return result
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/index-directory")
def index_directory_api(req: IndexDirectoryRequest):
    """
    Index all supported files in a directory recursively.
    
    Args:
        req: IndexDirectoryRequest containing directory path
        
    Returns:
        Dictionary with success status and processing statistics
    """
    try:
        directory_path = Path(req.path)
        
        if not directory_path.exists():
            raise HTTPException(status_code=404, detail=f"Directory not found: {req.path}")
        
        if not directory_path.is_dir():
            raise HTTPException(status_code=400, detail=f"Path is not a directory: {req.path}")
        
        # Find all supported files in directory and subdirectories
        supported_extensions = {'.txt', '.md', '.py', '.js', '.ts', '.json', '.csv', '.log', 
                              '.pdf', '.docx', '.png', '.jpg', '.jpeg', '.tiff'}
        
        file_paths = []
        for file_path in directory_path.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
                file_paths.append(str(file_path))
        
        if not file_paths:
            return {
                "success": True,
                "filesProcessed": 0,
                "chunksIndexed": 0,
                "message": "No supported files found in directory"
            }
        
        logger.info(f"Found {len(file_paths)} supported files in directory: {req.path}")
        
        # Index all found files
        result = index_files(file_paths)
        
        return {
            "success": True,
            "filesProcessed": result["files_indexed"],
            "chunksIndexed": result["chunks_indexed"],
            "totalFiles": len(file_paths),
            "directory": str(directory_path.resolve())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Directory indexing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Directory indexing failed: {str(e)}")

@app.post("/index-file")
def index_file_api(req: IndexFileRequest):
    """
    Index a single file.
    
    Args:
        req: IndexFileRequest containing file path
        
    Returns:
        Dictionary with file metadata and processing status
    """
    try:
        file_path = Path(req.path)
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {req.path}")
        
        if not file_path.is_file():
            raise HTTPException(status_code=400, detail=f"Path is not a file: {req.path}")
        
        # Calculate file metadata
        file_size = file_path.stat().st_size
        checksum = sha256_file(str(file_path))
        
        # Index the single file
        result = index_files([str(file_path)])
        
        return {
            "success": result["files_indexed"] > 0,
            "checksum": checksum,
            "size": file_size,
            "chunksIndexed": result["chunks_indexed"],
            "filePath": str(file_path.resolve()),
            "fileName": file_path.name,
            "fileType": file_path.suffix.lower()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File indexing failed: {e}")
        raise HTTPException(status_code=500, detail=f"File indexing failed: {str(e)}")

@app.post("/reindex-file")
def reindex_file_api(req: ReindexFileRequest):
    """
    Re-index a modified file (removes old entries and adds new ones).
    
    Args:
        req: ReindexFileRequest containing file path
        
    Returns:
        Dictionary with updated file metadata and processing status
    """
    try:
        file_path = Path(req.path)
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {req.path}")
        
        if not file_path.is_file():
            raise HTTPException(status_code=400, detail=f"Path is not a file: {req.path}")
        
        # Calculate new file metadata
        file_size = file_path.stat().st_size
        checksum = sha256_file(str(file_path))
        
                # First, try to remove existing entries for this file
        try:
            # Search for existing entries with this file path
            existing_results = search_by_file_path(str(file_path.resolve()))
            
            if existing_results:
                existing_ids = [r["id"] for r in existing_results]
                if existing_ids:
                    delete_points(existing_ids)
                    logger.info(f"Removed {len(existing_ids)} existing chunks for file: {file_path.name}")
            
        except Exception as delete_error:
            logger.warning(f"Could not remove existing entries for {file_path.name}: {delete_error}")
        
        # Re-index the file
        result = index_files([str(file_path)])
        
        return {
            "success": result["files_indexed"] > 0,
            "checksum": checksum,
            "size": file_size,
            "chunksIndexed": result["chunks_indexed"],
            "filePath": str(file_path.resolve()),
            "fileName": file_path.name,
            "fileType": file_path.suffix.lower(),
            "reindexed": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File re-indexing failed: {e}")
        raise HTTPException(status_code=500, detail=f"File re-indexing failed: {str(e)}")

@app.post("/file-content")
def get_file_content_api(req: FileContentRequest):
    """
    Get all indexed content for a specific file by aggregating its chunks.
    
    Args:
        req: FileContentRequest containing file path
        
    Returns:
        Dictionary with aggregated file content and metadata
    """
    try:
        file_path = Path(req.path)
        # Use the original path as provided instead of resolving it
        file_path_str = req.path
        
        # Search for all chunks from this file
        try:
            results = search_by_file_path(file_path_str)
            
            if not results:
                raise HTTPException(status_code=404, detail=f"No indexed content found for file: {req.path}")
            
            # Sort chunks by index if available, otherwise by score
            sorted_results = sorted(results, key=lambda x: x.get("payload", {}).get("chunk_index", 0))
            
            # Aggregate all text content
            content_chunks = []
            for result in sorted_results:
                payload = result.get("payload", {})
                # The actual text content is stored in the 'chunk' field
                text = payload.get("chunk", payload.get("text", payload.get("content", "")))
                if text:
                    content_chunks.append(text)
            
            full_content = "\n\n".join(content_chunks)
            
            return {
                "success": True,
                "filePath": file_path_str,
                "fileName": file_path.name,
                "content": full_content,
                "totalChunks": len(results),
                "contentLength": len(full_content)
            }
            
        except HTTPException:
            raise
        except Exception as search_error:
            logger.error(f"Error retrieving file content: {search_error}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve file content: {str(search_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File content retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"File content retrieval failed: {str(e)}")

@app.delete("/remove-file")
def remove_file_api(req: RemoveFileRequest):
    """
    Remove a file from the index.
    
    Args:
        req: RemoveFileRequest containing file path
        
    Returns:
        Dictionary with removal status
    """
    try:
        file_path = Path(req.path)
        file_path_str = str(file_path.resolve())
        
        # Search for entries with this file path
        try:
            results = search_by_file_path(file_path_str)
            
            if not results:
                return {
                    "success": True,
                    "message": f"No indexed content found for file: {req.path}",
                    "chunksRemoved": 0
                }
            
            # Extract IDs for deletion
            matching_ids = [r["id"] for r in results]
            
            # Delete the matching points
            success = delete_points(matching_ids)
            
            if success:
                logger.info(f"Successfully removed {len(matching_ids)} chunks for file: {file_path.name}")
                return {
                    "success": True,
                    "chunksRemoved": len(matching_ids),
                    "filePath": file_path_str,
                    "fileName": file_path.name
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to delete file entries from index")
                
        except Exception as search_error:
            logger.error(f"Error searching/deleting file entries: {search_error}")
            raise HTTPException(status_code=500, detail=f"Failed to remove file from index: {str(search_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File removal failed: {e}")
        raise HTTPException(status_code=500, detail=f"File removal failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting Semantic Worker API...")
    uvicorn.run("app:app", host="0.0.0.0", port=8081, reload=True)
