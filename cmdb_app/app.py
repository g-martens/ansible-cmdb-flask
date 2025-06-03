from flask import Flask, send_from_directory, render_template, send_file, request, redirect, url_for
import os
import json
import pandas as pd
from facts_utils import parse_ansible_facts

app = Flask(__name__)

FACTS_DIR = './facts'

def load_all_facts():
    all_facts = []
    for filename in os.listdir(FACTS_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(FACTS_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                ansible_facts = data.get('ansible_facts', {})
                all_facts.append(parse_ansible_facts(filename, ansible_facts))  # gebruik de helper
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


if __name__ == "__main__":
    app.run(debug=True)
