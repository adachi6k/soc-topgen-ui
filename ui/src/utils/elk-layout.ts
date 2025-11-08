/**
 * ELK Layout Integration
 * Automatic graph layout using ELK.js with orthogonal edge routing
 */

import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import { Endpoint, Router, Connection } from '../types/config';

export interface LayoutNode {
  id: string;
  label: string;
  type: 'master' | 'slave' | 'router';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  points?: Array<{ x: number; y: number }>;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

const elk = new ELK();

const BLOCK_WIDTH = 140;
const BLOCK_HEIGHT = 60;

/**
 * Compute automatic layout for topology graph using ELK.js
 * 
 * @param endpoints Array of endpoint configurations
 * @param routers Array of router configurations
 * @param connections Array of connection configurations
 * @returns Layout result with positioned nodes and edges
 */
export async function computeElkLayout(
  endpoints: Endpoint[],
  routers: Router[],
  connections: Connection[]
): Promise<LayoutResult> {
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

  // Create ELK nodes
  const elkNodes: ElkNode[] = [];
  
  // Add masters
  masters.forEach((master) => {
    elkNodes.push({
      id: master.name,
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      labels: [{ text: master.name }],
      // @ts-expect-error - custom property for layer assignment
      properties: { layer: 0 },
    });
  });

  // Add routers
  routers.forEach((router) => {
    elkNodes.push({
      id: router.name,
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      labels: [{ text: router.name }],
      // @ts-expect-error - custom property for layer assignment
      properties: { layer: 1 },
    });
  });

  // Add slaves
  slaves.forEach((slave) => {
    elkNodes.push({
      id: slave.name,
      width: BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      labels: [{ text: slave.name }],
      // @ts-expect-error - custom property for layer assignment
      properties: { layer: 2 },
    });
  });

  // Create ELK edges
  const elkEdges: ElkExtendedEdge[] = [];
  const nodeIds = new Set(elkNodes.map(n => n.id));
  
  connections.forEach((conn, index) => {
    let fromId = conn.from;
    let toId = conn.to;

    // Map chimney names to their parent endpoints
    if (!nodeIds.has(fromId)) {
      const endpoint = chimneyToEndpoint.get(conn.from);
      if (endpoint) fromId = endpoint.name;
    }
    if (!nodeIds.has(toId)) {
      const endpoint = chimneyToEndpoint.get(conn.to);
      if (endpoint) toId = endpoint.name;
    }

    if (nodeIds.has(fromId) && nodeIds.has(toId)) {
      elkEdges.push({
        id: `edge_${index}`,
        sources: [fromId],
        targets: [toId],
      });
    }
  });

  // Define ELK graph
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.spacing.nodeNode': '50',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.considerModelOrder.strategy': 'PREFER_EDGES',
      'elk.padding': '[top=40,left=40,bottom=40,right=40]',
    },
    children: elkNodes,
    edges: elkEdges,
  };

  // Compute layout
  const layouted = await elk.layout(graph);

  // Extract positioned nodes
  const nodes: LayoutNode[] = [];
  
  if (layouted.children) {
    layouted.children.forEach((child) => {
      const endpoint = endpoints.find(ep => ep.name === child.id);
      const router = routers.find(r => r.name === child.id);
      
      let type: 'master' | 'slave' | 'router' = 'router';
      if (endpoint) {
        type = endpoint.type;
      } else if (router) {
        type = 'router';
      }
      
      nodes.push({
        id: child.id,
        label: child.id,
        type,
        x: child.x || 0,
        y: child.y || 0,
        width: child.width || BLOCK_WIDTH,
        height: child.height || BLOCK_HEIGHT,
      });
    });
  }

  // Extract edges with routing points
  const edges: LayoutEdge[] = [];
  
  if (layouted.edges) {
    layouted.edges.forEach((edge) => {
      const points = edge.sections?.[0]?.bendPoints?.map(bp => ({ x: bp.x, y: bp.y }));
      
      edges.push({
        id: edge.id,
        source: edge.sources?.[0] || '',
        target: edge.targets?.[0] || '',
        points,
      });
    });
  }

  // Calculate total dimensions
  const width = (layouted.width || 800) + 80; // Add padding
  const height = (layouted.height || 600) + 80;

  return { nodes, edges, width, height };
}
