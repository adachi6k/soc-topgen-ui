/**
 * API Client for soc-topgen-ui backend
 * Handles communication with Flask backend for validation and RTL generation
 * Supports offline mode for validation-only functionality
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { clientValidator, ValidationResult } from '../utils/validator';

// Backend API base URL - can be configured via environment variable
// For GitHub Pages deployment, users can set VITE_API_URL to point to their backend
// Default to relative path '/api' which works with Vite proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * API Client class for backend communication
 */
class ApiClient {
  private client: AxiosInstance;
  private offlineMode: boolean = false;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Initialize client validator for offline mode
    this.initializeOfflineMode();
  }

  /**
   * Initialize offline mode by loading schema
   */
  private async initializeOfflineMode(): Promise<void> {
    try {
      // Try to fetch schema from backend
      const schema = await this.getSchema();
      clientValidator.setSchema(schema);
    } catch (error) {
      console.warn('Backend not available, using offline mode');
      this.offlineMode = true;
      
      // Try to load bundled schema from public directory
      try {
        const response = await fetch('/schema.json');
        const schema = await response.json();
        clientValidator.setSchema(schema);
      } catch (schemaError) {
        console.error('Failed to load bundled schema:', schemaError);
      }
    }
  }

  /**
   * Check if backend is available
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await this.client.get('/api/health');
    return response.data;
  }

  /**
   * Get current JSON Schema
   */
  async getSchema(): Promise<Record<string, unknown>> {
    const response = await this.client.get('/api/schemas/current');
    return response.data;
  }

  /**
   * Validate a configuration
   * Falls back to client-side validation if backend is unavailable
   */
  async validateConfig(config: string | object): Promise<ValidationResult> {
    try {
      const response = await this.client.post('/api/validate', {
        config,
      });
      return response.data;
    } catch (error) {
      // Fallback to client-side validation
      console.warn('Backend validation failed, using client-side validation');
      
      if (typeof config === 'string') {
        return clientValidator.validateYAML(config);
      } else {
        return clientValidator.validateConfig(config);
      }
    }
  }

  /**
   * Generate RTL from configuration
   * Requires backend - will throw error if not available
   */
  async generateRTL(
    config: string | object,
    jobId?: string
  ): Promise<{
    success: boolean;
    job_id?: string;
    output_path?: string;
    zip_path?: string;
    message?: string;
    error?: string;
    validation_errors?: string[];
  }> {
    try {
      const response = await this.client.post('/api/generate', {
        config,
        job_id: jobId,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (!axiosError.response) {
          // Network error - backend not available
          throw new Error(
            'Backend server not available. RTL generation requires a running backend server. ' +
            'See documentation for deployment options.'
          );
        }
      }
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<Record<string, unknown>> {
    const response = await this.client.get(`/api/jobs/${jobId}`);
    return response.data;
  }

  /**
   * Get download URL for job result
   */
  getDownloadUrl(jobId: string): string {
    return `${API_BASE_URL}/api/jobs/${jobId}/download`;
  }

  /**
   * Check if running in offline mode
   */
  isOffline(): boolean {
    return this.offlineMode;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default ApiClient;
