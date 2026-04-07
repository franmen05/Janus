export interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  expiresAt: string | null;
  active: boolean;
  createdBy: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string;
}

export interface CreateApiKeyRequest {
  name: string;
  expiresAt: string | null;
}
