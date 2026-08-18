// Thin wrapper around the GoHighLevel (LeadConnector) v2 REST API.
// Real API calls only — no mock data. Paths/payloads below match the
// GHL v2 Conversations & Contacts API. If the API keys you send over need a
// small field-name tweak, this is the only file that needs to change.

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

class GhlApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'GhlApiError';
    this.status = status || 502;
    this.details = details;
  }
}

async function ghlFetch(token, path, { method = 'GET', body, query } = {}) {
  const url = new URL(BASE_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Version: API_VERSION,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new GhlApiError(`Could not reach GoHighLevel (${err.message})`, 502);
  }

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const message =
      json?.message || json?.error || `GoHighLevel returned ${res.status}`;
    throw new GhlApiError(message, res.status, json);
  }

  return json;
}

/** Quick call to validate a Location ID + token pair. */
async function testConnection(locationId, token) {
  return ghlFetch(token, '/contacts/', { query: { locationId, limit: 1 } });
}

// ---- Contacts -------------------------------------------------------------

/** Contacts in a location that carry a given tag (default: positive-replied). */
async function getContactsByTag(locationId, token, tag = 'positive-replied') {
  const json = await ghlFetch(token, '/contacts/search', {
    method: 'POST',
    body: {
      locationId,
      pageLimit: 100,
      filters: [{ field: 'tags', operator: 'contains', value: tag }],
    },
  });
  const raw = json.contacts || json.data || [];
  return raw.map(normalizeContact);
}

function normalizeContact(c) {
  return {
    id: c.id || c.contactId,
    name:
      c.contactName ||
      [c.firstName, c.lastName].filter(Boolean).join(' ') ||
      c.email ||
      'Unknown',
    email: c.email || null,
    phone: c.phone || null,
    tags: c.tags || [],
    dateUpdated: c.dateUpdated || null,
  };
}

// ---- Conversations ----------------------------------------------------

/** Conversations for a given contact (to find the thread to open/reply on). */
async function searchConversations(locationId, token, contactId) {
  const json = await ghlFetch(token, '/conversations/search', {
    query: { locationId, contactId },
  });
  return json.conversations || json.data || [];
}

/** Create a new conversation for a contact. */
async function createConversation(token, { locationId, contactId }) {
  return ghlFetch(token, '/conversations/', {
    method: 'POST',
    body: { locationId, contactId },
  });
}

/** Get a single conversation by id. */
async function getConversation(token, conversationId) {
  return ghlFetch(token, `/conversations/${conversationId}`);
}

/** Update a conversation (e.g. mark read, star). */
async function updateConversation(token, conversationId, updates) {
  return ghlFetch(token, `/conversations/${conversationId}`, {
    method: 'PUT',
    body: updates,
  });
}

/** Messages within a conversation (the email thread). */
async function getMessages(token, conversationId) {
  const json = await ghlFetch(token, `/conversations/${conversationId}/messages`);
  const raw = json.messages?.messages || json.messages || json.data || [];
  return raw.map(normalizeMessage);
}

function normalizeMessage(m) {
  return {
    id: m.id,
    direction: m.direction || m.messageType || 'inbound',
    subject: m.subject || m.emailSubject || '',
    html: m.body || m.html || m.message || '',
    from: m.from || m.emailFrom || '',
    to: m.to || m.emailTo || '',
    dateAdded: m.dateAdded || m.dateCreated || null,
  };
}

/** Send an email reply on a conversation. */
async function sendEmailReply(token, { locationId, conversationId, contactId, subject, html, emailTo, emailFrom }) {
  return ghlFetch(token, '/conversations/messages', {
    method: 'POST',
    body: {
      type: 'Email',
      locationId,
      conversationId,
      contactId,
      subject,
      html,
      emailTo,
      emailFrom,
    },
  });
}

module.exports = {
  GhlApiError,
  testConnection,
  getContactsByTag,
  searchConversations,
  createConversation,
  getConversation,
  updateConversation,
  getMessages,
  sendEmailReply,
};
