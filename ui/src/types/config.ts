/**
 * TypeScript type definitions for FlooNoC configuration
 */

export interface Protocol {
  data_width: number;
  addr_width: number;
  id_width: number;
  user_width?: number;
}

export interface Protocols {
  [key: string]: Protocol;
}

export interface Chimney {
  name: string;
}

export interface Endpoint {
  name: string;
  type: 'master' | 'slave';
  protocol: string;
  addr_range?: [number | string, number | string];
  chimneys?: Chimney[];
}

export interface Router {
  name: string;
  pos: [number, number];
}

export interface Connection {
  from: string;
  to: string;
}

export interface Routing {
  mode: 'deterministic' | 'adaptive';
}

export interface Top {
  name: string;
  export_axi?: string[];
}

export interface FlooNoCConfig {
  protocols: Protocols;
  endpoints: Endpoint[];
  routers: Router[];
  connections: Connection[];
  routing: Routing;
  top: Top;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
