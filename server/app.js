// Express app definition — no app.listen() here so this same module can be
// used both by the local dev server (server/index.js) and by the Vercel
// serverless entry (api/index.js).

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const settings = require('./settingsStore');
const ghl = require('./ghlClient');
const auth = require('./auth');

const app = express();

app.use(
  cors({
    origin: (origin, cb) => cb(null, origin || true),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Wrap async route handlers so thrown errors reach the error middleware.
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Every GHL-backed route needs credentials saved first.
function requireSettings(req, res, next) {
  const s = settings.load();
  if (!s.locationId || !s.token) {
    return res.status(400).json({ error: 'GHL is not connected yet. Save your Location ID and Private Integration Token in Settings first.' });
  }
  req.ghl = s;
  next();
}

// ---- Auth -----------------------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!auth.checkCredentials(email, password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  auth.issueSessionCookie(res);
  res.json({ email: auth.ACCOUNT.email });
});

app.post('/api/auth/logout', (req, res) => {
  auth.clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const session = auth.getSession(req);
  if (!session) return res.status(401).json({ error: 'Not signed in.' });
  res.json({ email: session.email, expiresAt: session.exp });
});

// Everything below requires a valid session.
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next();
  return auth.requireAuth(req, res, next);
});

// ---- Settings ---------------------------------------------------------

app.get('/api/settings', (req, res) => {
  res.json(settings.publicView());
});

app.post('/api/settings', asyncHandler(async (req, res) => {
  const { locationId, token } = req.body || {};
  if (!locationId || !token) {
    return res.status(400).json({ error: 'Location ID and Private Integration Token are both required.' });
  }

  // Validate against the real API before saving.
  await ghl.testConnection(locationId, token);

  settings.save({ locationId, token });
  res.json(settings.publicView());
}));

app.delete('/api/settings', (req, res) => {
  settings.clear();
  res.json(settings.publicView());
});

// ---- Contacts (filtered by tag) ----------------------------------------

app.get('/api/contacts', requireSettings, asyncHandler(async (req, res) => {
  const tag = req.query.tag || 'positive-replied';
  const contacts = await ghl.getContactsByTag(req.ghl.locationId, req.ghl.token, tag);
  res.json({ contacts });
}));

// ---- Conversations -------------------------------------------------------

// Find (or create) the conversation for a contact, then return it.
app.get('/api/conversations', requireSettings, asyncHandler(async (req, res) => {
  const { contactId } = req.query;
  if (!contactId) return res.status(400).json({ error: 'contactId is required.' });

  let conversations = await ghl.searchConversations(req.ghl.locationId, req.ghl.token, contactId);

  if (!conversations.length) {
    const created = await ghl.createConversation(req.ghl.token, {
      locationId: req.ghl.locationId,
      contactId,
    });
    conversations = [created];
  }

  res.json({ conversations });
}));

app.get('/api/conversations/:id', requireSettings, asyncHandler(async (req, res) => {
  const conversation = await ghl.getConversation(req.ghl.token, req.params.id);
  res.json({ conversation });
}));

app.put('/api/conversations/:id', requireSettings, asyncHandler(async (req, res) => {
  const conversation = await ghl.updateConversation(req.ghl.token, req.params.id, req.body || {});
  res.json({ conversation });
}));

app.get('/api/conversations/:id/messages', requireSettings, asyncHandler(async (req, res) => {
  const messages = await ghl.getMessages(req.ghl.token, req.params.id);
  res.json({ messages });
}));

// ---- Reply (send email) -------------------------------------------------

app.post('/api/conversations/:id/reply', requireSettings, asyncHandler(async (req, res) => {
  const { contactId, subject, html, emailTo, emailFrom } = req.body || {};
  if (!contactId || !html) {
    return res.status(400).json({ error: 'contactId and html body are required.' });
  }

  const result = await ghl.sendEmailReply(req.ghl.token, {
    locationId: req.ghl.locationId,
    conversationId: req.params.id,
    contactId,
    subject,
    html,
    emailTo,
    emailFrom,
  });

  res.json({ result });
}));

// ---- Errors ---------------------------------------------------------------

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, _next) => {
  const status = err.status || 500;
  console.error(`[error] ${req.method} ${req.path} ->`, err.message);
  res.status(status).json({
    error: err.message || 'Something went wrong talking to GoHighLevel.',
    details: err.details,
  });
});

module.exports = app;
