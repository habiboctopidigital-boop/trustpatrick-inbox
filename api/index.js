// Vercel serverless entry point. An Express app instance is itself a valid
// (req, res) request handler, so exporting it directly is all Vercel needs —
// every request under /api/** (see vercel.json) is routed here and handled
// by the same Express routing used locally in server/index.js.
module.exports = require('../server/app');
