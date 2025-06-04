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
                    mainTable.column(1).search('').column(2).search('').draw();
                } else {
                    // Select new version
                    selectedVersion = v.version;
                    selectedOs = v.os;
                    document.querySelectorAll('#versionTable tr').forEach(r => r.classList.remove('selected'));
                    row.classList.add('selected');
                    mainTable.column(1).search(`^${v.os}$`, true, false)
                           .column(2).search(`^${v.version}$`, true, false)
                           .draw();
                }
                updateCharts();
            });
        });
}

function updateCharts(filteredData = null) {
    const data = filteredData || JSON.parse(document.getElementById('table-data').textContent);
    
    // Count OS distributions
    const osCounts = new Map();
    data.forEach(row => {
        const os = row.ansible_distribution || 'Unknown';
        osCounts.set(os, (osCounts.get(os) || 0) + 1);
    });

    // Update pie chart
    if (osChart) {
        osChart.destroy();
    }

    const osLabels = Array.from(osCounts.keys());
    const osData = Array.from(osCounts.values());
    const colors = osLabels.map((_, i) => `hsl(${i * 360 / osLabels.length}, 70%, 60%)`);

    osChart = new Chart(document.getElementById('osChart'), {
        type: 'pie',
        data: {
            labels: osLabels,
            datasets: [{
                data: osData,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const os = osLabels[index];
                    
                    if (selectedOs === os) {
                        // Deselect
                        selectedOs = null;
                        selectedVersion = null;
                        mainTable.column(1).search('').draw();
                    } else {
                        // Select new OS
                        selectedOs = os;
                        selectedVersion = null;
                        mainTable.column(1).search(`^${os}$`, true, false).draw();
                    }
                    
                    updateVersionTable(data, selectedOs);
                }
            }
        }
    });

    // Update version table
    updateVersionTable(data, selectedOs);
} 