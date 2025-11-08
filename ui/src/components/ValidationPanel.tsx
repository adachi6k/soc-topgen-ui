/**
 * ValidationPanel Component
 * Displays validation results and errors
 */

import React from 'react';
import { ValidationResult } from '../types/config';

interface ValidationPanelProps {
  validation: ValidationResult | null;
  isValidating?: boolean;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ validation, isValidating }) => {
  if (isValidating) {
    return (
      <div className="validation-panel validating">
        <h3>⏳ Validating...</h3>
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="validation-panel">
        <h3>Validation</h3>
        <p className="info">Edit configuration to see validation results</p>
      </div>
    );
  }

  // Backend unavailable - show info message instead of error
  if (validation.backendUnavailable) {
    return (
      <div className="validation-panel info">
        <h3>ℹ️ Validation Unavailable</h3>
        <div className="info-message">
          <p>Backend validation is not available.</p>
          <p>The configuration editor is running in static mode (GitHub Pages).</p>
          <p>To enable full validation and RTL generation, please run the backend locally.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`validation-panel ${validation.valid ? 'valid' : 'invalid'}`}>
      <h3>{validation.valid ? '✅ Valid Configuration' : '❌ Invalid Configuration'}</h3>
      {validation.errors.length > 0 && (
        <div className="errors">
          <h4>Errors:</h4>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {validation.valid && (
        <p className="success">Configuration is valid and ready for RTL generation</p>
      )}
    </div>
  );
};

export default ValidationPanel;
