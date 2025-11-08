/**
 * Manhattan Path Generator
 * Creates orthogonal (horizontal/vertical only) paths between points
 */

export interface Point {
  x: number;
  y: number;
}

export interface PathSegment {
  type: 'H' | 'V'; // Horizontal or Vertical
  start: Point;
  end: Point;
}

/**
 * Generate orthogonal path between two points
 * Uses Manhattan routing with minimal bends (1-2 turns)
 * 
 * @param from Starting point
 * @param to Ending point
 * @param fromSide Side of the source node ('top' | 'bottom' | 'left' | 'right')
 * @param toSide Side of the target node ('top' | 'bottom' | 'left' | 'right')
 * @returns SVG path data string
 */
export function orthogonalPath(
  from: Point,
  to: Point,
  fromSide: 'top' | 'bottom' | 'left' | 'right' = 'bottom',
  toSide: 'top' | 'bottom' | 'left' | 'right' = 'top'
): string {
  // Calculate intermediate points based on sides
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Start path
  const path: string[] = [`M ${from.x},${from.y}`];
  
  // Determine routing based on relative positions
  if (fromSide === 'bottom' && toSide === 'top') {
    // Typical master -> router -> slave connection
    const midY = from.y + (to.y - from.y) / 2;
    
    // Vertical segment down from source
    path.push(`V ${midY}`);
    
    // Horizontal segment to target x
    path.push(`H ${to.x}`);
    
    // Vertical segment to target
    path.push(`V ${to.y}`);
  } else if (fromSide === 'bottom' && toSide === 'bottom') {
    // Both exit bottom - route around
    const midY = Math.max(from.y, to.y) + 20;
    path.push(`V ${midY}`);
    path.push(`H ${to.x}`);
    path.push(`V ${to.y}`);
  } else if (fromSide === 'top' && toSide === 'top') {
    // Both exit top - route around
    const midY = Math.min(from.y, to.y) - 20;
    path.push(`V ${midY}`);
    path.push(`H ${to.x}`);
    path.push(`V ${to.y}`);
  } else if (fromSide === 'right' && toSide === 'left') {
    // Horizontal connection
    const midX = from.x + (to.x - from.x) / 2;
    path.push(`H ${midX}`);
    path.push(`V ${to.y}`);
    path.push(`H ${to.x}`);
  } else {
    // Default: try to make a simple path
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal first
      path.push(`H ${to.x}`);
      path.push(`V ${to.y}`);
    } else {
      // Vertical first
      path.push(`V ${to.y}`);
      path.push(`H ${to.x}`);
    }
  }
  
  return path.join(' ');
}

/**
 * Generate orthogonal path with obstacle avoidance
 * More sophisticated routing that avoids node rectangles
 * 
 * @param from Starting point
 * @param to Ending point
 * @returns SVG path data string
 */
export function orthogonalPathWithObstacles(
  from: Point,
  to: Point
): string {
  // For now, use simple orthogonal routing
  // Future enhancement: implement A* or similar pathfinding
  return orthogonalPath(from, to);
}

/**
 * Calculate the length of an orthogonal path
 * 
 * @param path SVG path data string
 * @returns Path length in pixels
 */
export function pathLength(path: string): number {
  let length = 0;
  const commands = path.split(/(?=[MLHVZ])/);
  let currentX = 0;
  let currentY = 0;
  
  commands.forEach(cmd => {
    const type = cmd[0];
    const values = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
    
    switch (type) {
      case 'M':
        currentX = values[0];
        currentY = values[1];
        break;
      case 'L':
        length += Math.sqrt(
          Math.pow(values[0] - currentX, 2) + 
          Math.pow(values[1] - currentY, 2)
        );
        currentX = values[0];
        currentY = values[1];
        break;
      case 'H':
        length += Math.abs(values[0] - currentX);
        currentX = values[0];
        break;
      case 'V':
        length += Math.abs(values[0] - currentY);
        currentY = values[0];
        break;
    }
  });
  
  return length;
}
