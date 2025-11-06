# FlooNoC Configuration Examples

This directory contains example YAML configurations for the FlooNoC SoC generator.

## Available Examples

### minimal.yml
A minimal configuration with:
- 1 master endpoint
- 1 slave endpoint
- 1 router
- Simple point-to-point connections

This is the simplest possible configuration to get started.

### multi_slave.yml
A more complex configuration with:
- 1 master (CPU)
- 3 slaves (RAM0, RAM1, Peripheral)
- 3 routers forming a mesh
- Multiple address ranges

This demonstrates address range mapping and multi-hop routing.

## Using These Examples

### Via API
```bash
curl -X POST http://localhost:5000/api/validate \
  -H "Content-Type: application/json" \
  -d @<(echo "{\"config\": \"$(cat minimal.yml)\"}")
```

### Via Python
```python
from validators.config_validator import ConfigValidator
import yaml

validator = ConfigValidator('docs/schema/floonoc_config.schema.json')

with open('examples/minimal.yml') as f:
    config = yaml.safe_load(f)

is_valid, errors = validator.validate(config)
print(f"Valid: {is_valid}")
if errors:
    for error in errors:
        print(f"  - {error}")
```

## Creating Your Own Configuration

1. Start with `minimal.yml` or use `backend/templates/default.yml`
2. Add your protocols with desired widths
3. Define your endpoints (masters and slaves)
4. Create routers at specific positions
5. Connect endpoints to routers
6. Specify routing mode
7. Configure top-level exports

See `docs/SPEC.md` for detailed specification.

## Address Range Guidelines

- Ensure no overlapping address ranges between slaves
- Use hex notation: `0x80000000` or decimal
- End address must be greater than start address
- Common ranges:
  - RAM: `0x80000000 - 0x8fffffff`
  - Peripherals: `0x40000000 - 0x4fffffff`
  - ROM: `0x00000000 - 0x0fffffff`
