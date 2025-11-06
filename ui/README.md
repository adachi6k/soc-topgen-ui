# Frontend UI

React + TypeScript + Vite frontend for soc-topgen-ui.

## Setup

### Install Dependencies

```bash
npm install
```

## Development

### Start Development Server

```bash
npm run dev
```

The development server will start on `http://localhost:3000` with hot module reloading.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Project Structure

```
ui/
├── src/
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   ├── api/
│   │   └── client.ts        # Backend API client
│   ├── components/          # Reusable React components
│   ├── pages/               # Page components
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Node dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── .eslintrc.cjs           # ESLint configuration
```

## Environment Variables

Create a `.env` file in the `ui/` directory:

```env
VITE_API_URL=http://localhost:5000
```

## API Client

The API client is located in `src/api/client.ts` and provides methods for:

- `healthCheck()` - Check backend health
- `getSchema()` - Get JSON Schema
- `validateConfig(config)` - Validate configuration
- `generateRTL(config, jobId?)` - Generate RTL
- `getJobStatus(jobId)` - Get job status
- `getDownloadUrl(jobId)` - Get download URL

Example usage:

```typescript
import { apiClient } from './api/client';

// Validate configuration
const result = await apiClient.validateConfig(yamlString);
if (result.valid) {
  console.log('Configuration is valid');
} else {
  console.error('Validation errors:', result.errors);
}

// Generate RTL
const genResult = await apiClient.generateRTL(yamlString);
if (genResult.success) {
  const url = apiClient.getDownloadUrl(genResult.job_id);
  window.location.href = url;
}
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **js-yaml** - YAML parsing

## Docker

Build and run using Docker:

```bash
cd ..
docker build -f docker/Dockerfile.frontend -t soc-topgen-frontend .
docker run -p 3000:80 soc-topgen-frontend
```

Or use docker-compose:

```bash
cd docker
docker-compose up frontend
```

## Future Features

- Visual configuration editor with forms
- Real-time YAML validation
- Interactive NoC topology visualization
- Configuration templates and examples browser
- Job history and management
- Syntax highlighting for YAML
