/**
 * TopologyDiagram Component
 * Visual representation of NoC topology showing block connections
 */

import React, { useMemo } from 'react';
import { Endpoint, Router, Connection } from '../types/config';

interface TopologyDiagramProps {
  endpoints: Endpoint[];
  routers: Router[];
  connections: Connection[];
}

interface BlockNode {
  id: string;
  label: string;
  type: 'master' | 'slave' | 'router';
  x: number;
  y: number;
  width: number;
  height: number;
}

const BLOCK_WIDTH = 140;
const BLOCK_HEIGHT = 60;
const ROUTER_WIDTH = 480; // Wider aspect ratio for NoC routers to minimize arrow bends
const ROUTER_HEIGHT = 60;
const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 20;
const MARGIN = 40;

const TopologyDiagram: React.FC<TopologyDiagramProps> = ({
  endpoints,
  routers,
  connections,
}) => {
  const { blocks, links, svgWidth, svgHeight } = useMemo(() => {
    // Separate endpoints into masters and slaves
    const masters = endpoints.filter((ep) => ep.type === 'master');
    const slaves = endpoints.filter((ep) => ep.type === 'slave');

    // Create a map of chimney names to their parent endpoint
    const chimneyToEndpoint = new Map<string, Endpoint>();
    endpoints.forEach((ep) => {
      ep.chimneys?.forEach((ch) => {
        chimneyToEndpoint.set(ch.name, ep);
      });
    });

    // Calculate layout
    const maxWidth = Math.max(masters.length, routers.length, slaves.length);
    const maxRouterWidth = routers.length * ROUTER_WIDTH + (routers.length - 1) * HORIZONTAL_SPACING;
    const maxEndpointWidth = maxWidth * BLOCK_WIDTH + (maxWidth - 1) * HORIZONTAL_SPACING;
    const totalWidth = Math.max(maxRouterWidth, maxEndpointWidth) + 2 * MARGIN;
    const totalHeight = 3 * BLOCK_HEIGHT + 2 * VERTICAL_SPACING + 2 * MARGIN;

    const blocks: BlockNode[] = [];

    // Position masters at the top
    masters.forEach((master, i) => {
      const x = MARGIN + i * (BLOCK_WIDTH + HORIZONTAL_SPACING);
      blocks.push({
        id: master.name,
        label: master.name,
        type: 'master',
        x,
        y: MARGIN,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
      });
    });

    // Position routers in the middle
    routers.forEach((router, i) => {
      const x = MARGIN + i * (ROUTER_WIDTH + HORIZONTAL_SPACING);
      blocks.push({
        id: router.name,
        label: router.name,
        type: 'router',
        x,
        y: MARGIN + BLOCK_HEIGHT + VERTICAL_SPACING,
        width: ROUTER_WIDTH,
        height: ROUTER_HEIGHT,
      });
    });

    // Position slaves at the bottom
    slaves.forEach((slave, i) => {
      const x = MARGIN + i * (BLOCK_WIDTH + HORIZONTAL_SPACING);
      blocks.push({
        id: slave.name,
        label: slave.name,
        type: 'slave',
        x,
        y: MARGIN + 2 * (BLOCK_HEIGHT + VERTICAL_SPACING),
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
      });
    });

    // Create block lookup map
    const blockMap = new Map<string, BlockNode>();
    blocks.forEach((block) => blockMap.set(block.id, block));

    // Create links from connections
    const links: Array<{ from: BlockNode; to: BlockNode }> = [];
    connections.forEach((conn) => {
      // Map chimney names to their parent endpoints or use router names directly
      let fromBlock = blockMap.get(conn.from);
      let toBlock = blockMap.get(conn.to);

      // If not found, check if it's a chimney name
      if (!fromBlock) {
        const endpoint = chimneyToEndpoint.get(conn.from);
        if (endpoint) {
          fromBlock = blockMap.get(endpoint.name);
        }
      }
      if (!toBlock) {
        const endpoint = chimneyToEndpoint.get(conn.to);
        if (endpoint) {
          toBlock = blockMap.get(endpoint.name);
        }
      }

      if (fromBlock && toBlock) {
        links.push({ from: fromBlock, to: toBlock });
      }
    });

    return {
      blocks,
      links,
      svgWidth: totalWidth,
      svgHeight: totalHeight,
    };
  }, [endpoints, routers, connections]);

  const getBlockColor = (type: 'master' | 'slave' | 'router'): string => {
    switch (type) {
      case 'master':
        return '#1976d2'; // Blue for masters
      case 'slave':
        return '#388e3c'; // Green for slaves
      case 'router':
        return '#f57c00'; // Orange for routers
      default:
        return '#757575'; // Gray default
    }
  };

  const getBlockTypeLabel = (type: 'master' | 'slave' | 'router'): string => {
    switch (type) {
      case 'master':
        return 'Master';
      case 'slave':
        return 'Slave';
      case 'router':
        return 'NoC';
      default:
        return '';
    }
  };

  const renderArrowMarker = () => (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="10"
        refX="9"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 10 3, 0 6" fill="#666" />
      </marker>
    </defs>
  );

  const renderBlock = (block: BlockNode) => {
    const color = getBlockColor(block.type);
    const typeLabel = getBlockTypeLabel(block.type);

    return (
      <g key={block.id}>
        <rect
          x={block.x}
          y={block.y}
          width={block.width}
          height={block.height}
          fill={color}
          stroke="#333"
          strokeWidth="2"
          rx="4"
        />
        <text
          x={block.x + block.width / 2}
          y={block.y + block.height / 2 - 8}
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
        >
          {typeLabel}
        </text>
        <text
          x={block.x + block.width / 2}
          y={block.y + block.height / 2 + 10}
          textAnchor="middle"
          fill="white"
          fontSize="12"
        >
          {block.label}
        </text>
      </g>
    );
  };

  const renderLink = (link: { from: BlockNode; to: BlockNode }, index: number) => {
    const fromX = link.from.x + link.from.width / 2;
    const fromY = link.from.y + link.from.height;
    const toX = link.to.x + link.to.width / 2;
    const toY = link.to.y;

    return (
      <line
        key={`link-${index}`}
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="#666"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    );
  };

  if (blocks.length === 0) {
    return (
      <div className="topology-diagram-empty">
        <p>No topology to display. Add endpoints and routers to see the diagram.</p>
      </div>
    );
  }

  return (
    <div className="topology-diagram">
      <h3>Topology Diagram</h3>
      <div className="topology-diagram-container">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="topology-svg"
        >
          {renderArrowMarker()}
          {links.map((link, index) => renderLink(link, index))}
          {blocks.map((block) => renderBlock(block))}
        </svg>
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

export default TopologyDiagram;
