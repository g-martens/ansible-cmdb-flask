function findColumnIndexById(table, columnId) {
    const columns = table.settings()[0].aoColumns;
    return columns.findIndex(col => col.id === columnId);
}

function updateVersionTable(data, selectedOs = null) {
    const versions = new Map();
    
    data.forEach(row => {
        const os = row.ansible_distribution || 'Unknown';
        const version = row.ansible_distribution_version || 'Unknown';
        const key = `${os}|||${version}`;
        
        if (!versions.has(key)) {
            versions.set(key, { os, version, count: 1 });
        } else {
            versions.get(key).count++;
        }
    });

    const tbody = document.querySelector('#versionTable tbody');
    tbody.innerHTML = '';

    Array.from(versions.values())
        .filter(v => !selectedOs || v.os === selectedOs)
        .sort((a, b) => {
            if (a.os !== b.os) return a.os.localeCompare(b.os);
            return a.version.localeCompare(b.version);
        })
        .forEach(v => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${v.os}</td>
                <td>${v.version}</td>
                <td>${v.count}</td>
            `;
            
            if (selectedVersion && v.os === selectedOs && v.version === selectedVersion) {
                row.classList.add('selected');
            }

            row.addEventListener('click', () => {
                const tableData = JSON.parse(document.getElementById('table-data').textContent);
                if (selectedVersion === v.version && selectedOs === v.os) {
                    // Deselect
                    selectedVersion = null;
                    selectedOs = null;
                    document.querySelectorAll('#versionTable tr').forEach(r => r.classList.remove('selected'));
                    mainTable.columns().search('').draw();
                } else {
                    // Select new version
                    selectedVersion = v.version;
                    selectedOs = v.os;
                    document.querySelectorAll('#versionTable tr').forEach(r => r.classList.remove('selected'));
                    row.classList.add('selected');
                    
                    // Find column indices by their IDs
                    const osColumnIndex = findColumnIndexById(mainTable, 'os');
                    const versionColumnIndex = findColumnIndexById(mainTable, 'os_version');
                    
                    // Apply the filters using the correct indices
                    if (osColumnIndex !== -1 && versionColumnIndex !== -1) {
                        mainTable.column(osColumnIndex).search(`^${v.os}$`, true, false)
                                .column(versionColumnIndex).search(`^${v.version}$`, true, false)
                                .draw();
                    }
                }
                updateCharts(tableData);
            });
        });
}

function updateCharts(data) {
    if (!data) {
        return;
    }

    // Get OS distribution data
    const osData = {};
    data.forEach(row => {
        try {
            const os = row.ansible_distribution || 'Unknown';
            osData[os] = (osData[os] || 0) + 1;
        } catch (e) {
            // Silent error handling
        }
    });

    // Sort OS data by count
    const sortedOsData = Object.entries(osData)
        .sort((a, b) => b[1] - a[1]);

    // Create OS chart
    const osCtx = document.getElementById('osChart');
    if (!osCtx) {
        return;
    }

    // Destroy existing chart if it exists
    if (window.osChart && typeof window.osChart.destroy === 'function') {
        window.osChart.destroy();
    }
    
    // Create new chart
    window.osChart = new Chart(osCtx, {
        type: 'pie',
        data: {
            labels: sortedOsData.map(([os]) => os),
            datasets: [{
                data: sortedOsData.map(([, count]) => count),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            },
            onClick: (event, elements) => {
                const tableData = JSON.parse(document.getElementById('table-data').textContent);
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const os = sortedOsData[index][0];
                    
                    if (selectedOs === os) {
                        // Deselect if clicking the same OS
                        selectedOs = null;
                        selectedVersion = null;
                        mainTable.columns().search('').draw();
                    } else {
                        // Select new OS
                        selectedOs = os;
                        selectedVersion = null;
                        
                        // Find column index by ID
                        const osColumnIndex = findColumnIndexById(mainTable, 'os');
                        
                        // Apply the filter using the correct index
                        if (osColumnIndex !== -1) {
                            mainTable.column(osColumnIndex).search(`^${os}$`, true, false).draw();
                        }
                    }
                    
                    // Update version table with filtered data
                    updateVersionTable(tableData, selectedOs);
                }
            }
        }
    });

    // Update version table
    updateVersionTable(data, selectedOs);
} 