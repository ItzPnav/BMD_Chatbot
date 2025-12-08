// backend/src/utils/vectorUtils.js

/**
 * Convert JS float64 array → pgvector float4 array literal
 */
export function toPgVector(arr) {
  const f4 = arr.map(v => Number.parseFloat(v.toFixed(6)));
  return `[${f4.join(",")}]`;
}

/**
 * Text chunker for RAG
 * Splits text into chunks of ~800 characters with overlap.
 */
export function chunkText(text, chunkSize = 800, overlap = 150) {
  if (!text) return [];

  // Normalize new lines
  text = text.replace(/\r/g, "");

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Prefer ending at sentence boundary
    if (end < text.length) {
      const nextPeriod = text.indexOf(".", end);
      if (nextPeriod !== -1 && nextPeriod - end < 200) {
        end = nextPeriod + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);

    start = end - overlap; // step back for overlap
    if (start < 0) start = 0;
  }

  return chunks;
}
