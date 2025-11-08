/**
 * EndpointEditor Component
 * Edit endpoints (masters and slaves)
 */

import React from 'react';
import { Endpoint } from '../types/config';

interface EndpointEditorProps {
  endpoints: Endpoint[];
  protocolNames: string[];
  onChange: (endpoints: Endpoint[]) => void;
}

const EndpointEditor: React.FC<EndpointEditorProps> = ({ endpoints, protocolNames, onChange }) => {
  const handleEndpointChange = (index: number, field: keyof Endpoint, value: string | Endpoint['type'] | Endpoint['protocol'] | Endpoint['chimneys']) => {
    const updated = [...endpoints];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddEndpoint = () => {
    const newEndpoint: Endpoint = {
      name: `endpoint_${endpoints.length}`,
      type: 'master',
      protocol: protocolNames[0] || 'axi',
      chimneys: [{ name: `ep${endpoints.length}_ch` }],
    };
    onChange([...endpoints, newEndpoint]);
  };

  const handleDeleteEndpoint = (index: number) => {
    const updated = endpoints.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddressRangeChange = (index: number, rangeIndex: 0 | 1, value: string) => {
    const updated = [...endpoints];
    const endpoint = updated[index];
    if (!endpoint.addr_range) {
      endpoint.addr_range = [0, 0];
    }
    const newRange: [number | string, number | string] = [...endpoint.addr_range];
    
    // Try to parse as hex or decimal
    if (value.startsWith('0x') || value.startsWith('0X')) {
      newRange[rangeIndex] = value;
    } else {
      const numValue = parseInt(value, 10);
      newRange[rangeIndex] = isNaN(numValue) ? value : numValue;
    }
    
    endpoint.addr_range = newRange;
    onChange(updated);
  };

  const handleChimneyNameChange = (endpointIndex: number, chimneyIndex: number, name: string) => {
    const updated = [...endpoints];
    const endpoint = updated[endpointIndex];
    if (endpoint.chimneys) {
      endpoint.chimneys[chimneyIndex].name = name;
    }
    onChange(updated);
  };

  const handleAddChimney = (endpointIndex: number) => {
    const updated = [...endpoints];
    const endpoint = updated[endpointIndex];
    if (!endpoint.chimneys) {
      endpoint.chimneys = [];
    }
    endpoint.chimneys.push({ name: `${endpoint.name}_ch${endpoint.chimneys.length}` });
    onChange(updated);
  };

  const handleDeleteChimney = (endpointIndex: number, chimneyIndex: number) => {
    const updated = [...endpoints];
    const endpoint = updated[endpointIndex];
    if (endpoint.chimneys) {
      endpoint.chimneys = endpoint.chimneys.filter((_, i) => i !== chimneyIndex);
    }
    onChange(updated);
  };

  const formatAddress = (addr: number | string): string => {
    if (typeof addr === 'string') return addr;
    return `0x${addr.toString(16).toUpperCase()}`;
  };

  return (
    <div className="endpoint-editor">
      <h3>Endpoints</h3>
      <div className="endpoint-list">
        {endpoints.map((endpoint, index) => (
          <div key={index} className="endpoint-item">
            <div className="endpoint-header">
              <input
                type="text"
                value={endpoint.name}
                onChange={(e) => handleEndpointChange(index, 'name', e.target.value)}
                placeholder="Endpoint name"
                className="endpoint-name-input"
              />
              <select
                value={endpoint.type}
                onChange={(e) => handleEndpointChange(index, 'type', e.target.value)}
                className="endpoint-type-select"
              >
                <option value="master">Master</option>
                <option value="slave">Slave</option>
              </select>
              <button
                onClick={() => handleDeleteEndpoint(index)}
                className="delete-button"
                title="Delete endpoint"
              >
                🗑️
              </button>
            </div>
            <div className="endpoint-fields">
              <div className="field">
                <label>Protocol:</label>
                <select
                  value={endpoint.protocol}
                  onChange={(e) => handleEndpointChange(index, 'protocol', e.target.value)}
                >
                  {protocolNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {endpoint.type === 'slave' && (
                <div className="field address-range">
                  <label>Address Range:</label>
                  <div className="address-range-inputs">
                    <input
                      type="text"
                      value={formatAddress(endpoint.addr_range?.[0] || 0)}
                      onChange={(e) => handleAddressRangeChange(index, 0, e.target.value)}
                      placeholder="Start (e.g., 0x80000000)"
                    />
                    <span>to</span>
                    <input
                      type="text"
                      value={formatAddress(endpoint.addr_range?.[1] || 0)}
                      onChange={(e) => handleAddressRangeChange(index, 1, e.target.value)}
                      placeholder="End (e.g., 0x8000FFFF)"
                    />
                  </div>
                </div>
              )}
              <div className="field chimneys-field">
                <label>Chimneys:</label>
                <div className="chimneys-list">
                  {endpoint.chimneys?.map((chimney, chimneyIndex) => (
                    <div key={chimneyIndex} className="chimney-item">
                      <input
                        type="text"
                        value={chimney.name}
                        onChange={(e) =>
                          handleChimneyNameChange(index, chimneyIndex, e.target.value)
                        }
                        placeholder="Chimney name"
                      />
                      <button
                        onClick={() => handleDeleteChimney(index, chimneyIndex)}
                        className="delete-button-small"
                        disabled={endpoint.chimneys && endpoint.chimneys.length === 1}
                        title="Delete chimney"
                      >
                        ✖
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddChimney(index)}
                    className="add-button-small"
                  >
                    ➕ Add Chimney
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleAddEndpoint} className="add-button">
        ➕ Add Endpoint
      </button>
    </div>
  );
};

export default EndpointEditor;
