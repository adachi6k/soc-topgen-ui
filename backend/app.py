"""
Flask Backend for soc-topgen-ui
Main entry point for the backend API server
Provides endpoints for validating and generating FlooNoC RTL configurations
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from pathlib import Path
from typing import Dict, Any, Tuple

# Import custom modules
from floogen_runner import FlooGenRunner
from validators.config_validator import ConfigValidator

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration
BASE_DIR = Path(__file__).parent
SCHEMA_PATH = BASE_DIR.parent / "docs" / "schema" / "floonoc_config.schema.json"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Initialize validator
validator = ConfigValidator(schema_path=str(SCHEMA_PATH))

# Initialize floogen runner
runner = FlooGenRunner(output_base_dir=str(OUTPUT_DIR))


@app.route("/api/health", methods=["GET"])
def health_check() -> Tuple[Dict[str, str], int]:
    """
    Health check endpoint
    Returns: JSON response with status
    """
    return jsonify({"status": "healthy", "service": "soc-topgen-ui-backend"}), 200


@app.route("/api/schemas/current", methods=["GET"])
def get_schema() -> Tuple[Dict[str, Any], int]:
    """
    Get the current JSON Schema for FlooNoC configuration
    Returns: JSON Schema object
    """
    try:
        with open(SCHEMA_PATH, "r") as f:
            schema = json.load(f)
        return jsonify(schema), 200
    except FileNotFoundError:
        return jsonify({"error": "Schema file not found"}), 404
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Invalid schema file: {str(e)}"}), 500


@app.route("/api/validate", methods=["POST"])
def validate_config() -> Tuple[Dict[str, Any], int]:
    """
    Validate a FlooNoC YAML configuration
    
    Request body should contain:
    - config: YAML configuration as string or dict
    
    Returns: Validation result with errors if any
    """
    try:
        data = request.get_json()
        
        if not data or "config" not in data:
            return jsonify({
                "valid": False,
                "errors": ["Missing 'config' field in request body"]
            }), 400
        
        config = data["config"]
        
        # Validate the configuration
        is_valid, errors = validator.validate(config)
        
        response = {
            "valid": is_valid,
            "errors": errors if errors else []
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            "valid": False,
            "errors": [f"Validation error: {str(e)}"]
        }), 500


@app.route("/api/generate", methods=["POST"])
def generate_rtl() -> Tuple[Dict[str, Any], int]:
    """
    Generate RTL using floogen
    
    Request body should contain:
    - config: YAML configuration as string or dict
    - job_id: Optional job identifier
    
    Returns: Job information and download URL
    """
    try:
        data = request.get_json()
        
        if not data or "config" not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'config' field in request body"
            }), 400
        
        config = data["config"]
        job_id = data.get("job_id", None)
        
        # First validate the configuration
        is_valid, errors = validator.validate(config)
        if not is_valid:
            return jsonify({
                "success": False,
                "error": "Configuration validation failed",
                "validation_errors": errors
            }), 400
        
        # Run floogen
        success, result = runner.run(config, job_id=job_id)
        
        if success:
            return jsonify({
                "success": True,
                "job_id": result["job_id"],
                "output_path": result["output_path"],
                "zip_path": result["zip_path"],
                "message": "RTL generation successful"
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": result.get("error", "Unknown error"),
                "stdout": result.get("stdout", ""),
                "stderr": result.get("stderr", "")
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Generation error: {str(e)}"
        }), 500


@app.route("/api/jobs/<job_id>", methods=["GET"])
def get_job_status(job_id: str) -> Tuple[Dict[str, Any], int]:
    """
    Get the status and results of a generation job
    
    Args:
        job_id: Job identifier
        
    Returns: Job status and information
    """
    try:
        job_info = runner.get_job_info(job_id)
        
        if job_info:
            return jsonify(job_info), 200
        else:
            return jsonify({
                "error": f"Job {job_id} not found"
            }), 404
            
    except Exception as e:
        return jsonify({
            "error": f"Error retrieving job: {str(e)}"
        }), 500


@app.route("/api/jobs/<job_id>/download", methods=["GET"])
def download_job_result(job_id: str):
    """
    Download the generated RTL as a ZIP file
    
    Args:
        job_id: Job identifier
        
    Returns: ZIP file download
    """
    try:
        job_info = runner.get_job_info(job_id)
        
        if not job_info:
            return jsonify({"error": f"Job {job_id} not found"}), 404
        
        zip_path = job_info.get("zip_path")
        if not zip_path or not os.path.exists(zip_path):
            return jsonify({"error": "Generated files not found"}), 404
        
        return send_file(
            zip_path,
            mimetype="application/zip",
            as_attachment=True,
            download_name=f"{job_id}_rtl.zip"
        )
        
    except Exception as e:
        return jsonify({
            "error": f"Download error: {str(e)}"
        }), 500


if __name__ == "__main__":
    # Development server
    app.run(host="0.0.0.0", port=5000, debug=True)
