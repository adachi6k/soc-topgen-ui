# soc-topgen-ui

Browser-based SoC Top RTL Generator UI with FlooNoC/floogen Integration

## Overview

`soc-topgen-ui` is a web-based tool for configuring AXI-based System-on-Chip (SoC) architectures and generating RTL (Register Transfer Level) code using [FlooNoC](https://github.com/pulp-platform/FlooNoC)'s `floogen` tool. It provides an intuitive graphical interface for defining protocols, endpoints, routers, and connections, with real-time validation and automatic SystemVerilog generation.

## Features

- 🎨 **Visual Configuration Editor**: Edit protocols, endpoints, routers, and connections through a web interface
- ✅ **Real-time Validation**: JSON Schema-based validation with semantic checks
- 🔄 **Automatic RTL Generation**: Generate SystemVerilog files using floogen
- 📦 **Easy Export**: Download generated RTL as ZIP files
- 🐳 **Docker Support**: Containerized deployment with Docker Compose
- 🔒 **Type-Safe**: TypeScript frontend with comprehensive type definitions
- 🎯 **Complex Topologies**: Support for multi-layer interconnects, bridges, and subsystems
- 🔵 **Connection Types**: Visualize coherent, non-coherent, and AXI connections with color coding
- ↔️ **Bidirectional Connections**: Model buses and caches with bidirectional arrows
- 📊 **Interactive Diagrams**: Drag, zoom, and pan topology visualizations

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser   │─────▶│ Flask API    │─────▶│   floogen    │
│   (React)   │◀─────│  (Python)    │◀─────│   Runner     │
└─────────────┘      └──────────────┘      └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Generated   │
                     │  RTL (ZIP)   │
                     └──────────────┘
```

## Project Structure

```
soc-topgen-ui/
├── README.md                          # This file
├── docs/
│   ├── SPEC.md                        # Detailed specification
│   └── schema/
│       └── floonoc_config.schema.json # JSON Schema for validation
├── ui/                                # React frontend
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx                    # Main application
│   │   ├── components/                # React components
│   │   ├── pages/                     # Page components
│   │   ├── api/                       # API client
│   │   └── utils/                     # Utility functions
│   └── public/
├── backend/                           # Flask backend
│   ├── app.py                         # Flask entrypoint
│   ├── requirements.txt               # Python dependencies
│   ├── floogen_runner.py              # floogen execution wrapper
│   ├── validators/
│   │   └── config_validator.py        # Configuration validation
│   └── templates/
│       └── default.yml                # Default configuration template
├── examples/                          # Example configurations
│   ├── minimal.yml                    # Minimal example
│   └── multi_slave.yml                # Multi-slave example
├── docker/                            # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
└── .github/
    ├── workflows/
    │   └── ci.yml                     # CI/CD pipeline
    └── ISSUE_TEMPLATE/                # Issue templates
```

## Quick Start

### GitHub Pages Demo

🌐 **Try it online**: [https://adachi6k.github.io/soc-topgen-ui/](https://adachi6k.github.io/soc-topgen-ui/)

The GitHub Pages deployment provides:
- Configuration editor with syntax highlighting
- Real-time validation using JSON Schema
- Example configurations

**Note**: RTL generation requires running the backend locally. See [GitHub Pages Deployment Guide](./docs/GITHUB_PAGES.md) for details.

### Prerequisites

- **Backend**: Python 3.10+, floogen (from FlooNoC)
- **Frontend**: Node.js 20+
- **Optional**: Docker & Docker Compose

### Local Development

#### Backend

```bash
cd backend
pip install -r requirements.txt
# Note: Install floogen separately from FlooNoC repository
python app.py
# Server runs on http://localhost:5000
```

#### Frontend

```bash
cd ui
npm install
npm run dev
# Server runs on http://localhost:3000
```

### Docker Deployment

```bash
cd docker
docker-compose up
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/schemas/current` | Get JSON Schema |
| POST | `/api/validate` | Validate configuration |
| POST | `/api/generate` | Generate RTL |
| GET | `/api/jobs/:id` | Get job status |
| GET | `/api/jobs/:id/download` | Download generated RTL |

## Configuration Example

```yaml
protocols:
  axi: { data_width: 64, addr_width: 32, id_width: 6 }

endpoints:
  - name: m0
    type: master
    protocol: axi
    chimneys: [{ name: m0_ch }]
  
  - name: s0
    type: slave
    protocol: axi
    addr_range: [0x80000000, 0x8000ffff]
    chimneys: [{ name: s0_ch }]

routers:
  - name: r0
    pos: [0, 0]

connections:
  - { from: m0_ch, to: r0 }
  - { from: r0, to: s0_ch }

routing:
  mode: deterministic

top:
  name: soc_top
  export_axi: [m0, s0]
```

See [examples/](./examples/) for more examples.

## Development Roadmap

### Phase 1: Foundation (v0.1)
- [x] Directory structure setup
- [x] JSON Schema definition
- [x] Example YAML files
- [ ] Backend API implementation
- [ ] Frontend prototype

### Phase 2: Core Features (v0.2)
- [ ] Configuration editor UI
- [ ] Real-time validation
- [ ] RTL generation integration
- [ ] Download functionality

### Phase 3: Enhancement (v0.3)
- [ ] Visual NoC topology viewer
- [ ] Configuration history
- [ ] Advanced validation rules
- [ ] Documentation improvements

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See `.github/ISSUE_TEMPLATE/` for issue templates.

## License

This project is licensed under the Apache-2.0 License - see the LICENSE file for details.

Generated RTL files will include appropriate license headers.

## Acknowledgments

- [FlooNoC](https://github.com/pulp-platform/FlooNoC) - Network-on-Chip generator
- [PULP Platform](https://pulp-platform.org/) - Open-source hardware platform

## Documentation

- 📖 [Detailed Specification](./docs/SPEC.md)
- 🚀 [GitHub Pages Deployment Guide](./docs/GITHUB_PAGES.md)
- 🎨 [Complex Block Diagram Features](./docs/COMPLEX_DIAGRAMS.md)
- 💡 [Example Configurations](./examples/README.md)
- 🛠️ [Development Guide](./docs/DEVELOPMENT.md) (if exists)

For detailed specification, see [docs/SPEC.md](./docs/SPEC.md).

For complex diagram features, see [docs/COMPLEX_DIAGRAMS.md](./docs/COMPLEX_DIAGRAMS.md).

## Support

For issues and questions:
- 🐛 Bug reports: Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- 💡 Feature requests: Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- 📖 Documentation: Check [docs/](./docs/) directory