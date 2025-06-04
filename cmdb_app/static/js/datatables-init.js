let mainTable;

function applyFilter(column, value, useRegex) {
    try {
        if (!value || (Array.isArray(value) && value.length === 0)) {
            column.search('').draw();
            return true;
        }

        let searchValue;
        if (Array.isArray(value)) {
            // Handle multiple values from select2
            searchValue = value.join('|');
        } else {
            // Handle single value from text input
            searchValue = value;
        }

        // Apply search
        column.search(searchValue, useRegex, !useRegex).draw();
        return true;
    } catch (e) {
        console.error('Filter error:', e);
        return false;
    }
}

function initializeDataTable(tableData) {
    const headerRow = $('#cmdbTable thead tr.header-row');
    const filterRow = $('#cmdbTable thead tr.filter-row');
    
    // Add headers and filter cells
    tableColumns.forEach(column => {
        headerRow.append(`<th>${column.title}</th>`);
        filterRow.append('<th></th>');
    });

    mainTable = $('#cmdbTable').DataTable({
        data: tableData,
        columns: tableColumns,
        dom: 'Bfrtip',
        pageLength: 100,
        lengthChange: false,
        orderCellsTop: true,
        fixedHeader: true,
        select: {
            style: 'multi',
            selector: 'td'
        },
        buttons: [
            {
                extend: 'colvis',
                text: 'Zichtbare kolommen',
                columns: ':not(:first-child)'
            },
            {
                extend: 'csvHtml5',
                text: 'Exporteer CSV',
                title: 'CMDB_export',
                exportOptions: {
                    columns: ':visible',
                    rows: function(idx, data, node) {
                        return $(node).hasClass('selected') || mainTable.rows('.selected').nodes().length === 0;
                    },
                    format: {
                        header: function (data, columnIdx) {
                            return tableColumns[columnIdx].title;
                        }
                    }
                }
            },
            {
                extend: 'excelHtml5',
                text: 'Exporteer Excel',
                title: 'CMDB_export',
                exportOptions: {
                    columns: ':visible',
                    rows: function(idx, data, node) {
                        return $(node).hasClass('selected') || mainTable.rows('.selected').nodes().length === 0;
                    },
                    format: {
                        header: function (data, columnIdx) {
                            return tableColumns[columnIdx].title;
                        }
                    }
                }
            }
        ]
    });

    // Initialize filters in header
    $('#cmdbTable thead tr.filter-row th').each(function (i) {
        if (i === 0) {
            // Simple text filter for hostname
            $(this).html('<input type="text" class="column-filter" placeholder="Filter hostname" />');
            $('input', this).on('keyup change', function () {
                const val = this.value.trim();
                mainTable.column(i).search(val).draw();
                updateCharts(mainTable.rows({search: 'applied'}).data().toArray());
            });
        } else {
            // Create select2 dropdowns for other columns
            const select = $('<select multiple class="filter-select"></select>')
                .appendTo($(this))
                .on('change', function () {
                    const vals = $(this).val() || [];
                    const success = applyFilter(mainTable.column(i), vals, true);
                    if (success) {
                        updateCharts(mainTable.rows({search: 'applied'}).data().toArray());
                    }
                });

            // Get unique values for the column
            const uniqueValues = new Set();
            mainTable.column(i).data().each(function(d, j) {
                const value = tableColumns[i].render(d, 'filter', mainTable.row(j).data());
                if (value) uniqueValues.add(value);
            });

            // Add options to select
            Array.from(uniqueValues)
                .sort()
                .forEach(value => {
                    select.append(`<option value="${value}">${value}</option>`);
                });

            // Initialize select2
            select.select2({
                placeholder: `Filter ${tableColumns[i].title}`,
                width: '100%'
            });
        }
    });

    // Handle selection changes
    mainTable.on('select deselect', function () {
        var selectedRows = mainTable.rows('.selected').count();
        $('#selected-count').text(selectedRows + ' rijen geselecteerd');
        $('#selection-info').toggle(selectedRows > 0);
    });

    // Clear selection button
    $('#clear-selection').on('click', function() {
        mainTable.rows().deselect();
    });

    // Reset filters button
    $('#reset-filters').on('click', function () {
        $('.column-filter').val('');
        $('.filter-select').val(null).trigger('change');
        mainTable.columns().search('').draw();
        updateCharts(tableData);
    });

    // Handle rows per page change
    $('#rows-per-page').on('change', function () {
        const val = parseInt($(this).val(), 10);
        mainTable.page.len(val).draw();
    });
}

// Export the mainTable for use in other scripts
window.mainTable = mainTable; 