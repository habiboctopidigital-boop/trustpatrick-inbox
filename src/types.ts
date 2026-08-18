export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  dateUpdated?: string | null;
}

export interface ConversationMessage {
  id: string;
  direction: 'inbound' | 'outbound' | string;
  subject: string;
  html: string;
  from: string;
  to: string;
  dateAdded: string | null;
}

export interface Conversation {
  id: string;
  contactId: string;
  [key: string]: unknown;
}

export interface SettingsView {
  configured: boolean;
  locationId: string;
  tokenPreview: string;
  hasToken: boolean;
  managedByEnv: boolean;
}

export interface AuthUser {
  email: string;
  expiresAt: number;
}

export interface ApiErrorShape {
  error: string;
  details?: unknown;
}
