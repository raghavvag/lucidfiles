from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""
    
    # Qdrant database configuration
    QDRANT_URL: str = Field(default="http://localhost:6333", description="Qdrant database URL")
    QDRANT_API_KEY: str | None = Field(default=None, description="Qdrant API key for authentication")
    QDRANT_COLLECTION: str = Field(default="files_chunks", description="Name of the Qdrant collection")
    
    # Embedding model configuration
    EMBEDDING_MODEL: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2", 
        description="HuggingFace model name for embeddings"
    )
    
    # Text chunking configuration
    CHUNK_SIZE: int = Field(default=800, description="Maximum size of text chunks", ge=100, le=2000)
    CHUNK_OVERLAP: int = Field(default=120, description="Overlap between consecutive chunks", ge=0, le=500)
    
    # Search configuration
    MAX_TOP_K: int = Field(default=8, description="Maximum number of search results to return", ge=1, le=100)
    
    # File processing configuration
    SUPPORTED_FILE_TYPES: List[str] = Field(
        default=["pdf", "docx", "txt", "md"], 
        description="List of supported file extensions"
    )
    MAX_FILE_SIZE_MB: int = Field(default=50, description="Maximum file size in MB", ge=1, le=500)
    
    # API configuration
    API_HOST: str = Field(default="0.0.0.0", description="API host address")
    API_PORT: int = Field(default=8000, description="API port number", ge=1024, le=65535)
    
    # Logging configuration
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    
    # Model configuration using Pydantic v2 syntax
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

@lru_cache
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()
