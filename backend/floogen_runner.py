"""
FlooGen Runner Module
Handles execution of floogen tool to generate RTL from YAML configurations
"""

import subprocess
import tempfile
import shutil
import os
import yaml
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import uuid
from datetime import datetime


class FlooGenRunner:
    """
    Wrapper class for running floogen CLI tool
    Manages YAML files, output directories, and ZIP packaging
    """
    
    def __init__(self, output_base_dir: str = "./output"):
        """
        Initialize the FlooGen runner
        
        Args:
            output_base_dir: Base directory for all output files
        """
        self.output_base_dir = Path(output_base_dir)
        self.output_base_dir.mkdir(parents=True, exist_ok=True)
        self.jobs: Dict[str, Dict[str, Any]] = {}
    
    def run(self, config: Any, job_id: Optional[str] = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Run floogen with the given configuration
        
        Args:
            config: YAML configuration (string or dict)
            job_id: Optional job identifier, will be generated if not provided
            
        Returns:
            Tuple of (success: bool, result: dict)
            result contains job_id, output_path, zip_path on success
            or error, stdout, stderr on failure
        """
        if job_id is None:
            job_id = self._generate_job_id()
        
        job_dir = self.output_base_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        
        # Convert config to dict if it's a string (YAML)
        if isinstance(config, str):
            try:
                config_dict = yaml.safe_load(config)
            except yaml.YAMLError as e:
                return False, {
                    "error": f"YAML parsing error: {str(e)}",
                    "stdout": "",
                    "stderr": str(e)
                }
        else:
            config_dict = config
        
        # Write configuration to YAML file
        config_file = job_dir / "config.yml"
        try:
            with open(config_file, "w") as f:
                yaml.dump(config_dict, f, default_flow_style=False)
        except Exception as e:
            return False, {
                "error": f"Failed to write config file: {str(e)}",
                "stdout": "",
                "stderr": str(e)
            }
        
        # Output directory for RTL files
        rtl_output_dir = job_dir / "rtl_output"
        rtl_output_dir.mkdir(exist_ok=True)
        
        # Run floogen
        # Note: This assumes floogen is installed and available in PATH
        # Command: floogen -c config.yml -o output/
        cmd = [
            "floogen",
            "-c", str(config_file),
            "-o", str(rtl_output_dir)
        ]
        
        try:
            # Execute floogen command
            result = subprocess.run(
                cmd,
                cwd=str(job_dir),
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            stdout = result.stdout
            stderr = result.stderr
            returncode = result.returncode
            
            if returncode == 0:
                # Success - create ZIP file
                zip_path = self._create_zip(job_dir, rtl_output_dir, job_id)
                
                job_info = {
                    "job_id": job_id,
                    "status": "completed",
                    "timestamp": datetime.now().isoformat(),
                    "output_path": str(rtl_output_dir),
                    "zip_path": str(zip_path),
                    "config_file": str(config_file),
                    "stdout": stdout,
                    "stderr": stderr
                }
                
                self.jobs[job_id] = job_info
                
                return True, job_info
            else:
                # Failed
                error_msg = f"floogen exited with code {returncode}"
                job_info = {
                    "job_id": job_id,
                    "status": "failed",
                    "timestamp": datetime.now().isoformat(),
                    "error": error_msg,
                    "stdout": stdout,
                    "stderr": stderr
                }
                
                self.jobs[job_id] = job_info
                
                return False, job_info
                
        except FileNotFoundError:
            # floogen not found in PATH
            error_msg = "floogen command not found. Please ensure floogen is installed."
            return False, {
                "error": error_msg,
                "stdout": "",
                "stderr": error_msg
            }
        except subprocess.TimeoutExpired:
            error_msg = "floogen execution timed out (>5 minutes)"
            return False, {
                "error": error_msg,
                "stdout": "",
                "stderr": error_msg
            }
        except Exception as e:
            error_msg = f"Unexpected error running floogen: {str(e)}"
            return False, {
                "error": error_msg,
                "stdout": "",
                "stderr": str(e)
            }
    
    def get_job_info(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a job
        
        Args:
            job_id: Job identifier
            
        Returns:
            Job information dict or None if not found
        """
        return self.jobs.get(job_id)
    
    def _generate_job_id(self) -> str:
        """
        Generate a unique job ID
        
        Returns:
            Unique job identifier string
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"job_{timestamp}_{unique_id}"
    
    def _create_zip(self, job_dir: Path, rtl_output_dir: Path, job_id: str) -> Path:
        """
        Create a ZIP file of the generated RTL
        
        Args:
            job_dir: Job directory
            rtl_output_dir: RTL output directory
            job_id: Job identifier
            
        Returns:
            Path to the created ZIP file
        """
        zip_path = job_dir / f"{job_id}_rtl.zip"
        
        # Create ZIP file
        shutil.make_archive(
            str(zip_path.with_suffix("")),  # Remove .zip as make_archive adds it
            "zip",
            rtl_output_dir
        )
        
        return zip_path
