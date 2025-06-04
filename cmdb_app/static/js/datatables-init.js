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

function convertToRegex(input) {
    // Escape special regex characters except * and |
    let regex = input.replace(/[.+?^${}()\[\]\\]/g, '\\$&');
    
    // Convert * to .*
    regex = regex.replace(/\*/g, '.*');
    
    return regex;
}

function initializeDataTable(data) {
    console.log('Initializing DataTable with data:', data);

    // Create DataTable
    window.mainTable = $('#cmdbTable').DataTable({
        data: data,
        columns: window.tableColumns,
        pageLength: 100,
        dom: 'Blfrtip',
        buttons: [
            'copy', 'csv', 'excel',
            {
                extend: 'colvis',
                columns: ':not(.noVis)'
            }
        ],
        order: [[0, 'asc']],
        select: true,
        initComplete: function() {
            const api = this.api();
            
            // Add header cells first
            $('.header-row').html(
                window.tableColumns.map(col => 
                    `<th>${col.title || ''}</th>`
                ).join('')
            );

            // Setup filters for each column
            api.columns().every(function(columnIndex) {
                const column = this;
                const columnDef = window.tableColumns[columnIndex];
                
                // Skip columns that shouldn't have filters
                if (columnDef && columnDef.noFilter) {
                    return;
                }

                // Create filter cell
                const filterCell = $('<td></td>');
                
                // Create and append filter input
                const input = $('<input type="text" class="column-filter" placeholder="Filter... (use * for wildcard)">')
                    .appendTo(filterCell);

                // Handle input events
                input.on('keyup change', function() {
                    if (column.search() !== this.value) {
                        try {
                            const regexValue = convertToRegex(this.value);
                            column.search(regexValue, true, false).draw();
                        } catch (e) {
                            console.error('Search error:', e);
                            // Invalid regex - don't update the search
                            $(this).addClass('invalid-regex');
                            return;
                        }
                        $(this).removeClass('invalid-regex');
                    }
                });

                // Add filter cell to filter row
                $('.filter-row').append(filterCell);
            });
        }
    });

    // Handle row selection
    const $selectionInfo = $('#selection-info');
    const $selectedCount = $('#selected-count');
    
    window.mainTable.on('select deselect', function() {
        const selectedRows = window.mainTable.rows({ selected: true }).count();
        $selectedCount.text(`${selectedRows} ${selectedRows === 1 ? 'rij' : 'rijen'} geselecteerd`);
        $selectionInfo.toggle(selectedRows > 0);
    });

    // Clear selection button
    $('#clear-selection').on('click', function() {
        window.mainTable.rows().deselect();
    });

    // Reset filters button
    $('#reset-filters').on('click', function() {
        // Clear all filter inputs
        $('.column-filter').val('');
        // Clear DataTable search
        window.mainTable.search('').columns().search('').draw();
        // Clear OS and version filters
        selectedOs = null;
        selectedVersion = null;
        // Update charts
        updateCharts(data);
        // Remove selection from version table
        document.querySelectorAll('#versionTable tr').forEach(r => r.classList.remove('selected'));
    });
} 