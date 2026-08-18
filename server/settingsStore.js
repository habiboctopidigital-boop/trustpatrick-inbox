// Single-tenant GHL settings storage.
//
// Production (Railway, Vercel, or any host): set GHL_LOCATION_ID +
// GHL_PRIVATE_TOKEN as environment variables in the project settings. Both
// Vercel serverless functions and Railway's container filesystem are
// ephemeral (Railway's disk resets on every redeploy/restart unless a
// volume is attached), so anything written to a file is not durable — env
// vars are the reliable source in production, and settings become
// read-only ("configured via environment") in that mode.
//
// Local dev (no env vars set): falls back to a JSON file in the OS temp
// dir, so the Settings UI's Connect flow works for local testing.

const fs = require('fs');
const os = require('os');
const path = require('path');

const SETTINGS_FILE = path.join(os.tmpdir(), 'positive-replies-settings.json');

const ENV_LOCATION_ID = process.env.GHL_LOCATION_ID || '';
const ENV_TOKEN = process.env.GHL_PRIVATE_TOKEN || '';
const FROM_ENV = Boolean(ENV_LOCATION_ID && ENV_TOKEN);

let cache = null;

function loadFile() {
  if (cache) return cache;
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch {
      cache = { locationId: '', token: '' };
    }
  } else {
    cache = { locationId: '', token: '' };
  }
  return cache;
}

function load() {
  if (FROM_ENV) return { locationId: ENV_LOCATION_ID, token: ENV_TOKEN };
  return loadFile();
}

function save(next) {
  if (FROM_ENV) {
    throw new Error(
      'GHL credentials are set via environment variables (GHL_LOCATION_ID / GHL_PRIVATE_TOKEN) — update them in your hosting provider, not here.'
    );
  }
  cache = { locationId: next.locationId || '', token: next.token || '' };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // Best-effort: on a read-only filesystem this keeps working in-memory
    // for the life of the process even though it won't persist.
  }
  return cache;
}

function clear() {
  if (FROM_ENV) {
    throw new Error('GHL credentials are set via environment variables — remove them there to disconnect.');
  }
  cache = { locationId: '', token: '' };
  try {
    if (fs.existsSync(SETTINGS_FILE)) fs.unlinkSync(SETTINGS_FILE);
  } catch {
    // ignore
  }
  return cache;
}

function isConfigured() {
  const s = load();
  return Boolean(s.locationId && s.token);
}

function maskToken(token) {
  if (!token) return '';
  if (token.length <= 8) return '•'.repeat(token.length);
  return `${token.slice(0, 4)}${'•'.repeat(Math.max(4, token.length - 8))}${token.slice(-4)}`;
}

function publicView() {
  const s = load();
  return {
    configured: isConfigured(),
    locationId: s.locationId || '',
    tokenPreview: maskToken(s.token),
    hasToken: Boolean(s.token),
    managedByEnv: FROM_ENV,
  };
}

module.exports = { load, save, clear, isConfigured, publicView };
