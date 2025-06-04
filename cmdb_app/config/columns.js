const tableColumns = [
    {
        data: null,
        title: 'Hostname',
        visible: true,
        render: (data, type, row) => {
            const hostname = row.ansible_hostname || '';
            if (type === 'display') {
                return `<a href="/host/${hostname}">${hostname}</a>`;
            }
            return hostname;
        }
    },
    {
        data: null,
        title: 'FQDN',
        visible: true,
        render: (data, type, row) => {
            return row.ansible_fqdn || 'Unknown';
        }
    },
    {
        data: null,
        title: 'OS Family',
        visible: true,
        render: (data, type, row) => {
            return row.ansible_distribution || 'Unknown';
        }
    },
    {
        data: null,
        title: 'OS Version',
        visible: true,
        render: (data, type, row) => {
            return row.ansible_distribution_version || 'Unknown';
        }
    },
    {
        data: null,
        title: 'Memory (MB)',
        visible: true,
        render: (data, type, row) => {
            const memory = row.ansible_memtotal_mb || 0;
            if (type === 'filter' || type === 'sort') {
                return memory;
            }
            return memory.toLocaleString();
        }
    },
    {
        data: null,
        title: 'CPU Cores',
        visible: true,
        render: (data, type, row) => {
            const cores = row.ansible_processor_cores || 0;
            if (type === 'filter' || type === 'sort') {
                return cores;
            }
            return cores.toString();
        }
    },
    {
        data: null,
        title: 'IP Address',
        visible: true,
        render: (data, type, row) => {
            const addresses = row.ansible_all_ipv4_addresses;
            if (!addresses) return '';
            if (Array.isArray(addresses)) {
                if (type === 'filter' || type === 'sort') {
                    return addresses.join(' ');
                }
                return addresses.join(', ');
            }
            return addresses;
        }
    }
]; 