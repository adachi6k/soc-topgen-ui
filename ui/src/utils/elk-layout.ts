/**
 * Column Grid Layout for NoC Topology
 * Stable layout algorithm using column-based positioning
 */

import { Endpoint, Router, Connection } from '../types/config';

export interface LayoutNode {
  id: string;
  label: string;
  type: 'master' | 'slave' | 'router';
  x: number;
  y: number;
  width: number;
  height: number;
  colIndex?: number;
  depth?: number;
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

// Layout constants for column grid
const COL_GAP = 160;           // Column spacing
const LEVEL_GAP = 120;         // Layer spacing
const NODE_PADDING = 24;       // Internal node padding
const MIN_WIDTH = 140;         // Minimum node width
const MAX_WIDTH = 720;         // Maximum node width
const NODE_HEIGHT = 44;        // Fixed node height
const CANVAS_PADDING = 48;     // Canvas padding

const BLOCK_WIDTH = 140;

interface HierarchyNode {
  id: string;
  label: string;
  type: 'master' | 'slave' | 'router';
  children: HierarchyNode[];
  parent?: HierarchyNode;
  colIndex?: number;
  minCol?: number;
  maxCol?: number;
  depth: number;
}

/**
 * Build a hierarchy tree from connections
 */
function buildHierarchy(
  endpoints: Endpoint[],
  routers: Router[],
  connections: Connection[]
): HierarchyNode[] {
  // Create a map of chimney names to their parent endpoint
  const chimneyToEndpoint = new Map<string, Endpoint>();
  endpoints.forEach((ep) => {
    ep.chimneys?.forEach((ch) => {
      chimneyToEndpoint.set(ch.name, ep);
    });
  });

  // Create all nodes
  const nodeMap = new Map<string, HierarchyNode>();
  
  endpoints.forEach((ep) => {
    nodeMap.set(ep.name, {
      id: ep.name,
      label: ep.name,
      type: ep.type,
      children: [],
      depth: 0, // Will be calculated later
    });
  });

  routers.forEach((router) => {
    nodeMap.set(router.name, {
      id: router.name,
      label: router.name,
      type: 'router',
      children: [],
      depth: 0, // Will be calculated later
    });
  });

  // Build parent-child relationships
  const parentMap = new Map<string, Set<string>>();
  
  connections.forEach((conn) => {
    let fromId = conn.from;
    let toId = conn.to;

    // Map chimney names to their parent endpoints
    const fromEndpoint = chimneyToEndpoint.get(conn.from);
    const toEndpoint = chimneyToEndpoint.get(conn.to);
    
    if (fromEndpoint) fromId = fromEndpoint.name;
    if (toEndpoint) toId = toEndpoint.name;

    if (!parentMap.has(fromId)) {
      parentMap.set(fromId, new Set());
    }
    parentMap.get(fromId)!.add(toId);
  });

  // Connect children to parents
  parentMap.forEach((children, parentId) => {
    const parent = nodeMap.get(parentId);
    if (parent) {
      children.forEach((childId) => {
        const child = nodeMap.get(childId);
        if (child) {
          parent.children.push(child);
          child.parent = parent;
        }
      });
    }
  });

  // Find root nodes (nodes with no parents)
  const roots: HierarchyNode[] = [];
  nodeMap.forEach((node) => {
    if (!node.parent) {
      roots.push(node);
    }
  });

  // Calculate depths from roots
  const calculateDepth = (node: HierarchyNode, depth: number) => {
    node.depth = depth;
    node.children.forEach(child => calculateDepth(child, depth + 1));
  };

  roots.forEach(root => calculateDepth(root, 0));

  return roots;
}

/**
 * Assign column indices to leaf nodes (slaves and routers with no children)
 */
function assignColumns(roots: HierarchyNode[]): void {
  let colIndex = 0;
  
  const assignLeafColumns = (node: HierarchyNode) => {
    if (node.children.length === 0) {
      // Leaf node - assign column
      node.colIndex = colIndex++;
      node.minCol = node.colIndex;
      node.maxCol = node.colIndex;
    } else {
      // Internal node - recurse to children first
      node.children.forEach(assignLeafColumns);
      
      // Calculate span from children
      const childCols = node.children
        .filter(c => c.minCol !== undefined && c.maxCol !== undefined)
        .flatMap(c => [c.minCol!, c.maxCol!]);
      
      if (childCols.length > 0) {
        node.minCol = Math.min(...childCols);
        node.maxCol = Math.max(...childCols);
      } else {
        // Fallback for nodes without valid children
        node.colIndex = colIndex++;
        node.minCol = node.colIndex;
        node.maxCol = node.colIndex;
      }
    }
  };

  roots.forEach(assignLeafColumns);
}

/**
 * Calculate positions and dimensions for all nodes
 */
function calculateLayout(roots: HierarchyNode[]): LayoutNode[] {
  const nodes: LayoutNode[] = [];
  
  const processNode = (node: HierarchyNode) => {
    // Calculate center x position based on column span
    const centerCol = ((node.minCol ?? 0) + (node.maxCol ?? 0)) / 2;
    const xCenter = centerCol * COL_GAP + CANVAS_PADDING;
    
    // Calculate width based on column span
    const spanCols = (node.maxCol ?? 0) - (node.minCol ?? 0) + 1;
    let width: number;
    
    if (node.type === 'router') {
      // Router width based on span
      width = spanCols * COL_GAP + 2 * NODE_PADDING;
      width = Math.max(MIN_WIDTH, Math.min(width, MAX_WIDTH));
    } else {
      // Endpoints use fixed width
      width = BLOCK_WIDTH;
    }
    
    // Calculate y position based on depth
    const y = node.depth * LEVEL_GAP + CANVAS_PADDING;
    
    // Calculate x position (center - half width)
    const x = xCenter - width / 2;
    
    nodes.push({
      id: node.id,
      label: node.label,
      type: node.type,
      x,
      y,
      width,
      height: NODE_HEIGHT,
      colIndex: node.colIndex,
      depth: node.depth,
    });
    
    // Process children
    node.children.forEach(processNode);
  };
  
  roots.forEach(processNode);
  return nodes;
}

/**
 * Calculate edge paths with Manhattan routing
 */
function calculateEdges(
  nodes: LayoutNode[],
  connections: Connection[],
  chimneyToEndpoint: Map<string, Endpoint>
): LayoutEdge[] {
  const nodeMap = new Map<string, LayoutNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  
  const edges: LayoutEdge[] = [];
  
  connections.forEach((conn, index) => {
    let fromId = conn.from;
    let toId = conn.to;

    // Map chimney names to their parent endpoints
    const fromEndpoint = chimneyToEndpoint.get(conn.from);
    const toEndpoint = chimneyToEndpoint.get(conn.to);
    
    if (fromEndpoint) fromId = fromEndpoint.name;
    if (toEndpoint) toId = toEndpoint.name;

    const source = nodeMap.get(fromId);
    const target = nodeMap.get(toId);
    
    if (!source || !target) return;
    
    // Calculate edge with Manhattan routing
    const edge = calculateManhattanEdge(source, target, index);
    edges.push(edge);
  });
  
  return edges;
}

/**
 * Calculate Manhattan edge path between two nodes
 */
function calculateManhattanEdge(
  source: LayoutNode,
  target: LayoutNode,
  index: number
): LayoutEdge {
  const sourceCenterX = source.x + source.width / 2;
  const targetCenterX = target.x + target.width / 2;
  
  // Determine which side of parent to connect from
  const useRightSide = targetCenterX >= sourceCenterX;
  
  // Calculate source port position
  let sourcePortX: number;
  if (useRightSide) {
    sourcePortX = source.x + source.width;
  } else {
    sourcePortX = source.x;
  }
  
  const sourcePort = {
    x: sourcePortX,
    y: source.y + source.height,
  };
  
  // Calculate target port position (aligned with source if possible)
  let targetPortX = sourcePortX;
  
  // Clamp to target bounds
  if (targetPortX < target.x) {
    targetPortX = target.x;
  } else if (targetPortX > target.x + target.width) {
    targetPortX = target.x + target.width;
  }
  
  const targetPort = {
    x: targetPortX,
    y: target.y,
  };
  
  // Calculate bend points for Manhattan routing
  const points: Array<{ x: number; y: number }> = [];
  
  if (sourcePort.x === targetPort.x) {
    // Pure vertical line - no bends needed
    // Points will be empty, just straight line from sourcePort to targetPort
  } else {
    // Need horizontal segment
    const midY = (sourcePort.y + targetPort.y) / 2;
    
    // Add intermediate points for Manhattan path
    points.push({ x: sourcePort.x, y: midY });
    points.push({ x: targetPort.x, y: midY });
  }
  
  return {
    id: `edge_${index}`,
    source: source.id,
    target: target.id,
    points,
    sourcePort,
    targetPort,
  };
}

/**
 * Compute column grid layout for topology graph
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
  // Create a map of chimney names to their parent endpoint
  const chimneyToEndpoint = new Map<string, Endpoint>();
  endpoints.forEach((ep) => {
    ep.chimneys?.forEach((ch) => {
      chimneyToEndpoint.set(ch.name, ep);
    });
  });

  // Build hierarchy from connections
  const roots = buildHierarchy(endpoints, routers, connections);

  // Assign column indices to leaves and propagate spans
  assignColumns(roots);

  // Calculate node positions and dimensions
  const nodes = calculateLayout(roots);

  // Calculate edges with Manhattan routing
  const edges = calculateEdges(nodes, connections, chimneyToEndpoint);

  // Calculate canvas dimensions
  let maxX = 0;
  let maxY = 0;

  nodes.forEach((node) => {
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });

  const width = maxX + CANVAS_PADDING;
  const height = maxY + CANVAS_PADDING;

  return { nodes, edges, width, height };
}
