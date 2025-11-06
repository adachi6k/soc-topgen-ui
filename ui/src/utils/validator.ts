/**
 * Client-side YAML configuration validator
 * Provides offline validation capability using JSON Schema
 */

import Ajv, { ErrorObject } from 'ajv';
import yaml from 'js-yaml';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Client-side configuration validator
 * Can validate configurations without backend API
 */
export class ClientValidator {
  private ajv: Ajv;
  private schema: object | null = null;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
  }

  /**
   * Load the JSON schema (can be fetched from backend or bundled)
   */
  async loadSchema(schemaUrl: string): Promise<void> {
    try {
      const response = await fetch(schemaUrl);
      this.schema = await response.json();
    } catch (error) {
      console.error('Failed to load schema:', error);
      throw new Error('Failed to load validation schema');
    }
  }

  /**
   * Set schema directly (for bundled schemas)
   */
  setSchema(schema: object): void {
    this.schema = schema;
  }

  /**
   * Validate a YAML configuration string
   */
  validateYAML(yamlConfig: string): ValidationResult {
    try {
      // Parse YAML to object
      const config = yaml.load(yamlConfig);
      
      // Validate against schema
      return this.validateConfig(config);
    } catch (error) {
      // YAML parsing error
      if (error instanceof Error) {
        return {
          valid: false,
          errors: [`YAML parsing error: ${error.message}`],
        };
      }
      return {
        valid: false,
        errors: ['Unknown YAML parsing error'],
      };
    }
  }

  /**
   * Validate a configuration object
   */
  validateConfig(config: unknown): ValidationResult {
    if (!this.schema) {
      return {
        valid: false,
        errors: ['Schema not loaded. Call loadSchema() first.'],
      };
    }

    const validate = this.ajv.compile(this.schema);
    const valid = validate(config);

    if (valid) {
      return {
        valid: true,
        errors: [],
      };
    }

    // Format validation errors
    const errors = (validate.errors || []).map((error: ErrorObject) => {
      const path = error.instancePath || '/';
      const message = error.message || 'Unknown error';
      return `${path}: ${message}`;
    });

    return {
      valid: false,
      errors,
    };
  }

  /**
   * Check if schema is loaded
   */
  isReady(): boolean {
    return this.schema !== null;
  }
}

// Export singleton instance for convenience
export const clientValidator = new ClientValidator();
