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
  sourcePort?: { x: number; y: number };
  targetPort?: { x: number; y: number };
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
const MIN_ROUTER_WIDTH = 200; // Minimum width for NoC routers
const ROUTER_HEIGHT = 60;
const ROUTER_PADDING = 40; // Padding around child nodes

/**
 * Build a graph of connections to determine parent-child relationships
 */
function buildConnectionGraph(
  connections: Connection[],
  chimneyToEndpoint: Map<string, Endpoint>,
  nodeIds: Set<string>
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  connections.forEach((conn) => {
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
      if (!graph.has(fromId)) {
        graph.set(fromId, new Set());
      }
      graph.get(fromId)!.add(toId);
    }
  });

  return graph;
}

/**
 * Calculate router widths based on the span of their children
 * This is done after ELK layout to use the actual child positions
 */
function calculateDynamicRouterWidths(
  layouted: ElkNode,
  connectionGraph: Map<string, Set<string>>,
  routerIds: Set<string>
): Map<string, number> {
  const routerWidths = new Map<string, number>();

  if (!layouted.children) return routerWidths;

  // Create a map of node positions
  const nodePositions = new Map<string, { x: number; width: number }>();
  layouted.children.forEach((child) => {
    nodePositions.set(child.id, {
      x: child.x || 0,
      width: child.width || BLOCK_WIDTH,
    });
  });

  // Calculate width for each router based on children span
  routerIds.forEach((routerId) => {
    const children = connectionGraph.get(routerId);
    
    if (!children || children.size === 0) {
      // No children, use minimum width
      routerWidths.set(routerId, MIN_ROUTER_WIDTH);
      return;
    }

    // Find the span of all children
    let minX = Infinity;
    let maxX = -Infinity;

    children.forEach((childId) => {
      const childPos = nodePositions.get(childId);
      if (childPos) {
        minX = Math.min(minX, childPos.x);
        maxX = Math.max(maxX, childPos.x + childPos.width);
      }
    });

    if (minX !== Infinity && maxX !== -Infinity) {
      // Width should span all children plus padding
      const spanWidth = maxX - minX + 2 * ROUTER_PADDING;
      routerWidths.set(routerId, Math.max(spanWidth, MIN_ROUTER_WIDTH));
    } else {
      routerWidths.set(routerId, MIN_ROUTER_WIDTH);
    }
  });

  return routerWidths;
}

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

  // Add routers (initial width, will be recalculated later)
  const routerIds = new Set(routers.map(r => r.name));
  routers.forEach((router) => {
    elkNodes.push({
      id: router.name,
      width: MIN_ROUTER_WIDTH,
      height: ROUTER_HEIGHT,
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

  // Build connection graph for dynamic width calculation
  const connectionGraph = buildConnectionGraph(connections, chimneyToEndpoint, nodeIds);

  // Calculate dynamic router widths based on child node positions
  const routerWidths = calculateDynamicRouterWidths(layouted, connectionGraph, routerIds);

  // Extract positioned nodes with dynamic widths for routers
  const nodes: LayoutNode[] = [];
  const nodeMap = new Map<string, LayoutNode>();
  
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

      // Use dynamic width for routers
      let nodeWidth = child.width || BLOCK_WIDTH;
      if (type === 'router' && routerWidths.has(child.id)) {
        nodeWidth = routerWidths.get(child.id)!;
      }
      
      const node: LayoutNode = {
        id: child.id,
        label: child.id,
        type,
        x: child.x || 0,
        y: child.y || 0,
        width: nodeWidth,
        height: child.height || (type === 'router' ? ROUTER_HEIGHT : BLOCK_HEIGHT),
      };

      nodes.push(node);
      nodeMap.set(node.id, node);
    });
  }

  // Calculate optimal port positions for each edge
  const calculatePortPosition = (
    sourceNode: LayoutNode,
    targetNode: LayoutNode,
    isSource: boolean
  ): { x: number; y: number } => {
    if (isSource) {
      // Source port is at the bottom of the source node
      // Calculate horizontal position based on target alignment
      const targetCenterX = targetNode.x + targetNode.width / 2;
      const sourceLeftX = sourceNode.x;
      const sourceRightX = sourceNode.x + sourceNode.width;

      // Clamp target position to source node bounds for straighter lines
      let portX = targetCenterX;
      if (targetCenterX < sourceLeftX) {
        portX = sourceLeftX;
      } else if (targetCenterX > sourceRightX) {
        portX = sourceRightX;
      }

      return {
        x: portX,
        y: sourceNode.y + sourceNode.height,
      };
    } else {
      // Target port is at the top of the target node
      // Calculate horizontal position based on source alignment
      const sourceCenterX = sourceNode.x + sourceNode.width / 2;
      const targetLeftX = targetNode.x;
      const targetRightX = targetNode.x + targetNode.width;

      // Clamp source position to target node bounds for straighter lines
      let portX = sourceCenterX;
      if (sourceCenterX < targetLeftX) {
        portX = targetLeftX;
      } else if (sourceCenterX > targetRightX) {
        portX = targetRightX;
      }

      return {
        x: portX,
        y: targetNode.y,
      };
    }
  };

  // Extract edges with routing points and port positions
  const edges: LayoutEdge[] = [];
  
  if (layouted.edges) {
    layouted.edges.forEach((edge) => {
      const sourceNode = nodeMap.get(edge.sources?.[0] || '');
      const targetNode = nodeMap.get(edge.targets?.[0] || '');

      const points = edge.sections?.[0]?.bendPoints?.map(bp => ({ x: bp.x, y: bp.y }));
      
      const edgeData: LayoutEdge = {
        id: edge.id,
        source: edge.sources?.[0] || '',
        target: edge.targets?.[0] || '',
        points,
      };

      // Calculate port positions for straighter connections
      if (sourceNode && targetNode) {
        edgeData.sourcePort = calculatePortPosition(sourceNode, targetNode, true);
        edgeData.targetPort = calculatePortPosition(sourceNode, targetNode, false);
      }

      edges.push(edgeData);
    });
  }

  // Calculate total dimensions
  const width = (layouted.width || 800) + 80; // Add padding
  const height = (layouted.height || 600) + 80;

  return { nodes, edges, width, height };
}
