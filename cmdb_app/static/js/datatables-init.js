let mainTable;

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
            // Special handling for hostname column
            $(this).html('<input type="text" class="column-filter" placeholder="Filter hostname" />');
            $('input', this).on('keyup change', function () {
                const val = this.value;
                const useRegex = $('#use-regex').is(':checked');
                if (mainTable.column(i).search() !== val) {
                    mainTable.column(i).search(val, useRegex, !useRegex).draw();
                }
                updateCharts(mainTable.rows({search: 'applied'}).data().toArray());
            });
        } else {
            // Create select2 dropdowns for other columns
            const select = $('<select multiple class="filter-select"></select>')
                .appendTo($(this))
                .on('change', function () {
                    const vals = $(this).val() || [];
                    const useRegex = $('#use-regex').is(':checked');
                    
                    let searchValue = '';
                    if (vals.length > 0) {
                        if (useRegex) {
                            searchValue = vals.join('|');
                        } else {
                            searchValue = vals.map(v => `^${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).join('|');
                        }
                    }
                    
                    mainTable.column(i).search(searchValue, true, !useRegex).draw();
                    updateCharts(mainTable.rows({search: 'applied'}).data().toArray());
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

    // Handle regex checkbox change
    $('#use-regex').on('change', function () {
        // Re-apply all current filters with new regex setting
        const useRegex = $(this).is(':checked');
        
        // Update hostname filter
        const hostnameVal = $('.column-filter').val();
        if (hostnameVal) {
            mainTable.column(0).search(hostnameVal, useRegex, !useRegex);
        }

        // Update all select2 filters
        $('.filter-select').each(function(i) {
            const vals = $(this).val() || [];
            if (vals.length > 0) {
                const searchValue = useRegex ? vals.join('|') : vals.map(v => `^${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).join('|');
                mainTable.column(i + 1).search(searchValue, true, !useRegex);
            }
        });

        mainTable.draw();
        updateCharts(mainTable.rows({search: 'applied'}).data().toArray());
    });

    // Reset filters button
    $('#reset-filters').on('click', function () {
        $('#hostname-regex').val('');
        $('.filter-select').val(null).trigger('change');
        $('#use-regex').prop('checked', false);
        selectedOs = null;
        selectedVersion = null;
        mainTable.columns().search('').draw();
        updateCharts(tableData);
    });

    // Handle rows per page change
    $('#rows-per-page').on('change', function () {
        const val = parseInt($(this).val(), 10);
        mainTable.page.len(val).draw();
    });

    // Handle hostname regex filter
    $('#hostname-regex').on('keyup change', function () {
        const val = this.value;
        const useRegex = $('#use-regex').is(':checked');
        mainTable.column(0).search(val, useRegex, !useRegex).draw();
        updateCharts(mainTable.rows({search: 'applied'}).data().toArray());
    });
}

// Export the mainTable for use in other scripts
window.mainTable = mainTable; 