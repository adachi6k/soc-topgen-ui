/**
 * RoutingEditor Component
 * Edit routing configuration
 */

import React from 'react';
import { Routing } from '../types/config';

interface RoutingEditorProps {
  routing: Routing;
  onChange: (routing: Routing) => void;
}

const RoutingEditor: React.FC<RoutingEditorProps> = ({ routing, onChange }) => {
  const handleModeChange = (mode: 'deterministic' | 'adaptive') => {
    onChange({ ...routing, mode });
  };

  return (
    <div className="routing-editor">
      <h3>Routing Configuration</h3>
      <div className="routing-fields">
        <div className="field">
          <label>Routing Mode:</label>
          <select value={routing.mode} onChange={(e) => handleModeChange(e.target.value as 'deterministic' | 'adaptive')}>
            <option value="deterministic">Deterministic</option>
            <option value="adaptive">Adaptive</option>
          </select>
          <p className="field-description">
            {routing.mode === 'deterministic' 
              ? 'Deterministic routing uses fixed paths for packets'
              : 'Adaptive routing allows dynamic path selection'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoutingEditor;
