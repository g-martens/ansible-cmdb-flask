// Helper function to get nested object values using a path string
function jsonxs(obj, path, defaultValue = '') {
    try {
        return path.split('.').reduce((o, i) => o[i], obj) || defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

// Helper function to render a template with data
function renderTemplate(template, data) {
    // Simple template engine
    let result = template;
    
    // Replace <%= %> expressions
    result = result.replace(/<%=(.*?)%>/g, (match, expr) => {
        try {
            return eval('data.' + expr.trim()) || '';
        } catch (e) {
            return '';
        }
    });
    
    // Replace <% %> code blocks
    result = result.replace(/<%([^=].*?)%>/g, (match, code) => {
        try {
            let output = '';
            eval('with(data){' + code + '}');
            return output;
        } catch (e) {
            console.error('Template error:', e);
            return '';
        }
    });
    
    return result;
}

// Export for use in other scripts
window.jsonxs = jsonxs;
window.renderTemplate = renderTemplate; 