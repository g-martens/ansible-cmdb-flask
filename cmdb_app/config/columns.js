// Helper function to get nested object values using a path string
function jsonxs(obj, path, defaultValue = '') {
    try {
        return path.split('.').reduce((o, i) => o[i], obj) || defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

// Helper function to render a template with data
function renderTemplate(template, data) {
    // Simple template engine
    let result = template;
    
    // Replace <%= %> expressions
    result = result.replace(/<%=(.*?)%>/g, (match, expr) => {
        try {
            return eval('data.' + expr.trim()) || '';
        } catch (e) {
            return '';
        }
    });
    
    // Replace <% %> code blocks
    result = result.replace(/<%([^=].*?)%>/g, (match, code) => {
        try {
            let output = '';
            eval('with(data){' + code + '}');
            return output;
        } catch (e) {
            return '';
        }
    });
    
    return result;
}

const tableColumns = [
    {
        title: "Hostname",
        id: "hostname",
        data: null,
        sType: "string",
        visible: true,
        render: function(data, type, row) {
            try {
                const hostname = jsonxs(row, 'ansible_hostname', '');
                if (type === 'display') {
                    return `<a href="/host/${hostname}">${hostname}</a>`;
                }
                return hostname;
            } catch (e) {
                return '';
            }
        }
    },
    {
        title: "FQDN",
        id: "fqdn",
        data: null,
        sType: "string",
        visible: true,
        render: function(data, type, row) {
            try {
                return jsonxs(row, 'ansible_fqdn', '');
            } catch (e) {
                return '';
            }
        }
    },
    {
        title: "OS",
        id: "os",
        data: null,
        sType: "string",
        visible: true,
        render: function(data, type, row) {
            try {
                return jsonxs(row, 'ansible_distribution', '');
            } catch (e) {
                return '';
            }
        }
    },
    {
        title: "OS Version",
        id: "os_version",
        data: null,
        sType: "string",
        visible: true,
        render: function(data, type, row) {
            try {
                return jsonxs(row, 'ansible_distribution_version', '');
            } catch (e) {
                return '';
            }
        }
    },
    {
        title: "Architecture",
        id: "architecture",
        data: null,
        sType: "string",
        visible: true,
        render: function(data, type, row) {
            try {
                return jsonxs(row, 'ansible_architecture', '');
            } catch (e) {
                return '';
            }
        }
    },
    {
        title: "Processor Count",
        id: "processor_count",
        data: null,
        sType: "num",
        visible: true,
        render: function(data, type, row) {
            try {
                const count = jsonxs(row, 'ansible_processor_count', 0);
                if (type === 'display') {
                    return count.toString();
                }
                return count;
            } catch (e) {
                return 0;
            }
        }
    },
    {
        title: "Memory (GB)",
        id: "memory",
        data: null,
        sType: "num",
        visible: true,
        render: function(data, type, row) {
            try {
                const memMB = jsonxs(row, 'ansible_memtotal_mb', 0);
                const memGB = memMB / 1024;
                if (type === 'display') {
                    return memGB.toFixed(1);
                }
                return memGB;
            } catch (e) {
                return 0;
            }
        }
    },
    {
        title: "IP Addresses",
        id: "ip_addresses",
        data: null,
        sType: "string",
        visible: true,
        render: function(data, type, row) {
            try {
                const ipAddresses = jsonxs(row, 'ansible_all_ipv4_addresses', []);
                
                if (!Array.isArray(ipAddresses)) {
                    return '';
                }

                if (type === 'display') {
                    return ipAddresses.length > 0 
                        ? `<ul class="ip-list">${ipAddresses.map(ip => `<li>${ip}</li>`).join('')}</ul>`
                        : '';
                }
                return ipAddresses.join(', ');
            } catch (e) {
                return '';
            }
        }
    }
];

// Export for use in other scripts
window.tableColumns = tableColumns; 