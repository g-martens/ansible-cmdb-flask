from flask import Flask, send_from_directory, render_template, send_file, request, redirect, url_for, jsonify, abort
import os
import json

app = Flask(__name__)

FACTS_DIR = './facts'

def load_all_facts():
    all_facts = []
    for filename in os.listdir(FACTS_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(FACTS_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    ansible_facts = data.get('ansible_facts', {})
                    # Add the filename without .json as a fallback for hostname
                    if 'ansible_hostname' not in ansible_facts:
                        ansible_facts['ansible_hostname'] = filename[:-5]
                    all_facts.append(ansible_facts)
                except json.JSONDecodeError as e:
                    print(f"Error loading {filename}: {e}")
                except Exception as e:
                    print(f"Unexpected error loading {filename}: {e}")
    return all_facts

def load_facts_for_host(hostname):
    for filename in os.listdir(FACTS_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(FACTS_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                facts = data.get('ansible_facts', {})
                if facts.get('ansible_hostname') == hostname or filename[:-5] == hostname:
                    return facts
    return None

@app.route('/')
def index():
    items = load_all_facts()
    return render_template('index.html', items=items)

@app.route('/host/<hostname>')
def host_detail(hostname):
    facts = load_facts_for_host(hostname)
    if not facts:
        abort(404)
    return render_template('host_detail.html', hostname=hostname, facts=facts)

@app.route('/api/facts/<hostname>', methods=['GET'])
def get_host_facts(hostname):
    filename = f"{hostname}.json"
    filepath = os.path.join(FACTS_DIR, filename)
    if os.path.isfile(filepath):
        return send_from_directory(FACTS_DIR, filename)
    return jsonify({"error": "Host not found"}), 404

@app.route('/config/<path:filename>')
def serve_config(filename):
    config_dir = os.path.join(os.path.dirname(__file__), 'config')
    return send_from_directory(config_dir, filename)

if __name__ == "__main__":
    app.run(debug=True)
