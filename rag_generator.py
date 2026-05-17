#!/usr/bin/env python3
"""
RAG Chunk Generator for Smart Cemetery Chatbot
Extracts text from PDF files and creates chunks for AI retrieval
"""

import os
import json
import re
from pathlib import Path

# Try to import PDF libraries - install via: pip install pypdf pdfplumber
try:
    import pypdf
    PDF_LIBRARY = "pypdf"
except ImportError:
    try:
        import pdfplumber
        PDF_LIBRARY = "pdfplumber"
    except ImportError:
        PDF_LIBRARY = None

def extract_text_pypdf(pdf_path):
    """Extract text using pypdf"""
    text = ""
    with open(pdf_path, 'rb') as f:
        reader = pypdf.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_pdfplumber(pdf_path):
    """Extract text using pdfplumber"""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or "" + "\n"
    return text

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using available library"""
    if PDF_LIBRARY == "pypdf":
        return extract_text_pypdf(pdf_path)
    elif PDF_LIBRARY == "pdfplumber":
        return extract_text_pdfplumber(pdf_path)
    else:
        # Fallback: try pypdf first
        try:
            return extract_text_pypdf(pdf_path)
        except:
            return ""

def clean_text(text):
    """Clean and normalize extracted text"""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove excessive newlines
    text = re.sub(r'\n+', '\n', text)
    # Strip leading/trailing whitespace
    text = text.strip()
    return text

def chunk_text(text, chunk_size=500, overlap=50):
    """Split text into overlapping chunks"""
    # Split by sentences first (period followed by space)
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence_length = len(sentence)
        
        if current_length + sentence_length > chunk_size and current_chunk:
            # Save current chunk
            chunks.append(' '.join(current_chunk))
            
            # Start new chunk with overlap
            overlap_text = ' '.join(current_chunk)[-overlap:] if current_chunk else ''
            current_chunk = [overlap_text + ' ' + sentence if overlap_text else sentence]
            current_length = len(overlap_text) + sentence_length + 1
        else:
            current_chunk.append(sentence)
            current_length += sentence_length + 1
    
    # Add remaining chunk
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    # Filter out very short chunks
    chunks = [c for c in chunks if len(c) > 50]
    
    return chunks

def process_pdfs(pdf_dir="public/data-pdf", output_file="rag_chunks.json"):
    """Process all PDFs and create chunks"""
    pdf_path = Path(pdf_dir)
    
    if not pdf_path.exists():
        print(f"Error: Directory {pdf_dir} not found")
        return
    
    # Find all PDF files
    pdf_files = list(pdf_path.glob("*.pdf"))
    
    if not pdf_files:
        print(f"Error: No PDF files found in {pdf_dir}")
        return
    
    print(f"Found {len(pdf_files)} PDF files")
    print(f"Using PDF library: {PDF_LIBRARY or 'None - install pypdf or pdfplumber'}")
    
    all_chunks = []
    
    for pdf_file in pdf_files:
        print(f"\nProcessing: {pdf_file.name}")
        
        # Extract text
        text = extract_text_from_pdf(str(pdf_file))
        
        if not text:
            print(f"  Warning: No text extracted from {pdf_file.name}")
            continue
        
        # Clean text
        text = clean_text(text)
        print(f"  Extracted {len(text)} characters")
        
        # Chunk text
        chunks = chunk_text(text, chunk_size=500, overlap=50)
        print(f"  Created {len(chunks)} chunks")
        
        # Add source metadata to chunks
        for chunk in chunks:
            all_chunks.append(f"[{pdf_file.name}] {chunk}")
    
    # Save chunks to JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Successfully created {len(all_chunks)} chunks")
    print(f"✓ Saved to {output_file}")
    print(f"\nTo use with the chatbot, ensure rag_chunks.json is in the project root")

if __name__ == "__main__":
    # Change to project directory
    os.chdir("/Users/mwlanaz/Development/capstone-project/web-testing")
    process_pdfs()