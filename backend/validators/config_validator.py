"""
Configuration Validator Module
Validates FlooNoC YAML configurations against JSON Schema
and performs additional semantic checks
"""

import json
import yaml
from pathlib import Path
from typing import Dict, Any, List, Tuple, Union
from jsonschema import validate, ValidationError, Draft7Validator


class ConfigValidator:
    """
    Validator for FlooNoC YAML configurations
    Performs JSON Schema validation and additional semantic checks
    """
    
    def __init__(self, schema_path: str):
        """
        Initialize validator with JSON Schema
        
        Args:
            schema_path: Path to JSON Schema file
        """
        self.schema_path = Path(schema_path)
        self.schema = self._load_schema()
        self.validator = Draft7Validator(self.schema)
    
    def _load_schema(self) -> Dict[str, Any]:
        """
        Load JSON Schema from file
        
        Returns:
            Schema dictionary
        """
        with open(self.schema_path, "r") as f:
            return json.load(f)
    
    def validate(self, config: Union[str, Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validate a configuration
        
        Args:
            config: YAML string or dictionary
            
        Returns:
            Tuple of (is_valid: bool, errors: List[str])
        """
        # Parse YAML if string
        if isinstance(config, str):
            try:
                config_dict = yaml.safe_load(config)
            except yaml.YAMLError as e:
                return False, [f"YAML parsing error: {str(e)}"]
        else:
            config_dict = config
        
        errors: List[str] = []
        
        # JSON Schema validation
        schema_errors = self._validate_schema(config_dict)
        errors.extend(schema_errors)
        
        # Additional semantic validation
        if not schema_errors:  # Only do semantic checks if schema is valid
            semantic_errors = self._validate_semantics(config_dict)
            errors.extend(semantic_errors)
        
        return (len(errors) == 0, errors)
    
    def _validate_schema(self, config: Dict[str, Any]) -> List[str]:
        """
        Validate against JSON Schema
        
        Args:
            config: Configuration dictionary
            
        Returns:
            List of error messages
        """
        errors = []
        
        for error in self.validator.iter_errors(config):
            # Format error message with path
            path = " -> ".join(str(p) for p in error.path) if error.path else "root"
            errors.append(f"{path}: {error.message}")
        
        return errors
    
    def _validate_semantics(self, config: Dict[str, Any]) -> List[str]:
        """
        Perform semantic validation checks
        
        Args:
            config: Configuration dictionary
            
        Returns:
            List of error messages
        """
        errors = []
        
        # Extract components
        protocols = config.get("protocols", {})
        endpoints = config.get("endpoints", [])
        routers = config.get("routers", [])
        connections = config.get("connections", [])
        
        # Check 1: Protocol references in endpoints
        for ep in endpoints:
            protocol = ep.get("protocol")
            if protocol and protocol not in protocols:
                errors.append(
                    f"Endpoint '{ep.get('name')}' references undefined protocol '{protocol}'"
                )
        
        # Check 2: Slave endpoints must have addr_range
        for ep in endpoints:
            if ep.get("type") == "slave" and "addr_range" not in ep:
                errors.append(
                    f"Slave endpoint '{ep.get('name')}' must have 'addr_range'"
                )
        
        # Check 3: Check for duplicate chimney names
        chimney_names = set()
        for ep in endpoints:
            for chimney in ep.get("chimneys", []):
                ch_name = chimney.get("name")
                if ch_name in chimney_names:
                    errors.append(f"Duplicate chimney name: '{ch_name}'")
                chimney_names.add(ch_name)
        
        # Check 4: Check for duplicate router names
        router_names = set()
        for router in routers:
            r_name = router.get("name")
            if r_name in router_names:
                errors.append(f"Duplicate router name: '{r_name}'")
            router_names.add(r_name)
        
        # Check 5: Check for duplicate endpoint names
        endpoint_names = set()
        for ep in endpoints:
            ep_name = ep.get("name")
            if ep_name in endpoint_names:
                errors.append(f"Duplicate endpoint name: '{ep_name}'")
            endpoint_names.add(ep_name)
        
        # Check 6: Validate connections reference existing nodes
        all_nodes = chimney_names | router_names
        for conn in connections:
            from_node = conn.get("from")
            to_node = conn.get("to")
            
            if from_node not in all_nodes:
                errors.append(
                    f"Connection references undefined 'from' node: '{from_node}'"
                )
            if to_node not in all_nodes:
                errors.append(
                    f"Connection references undefined 'to' node: '{to_node}'"
                )
        
        # Check 7: Validate address range overlaps for slave endpoints
        slaves = [ep for ep in endpoints if ep.get("type") == "slave"]
        for i, slave1 in enumerate(slaves):
            if "addr_range" not in slave1:
                continue
            range1 = slave1["addr_range"]
            start1 = self._parse_addr(range1[0])
            end1 = self._parse_addr(range1[1])
            
            for slave2 in slaves[i+1:]:
                if "addr_range" not in slave2:
                    continue
                range2 = slave2["addr_range"]
                start2 = self._parse_addr(range2[0])
                end2 = self._parse_addr(range2[1])
                
                # Check for overlap
                if not (end1 < start2 or end2 < start1):
                    errors.append(
                        f"Address range overlap between '{slave1.get('name')}' "
                        f"and '{slave2.get('name')}'"
                    )
        
        # Check 8: Validate export_axi references
        top = config.get("top", {})
        export_axi = top.get("export_axi", [])
        endpoint_names_list = [ep.get("name") for ep in endpoints]
        
        for exported in export_axi:
            if exported not in endpoint_names_list:
                errors.append(
                    f"top.export_axi references undefined endpoint: '{exported}'"
                )
        
        return errors
    
    def _parse_addr(self, addr: Union[int, str]) -> int:
        """
        Parse address from hex string or integer
        
        Args:
            addr: Address as hex string (e.g., "0x80000000") or integer
            
        Returns:
            Integer address
        """
        if isinstance(addr, str):
            # Handle hex strings like "0x80000000" or "0x8000_0000"
            addr = addr.replace("_", "")
            return int(addr, 0)  # 0 means auto-detect base
        return int(addr)
