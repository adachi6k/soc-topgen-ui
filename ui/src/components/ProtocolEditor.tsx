/**
 * ProtocolEditor Component
 * Edit protocol configurations (AXI parameters)
 */

import React from 'react';
import { Protocols, Protocol } from '../types/config';

interface ProtocolEditorProps {
  protocols: Protocols;
  onChange: (protocols: Protocols) => void;
}

const ProtocolEditor: React.FC<ProtocolEditorProps> = ({ protocols, onChange }) => {
  const protocolNames = Object.keys(protocols);

  const handleProtocolChange = (name: string, field: keyof Protocol, value: number) => {
    const updated = {
      ...protocols,
      [name]: {
        ...protocols[name],
        [field]: value,
      },
    };
    onChange(updated);
  };

  const handleAddProtocol = () => {
    const newName = `protocol_${protocolNames.length}`;
    onChange({
      ...protocols,
      [newName]: {
        data_width: 64,
        addr_width: 32,
        id_width: 6,
      },
    });
  };

  const handleDeleteProtocol = (name: string) => {
    const updated = { ...protocols };
    delete updated[name];
    onChange(updated);
  };

  const handleRenameProtocol = (oldName: string, newName: string) => {
    if (oldName === newName || !newName || protocols[newName]) {
      return;
    }
    const updated = { ...protocols };
    updated[newName] = updated[oldName];
    delete updated[oldName];
    onChange(updated);
  };

  return (
    <div className="protocol-editor">
      <h3>Protocols</h3>
      <div className="protocol-list">
        {protocolNames.map((name) => {
          const protocol = protocols[name];
          return (
            <div key={name} className="protocol-item">
              <div className="protocol-header">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleRenameProtocol(name, e.target.value)}
                  className="protocol-name-input"
                  placeholder="Protocol name"
                />
                <button
                  onClick={() => handleDeleteProtocol(name)}
                  className="delete-button"
                  disabled={protocolNames.length === 1}
                  title="Delete protocol"
                >
                  🗑️
                </button>
              </div>
              <div className="protocol-fields">
                <div className="field">
                  <label>Data Width (bits):</label>
                  <input
                    type="number"
                    value={protocol.data_width}
                    onChange={(e) =>
                      handleProtocolChange(name, 'data_width', parseInt(e.target.value) || 8)
                    }
                    min="8"
                  />
                </div>
                <div className="field">
                  <label>Address Width (bits):</label>
                  <input
                    type="number"
                    value={protocol.addr_width}
                    onChange={(e) =>
                      handleProtocolChange(name, 'addr_width', parseInt(e.target.value) || 8)
                    }
                    min="8"
                  />
                </div>
                <div className="field">
                  <label>ID Width (bits):</label>
                  <input
                    type="number"
                    value={protocol.id_width}
                    onChange={(e) =>
                      handleProtocolChange(name, 'id_width', parseInt(e.target.value) || 1)
                    }
                    min="1"
                  />
                </div>
                {protocol.user_width !== undefined && (
                  <div className="field">
                    <label>User Width (bits):</label>
                    <input
                      type="number"
                      value={protocol.user_width}
                      onChange={(e) =>
                        handleProtocolChange(name, 'user_width', parseInt(e.target.value) || 0)
                      }
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={handleAddProtocol} className="add-button">
        ➕ Add Protocol
      </button>
    </div>
  );
};

export default ProtocolEditor;
