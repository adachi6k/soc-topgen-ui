/**
 * ConnectionEditor Component
 * Edit connections between chimneys and routers
 */

import React from 'react';
import { Connection, Endpoint, Router } from '../types/config';

interface ConnectionEditorProps {
  connections: Connection[];
  endpoints: Endpoint[];
  routers: Router[];
  onChange: (connections: Connection[]) => void;
}

const ConnectionEditor: React.FC<ConnectionEditorProps> = ({
  connections,
  endpoints,
  routers,
  onChange,
}) => {
  // Get list of all available nodes (chimneys and routers)
  const getAvailableNodes = (): string[] => {
    const nodes: string[] = [];
    
    // Add all chimney names
    endpoints.forEach((endpoint) => {
      endpoint.chimneys?.forEach((chimney) => {
        nodes.push(chimney.name);
      });
    });
    
    // Add all router names
    routers.forEach((router) => {
      nodes.push(router.name);
    });
    
    return nodes;
  };

  const availableNodes = getAvailableNodes();

  const handleConnectionChange = (index: number, field: keyof Connection, value: string) => {
    const updated = [...connections];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddConnection = () => {
    const newConnection: Connection = {
      from: availableNodes[0] || '',
      to: availableNodes[1] || availableNodes[0] || '',
    };
    onChange([...connections, newConnection]);
  };

  const handleDeleteConnection = (index: number) => {
    const updated = connections.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="connection-editor">
      <h3>Connections</h3>
      <div className="connection-list">
        {connections.map((connection, index) => (
          <div key={index} className="connection-item">
            <div className="connection-fields">
              <div className="field">
                <label>From:</label>
                <select
                  value={connection.from}
                  onChange={(e) => handleConnectionChange(index, 'from', e.target.value)}
                >
                  <option value="">Select source...</option>
                  {availableNodes.map((node) => (
                    <option key={node} value={node}>
                      {node}
                    </option>
                  ))}
                </select>
              </div>
              <span className="arrow">→</span>
              <div className="field">
                <label>To:</label>
                <select
                  value={connection.to}
                  onChange={(e) => handleConnectionChange(index, 'to', e.target.value)}
                >
                  <option value="">Select destination...</option>
                  {availableNodes.map((node) => (
                    <option key={node} value={node}>
                      {node}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleDeleteConnection(index)}
                className="delete-button"
                title="Delete connection"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddConnection}
        className="add-button"
        disabled={availableNodes.length < 2}
      >
        ➕ Add Connection
      </button>
      {availableNodes.length < 2 && (
        <p className="info">Add at least 2 chimneys or routers to create connections</p>
      )}
    </div>
  );
};

export default ConnectionEditor;
