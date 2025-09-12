Backend skeleton:
- start with: node server.js
- Exposes:
  POST /api/v1/cases  (multipart form: field "media", "notes")
  GET  /api/v1/cases/:id
- Currently uses a mock processor (mockProcessor.js). Replace mockProcess with real worker / job queue.
- Deploy on Render as a web service (Node). Set NODE_VERSION to 22.x.
