from flask import Flask, send_from_directory, render_template, send_file, request, redirect, url_for, jsonify, abort
import os
import json
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from cachetools import TTLCache
from threading import Lock
import time
import re

app = Flask(__name__)

FACTS_DIR = './facts'
# Cache facts for 5 minutes
facts_cache = TTLCache(maxsize=1000, ttl=300)
cache_lock = Lock()

class FactsEventHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            clear_cache()
    
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            clear_cache()
    
    def on_deleted(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            clear_cache()

def clear_cache():
    with cache_lock:
        facts_cache.clear()

def setup_file_monitoring():
    event_handler = FactsEventHandler()
    observer = Observer()
    observer.schedule(event_handler, FACTS_DIR, recursive=False)
    observer.start()
    return observer

def load_all_facts():
    with cache_lock:
        if 'all_facts' in facts_cache:
            return facts_cache['all_facts']
        
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
        
        facts_cache['all_facts'] = all_facts
        return all_facts

def load_facts_for_host(hostname):
    all_facts = load_all_facts()
    for facts in all_facts:
        if facts.get('ansible_hostname') == hostname:
            return facts
    return None

def filter_data(data, search_value):
    """Filter data based on search value."""
    if not search_value:
        return data
    
    filtered = []
    search_terms = search_value.lower().split('|||')
    
    for item in data:
        if len(search_terms) == 2:  # OS and Version filter
            os_name, version = search_terms
            os_name = os_name.strip()
            version = version.strip()
            item_os = str(item.get('ansible_distribution', '')).lower().strip()
            item_version = str(item.get('ansible_distribution_version', '')).lower().strip()
            
            if item_os == os_name and item_version == version:
                filtered.append(item)
        else:  # Single term search
            search_term = search_terms[0].strip()
            
            # Check if this is an exact OS match first
            item_os = str(item.get('ansible_distribution', '')).lower().strip()
            if item_os == search_term:
                filtered.append(item)
                continue
            
            # If not an exact OS match, do a general search
            found = False
            for key in ['ansible_hostname', 'ansible_fqdn', 'ansible_distribution', 
                       'ansible_distribution_version', 'ansible_architecture']:
                value = str(item.get(key, '')).lower()
                if search_term in value:
                    found = True
                    break
            
            # Check IP addresses
            if not found:
                ip_addresses = item.get('ansible_all_ipv4_addresses', [])
                if any(search_term in str(ip).lower() for ip in ip_addresses):
                    found = True
            
            if found:
                filtered.append(item)
    
    return filtered

def natural_sort_key(s):
    """
    Natural sort key function that splits strings into text and numeric parts.
    For example: "host11" becomes ["host", 11] for proper numeric comparison.
    """
    convert = lambda text: int(text) if text.isdigit() else text.lower()
    return [convert(c) for c in re.split('([0-9]+)', str(s))]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    # Get DataTables parameters
    draw = int(request.args.get('draw', 1))
    start = int(request.args.get('start', 0))
    length = int(request.args.get('length', 10))
    search_value = request.args.get('search[value]', '')
    
    # Get sorting parameters
    order_column = request.args.get('order[0][column]', '0')
    order_dir = request.args.get('order[0][dir]', 'asc')
    columns = [
        'ansible_hostname',
        'ansible_fqdn',
        'ansible_distribution',
        'ansible_distribution_version',
        'ansible_architecture',
        'ansible_processor_cores',
        'ansible_memtotal_mb',
        'ansible_all_ipv4_addresses'
    ]
    # Define numeric columns
    numeric_columns = {
        'ansible_processor_cores',
        'ansible_memtotal_mb'
    }
    
    sort_column = columns[int(order_column)]
    
    # Load all facts
    all_facts = load_all_facts()
    
    # Apply search filter
    filtered_data = filter_data(all_facts, search_value)
    
    # Apply sorting
    def sort_key(item):
        value = item.get(sort_column)
        
        # Handle numeric columns
        if sort_column in numeric_columns:
            try:
                # Convert to float for numeric comparison
                return float(value) if value is not None else float('-inf')
            except (ValueError, TypeError):
                return float('-inf')
        
        # Handle lists (like IP addresses)
        if isinstance(value, list):
            return str(value[0]) if value else ''
            
        # Handle version strings
        if sort_column == 'ansible_distribution_version':
            # Split version into numeric parts
            try:
                return [int(x) for x in str(value).split('.')]
            except (ValueError, AttributeError):
                return [0]
        
        # Handle hostname with natural sorting
        if sort_column == 'ansible_hostname':
            return natural_sort_key(value)
                
        # Default string handling
        return str(value) if value is not None else ''
    
    filtered_data.sort(key=sort_key, reverse=(order_dir == 'desc'))
    
    # Calculate total and filtered record counts
    total_records = len(all_facts)
    total_filtered = len(filtered_data)
    
    # Handle length = -1 (all records)
    if length == -1:
        paginated_data = filtered_data
    else:
        # Paginate the results
        paginated_data = filtered_data[start:start + length]
    
    return jsonify({
        'draw': draw,
        'recordsTotal': total_records,
        'recordsFiltered': total_filtered,
        'data': paginated_data
    })

@app.route('/host/<hostname>')
def host_detail(hostname):
    facts = load_facts_for_host(hostname)
    if not facts:
        abort(404)
    # Ensure proper JSON formatting
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
    observer = setup_file_monitoring()
    try:
        app.run(host='0.0.0.0', port=5000)
    finally:
        observer.stop()
        observer.join()
