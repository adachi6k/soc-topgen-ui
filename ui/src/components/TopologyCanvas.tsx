/**
 * TopologyCanvas Component
 * Interactive D3-based topology diagram with orthogonal routing
 * Features:
 * - Orthogonal (Manhattan) edge routing
 * - Drag & drop nodes
 * - Zoom & pan
 * - Hover tooltips
 * - Auto-layout with ELK.js
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Endpoint, Router, Connection } from '../types/config';
import { orthogonalPath } from '../utils/manhattanPath';
import { computeElkLayout, LayoutNode, LayoutEdge } from '../utils/elk-layout';

interface TopologyCanvasProps {
  endpoints: Endpoint[];
  routers: Router[];
  connections: Connection[];
}

interface D3Node extends LayoutNode {
  fx?: number | null;
  fy?: number | null;
}

const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  endpoints,
  routers,
  connections,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<D3Node[]>([]);
  const [edges, setEdges] = useState<LayoutEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compute layout when data changes
  useEffect(() => {
    const computeLayout = async () => {
      setIsLoading(true);
      try {
        const layout = await computeElkLayout(endpoints, routers, connections);
        setNodes(layout.nodes);
        setEdges(layout.edges);
      } catch (error) {
        console.error('Layout computation failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (endpoints.length > 0 || routers.length > 0) {
      computeLayout();
    }
  }, [endpoints, routers, connections]);

  // Set up D3 visualization
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0 || isLoading) return;

    const svg = d3.select(svgRef.current);
    
    // Clear previous content
    svg.selectAll('*').remove();

    // Get container dimensions
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = 600;

    // Calculate bounds of the graph
    const graphBounds = {
      minX: Math.min(...nodes.map(n => n.x)) - 50,
      minY: Math.min(...nodes.map(n => n.y)) - 50,
      maxX: Math.max(...nodes.map(n => n.x + n.width)) + 50,
      maxY: Math.max(...nodes.map(n => n.y + n.height)) + 50,
    };
    const graphWidth = graphBounds.maxX - graphBounds.minX;
    const graphHeight = graphBounds.maxY - graphBounds.minY;

    // Set up SVG dimensions
    svg
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    // Create main group for zoom/pan
    const g = svg.append('g').attr('class', 'main-group');

    // Define arrow markers for different connection types
    const defs = svg.append('defs');
    
    // Default arrowhead
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#666');

    // Coherent connection arrowhead (blue)
    defs
      .append('marker')
      .attr('id', 'arrowhead-coherent')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#1976d2');

    // Non-coherent connection arrowhead (orange)
    defs
      .append('marker')
      .attr('id', 'arrowhead-non-coherent')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#f57c00');

    // AXI connection arrowhead (green)
    defs
      .append('marker')
      .attr('id', 'arrowhead-axi')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#388e3c');

    // Bidirectional marker (double-ended)
    defs
      .append('marker')
      .attr('id', 'arrowhead-bidirectional')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#9c27b0');

    // Reverse arrow marker for bidirectional connections
    defs
      .append('marker')
      .attr('id', 'arrowhead-reverse')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 0)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 10 0 L 0 5 L 10 10 z')
      .attr('fill', '#9c27b0');

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as d3.ZoomBehavior<SVGSVGElement, unknown>);

    // Fit to view function
    const fitToView = () => {
      const scale = Math.min(
        containerWidth / graphWidth,
        containerHeight / graphHeight,
        1
      ) * 0.9;

      const translateX = (containerWidth - graphWidth * scale) / 2 - graphBounds.minX * scale;
      const translateY = (containerHeight - graphHeight * scale) / 2 - graphBounds.minY * scale;

      svg
        .transition()
        .duration(750)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .call(zoom.transform as any, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    };

    // Keyboard handler for 'f' key to fit
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'f' || event.key === 'F') {
        fitToView();
      }
    };
    window.addEventListener('keydown', handleKeyPress);

    // Initial fit to view
    fitToView();

    // Helper function to get edge color and style based on connection type
    const getEdgeStyle = (edge: LayoutEdge) => {
      const conn = connections.find(c => 
        (c.from === edge.source || c.from === edge.sourceId) && 
        (c.to === edge.target || c.to === edge.targetId)
      );
      
      if (!conn) {
        return { color: '#666', marker: 'url(#arrowhead)', width: 2 };
      }

      if (conn.bidirectional) {
        return { 
          color: '#9c27b0', 
          marker: 'url(#arrowhead-bidirectional)',
          markerStart: 'url(#arrowhead-reverse)',
          width: 3 
        };
      }

      switch (conn.type) {
        case 'coherent':
          return { color: '#1976d2', marker: 'url(#arrowhead-coherent)', width: 3 };
        case 'non-coherent':
          return { color: '#f57c00', marker: 'url(#arrowhead-non-coherent)', width: 3 };
        case 'axi':
          return { color: '#388e3c', marker: 'url(#arrowhead-axi)', width: 2 };
        default:
          return { color: '#666', marker: 'url(#arrowhead)', width: 2 };
      }
    };

    // Helper function to get node color
    const getNodeColor = (node: LayoutNode): string => {
      // Check if endpoint has custom color
      const endpoint = endpoints.find(ep => ep.name === node.id);
      if (endpoint?.color) return endpoint.color;

      // Check if router has custom color
      const router = routers.find(r => r.name === node.id);
      if (router?.color) return router.color;

      // Default colors based on type
      switch (node.type) {
        case 'master': return '#1976d2';
        case 'slave': return '#388e3c';
        case 'router': return '#f57c00';
        case 'interconnect': return '#7b1fa2';
        case 'bridge': return '#c2185b';
        default: return '#757575';
      }
    };

    // Helper function to get node type label
    const getNodeTypeLabel = (node: LayoutNode): string => {
      const router = routers.find(r => r.name === node.id);
      if (router?.type === 'interconnect') return 'Interconnect';
      if (router?.type === 'bridge') return 'Bridge';
      
      switch (node.type) {
        case 'master': return 'Master';
        case 'slave': return 'Slave';
        case 'router': return 'NoC';
        case 'interconnect': return 'Interconnect';
        case 'bridge': return 'Bridge';
        default: return '';
      }
    };

    // Create edges group (draw first so they appear behind nodes)
    const edgesGroup = g.append('g').attr('class', 'edges');

    // Create nodes group
    const nodesGroup = g.append('g').attr('class', 'nodes');

    // Draw edges with orthogonal routing
    const edgeElements = edgesGroup
      .selectAll<SVGGElement, LayoutEdge>('g.edge')
      .data(edges)
      .enter()
      .append('g')
      .attr('class', 'edge');

    edgeElements
      .append('path')
      .attr('class', 'edge-path')
      .attr('d', (d) => {
        const sourceNode = nodes.find(n => n.id === d.source);
        const targetNode = nodes.find(n => n.id === d.target);
        
        if (!sourceNode || !targetNode) return '';

        // Use port positions if available for straighter connections
        const from = d.sourcePort || {
          x: sourceNode.x + sourceNode.width / 2,
          y: sourceNode.y + sourceNode.height,
        };
        const to = d.targetPort || {
          x: targetNode.x + targetNode.width / 2,
          y: targetNode.y,
        };

        // Use ELK routing points if available
        if (d.points && d.points.length > 0) {
          const path = [`M ${from.x},${from.y}`];
          d.points.forEach(p => {
            path.push(`L ${p.x},${p.y}`);
          });
          path.push(`L ${to.x},${to.y}`);
          return path.join(' ');
        }

        return orthogonalPath(from, to, 'bottom', 'top');
      })
      .attr('fill', 'none')
      .attr('stroke', (d) => getEdgeStyle(d).color)
      .attr('stroke-width', (d) => getEdgeStyle(d).width)
      .attr('marker-end', (d) => getEdgeStyle(d).marker)
      .attr('marker-start', (d) => getEdgeStyle(d).markerStart || 'none')
      .append('title')
      .text((d) => {
        const conn = connections.find(c => 
          (c.from === d.source || c.from === d.sourceId) && 
          (c.to === d.target || c.to === d.targetId)
        );
        const connType = conn?.type || 'default';
        const bidirectional = conn?.bidirectional ? ' (bidirectional)' : '';
        return `${d.source} → ${d.target}\nType: ${connType}${bidirectional}`;
      });

    // Update edges function
    const updateEdges = () => {
      // Group edges by source for proper port distribution
      const edgesBySource = new Map<string, typeof edges[0][]>();
      edges.forEach(edge => {
        if (!edgesBySource.has(edge.source)) {
          edgesBySource.set(edge.source, []);
        }
        edgesBySource.get(edge.source)!.push(edge);
      });
      
      // Sort edges by target position for each source
      edgesBySource.forEach(edgeGroup => {
        edgeGroup.sort((a, b) => {
          const targetA = nodes.find(n => n.id === a.target);
          const targetB = nodes.find(n => n.id === b.target);
          if (!targetA || !targetB) return 0;
          return (targetA.x + targetA.width / 2) - (targetB.x + targetB.width / 2);
        });
      });
      
      edgeElements.select('path').attr('d', (d) => {
        const sourceNode = nodes.find(n => n.id === d.source);
        const targetNode = nodes.find(n => n.id === d.target);
        
        if (!sourceNode || !targetNode) return '';

        // Find this edge's position among edges from the same source
        const sourceEdges = edgesBySource.get(d.source) || [];
        const connIndex = sourceEdges.findIndex(e => e.id === d.id);
        const totalConns = sourceEdges.length;

        // Calculate source port X position based on number of connections
        let sourcePortX: number;
        const sourceCenterX = sourceNode.x + sourceNode.width / 2;
        
        if (totalConns === 1) {
          // Single connection: use center
          sourcePortX = sourceCenterX;
        } else {
          // Multiple connections: distribute evenly across the width
          const segmentWidth = sourceNode.width / totalConns;
          sourcePortX = sourceNode.x + segmentWidth * (connIndex + 0.5);
        }

        // Target port with horizontal alignment to source
        let targetPortX = sourcePortX;
        if (sourcePortX < targetNode.x) {
          targetPortX = targetNode.x;
        } else if (sourcePortX > targetNode.x + targetNode.width) {
          targetPortX = targetNode.x + targetNode.width;
        }

        const from = {
          x: sourcePortX,
          y: sourceNode.y + sourceNode.height,
        };
        const to = {
          x: targetPortX,
          y: targetNode.y,
        };

        return orthogonalPath(from, to, 'bottom', 'top');
      });
    };

    // Set up drag behavior
    const drag = d3.drag<SVGGElement, D3Node>()
      .on('start', function(_event, d) {
        d3.select(this).raise();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function(event, d) {
        d.fx = event.x;
        d.fy = event.y;
        d.x = event.x;
        d.y = event.y;
        
        // Update node position
        d3.select(this).attr('transform', `translate(${d.x}, ${d.y})`);
        
        // Update connected edges
        updateEdges();
      })
      .on('end', function(_event, d) {
        // Keep the position fixed
        d.fx = d.x;
        d.fy = d.y;
      });

    // Draw nodes
    const nodeElements = nodesGroup
      .selectAll<SVGGElement, D3Node>('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .call(drag as d3.DragBehavior<SVGGElement, D3Node, D3Node | d3.SubjectPosition>)
      .style('cursor', 'move');

    // Node rectangle
    nodeElements
      .append('rect')
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height)
      .attr('fill', (d) => getNodeColor(d))
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .attr('rx', 4);

    // Node type label
    nodeElements
      .append('text')
      .attr('x', (d) => d.width / 2)
      .attr('y', (d) => d.height / 2 - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '14')
      .attr('font-weight', 'bold')
      .text((d) => getNodeTypeLabel(d));

    // Node name label
    nodeElements
      .append('text')
      .attr('x', (d) => d.width / 2)
      .attr('y', (d) => d.height / 2 + 10)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12')
      .text((d) => d.label);

    // Node tooltip
    nodeElements
      .append('title')
      .text((d) => {
        const endpoint = endpoints.find(ep => ep.name === d.id);
        if (endpoint) {
          const chimneys = endpoint.chimneys?.map(ch => ch.name).join(', ') || 'none';
          return `Type: ${d.type}\nID: ${d.id}\nProtocol: ${endpoint.protocol}\nChimneys: ${chimneys}`;
        }
        return `Type: ${d.type}\nID: ${d.id}`;
      });

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [nodes, edges, isLoading, endpoints, connections, routers]);

  if (isLoading) {
    return (
      <div className="topology-canvas-loading">
        <p>Computing layout...</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="topology-canvas-empty">
        <p>No topology to display. Add endpoints and routers to see the diagram.</p>
      </div>
    );
  }

  return (
    <div className="topology-canvas">
      <h3>Interactive Topology Diagram</h3>
      <div className="topology-canvas-controls">
        <p className="controls-hint">
          💡 <strong>Drag</strong> nodes to reposition • <strong>Mouse wheel</strong> to zoom • 
          <strong>Drag canvas</strong> to pan • Press <kbd>F</kbd> to fit view
        </p>
      </div>
      <div ref={containerRef} className="topology-canvas-container">
        <svg ref={svgRef} className="topology-svg-canvas"></svg>
      </div>
      <div className="topology-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#1976d2' }}></span>
          <span>Master Endpoints</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f57c00' }}></span>
          <span>NoC Routers</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#388e3c' }}></span>
          <span>Slave Endpoints</span>
        </div>
      </div>
    </div>
  );
};

export default TopologyCanvas;
