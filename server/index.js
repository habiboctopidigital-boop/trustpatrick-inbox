// Local dev / traditional Node hosting entry point.
// On Vercel, api/index.js imports server/app.js directly instead of this file.

const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Positive Replies backend listening on http://localhost:${PORT}`);
});
