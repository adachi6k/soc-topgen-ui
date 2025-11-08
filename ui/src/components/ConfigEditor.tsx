/**
 * ConfigEditor Component
 * Main visual configuration editor with tabbed interface
 */

import React, { useState, useEffect } from 'react';
import { FlooNoCConfig, ValidationResult } from '../types/config';
import { parseYAML, stringifyYAML, downloadFile, createDefaultConfig } from '../utils';
import { apiClient } from '../api/client';

import ProtocolEditor from './ProtocolEditor';
import EndpointEditor from './EndpointEditor';
import RouterEditor from './RouterEditor';
import ConnectionEditor from './ConnectionEditor';
import RoutingEditor from './RoutingEditor';
import TopEditor from './TopEditor';
import ValidationPanel from './ValidationPanel';
import TopologyDiagram from './TopologyDiagram';

type Tab = 'protocols' | 'endpoints' | 'routers' | 'connections' | 'routing' | 'top' | 'topology' | 'yaml';

const ConfigEditor: React.FC = () => {
  const [config, setConfig] = useState<FlooNoCConfig>(createDefaultConfig());
  const [activeTab, setActiveTab] = useState<Tab>('protocols');
  const [yamlText, setYamlText] = useState<string>('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [yamlError, setYamlError] = useState<string | null>(null);

  // Sync YAML text with config when switching to YAML tab
  useEffect(() => {
    if (activeTab === 'yaml') {
      try {
        const yaml = stringifyYAML(config);
        setYamlText(yaml);
        setYamlError(null);
      } catch (error) {
        setYamlError(error instanceof Error ? error.message : String(error));
      }
    }
  }, [activeTab, config]);

  // Auto-validate when config changes
  useEffect(() => {
    const validateConfig = async () => {
      setIsValidating(true);
      try {
        const yamlStr = stringifyYAML(config);
        const result = await apiClient.validateConfig(yamlStr);
        setValidation(result);
      } catch (error) {
        setValidation({
          valid: false,
          errors: [error instanceof Error ? error.message : 'Validation failed'],
        });
      } finally {
        setIsValidating(false);
      }
    };

    const timer = setTimeout(() => {
      validateConfig();
    }, 500);
    return () => clearTimeout(timer);
  }, [config]);

  const handleYamlChange = (value: string) => {
    setYamlText(value);
    try {
      const parsed = parseYAML(value);
      setConfig(parsed);
      setYamlError(null);
    } catch (error) {
      setYamlError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleLoadExample = async (exampleName: string) => {
    try {
      // Use import.meta.env.BASE_URL to respect the base path in GitHub Pages deployment
      const basePath = import.meta.env.BASE_URL || '/';
      const examplePath = `${basePath}examples/${exampleName}.yml`;
      const response = await fetch(examplePath);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const yamlText = await response.text();
      const parsed = parseYAML(yamlText);
      setConfig(parsed);
      setYamlText(yamlText);
      setYamlError(null);
    } catch (error) {
      setYamlError(`Failed to load example: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleExportYAML = () => {
    try {
      const yaml = stringifyYAML(config);
      downloadFile(yaml, `${config.top.name}.yml`, 'text/yaml');
    } catch (error) {
      alert(`Failed to export YAML: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleImportYAML = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yml,.yaml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          try {
            const parsed = parseYAML(text);
            setConfig(parsed);
            setYamlText(text);
            setYamlError(null);
          } catch (error) {
            setYamlError(`Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('Reset to default configuration? This will discard all changes.')) {
      setConfig(createDefaultConfig());
      setYamlError(null);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'protocols':
        return (
          <ProtocolEditor
            protocols={config.protocols}
            onChange={(protocols) => setConfig({ ...config, protocols })}
          />
        );
      case 'endpoints':
        return (
          <EndpointEditor
            endpoints={config.endpoints}
            protocolNames={Object.keys(config.protocols)}
            onChange={(endpoints) => setConfig({ ...config, endpoints })}
          />
        );
      case 'routers':
        return (
          <RouterEditor
            routers={config.routers}
            onChange={(routers) => setConfig({ ...config, routers })}
          />
        );
      case 'connections':
        return (
          <ConnectionEditor
            connections={config.connections}
            endpoints={config.endpoints}
            routers={config.routers}
            onChange={(connections) => setConfig({ ...config, connections })}
          />
        );
      case 'routing':
        return (
          <RoutingEditor
            routing={config.routing}
            onChange={(routing) => setConfig({ ...config, routing })}
          />
        );
      case 'top':
        return (
          <TopEditor
            top={config.top}
            endpoints={config.endpoints}
            onChange={(top) => setConfig({ ...config, top })}
          />
        );
      case 'topology':
        return (
          <TopologyDiagram
            endpoints={config.endpoints}
            routers={config.routers}
            connections={config.connections}
          />
        );
      case 'yaml':
        return (
          <div className="yaml-editor">
            <h3>YAML Configuration</h3>
            {yamlError && (
              <div className="error-message">
                <strong>Error:</strong> {yamlError}
              </div>
            )}
            <textarea
              value={yamlText}
              onChange={(e) => handleYamlChange(e.target.value)}
              className="yaml-textarea"
              spellCheck={false}
              placeholder="# FlooNoC Configuration YAML"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="config-editor">
      <div className="editor-header">
        <h2>Visual Configuration Editor</h2>
        <div className="editor-actions">
          <button onClick={handleImportYAML} className="action-button">
            📂 Import YAML
          </button>
          <button onClick={handleExportYAML} className="action-button">
            💾 Export YAML
          </button>
          <button onClick={handleReset} className="action-button">
            🔄 Reset
          </button>
          <select
            onChange={(e) => handleLoadExample(e.target.value)}
            className="example-select"
            defaultValue=""
          >
            <option value="" disabled>
              Load Example...
            </option>
            <option value="minimal">Minimal</option>
            <option value="multi_slave">Multi-Slave</option>
          </select>
        </div>
      </div>

      <div className="editor-tabs">
        {(['protocols', 'endpoints', 'routers', 'connections', 'routing', 'top', 'topology', 'yaml'] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="editor-content">
        <div className="editor-main">{renderTabContent()}</div>
        <div className="editor-sidebar">
          <ValidationPanel validation={validation} isValidating={isValidating} />
        </div>
      </div>
    </div>
  );
};

export default ConfigEditor;
