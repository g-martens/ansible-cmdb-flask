let mainTable;

function initializeDataTable(data) {
    console.log('Initializing DataTable with data:', data);
    // Initialize DataTable
    mainTable = $('#cmdbTable').DataTable({
        data: data,
        columns: window.tableColumns,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel',
            {
                extend: 'colvis',
                text: 'Column Visibility'
            }
        ],
        pageLength: 25,
        order: [[0, 'asc']],
        scrollX: true,
        select: true,
        initComplete: function() {
            console.log('DataTable initialization complete');
            // Add filter inputs to each column
            this.api().columns().every(function() {
                let column = this;
                let title = $(column.header()).text();
                
                // Create input element
                let input = $('<input type="text" placeholder="Filter ' + title + '" />')
                    .appendTo($(column.footer()).empty())
                    .on('keyup change', function() {
                        if (column.search() !== this.value) {
                            column.search(this.value).draw();
                        }
                    });
            });
        }
    });

    // Handle row selection
    mainTable.on('select deselect', function() {
        let selectedRows = mainTable.rows({ selected: true }).count();
        $('#selected-count').text(selectedRows + ' rows selected');
    });

    // Clear selection button
    $('#clear-selection').on('click', function() {
        mainTable.rows().deselect();
    });

    // Reset filters button
    $('#reset-filters').on('click', function() {
        mainTable.search('').columns().search('').draw();
        $('input').val('');
        selectedOs = null;
        selectedVersion = null;
        document.querySelectorAll('#versionTable tr').forEach(r => r.classList.remove('selected'));
        updateCharts(data);
    });
} 