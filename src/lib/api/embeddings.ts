import { supabase } from '@/integrations/supabase/client';

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  isAvailable(): boolean;
}

export interface EmbeddingGenerationResult {
  success: boolean;
  processed: number;
  failed: number;
  totalTokens: number;
  estimatedCostUSD: string;
  remaining: number;
  errors?: string[];
  error?: string;
}

export async function generateEmbeddings(
  table: 'content_repository' | 'document_chunks' = 'content_repository',
  batchSize: number = 10
): Promise<EmbeddingGenerationResult> {
  const { data, error } = await supabase.functions.invoke('generate-embeddings', {
    body: { table, batchSize }
  });

  if (error) {
    console.error('Error invoking generate-embeddings:', error);
    return { success: false, processed: 0, failed: 0, totalTokens: 0, estimatedCostUSD: '0', remaining: 0, error: error.message };
  }

  return data as EmbeddingGenerationResult;
}

export async function generateAllEmbeddings(
  table: 'content_repository' | 'document_chunks' = 'content_repository',
  batchSize: number = 10,
  onProgress?: (result: EmbeddingGenerationResult) => void
): Promise<{ totalProcessed: number; totalCost: string; errors: string[] }> {
  let totalProcessed = 0;
  let totalTokens = 0;
  const allErrors: string[] = [];
  
  while (true) {
    const result = await generateEmbeddings(table, batchSize);
    if (!result.success) { allErrors.push(result.error || 'Unknown error'); break; }
    totalProcessed += result.processed;
    totalTokens += result.totalTokens;
    if (result.errors) allErrors.push(...result.errors);
    onProgress?.(result);
    if (result.remaining === 0 || result.processed === 0) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const totalCost = ((totalTokens / 1000000) * 0.02).toFixed(6);
  return { totalProcessed, totalCost, errors: allErrors };
}

export const embeddingService: EmbeddingService = {
  async generateEmbedding(text: string): Promise<number[]> {
    console.warn('Single embedding generation should use pre-computed embeddings');
    return [];
  },
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    console.warn('Batch embedding generation should use the edge function');
    return texts.map(() => []);
  },
  isAvailable(): boolean {
    return true;
  }
};