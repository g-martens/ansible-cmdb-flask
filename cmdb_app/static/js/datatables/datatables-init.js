// Initialize DataTable when document is ready
$(document).ready(function() {
    // Initialize DataTable with server-side processing
    mainTable = $('#cmdbTable').DataTable({
        processing: true,
        serverSide: true,
        ajax: '/api/data',
        columns: [
            {
                title: "Hostname",
                data: "ansible_hostname",
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<a href="/host/${data}">${data}</a>`;
                    }
                    return data;
                }
            },
            {
                title: "FQDN",
                data: "ansible_fqdn"
            },
            {
                title: "OS",
                data: "ansible_distribution"
            },
            {
                title: "OS Version",
                data: "ansible_distribution_version"
            },
            {
                title: "Architecture",
                data: "ansible_architecture"
            },
            {
                title: "Processor Cores",
                data: "ansible_processor_cores"
            },
            {
                title: "Memory (GB)",
                data: "ansible_memtotal_mb",
                render: function(data, type, row) {
                    if (type === 'display') {
                        return (data / 1024).toFixed(1);
                    }
                    return data;
                }
            },
            {
                title: "IP Addresses",
                data: "ansible_all_ipv4_addresses",
                render: function(data, type, row) {
                    if (type === 'display' && Array.isArray(data)) {
                        return `<ul class="ip-list">${data.map(ip => `<li>${ip}</li>`).join('')}</ul>`;
                    }
                    return Array.isArray(data) ? data.join(', ') : '';
                }
            }
        ],
        dom: 'lBfrtip',
        lengthMenu: [
            [10, 20, 50, 100, 200, 500, -1],
            ['10', '20', '50', '100', '200', '500', 'All']
        ],
        buttons: [
            {
                extend: 'copy',
                text: 'Kopieer',
                exportOptions: {
                    modifier: {
                        search: 'applied',
                        order: 'applied'
                    }
                }
            },
            {
                extend: 'csv',
                text: 'CSV',
                exportOptions: {
                    modifier: {
                        search: 'applied',
                        order: 'applied'
                    }
                }
            },
            {
                extend: 'excel',
                text: 'Excel',
                exportOptions: {
                    modifier: {
                        search: 'applied',
                        order: 'applied'
                    }
                }
            },
            {
                extend: 'colvis',
                text: 'Kolommen'
            }
        ],
        pageLength: 50,
        order: [[0, 'asc']],
        orderCellsTop: true,
        ordering: true,
        orderMulti: true,
        orderClasses: true,
        scrollX: true,
        select: true,
        language: {
            lengthMenu: "Toon _MENU_ regels per pagina",
            info: "Toont _START_ tot _END_ van _TOTAL_ regels",
            infoEmpty: "Geen resultaten gevonden",
            infoFiltered: "(gefilterd uit _MAX_ totale regels)",
            search: "Zoeken:",
            paginate: {
                first: "Eerste",
                last: "Laatste",
                next: "Volgende",
                previous: "Vorige"
            },
            sortAscending: ": activeer om kolom oplopend te sorteren",
            sortDescending: ": activeer om kolom aflopend te sorteren"
        },
        initComplete: function() {
            console.log('DataTable initialization complete');
            
            // Add filter inputs to each column
            this.api().columns().every(function(index) {
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

            // Initial chart update
            updateCharts();
        },
        drawCallback: function() {
            // Update charts when data is redrawn
            updateCharts();
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
        updateCharts();
    });
});

// Filter clearing functions
function clearOsFilter() {
    selectedOs = null;
    selectedVersion = null;
    mainTable.search('').draw();
    document.querySelectorAll('#versionTable tr').forEach(r => r.classList.remove('selected'));
    updateCharts();
}

function clearVersionFilter() {
    selectedVersion = null;
    if (selectedOs) {
        mainTable.search(selectedOs).draw();
    } else {
        mainTable.search('').draw();
    }
    document.querySelectorAll('#versionTable tr').forEach(r => r.classList.remove('selected'));
    updateCharts();
} 