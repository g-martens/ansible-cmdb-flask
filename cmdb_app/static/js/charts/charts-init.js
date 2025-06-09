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
                if (selectedVersion === v.version && selectedOs === v.os) {
                    // Deselect
                    selectedVersion = null;
                    selectedOs = null;
                    document.querySelectorAll('#versionTable tr').forEach(r => r.classList.remove('selected'));
                    mainTable.search('').draw();
                } else {
                    // Select new version
                    selectedVersion = v.version;
                    selectedOs = v.os;
                    document.querySelectorAll('#versionTable tr').forEach(r => r.classList.remove('selected'));
                    row.classList.add('selected');
                    
                    // Create the search term with exact OS and version
                    const searchTerm = `${v.os}|||${v.version}`;
                    console.log('Applying version filter:', searchTerm);  // Debug log
                    mainTable.search(searchTerm).draw();
                }
            });
        });
}

function updateCharts() {
    // Get current search parameters
    const currentSearch = mainTable.search();
    console.log('Current search:', currentSearch);  // Debug log
    
    // Fetch all data for charts
    $.get('/api/data', { 
        draw: 1, 
        start: 0, 
        length: -1,
        search: { value: currentSearch }
    }, function(response) {
        const data = response.data;
        
        if (!data || !Array.isArray(data)) {
            console.error('Invalid data received:', data);
            return;
        }

        // Get OS distribution data
        const osData = {};
        data.forEach(row => {
            try {
                const os = row.ansible_distribution || 'Unknown';
                osData[os] = (osData[os] || 0) + 1;
            } catch (e) {
                console.error('Error processing row:', e);
            }
        });

        // Sort OS data by count
        const sortedOsData = Object.entries(osData)
            .sort((a, b) => b[1] - a[1]);

        // Create OS chart
        const osCtx = document.getElementById('osChart');
        if (!osCtx) {
            console.error('Chart canvas not found');
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
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const os = sortedOsData[index][0];
                        
                        if (selectedOs === os) {
                            // Deselect if clicking the same OS
                            selectedOs = null;
                            selectedVersion = null;
                            mainTable.search('').draw();
                        } else {
                            // Select new OS
                            selectedOs = os;
                            selectedVersion = null;
                            console.log('Applying OS filter:', os);  // Debug log
                            mainTable.search(os).draw();
                        }
                        
                        // Update version table with filtered data
                        updateVersionTable(data, selectedOs);
                    }
                }
            }
        });

        // Update version table
        updateVersionTable(data, selectedOs);
    });
} 