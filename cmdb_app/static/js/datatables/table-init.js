$(document).ready(function() {
    // Get the table data
    const tableData = JSON.parse(document.getElementById('table-data').textContent);
    console.log('Loaded table data:', tableData);

    // Initialize DataTable
    window.mainTable = $('#cmdbTable').DataTable({
        data: tableData,
        columns: window.tableColumns,
        dom: 'Blfrtip',
        buttons: [
            'copy', 'csv', 'excel',
            {
                extend: 'colvis',
                columns: ':not(.noVis)'
            }
        ],
        pageLength: 25,
        order: [[0, 'asc']],
        select: true
    });

    // Initialize charts with the full dataset
    updateCharts(tableData);

    // Update charts when table is filtered
    mainTable.on('search.dt', function() {
        const filteredData = mainTable.rows({ search: 'applied' }).data().toArray();
        updateCharts(filteredData);
    });
}); 