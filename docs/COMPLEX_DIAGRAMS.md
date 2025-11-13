# Complex Block Diagram Features

This document describes the new features added to support complex block diagrams similar to enterprise-grade SoC architectures (like Arteris FlexNoC systems).

## Overview

The topology visualization now supports advanced features for modeling complex System-on-Chip (SoC) architectures with multiple subsystems, various interconnect types, and different connection protocols.

## New Features

### 1. Router Types

In addition to standard NoC routers, the system now supports:

- **Interconnect**: Wide horizontal bus structures for connecting multiple subsystems
- **Bridge**: Smaller routing elements for protocol conversion and traffic management
- **NoC**: Standard Network-on-Chip routers

**Visual Distinction:**
- NoC Routers: Orange (#f57c00)
- Interconnects: Purple (#7b1fa2)
- Bridges: Pink (#c2185b)

**Configuration Example:**
```yaml
routers:
  - name: main_interconnect
    pos: [2, 1]
    type: interconnect      # Options: noc, interconnect, bridge
    width: 480              # Custom width (default varies by type)
    height: 80              # Custom height (default: 44)
    description: "Main System Interconnect"
```

### 2. Connection Types

Connections can now be typed to represent different protocols and coherency models:

- **coherent**: Cache-coherent connections (blue)
- **non-coherent**: Non-coherent memory connections (orange)
- **axi**: AXI protocol connections (green)
- **default**: Standard connections (gray)

**Visual Styling:**
Each connection type uses a distinct color with matching arrow markers for easy identification.

**Configuration Example:**
```yaml
connections:
  - from: cpu_ch
    to: l2_cache
    type: coherent          # Blue arrow
    
  - from: dma_ch
    to: memory_ctrl
    type: non-coherent      # Orange arrow
    
  - from: periph_master
    to: periph_interconnect
    type: axi               # Green arrow
```

### 3. Bidirectional Connections

Bus structures and cache coherency often require bidirectional data flow. Connections can now be marked as bidirectional, which renders arrows on both ends.

**Configuration Example:**
```yaml
connections:
  - from: cpu_cluster
    to: l2_cache
    bidirectional: true     # Purple arrows on both ends
    type: coherent
```

### 4. Subsystem Grouping

Endpoints can be logically grouped into subsystems for better organization:

**Configuration Example:**
```yaml
endpoints:
  - name: cpu0
    type: master
    protocol: axi
    subsystem: "CPU Cluster"       # Logical grouping
    description: "Primary CPU Core"
    
  - name: cpu1
    type: master
    protocol: axi
    subsystem: "CPU Cluster"       # Same subsystem
    description: "Secondary CPU Core"
```

### 5. Custom Dimensions

Routers and interconnects can specify custom dimensions:

**Configuration Example:**
```yaml
routers:
  - name: wide_interconnect
    type: interconnect
    width: 600              # Custom width in pixels
    height: 100             # Custom height in pixels
```

**Default Dimensions:**
- Standard endpoints: 140 × 44 px
- NoC routers: Calculated based on connections
- Interconnects: 360-480 px wide (or larger based on span)
- Bridges: 120 × 44 px

### 6. Chimney Direction

Chimneys (connection ports) can specify their direction:

**Configuration Example:**
```yaml
endpoints:
  - name: memory_controller
    chimneys:
      - name: mem_ctrl_in
        direction: input          # Options: input, output, bidirectional
      - name: mem_ctrl_out
        direction: output
```

### 7. Custom Colors

Both endpoints and routers support custom colors:

**Configuration Example:**
```yaml
endpoints:
  - name: special_accelerator
    type: master
    color: "#9c27b0"              # Custom purple color
    
routers:
  - name: custom_bridge
    type: bridge
    color: "#00bcd4"              # Custom cyan color
```

## Visual Legend

The topology canvas now displays a comprehensive legend with two sections:

### Node Types
- 🔵 Master Endpoints (Blue)
- 🟠 NoC Routers (Orange)
- 🟣 Interconnects (Purple)
- 🌸 Bridges (Pink)
- 🟢 Slave Endpoints (Green)

### Connection Types
- 🔵 Coherent (Blue line)
- 🟠 Non-coherent (Orange line)
- 🟢 AXI (Green line)
- 🟣 Bidirectional (Purple line with arrows on both ends)
- ⚫ Default (Gray line)

## Example Configurations

### 1. Multi-Core SoC (`multicore_soc.yml`)

A realistic multi-core system featuring:
- 3 CPU cores connected to a CPU cluster interconnect
- Shared L2 cache with coherent connections
- 2 DDR memory controllers
- 3 peripheral devices (UART, GPIO, SPI)
- Hierarchical interconnect structure

**Key Features Demonstrated:**
- Multiple master endpoints
- Hierarchical interconnect topology
- Cache coherency modeling
- Peripheral bus separation

### 2. Complex Subsystem (`complex_subsystem.yml`)

An enterprise-grade architecture similar to Arteris FlexNoC systems:
- Multiple design-specific subsystems
- Safety-critical subsystem isolation
- Coherent and non-coherent interconnects
- FlexNoC-style bridges
- Memory subsystem with controllers
- I/O peripheral subsystem
- Arm Cortex-R52 integration

**Key Features Demonstrated:**
- Subsystem grouping
- Mixed coherent/non-coherent traffic
- Bridge-based routing
- Complex interconnect topologies
- Bidirectional connections

## Usage Tips

### 1. Designing Complex Topologies

Start with a hierarchical mindset:
1. Define your major subsystems (CPU cluster, memory, peripherals)
2. Create interconnects for each subsystem
3. Add bridges to connect between subsystems
4. Specify connection types based on coherency requirements

### 2. Color Coding

Use connection types to visualize traffic patterns:
- Coherent (blue) for CPU-cache-memory paths
- Non-coherent (orange) for DMA and peripheral access
- AXI (green) for standard peripheral connections
- Bidirectional (purple) for cache and memory interfaces

### 3. Layout Optimization

For better visual results:
- Position interconnects at middle layers
- Group related endpoints by subsystem
- Use bridges to manage layer transitions
- Specify custom widths for wide buses

### 4. Interactive Features

The topology canvas supports:
- **Drag nodes** to reposition
- **Mouse wheel** to zoom in/out
- **Pan** by dragging the canvas background
- **Press 'F'** to fit the entire diagram to view
- **Hover** over nodes and connections for detailed information

## Backward Compatibility

All existing configurations continue to work. New features are optional:
- Connections without `type` use default styling
- Routers without `type` default to standard NoC routers
- All new fields are optional

## Future Enhancements

Potential future additions:
- Hierarchical block grouping with visual containers
- Multi-protocol support per connection
- Port-level connection specification
- Traffic flow animation
- Performance metrics overlay
- Auto-layout modes for specific topologies

## References

For more information:
- See `examples/multicore_soc.yml` for multi-core system example
- See `examples/complex_subsystem.yml` for enterprise architecture
- See `examples/README.md` for quick reference guide
- See main `README.md` for project overview

## Feedback

These features were developed based on the requirement to support complex block diagrams similar to the Arteris architecture diagram. Please provide feedback on:
- Visual clarity and color choices
- Missing features needed for your use cases
- Layout algorithm improvements
- Additional examples needed
