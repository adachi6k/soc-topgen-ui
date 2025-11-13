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

### multicore_soc.yml
Multi-core CPU system with memory hierarchy:
- 3 CPU cores with shared L2 cache
- 2 DDR memory controllers
- Multiple peripheral devices (UART, GPIO, SPI)
- Hierarchical interconnect structure
- Demonstrates coherent cache systems and peripheral buses

This example shows how to model a realistic multi-core SoC with cache hierarchy.

### complex_subsystem.yml
Complex subsystem architecture similar to Arteris FlexNoC:
- Multiple design-specific subsystems
- Safety-critical subsystem
- Coherent and non-coherent interconnects
- FlexNoC bridges for routing
- Memory subsystem with DDR controllers
- I/O peripheral subsystem
- Arm Cortex-R52 integration
- Bidirectional connections
- Typed connections (coherent/non-coherent/AXI)

This is the most complex example, demonstrating advanced features for enterprise-grade SoC designs.

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

### Advanced Features

**Connection Types**: Specify connection types for different interconnect protocols
```yaml
connections:
  - from: cpu_ch
    to: interconnect
    type: coherent        # Options: coherent, non-coherent, axi, default
```

**Bidirectional Connections**: Model buses with bidirectional data flow
```yaml
connections:
  - from: cache
    to: memory
    bidirectional: true   # Renders with arrows on both ends
```

**Router Types**: Use different router/interconnect types
```yaml
routers:
  - name: main_bus
    pos: [2, 1]
    type: interconnect    # Options: noc, interconnect, bridge
    width: 480            # Custom width
    height: 80            # Custom height
```

**Subsystems**: Group related components logically
```yaml
endpoints:
  - name: cpu0
    subsystem: "CPU Cluster"
    description: "Primary CPU Core"
```

See `docs/SPEC.md` for detailed specification.

## Address Range Guidelines

- Ensure no overlapping address ranges between slaves
- Use hex notation: `0x80000000` or decimal
- End address must be greater than start address
- Common ranges:
  - RAM: `0x80000000 - 0x8fffffff`
  - Peripherals: `0x40000000 - 0x4fffffff`
  - ROM: `0x00000000 - 0x0fffffff`
