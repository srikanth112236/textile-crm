/**
 * Export utility functions for CSV/Excel export
 */

export interface ExportData {
  [key: string]: string | number | undefined | null;
}

/**
 * Convert data array to CSV string
 */
export function convertToCSV(data: ExportData[], headers: string[]): string {
  // Create CSV header row
  const headerRow = headers.map((header) => `"${header}"`).join(',');

  // Create CSV data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '""';
        // Escape quotes and wrap in quotes
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV file
 */
export function exportToCSV(
  data: ExportData[],
  headers: { key: string; label: string }[],
  filename: string
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const headerLabels = headers.map((h) => h.label);
  const headerKeys = headers.map((h) => h.key);
  const csvData = data.map((row) => {
    const mappedRow: ExportData = {};
    headerKeys.forEach((key) => {
      mappedRow[key] = row[key];
    });
    return mappedRow;
  });

  const csvContent = convertToCSV(csvData, headerLabels);
  downloadCSV(csvContent, filename);
}

