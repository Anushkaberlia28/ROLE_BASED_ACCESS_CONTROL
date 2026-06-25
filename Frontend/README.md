Basic Frontend (Vanilla JS)

This is a minimal frontend to interact with the Backend in this workspace.

Quick start:

1. Start the backend server (from Backend folder):

```bash
cd Backend
npm install
npm run dev
```

The backend listens by default on port 7002.

2. Serve the frontend to allow cookies to be stored correctly (recommended):

```bash
# from repository root
cd Frontend
# using Python 3
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser.

3. Use the UI to register/login and create reimbursements.

Notes:
- The backend uses cookie-based auth; ensure `credentials: 'include'` is allowed by your browser when serving from a local server.
- This is intentionally minimal and meant for local development only.