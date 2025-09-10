"""
Document parsing utilities for extracting text from various file formats.

This module provides functions to parse different document types (TXT, PDF, DOCX)
and extract plain text, plus utilities for chunking text with overlap.
"""

from pathlib import Path
import fitz  # PyMuPDF
from docx import Document
from typing import List, Optional
import logging
import re

logger = logging.getLogger(__name__)

def parse_txt(path: Path) -> str:
    """
    Parse plain text file and return content.
    
    Args:
        path: Path to the text file
        
    Returns:
        str: Plain text content
        
    Raises:
        FileNotFoundError: If file doesn't exist
        UnicodeDecodeError: If file encoding issues occur
    """
    try:
        if not path.exists():
            raise FileNotFoundError(f"Text file not found: {path}")
        
        # Try UTF-8 first, fallback to other encodings
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            logger.warning(f"UTF-8 decode failed for {path}, trying latin-1")
            content = path.read_text(encoding="latin-1", errors="ignore")
        
        logger.debug(f"Parsed text file: {path} ({len(content)} chars)")
        return content.strip()
        
    except Exception as e:
        logger.error(f"Error parsing text file {path}: {e}")
        raise

def parse_pdf(path: Path) -> str:
    """
    Parse PDF file and extract text from all pages.
    
    Args:
        path: Path to the PDF file
        
    Returns:
        str: Extracted plain text from all pages
        
    Raises:
        FileNotFoundError: If file doesn't exist
        Exception: If PDF parsing fails
    """
    try:
        if not path.exists():
            raise FileNotFoundError(f"PDF file not found: {path}")
        
        doc = fitz.open(str(path))
        texts = []
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            page_text = page.get_text("text")
            
            # Clean up text formatting
            page_text = re.sub(r'\n+', '\n', page_text)  # Multiple newlines to single
            page_text = re.sub(r' +', ' ', page_text)     # Multiple spaces to single
            
            if page_text.strip():  # Only add non-empty pages
                texts.append(page_text.strip())
        
        doc.close()
        
        full_text = "\n\n".join(texts)
        logger.debug(f"Parsed PDF: {path} ({doc.page_count} pages, {len(full_text)} chars)")
        return full_text
        
    except Exception as e:
        logger.error(f"Error parsing PDF {path}: {e}")
        raise

def parse_docx(path: Path) -> str:
    """
    Parse DOCX file and extract text from all paragraphs.
    
    Args:
        path: Path to the DOCX file
        
    Returns:
        str: Extracted plain text from all paragraphs
        
    Raises:
        FileNotFoundError: If file doesn't exist
        Exception: If DOCX parsing fails
    """
    try:
        if not path.exists():
            raise FileNotFoundError(f"DOCX file not found: {path}")
        
        doc = Document(str(path))
        paragraphs = []
        
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if text:  # Only add non-empty paragraphs
                paragraphs.append(text)
        
        # Also extract text from tables if present
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    cell_text = cell.text.strip()
                    if cell_text:
                        row_text.append(cell_text)
                if row_text:
                    paragraphs.append(" | ".join(row_text))
        
        full_text = "\n\n".join(paragraphs)
        logger.debug(f"Parsed DOCX: {path} ({len(doc.paragraphs)} paragraphs, {len(full_text)} chars)")
        return full_text
        
    except Exception as e:
        logger.error(f"Error parsing DOCX {path}: {e}")
        raise

def parse_image_ocr(path: Path) -> str:
    """
    Parse image file using OCR and extract text.
    
    Args:
        path: Path to the image file
        
    Returns:
        str: Extracted text from image, empty string if OCR fails
        
    Note:
        This function gracefully handles OCR failures and returns empty string
        rather than raising exceptions, as OCR can be unreliable.
    """
    try:
        if not path.exists():
            logger.warning(f"Image file not found: {path}")
            return ""
        
        from PIL import Image
        import pytesseract
        
        # Open and process image
        with Image.open(str(path)) as img:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Extract text using OCR
            text = pytesseract.image_to_string(img, lang='eng')
            
            # Clean up OCR text
            text = re.sub(r'\n+', '\n', text)  # Multiple newlines to single
            text = re.sub(r' +', ' ', text)     # Multiple spaces to single
            text = text.strip()
            
            logger.debug(f"OCR parsed image: {path} ({len(text)} chars)")
            return text
            
    except ImportError:
        logger.warning("PIL or pytesseract not available for OCR")
        return ""
    except Exception as e:
        logger.warning(f"OCR failed for image {path}: {e}")
        return ""

def chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    """
    Split text into chunks with word-level overlap.
    
    Args:
        text: Input text to chunk
        chunk_size: Maximum number of characters per chunk
        overlap: Number of characters to overlap between chunks
        
    Returns:
        List[str]: List of text chunks, whitespace-trimmed and deterministic
        
    Raises:
        ValueError: If parameters are invalid
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0:
        raise ValueError("overlap cannot be negative")
    if overlap >= chunk_size:
        raise ValueError("overlap must be less than chunk_size")
    
    # Clean and normalize text
    text = text.strip()
    if not text:
        return []
    
    # Split into words for better chunk boundaries
    words = text.split()
    if not words:
        return []
    
    chunks = []
    start_idx = 0
    
    while start_idx < len(words):
        # Build chunk by adding words until we exceed chunk_size
        chunk_words = []
        char_count = 0
        
        for i in range(start_idx, len(words)):
            word = words[i]
            # Account for space between words (except for first word)
            word_length = len(word) + (1 if chunk_words else 0)
            
            if char_count + word_length > chunk_size and chunk_words:
                # We've hit the limit, stop here
                break
            
            chunk_words.append(word)
            char_count += word_length
        
        # Create chunk text
        if chunk_words:
            chunk_text = " ".join(chunk_words).strip()
            chunks.append(chunk_text)
        
        # Calculate next starting position with overlap
        if overlap > 0 and len(chunk_words) > 1:
            # Find overlap position by counting characters backwards
            overlap_chars = 0
            overlap_words = 0
            
            for i in range(len(chunk_words) - 1, -1, -1):
                word_length = len(chunk_words[i]) + (1 if i < len(chunk_words) - 1 else 0)
                if overlap_chars + word_length > overlap:
                    break
                overlap_chars += word_length
                overlap_words += 1
            
            # Move start index forward, accounting for overlap
            next_start = start_idx + len(chunk_words) - overlap_words
            
            # Ensure we make progress
            if next_start <= start_idx:
                next_start = start_idx + max(1, len(chunk_words) // 2)
        else:
            next_start = start_idx + len(chunk_words)
        
        start_idx = next_start
        
        # Break if we've processed all words
        if start_idx >= len(words):
            break
    
    logger.debug(f"Chunked text into {len(chunks)} chunks (size: {chunk_size}, overlap: {overlap})")
    return chunks

def get_file_parser(file_path: Path) -> Optional[callable]:
    """
    Get appropriate parser function for a file based on its extension.
    
    Args:
        file_path: Path to the file
        
    Returns:
        callable: Parser function or None if unsupported format
    """
    suffix = file_path.suffix.lower()
    
    parsers = {
        '.txt': parse_txt,
        '.md': parse_txt,
        '.text': parse_txt,
        '.pdf': parse_pdf,
        '.docx': parse_docx,
        '.doc': parse_docx,  # Note: .doc files might not work with python-docx
        '.png': parse_image_ocr,
        '.jpg': parse_image_ocr,
        '.jpeg': parse_image_ocr,
        '.gif': parse_image_ocr,
        '.bmp': parse_image_ocr,
        '.tiff': parse_image_ocr,
    }
    
    return parsers.get(suffix)

def parse_file(file_path: Path) -> str:
    """
    Parse any supported file and return its text content.
    
    Args:
        file_path: Path to the file to parse
        
    Returns:
        str: Extracted text content
        
    Raises:
        ValueError: If file format is not supported
        Exception: If parsing fails
    """
    parser = get_file_parser(file_path)
    if parser is None:
        raise ValueError(f"Unsupported file format: {file_path.suffix}")
    
    return parser(file_path)
