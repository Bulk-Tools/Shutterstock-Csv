export interface StockMetadata {
  description: string;
  keywords: string;
  categories: string;
  editorial: string;
  mature_content: string;
  illustration: string;
}

export interface ProcessedResult extends StockMetadata {
  filename: string;
  status: 'success' | 'error';
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

export interface FileWithId {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export enum AppStep {
  AUTH = 0,
  UPLOAD = 1,
  RESULTS = 2,
}
