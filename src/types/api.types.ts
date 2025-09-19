// src/types/api.types.ts
/**
 * Tipos relacionados às APIs e comunicação com serviços externos
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface PipefyMutation {
  query: string;
  variables?: Record<string, any>;
}

export interface PipefyResponse {
  data?: any;
  errors?: Array<{
    message: string;
    locations?: any[];
    path?: string[];
  }>;
}

export interface SupabaseRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, any>;
  old?: Record<string, any>;
  schema: string;
  table: string;
  commit_timestamp: string;
}

export interface UploadImageRequest {
  file: File;
  fieldId: string;
  cardId: string;
}

export interface UploadImageResponse {
  url: string;
  downloadUrl: string;
}
