# Development Guide

This guide helps developers get started with soc-topgen-ui development.

## Prerequisites

- Python 3.10 or higher
- Node.js 20 or higher
- Git
- (Optional) Docker and Docker Compose

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/adachi6k/soc-topgen-ui.git
cd soc-topgen-ui
```

### 2. Setup Backend

```bash
cd backend
pip install -r requirements.txt

# Test the validator
python3 << 'EOF'
from validators.config_validator import ConfigValidator
import yaml

validator = ConfigValidator('../docs/schema/floonoc_config.schema.json')
with open('../examples/minimal.yml') as f:
    config = yaml.safe_load(f)
is_valid, errors = validator.validate(config)
print(f"Valid: {is_valid}")
EOF

# Start the backend server
python app.py
```

Backend will be available at `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ui
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 4. (Optional) Install floogen

For actual RTL generation, install floogen:

```bash
git clone https://github.com/pulp-platform/FlooNoC.git
cd FlooNoC
pip install .
```

## Development Workflow

### Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test your changes (see Testing section)
4. Commit: `git commit -m "Description of changes"`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request

### Testing

#### Backend Tests

```bash
cd backend

# Test validator
python3 << 'EOF'
from validators.config_validator import ConfigValidator
import yaml

validator = ConfigValidator('../docs/schema/floonoc_config.schema.json')

# Test all examples
for example in ['minimal.yml', 'multi_slave.yml']:
    with open(f'../examples/{example}') as f:
        config = yaml.safe_load(f)
    is_valid, errors = validator.validate(config)
    print(f"{example}: {'✅ VALID' if is_valid else '❌ INVALID'}")
    if errors:
        for error in errors:
            print(f"  - {error}")
EOF

# Test API endpoints
python -m pytest tests/  # (when tests are added)
```

#### Frontend Tests

```bash
cd ui
npm run lint
npm run build
```

#### Integration Tests

```bash
# Start both services
cd backend && python app.py &
cd ui && npm run dev &

# Test API connectivity
curl http://localhost:5000/api/health
```

### Code Style

#### Python (Backend)

- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Keep functions focused and small

Example:
```python
def validate_config(config: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate a FlooNoC configuration.
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Tuple of (is_valid, errors)
    """
    # Implementation
```

#### TypeScript (Frontend)

- Use TypeScript strict mode
- Define interfaces for data structures
- Use functional components with hooks
- Keep components focused and reusable

Example:
```typescript
interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}

async function validateConfig(config: string): Promise<ConfigValidationResult> {
  // Implementation
}
```

## Project Structure

```
soc-topgen-ui/
├── README.md                 # Main project README
├── docs/
│   ├── SPEC.md              # Detailed specification
│   ├── DEVELOPMENT.md       # This file
│   └── schema/              # JSON schemas
├── backend/                 # Python Flask backend
│   ├── app.py              # Main entry point
│   ├── floogen_runner.py   # floogen wrapper
│   └── validators/         # Validation logic
├── ui/                      # React frontend
│   └── src/
│       ├── api/            # API client
│       ├── components/     # React components
│       └── pages/          # Page components
├── examples/                # Example configurations
├── docker/                  # Docker configurations
└── .github/                 # GitHub Actions & templates
```

## Adding New Features

### Adding a New API Endpoint

1. Define the endpoint in `backend/app.py`:

```python
@app.route("/api/my-endpoint", methods=["POST"])
def my_endpoint() -> Tuple[Dict[str, Any], int]:
    """
    Endpoint description
    """
    try:
        data = request.get_json()
        # Implementation
        return jsonify({"result": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

2. Add the client method in `ui/src/api/client.ts`:

```typescript
async myEndpoint(data: any): Promise<any> {
  const response = await this.client.post('/api/my-endpoint', data);
  return response.data;
}
```

3. Update documentation

### Adding a New React Component

1. Create component file in `ui/src/components/`:

```typescript
// MyComponent.tsx
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

2. Export from `ui/src/components/index.ts`
3. Use in pages or other components

### Adding Validation Rules

1. Add rule in `backend/validators/config_validator.py`:

```python
def _validate_my_rule(self, config: Dict[str, Any]) -> List[str]:
    """Validate my custom rule"""
    errors = []
    # Implementation
    return errors
```

2. Call from `_validate_semantics` method
3. Add test cases

## Debugging

### Backend Debugging

```bash
# Enable Flask debug mode
export FLASK_DEBUG=1
python app.py

# Or use debugger
python -m pdb app.py
```

### Frontend Debugging

- Use browser DevTools (F12)
- React DevTools extension
- Network tab for API calls
- Console for errors and logs

### Common Issues

**Issue**: "floogen command not found"
**Solution**: Install floogen from FlooNoC repository

**Issue**: CORS errors in frontend
**Solution**: Ensure Flask-CORS is installed and CORS() is called

**Issue**: Module import errors
**Solution**: Check Python path and virtual environment

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and PR:

1. Backend validation tests
2. Frontend build and lint
3. Schema validation

View results in the GitHub Actions tab.

## Docker Development

### Build Images

```bash
# Backend
docker build -f docker/Dockerfile.backend -t soc-topgen-backend .

# Frontend
docker build -f docker/Dockerfile.frontend -t soc-topgen-frontend .
```

### Run with Docker Compose

```bash
cd docker
docker-compose up
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### Development with Docker

Mount local directories for live reload:

```yaml
# In docker-compose.yml
volumes:
  - ../backend:/app
  - ../ui/src:/app/src
```

## Resources

- [FlooNoC Documentation](https://github.com/pulp-platform/FlooNoC)
- [React Documentation](https://react.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Vite Documentation](https://vitejs.dev/)
- [JSON Schema](https://json-schema.org/)

## Getting Help

- Open an issue using the templates in `.github/ISSUE_TEMPLATE/`
- Check existing issues and PRs
- Read the specification in `docs/SPEC.md`
