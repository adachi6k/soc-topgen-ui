/**
 * API Client for soc-topgen-ui backend
 * Handles communication with Flask backend for validation and RTL generation
 */

import axios, { AxiosInstance } from 'axios';

// Backend API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * API Client class for backend communication
 */
class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
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
   */
  async validateConfig(config: string | object): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const response = await this.client.post('/api/validate', {
      config,
    });
    return response.data;
  }

  /**
   * Generate RTL from configuration
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
    const response = await this.client.post('/api/generate', {
      config,
      job_id: jobId,
    });
    return response.data;
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
}

// Export singleton instance
export const apiClient = new ApiClient();
export default ApiClient;
