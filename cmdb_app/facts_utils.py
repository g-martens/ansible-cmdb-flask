# fact_utils.py
def parse_ansible_facts(filename, ansible_facts):
    hostname = ansible_facts.get('ansible_hostname', filename[:-5])
    return {
        'hostname': hostname,
        'fqdn': ansible_facts.get('ansible_fqdn', ''),
        'ip': ', '.join(ansible_facts.get('ansible_all_ipv4_addresses', [])),
        'os': f"{ansible_facts.get('ansible_distribution', '')}",
        'os_version': ansible_facts.get('ansible_distribution_version', ''),
        'architecture': ansible_facts.get('ansible_architecture', ''),
        'cpu': ', '.join(ansible_facts.get('ansible_processor', [])),
        'memory_mb': ansible_facts.get('ansible_memtotal_mb', 0),
        'facts': ansible_facts
    }
