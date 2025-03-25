/**
 * Utility functions for exporting data to CSV format
 */

/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers (if not provided, will use object keys)
 * @returns CSV formatted string
 */
export function convertToCSV(data: any[], headers?: string[]) {
    if (data.length === 0) return ""
  
    // If headers are not provided, use the keys from the first object
    const columnHeaders = headers || Object.keys(data[0])
  
    // Create header row
    let csvContent = columnHeaders.join(",") + "\n"
  
    // Add data rows
    data.forEach((item) => {
      const row = columnHeaders.map((header) => {
        // Get the value for this header
        const value = header.includes(".") ? header.split(".").reduce((obj, key) => obj && obj[key], item) : item[header]
  
        // Format the value for CSV
        const formattedValue = formatValueForCSV(value)
        return formattedValue
      })
  
      csvContent += row.join(",") + "\n"
    })
  
    return csvContent
  }
  
  /**
   * Format a value for CSV to handle special characters
   * @param value Value to format
   * @returns Formatted value
   */
  function formatValueForCSV(value: any): string {
    if (value === null || value === undefined) return ""
  
    // Convert to string
    const stringValue = String(value)
  
    // If the value contains commas, quotes, or newlines, wrap it in quotes
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      // Double up any quotes to escape them
      return `"${stringValue.replace(/"/g, '""')}"`
    }
  
    return stringValue
  }
  
  /**
   * Download data as a CSV file
   * @param csvContent CSV content to download
   * @param filename Filename for the downloaded file
   */
  export function downloadCSV(csvContent: string, filename: string) {
    // Create a blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  
    // Create a download link
    const link = document.createElement("a")
  
    // Create a URL for the blob
    const url = URL.createObjectURL(blob)
  
    // Set link properties
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
  
    // Add link to document
    document.body.appendChild(link)
  
    // Click the link to trigger download
    link.click()
  
    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  /**
   * Export data to CSV and download
   * @param data Data to export
   * @param filename Filename for the downloaded file
   * @param headers Optional custom headers
   */
  export function exportToCSV(data: any[], filename: string, headers?: string[]) {
    const csvContent = convertToCSV(data, headers)
    downloadCSV(csvContent, filename)
  }
  
  