# Ansible CMDB Flask Application Documentation

This documentation explains how to set up, run, and customize the Ansible CMDB Flask application.

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Customization](#customization)
  - [Columns Configuration](#columns-configuration)
  - [Custom Styling](#custom-styling)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ansible-cmdb-flask
   ```

2. Create a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

The application uses configuration files located in the `config` folder:

### columns.js
This file defines which Ansible facts are displayed in the table and how they are rendered. The configuration is an array of column definitions:

```javascript
const tableColumns = [
    {
        title: "Column Title",    // Display name in table header
        id: "column_id",         // Unique identifier for the column
        data: null,             // Leave as null for custom rendering
        sType: "string",        // Data type (string, number, etc.)
        visible: true,          // Whether column is visible by default
        render: function(data, type, row) {
            // Custom rendering function
            return jsonxs(row, 'ansible_fact_path', '');
        }
    }
]
```

To add a new column:
1. Add a new object to the `tableColumns` array
2. Specify the title and unique ID
3. Use the `render` function to extract and format the desired Ansible fact
4. Use `jsonxs()` to safely access nested fact data

### custom.css
You can add custom CSS styles in `config/custom.css` to override the default styling:

```css
/* Example customizations */
.header {
    background-color: #your-color;
}

.table {
    font-size: your-size;
}
```

## Running the Application

1. Ensure your Ansible facts are in the correct location (default: `facts` directory)

2. Start the Flask application:
   ```bash
   python app.py
   ```

3. Access the application in your web browser at `http://localhost:5000`

## Customization

### Columns Configuration

The table columns can be customized in `config/columns.js`. Each column object supports:

- `title`: Display name in the table header
- `id`: Unique identifier for the column
- `visible`: Whether the column is visible by default
- `render`: Function to extract and format data from Ansible facts
- `noFilter`: Set to true to disable filtering for this column
- `sType`: Data type for sorting (string, number, etc.)

Example adding a custom column:
```javascript
{
    title: "Memory",
    id: "memory",
    data: null,
    visible: true,
    render: function(data, type, row) {
        const memMB = jsonxs(row, 'ansible_memtotal_mb', 0);
        return `${memMB} MB`;
    }
}
```

### Custom Styling

The application's appearance can be customized through:

1. `config/custom.css` - For custom CSS overrides
2. `cmdb_app/static/css/style.css` - Main application styles
3. `cmdb_app/static/css/datatables.css` - DataTables-specific styles

## Features

- Regular expression filtering in all columns
  - Use `*` as wildcard (e.g., `ubuntu*` matches anything starting with "ubuntu")
  - Use `|` for OR operations (e.g., `ubuntu|debian`)
- Interactive charts showing OS distribution
- Exportable data (CSV, Excel)
- Responsive design
- Column visibility toggle
- Detailed host information pages

## Troubleshooting

Common issues and solutions:

1. **No data showing in table**
   - Check if Ansible facts are present in the correct directory
   - Verify file permissions

2. **Charts not updating**
   - Clear browser cache
   - Check browser console for JavaScript errors

3. **Filters not working**
   - Ensure valid regular expressions
   - Check browser console for errors

## Support

For issues and feature requests, please create an issue in the repository's issue tracker. 