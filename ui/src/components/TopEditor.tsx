/**
 * TopEditor Component
 * Edit top-level module configuration
 */

import React from 'react';
import { Top, Endpoint } from '../types/config';

interface TopEditorProps {
  top: Top;
  endpoints: Endpoint[];
  onChange: (top: Top) => void;
}

const TopEditor: React.FC<TopEditorProps> = ({ top, endpoints, onChange }) => {
  const endpointNames = endpoints.map((ep) => ep.name);

  const handleNameChange = (name: string) => {
    onChange({ ...top, name });
  };

  const handleExportToggle = (endpointName: string) => {
    const currentExports = top.export_axi || [];
    const isExported = currentExports.includes(endpointName);
    
    const newExports = isExported
      ? currentExports.filter((name) => name !== endpointName)
      : [...currentExports, endpointName];
    
    onChange({ ...top, export_axi: newExports });
  };

  return (
    <div className="top-editor">
      <h3>Top-Level Configuration</h3>
      <div className="top-fields">
        <div className="field">
          <label>Module Name:</label>
          <input
            type="text"
            value={top.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="soc_top"
          />
          <p className="field-description">Name of the top-level SystemVerilog module</p>
        </div>
        <div className="field">
          <label>Export AXI Endpoints:</label>
          <div className="checkbox-list">
            {endpointNames.length > 0 ? (
              endpointNames.map((name) => (
                <label key={name} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={top.export_axi?.includes(name) || false}
                    onChange={() => handleExportToggle(name)}
                  />
                  <span>{name}</span>
                </label>
              ))
            ) : (
              <p className="info">No endpoints defined yet</p>
            )}
          </div>
          <p className="field-description">
            Select endpoints to expose as top-level AXI ports in the generated RTL
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopEditor;
