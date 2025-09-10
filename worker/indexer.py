"""
Text embedding and indexing utilities.

This module provides functionality for loading and caching SentenceTransformer models,
computing embeddings, ensuring proper Qdrant collection setup, and batch indexing files.
"""

from sentence_transformers import SentenceTransformer
import numpy as np
from pathlib import Path
from typing import List, Optional, Iterable
import logging
import uuid
from config import get_settings
from qdrant_client_util import ensure_collection, upsert_embeddings, search
from parsers import parse_txt, parse_pdf, parse_docx, parse_image_ocr
from chunker import chunk_text
from utils import sha256_file

logger = logging.getLogger(__name__)

# Global cached model and vector size
_model: Optional[SentenceTransformer] = None
_vector_size: Optional[int] = None

def get_model() -> SentenceTransformer:
    """
    Get cached SentenceTransformer model, initialize if needed.
    
    Returns:
        SentenceTransformer: Loaded and cached model instance
        
    Raises:
        RuntimeError: If model fails to load
    """
    global _model, _vector_size
    
    if _model is None:
        try:
            settings = get_settings()
            model_name = settings.EMBEDDING_MODEL
            
            logger.info(f"Loading embedding model: {model_name}")
            _model = SentenceTransformer(model_name)
            
            # Compute vector size with dummy encoding
            logger.info("Computing vector size with dummy encoding...")
            dummy_text = "This is a test sentence to determine vector dimensions."
            test_vec = _model.encode([dummy_text], convert_to_numpy=True, normalize_embeddings=True)
            _vector_size = int(test_vec.shape[-1])
            
            logger.info(f"Model loaded successfully. Vector size: {_vector_size}")
            
            # Try to ensure Qdrant collection exists (optional - don't fail if Qdrant unavailable)
            try:
                logger.info("Ensuring Qdrant collection exists...")
                if ensure_collection(_vector_size):
                    logger.info("Qdrant collection setup completed successfully")
                else:
                    logger.warning("Failed to ensure Qdrant collection - collection may need manual setup")
            except Exception as qdrant_error:
                logger.warning(f"Qdrant collection setup failed (this is OK if Qdrant isn't running): {qdrant_error}")
            
            logger.info("Indexer initialization completed")
            
        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {e}")
            _model = None
            _vector_size = None
            raise RuntimeError(f"Model initialization failed: {e}")
    
    return _model

def get_vector_size() -> Optional[int]:
    """
    Get the vector size of the loaded model.
    
    Returns:
        int: Vector dimension or None if model not loaded
    """
    global _vector_size
    if _vector_size is None and _model is not None:
        # Fallback: compute vector size if not cached
        try:
            dummy_text = "test"
            test_vec = _model.encode([dummy_text], convert_to_numpy=True)
            _vector_size = int(test_vec.shape[-1])
        except Exception as e:
            logger.error(f"Failed to compute vector size: {e}")
    
    return _vector_size

def embed_texts(texts: List[str]) -> np.ndarray:
    """
    Convert texts to normalized embedding vectors.
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        np.ndarray: Normalized embedding vectors of shape (len(texts), vector_size)
        
    Raises:
        ValueError: If texts list is empty
        RuntimeError: If model is not properly initialized
    """
    if not texts:
        raise ValueError("Cannot embed empty text list")
    
    if not isinstance(texts, list):
        texts = list(texts)
    
    try:
        model = get_model()
        
        logger.debug(f"Embedding {len(texts)} texts...")
        
        # Encode texts with normalization
        embeddings = model.encode(
            texts, 
            convert_to_numpy=True, 
            normalize_embeddings=True,
            show_progress_bar=len(texts) > 100  # Show progress for large batches
        )
        
        logger.debug(f"Generated embeddings with shape: {embeddings.shape}")
        
        # Ensure embeddings are normalized (cosine similarity optimization)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        embeddings = embeddings / np.maximum(norms, 1e-8)  # Avoid division by zero
        
        return embeddings
        
    except Exception as e:
        logger.error(f"Failed to embed texts: {e}")
        raise RuntimeError(f"Text embedding failed: {e}")

def embed_single_text(text: str) -> np.ndarray:
    """
    Convert single text to normalized embedding vector.
    
    Args:
        text: Text string to embed
        
    Returns:
        np.ndarray: Normalized embedding vector of shape (vector_size,)
    """
    embeddings = embed_texts([text])
    return embeddings[0]

def is_model_loaded() -> bool:
    """
    Check if the embedding model is loaded and ready.
    
    Returns:
        bool: True if model is loaded and initialized
    """
    return _model is not None and _vector_size is not None

def reload_model() -> bool:
    """
    Force reload of the embedding model.
    
    Returns:
        bool: True if reload was successful
    """
    global _model, _vector_size
    
    try:
        _model = None
        _vector_size = None
        get_model()
        return True
    except Exception as e:
        logger.error(f"Failed to reload model: {e}")
        return False

def get_model_info() -> dict:
    """
    Get information about the loaded model.
    
    Returns:
        dict: Model information including name, vector size, and status
    """
    settings = get_settings()
    
    return {
        "model_name": settings.EMBEDDING_MODEL,
        "vector_size": get_vector_size(),
        "is_loaded": is_model_loaded(),
        "qdrant_collection": settings.QDRANT_COLLECTION
    }

def parse_file_to_text(path: Path) -> str:
    """
    Parse a file to text based on its extension.
    
    Args:
        path: Path to the file to parse
        
    Returns:
        str: Extracted text content, empty string if unsupported or failed
    """
    try:
        suffix = path.suffix.lower()
        
        # Text-based formats
        if suffix in [".txt", ".md", ".py", ".js", ".ts", ".json", ".csv", ".log"]:
            return parse_txt(path)
        
        # PDF format
        if suffix in [".pdf"]:
            return parse_pdf(path)
        
        # Word document format
        if suffix in [".docx"]:
            return parse_docx(path)
        
        # Image formats (OCR)
        if suffix in [".png", ".jpg", ".jpeg", ".tiff"]:
            return parse_image_ocr(path)
        
        # Unsupported types handled gracefully
        logger.debug(f"Unsupported file type: {suffix} for file {path}")
        return ""
        
    except Exception as e:
        logger.warning(f"Failed to parse file {path}: {e}")
        return ""

def index_files(paths: List[str]) -> dict:
    """
    Index multiple files by parsing, chunking, embedding, and storing in Qdrant.
    
    Args:
        paths: List of file paths to index
        
    Returns:
        dict: Summary with files_indexed, chunks_indexed, and points counts
    """
    settings = get_settings()
    all_chunks, payloads, ids = [], [], []
    file_count, chunk_count = 0, 0
    
    logger.info(f"Starting to index {len(paths)} files...")
    
    for path_str in paths:
        try:
            path = Path(path_str)
            
            # Skip non-existent or non-file paths
            if not path.exists() or not path.is_file():
                logger.warning(f"Skipping non-existent or non-file path: {path}")
                continue
            
            # Parse file to text
            text = parse_file_to_text(path)
            if not text.strip():
                logger.info(f"Skipping file with no extractable text: {path}")
                continue
            
            # Generate file hash for deduplication/tracking
            file_hash = sha256_file(str(path))
            
            # Chunk the text
            chunks = chunk_text(text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
            if not chunks:
                logger.warning(f"No chunks generated from file: {path}")
                continue
            
            logger.info(f"Processing {path.name}: {len(text)} chars -> {len(chunks)} chunks")
            
            # Generate embeddings for all chunks
            vectors = embed_texts(chunks)
            
            # Prepare metadata for each chunk
            base_meta = {
                "file_path": str(path.resolve()),
                "file_name": path.name,
                "file_hash": file_hash,
                "file_size": path.stat().st_size,
                "file_type": path.suffix.lower(),
            }
            
            # Generate unique IDs and payloads for each chunk
            these_ids = [str(uuid.uuid4()) for _ in chunks]
            these_payloads = [
                {
                    **base_meta, 
                    "chunk": chunk, 
                    "chunk_index": i,
                    "chunk_size": len(chunk)
                } 
                for i, chunk in enumerate(chunks)
            ]
            
            # Store in Qdrant
            try:
                success = upsert_embeddings(these_ids, vectors, these_payloads)
                if success:
                    logger.info(f"Successfully indexed {path.name} with {len(chunks)} chunks")
                    file_count += 1
                    chunk_count += len(chunks)
                    ids.extend(these_ids)
                    all_chunks.extend(chunks)
                    payloads.extend(these_payloads)
                else:
                    logger.error(f"Failed to store embeddings for {path.name}")
                    
            except Exception as e:
                logger.error(f"Error storing embeddings for {path.name}: {e}")
                continue
                
        except Exception as e:
            logger.error(f"Error processing file {path_str}: {e}")
            continue
    
    summary = {
        "files_indexed": file_count,
        "chunks_indexed": chunk_count,
        "points": len(ids)
    }
    
    logger.info(f"Indexing completed: {summary}")
    return summary

def semantic_search(query: str, top_k: int | None = None) -> dict:
    """
    Perform semantic search using query embedding and Qdrant vector search.
    
    Args:
        query: Search query string
        top_k: Maximum number of results to return (uses MAX_TOP_K if None)
        
    Returns:
        dict: Clean JSON response with query, top_k, and results containing 
              score, file metadata, and matched chunks
    """
    s = get_settings()
    top_k = top_k or s.MAX_TOP_K
    
    try:
        # Embed the query
        qvec = embed_texts([query])[0]
        
        # Perform Qdrant search
        results = search(qvec, top_k)
        
        # Format results into clean JSON structure
        items = []
        for r in results:
            payload = r.get("payload", {})
            items.append({
                "score": float(r.get("score", 0.0)),
                "file_path": payload.get("file_path"),
                "file_name": payload.get("file_name"),
                "chunk": payload.get("chunk"),
                "chunk_index": payload.get("chunk_index"),
                "file_type": payload.get("file_type"),
                "file_size": payload.get("file_size"),
                "chunk_size": payload.get("chunk_size")
            })
        
        return {
            "query": query,
            "top_k": top_k,
            "results": items,
            "total_results": len(items)
        }
        
    except Exception as e:
        logger.error(f"Error in semantic search: {e}")
        return {
            "query": query,
            "top_k": top_k,
            "results": [],
            "total_results": 0,
            "error": str(e)
        }
