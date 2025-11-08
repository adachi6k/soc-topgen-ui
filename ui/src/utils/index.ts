/**
 * Utility functions for the application
 */

import * as yaml from 'js-yaml';
import { FlooNoCConfig } from '../types/config';

/**
 * Parse YAML string to FlooNoC configuration object
 */
export function parseYAML(yamlString: string): FlooNoCConfig {
  try {
    return yaml.load(yamlString) as FlooNoCConfig;
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Serialize FlooNoC configuration object to YAML string
 */
export function stringifyYAML(config: FlooNoCConfig): string {
  try {
    return yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
  } catch (error) {
    throw new Error(`Failed to serialize YAML: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Download a file with given content and filename
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/yaml'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) {
    return 'No errors';
  }
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
}

/**
 * Create a default FlooNoC configuration
 */
export function createDefaultConfig(): FlooNoCConfig {
  return {
    protocols: {
      axi: {
        data_width: 64,
        addr_width: 32,
        id_width: 6,
      },
    },
    endpoints: [
      {
        name: 'm0',
        type: 'master',
        protocol: 'axi',
        chimneys: [{ name: 'm0_ch' }],
      },
      {
        name: 's0',
        type: 'slave',
        protocol: 'axi',
        addr_range: [0x80000000, 0x8000ffff],
        chimneys: [{ name: 's0_ch' }],
      },
    ],
    routers: [
      {
        name: 'r0',
        pos: [0, 0],
      },
    ],
    connections: [
      { from: 'm0_ch', to: 'r0' },
      { from: 'r0', to: 's0_ch' },
    ],
    routing: {
      mode: 'deterministic',
    },
    top: {
      name: 'soc_top',
      export_axi: ['m0', 's0'],
    },
  };
}
