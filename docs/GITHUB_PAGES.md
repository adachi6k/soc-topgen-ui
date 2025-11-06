# GitHub Pages Deployment Guide

This document explains how to deploy soc-topgen-ui to GitHub Pages.

## Overview

The soc-topgen-ui application is deployed to GitHub Pages as a static frontend. Since GitHub Pages only serves static files, the deployment has some limitations compared to the full local setup.

## What Works on GitHub Pages

✅ **Frontend UI**: The complete React-based user interface  
✅ **Client-side Validation**: Configuration validation using JSON Schema (works offline!)  
✅ **Configuration Editor**: Visual editing of FlooNoC configurations  
✅ **Example Loading**: Pre-loaded example configurations  
✅ **Offline Mode**: Full validation support without backend connection  

## What Requires Backend

❌ **RTL Generation**: Generating SystemVerilog files requires the floogen tool (needs backend)  
❌ **File Downloads**: Downloading generated RTL as ZIP files (needs backend)  

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│     GitHub Pages (Static Frontend)      │
│                                         │
│  - Configuration Editor                 │
│  - Client-side Validation (Offline!)   │
│  - Example Configurations              │
│  - Bundled JSON Schema                 │
└─────────────────────────────────────────┘
           │
           │ (Optional - for RTL generation)
           ▼
┌─────────────────────────────────────────┐
│    Your Backend Server (Optional)       │
│                                         │
│  - Flask API                            │
│  - floogen RTL Generation              │
│  - ZIP File Generation                 │
└─────────────────────────────────────────┘
```

The frontend includes a bundled JSON schema file, allowing it to perform full validation without any backend connection. This means users can edit and validate configurations entirely offline on GitHub Pages.

## Automatic Deployment

The frontend is automatically deployed to GitHub Pages when code is pushed to the `main` branch via GitHub Actions.

### Workflow: `.github/workflows/deploy-pages.yml`

The workflow:
1. Checks out the code
2. Installs Node.js dependencies
3. Builds the frontend with proper base path
4. Uploads the build artifact
5. Deploys to GitHub Pages

## Manual Setup (One-time)

To enable GitHub Pages for your repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: Select **GitHub Actions**
4. Save the settings

After the next push to `main`, the site will be available at:
```
https://<username>.github.io/soc-topgen-ui/
```

## Using with External Backend

If you want to use RTL generation features, you can deploy the backend separately and configure the frontend to connect to it.

### Option 1: Deploy Backend Separately

Deploy the backend to any hosting service that supports Python/Flask:
- Heroku
- Railway
- Render
- Your own server

### Option 2: Configure API URL

Set the backend URL when building the frontend:

```bash
cd ui
VITE_API_URL=https://your-backend.example.com npm run build
```

Or create a `.env.production` file in the `ui` directory:

```env
VITE_API_URL=https://your-backend.example.com
```

## Local Development

For full functionality including RTL generation, run both frontend and backend locally:

### Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### Frontend (Terminal 2)
```bash
cd ui
npm install
npm run dev
# Runs on http://localhost:3000
```

The Vite development server automatically proxies `/api` requests to the backend.

## Docker Deployment

For production deployment with both frontend and backend:

```bash
cd docker
docker-compose up
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Testing the Deployment Locally

To test the GitHub Pages build locally:

```bash
cd ui

# Build with GitHub Pages base path
VITE_BASE_PATH=/soc-topgen-ui/ npm run build

# Preview the build
npm run preview
```

Visit http://localhost:4173/soc-topgen-ui/

## Troubleshooting

### Issue: 404 on GitHub Pages

**Solution**: Ensure the base path in `vite.config.ts` matches your repository name.

### Issue: Assets not loading

**Solution**: Check that `VITE_BASE_PATH` is set correctly in the GitHub Actions workflow.

### Issue: API calls failing

**Solution**: The static GitHub Pages deployment doesn't include a backend. Either:
1. Use demo/validation-only features
2. Configure `VITE_API_URL` to point to your backend server
3. Run the full stack locally with Docker

## Security Notes

- Never commit API keys or secrets to the repository
- If connecting to an external backend, ensure it has proper CORS configuration
- Use HTTPS for any external API connections

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Main README](../README.md)
- [Development Guide](./DEVELOPMENT.md)
