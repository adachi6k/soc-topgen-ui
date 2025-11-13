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
  direction?: 'input' | 'output' | 'bidirectional';
}

export interface Endpoint {
  name: string;
  type: 'master' | 'slave';
  protocol: string;
  addr_range?: [number | string, number | string];
  chimneys?: Chimney[];
  description?: string;
  color?: string;
  subsystem?: string;
  components?: string[];
}

export interface Router {
  name: string;
  pos: [number, number];
  type?: 'noc' | 'interconnect' | 'bridge';
  width?: number;
  height?: number;
  color?: string;
  description?: string;
}

export interface Connection {
  from: string;
  to: string;
  type?: 'axi' | 'coherent' | 'non-coherent' | 'default';
  bidirectional?: boolean;
  label?: string;
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
  backendUnavailable?: boolean;
}
