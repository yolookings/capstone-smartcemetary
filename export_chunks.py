"""
Extract chunks from vector_store.pkl to JSON for Node.js usage
"""
import pickle

with open("vector_store.pkl", "rb") as f:
    data = pickle.load(f)

chunks = data.get("chunks", [])
print(f"Found {len(chunks)} chunks")

with open("rag_chunks.json", "w", encoding="utf-8") as f:
    import json
    json.dump(chunks, f, ensure_ascii=False, indent=2)

print("Exported to rag_chunks.json")
print(f"First chunk preview: {chunks[0][:200] if chunks else 'No chunks'}...")