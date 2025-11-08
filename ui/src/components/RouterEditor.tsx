/**
 * RouterEditor Component
 * Edit router configurations
 */

import React from 'react';
import { Router } from '../types/config';

interface RouterEditorProps {
  routers: Router[];
  onChange: (routers: Router[]) => void;
}

const RouterEditor: React.FC<RouterEditorProps> = ({ routers, onChange }) => {
  const handleRouterChange = (index: number, field: keyof Router, value: string | Router['pos']) => {
    const updated = [...routers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handlePositionChange = (index: number, posIndex: 0 | 1, value: number) => {
    const updated = [...routers];
    const newPos: [number, number] = [...updated[index].pos];
    newPos[posIndex] = value;
    updated[index].pos = newPos;
    onChange(updated);
  };

  const handleAddRouter = () => {
    const newRouter: Router = {
      name: `r${routers.length}`,
      pos: [routers.length, 0],
    };
    onChange([...routers, newRouter]);
  };

  const handleDeleteRouter = (index: number) => {
    const updated = routers.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="router-editor">
      <h3>Routers</h3>
      <div className="router-list">
        {routers.map((router, index) => (
          <div key={index} className="router-item">
            <div className="router-header">
              <input
                type="text"
                value={router.name}
                onChange={(e) => handleRouterChange(index, 'name', e.target.value)}
                placeholder="Router name"
                className="router-name-input"
              />
              <button
                onClick={() => handleDeleteRouter(index)}
                className="delete-button"
                title="Delete router"
              >
                🗑️
              </button>
            </div>
            <div className="router-fields">
              <div className="field position-field">
                <label>Position (x, y):</label>
                <div className="position-inputs">
                  <input
                    type="number"
                    value={router.pos[0]}
                    onChange={(e) => handlePositionChange(index, 0, parseInt(e.target.value) || 0)}
                    placeholder="X"
                    min="0"
                  />
                  <span>,</span>
                  <input
                    type="number"
                    value={router.pos[1]}
                    onChange={(e) => handlePositionChange(index, 1, parseInt(e.target.value) || 0)}
                    placeholder="Y"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleAddRouter} className="add-button">
        ➕ Add Router
      </button>
    </div>
  );
};

export default RouterEditor;
