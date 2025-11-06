# Backend API

Flask-based backend for soc-topgen-ui that provides REST API for configuration validation and RTL generation.

## Setup

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Install floogen

The backend requires the `floogen` tool from FlooNoC. Install it from the FlooNoC repository:

```bash
git clone https://github.com/pulp-platform/FlooNoC.git
cd FlooNoC
pip install .
```

## Running the Server

### Development Mode

```bash
python app.py
```

The server will start on `http://localhost:5000` with debug mode enabled.

### Production Mode

```bash
export FLASK_ENV=production
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### Health Check
```bash
GET /api/health
```

### Get JSON Schema
```bash
GET /api/schemas/current
```

### Validate Configuration
```bash
POST /api/validate
Content-Type: application/json

{
  "config": "yaml string or object"
}
```

### Generate RTL
```bash
POST /api/generate
Content-Type: application/json

{
  "config": "yaml string or object",
  "job_id": "optional-job-id"
}
```

### Get Job Status
```bash
GET /api/jobs/:job_id
```

### Download Generated RTL
```bash
GET /api/jobs/:job_id/download
```

## Project Structure

```
backend/
├── app.py                    # Flask application entry point
├── floogen_runner.py         # floogen execution wrapper
├── requirements.txt          # Python dependencies
├── validators/
│   └── config_validator.py   # Configuration validation logic
└── templates/
    └── default.yml           # Default configuration template
```

## Configuration Validation

The validator performs two types of checks:

1. **JSON Schema Validation**: Ensures the configuration follows the correct structure
2. **Semantic Validation**: 
   - Protocol references are valid
   - No duplicate names (endpoints, routers, chimneys)
   - Address ranges don't overlap
   - Connections reference existing nodes
   - Slave endpoints have address ranges

## Testing

```bash
# Test validation
python3 << 'EOF'
from validators.config_validator import ConfigValidator
import yaml

validator = ConfigValidator('../docs/schema/floonoc_config.schema.json')

with open('../examples/minimal.yml') as f:
    config = yaml.safe_load(f)

is_valid, errors = validator.validate(config)
print(f"Valid: {is_valid}")
if errors:
    for error in errors:
        print(f"  - {error}")
EOF
```

## Docker

Build and run using Docker:

```bash
cd ..
docker build -f docker/Dockerfile.backend -t soc-topgen-backend .
docker run -p 5000:5000 soc-topgen-backend
```

Or use docker-compose:

```bash
cd docker
docker-compose up backend
```
