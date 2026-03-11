import OpenAI from "openai";

import { env, hasOpenAI } from "@/config/env";

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function rerankBySemanticSimilarity<T extends { id: string; semanticText: string; score: number }>(
  query: string,
  items: T[],
) {
  if (!hasOpenAI || items.length === 0 || !query.trim()) {
    return items;
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: [query, ...items.map((item) => item.semanticText.slice(0, 4000))],
  });

  const [queryEmbedding, ...itemEmbeddings] = response.data.map((entry) => entry.embedding);

  return items
    .map((item, index) => ({
      ...item,
      semanticScore: cosineSimilarity(queryEmbedding, itemEmbeddings[index]),
      blendedScore: item.score + cosineSimilarity(queryEmbedding, itemEmbeddings[index]) * 10,
    }))
    .sort((a, b) => b.blendedScore - a.blendedScore);
}
