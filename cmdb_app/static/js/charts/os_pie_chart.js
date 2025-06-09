function renderOsPieChart(items) {
    const osCounts = {};
    items.forEach(item => {
        const os = item.os || 'Onbekend';
        osCounts[os] = (osCounts[os] || 0) + 1;
    });

    const osLabels = Object.keys(osCounts);
    const osData = Object.values(osCounts);

    const ctx = document.getElementById('osPieChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: osLabels,
            datasets: [{
                label: 'Aantal systemen',
                data: osData,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: false
                }
            }
        }
    });
}
