/**
 * Parse a date string that could be in various formats and return a Date object
 * Supports: DD.MM.YYYY, YYYY-MM-DD, YYYY/MM/DD
 */
export function parseFlexibleDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        return new Date(0); // Return epoch if invalid
    }

    // Finnish format: DD.MM.YYYY
    if (dateStr.includes('.')) {
        const [day, month, year] = dateStr.split('.').map(Number);
        if (day && month && year) {
            return new Date(year, month - 1, day);
        }
    }

    // ISO format: YYYY-MM-DD or YYYY/MM/DD
    if (dateStr.includes('-') || dateStr.includes('/')) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    // Fallback to default parsing
    return new Date(dateStr);
}

/**
 * Sort array of objects by date property in descending order (newest first)
 * Handles Finnish date format (DD.MM.YYYY) and other formats
 */
export function sortByDate(array, dateProperty = 'date') {
    return array.sort((a, b) => {
        const dateA = parseFlexibleDate(a[dateProperty]);
        const dateB = parseFlexibleDate(b[dateProperty]);
        return dateB - dateA; // Descending order
    });
}
