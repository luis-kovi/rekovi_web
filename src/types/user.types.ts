// src/types/user.types.ts
/**
 * Tipos relacionados aos usuários e permissões
 */

export type PermissionType = 'admin' | 'kovi' | 'ativa' | 'onsystem' | 'rvs' | 'chofer';

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
  app_metadata?: {
    permissionType?: PermissionType;
  };
}

export interface DatabaseUser {
  email: string;
  nome?: string;
  empresa?: string;
  permission_type?: PermissionType;
  status?: string;
  area_atuacao?: string[];
}

export interface UserPermissions {
  canViewAllCards: boolean;
  canEditCards: boolean;
  canAllocateDrivers: boolean;
  canRejectCollection: boolean;
  canAccessSettings: boolean;
  canViewAnalytics: boolean;
}
