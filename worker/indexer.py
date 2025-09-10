"""
Text embedding and indexing utilities.

This module provides functionality for loading and caching SentenceTransformer models,
computing embeddings, and ensuring proper Qdrant collection setup.
"""

from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Optional
import logging
from config import get_settings
from qdrant_client_util import ensure_collection

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
