import type { AIProvider, FileMetadata, VectorIndex } from '../engine/types';

export class NoopAIProvider implements AIProvider {
  async classify() {
    return undefined;
  }

  async summarize(_content: string, metadata: FileMetadata) {
    return `${metadata.category} file at ${metadata.relPath}`;
  }

  async embed(input: string) {
    // Deterministic tiny vector for local development; replace with OpenAI, Gemini, or local models.
    const buckets = new Array(16).fill(0);
    for (let i = 0; i < input.length; i++) {
      buckets[i % buckets.length] += input.charCodeAt(i) / 255;
    }
    return buckets;
  }
}

export class InMemoryVectorIndex implements VectorIndex {
  private vectors = new Map<string, { vector: number[]; metadata: Record<string, unknown> }>();

  async upsert(id: string, vector: number[], metadata: Record<string, unknown>) {
    this.vectors.set(id, { vector, metadata });
  }

  async search(vector: number[], limit: number) {
    const scored = Array.from(this.vectors.entries()).map(([id, item]) => ({
      id,
      score: cosineSimilarity(vector, item.vector),
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let aMag = 0;
  let bMag = 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    dot += av * bv;
    aMag += av * av;
    bMag += bv * bv;
  }
  if (!aMag || !bMag) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}
