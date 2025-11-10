/**
 * Advanced CSV Parser for Multi-Metric Time-Series Data
 * Handles both standard CSV and semicolon-delimited compound formats
 */

export interface ParsedCSVResult {
  headers: string[];
  data: Record<string, any>[];
  isMultiMetric: boolean;
  originalFormat: 'standard' | 'compound';
}

/**
 * Detects if the CSV uses compound format (semicolon-delimited values in cells)
 */
function detectCompoundFormat(firstRow: string, secondRow: string): boolean {
  // Check if cells contain semicolons indicating multiple values
  const firstCellMatch = firstRow.match(/^[^,]*;[^,]*/);
  const secondCellMatch = secondRow.match(/^[^,]*;[^,]*/);
  
  return !!(firstCellMatch && secondCellMatch);
}

/**
 * Parse standard CSV format
 */
function parseStandardCSV(csvText: string): ParsedCSVResult {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const data = lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line);
    const row: Record<string, any> = {};
    
    headers.forEach((header, i) => {
      if (i < values.length) {
        const value = values[i];
        // Try to convert to number if possible
        const numValue = parseFloat(value);
        row[header] = isNaN(numValue) ? value : numValue;
      }
    });
    
    return row;
  }).filter(row => Object.keys(row).length > 0);
  
  return {
    headers,
    data,
    isMultiMetric: false,
    originalFormat: 'standard',
  };
}

/**
 * Parse compound CSV format (semicolon-delimited values within cells)
 */
function parseCompoundCSV(csvText: string): ParsedCSVResult {
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('Invalid CSV format: Not enough rows');
  }
  
  // Parse first row to extract compound headers
  const firstRow = parseCSVLine(lines[0]);
  const compoundHeaders: string[] = [];
  
  firstRow.forEach((cell, cellIndex) => {
    if (cell.includes(';')) {
      // Split semicolon-delimited headers
      const subHeaders = cell.split(';').map(h => h.trim());
      compoundHeaders.push(...subHeaders);
    } else {
      compoundHeaders.push(cell.trim());
    }
  });
  
  // Clean up headers (remove duplicates by appending index if needed)
  const headers = cleanHeaders(compoundHeaders);
  
  // Parse data rows
  const data: Record<string, any>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = parseCSVLine(line);
    const row: Record<string, any> = {};
    let headerIndex = 0;
    
    cells.forEach((cell, cellIndex) => {
      if (cell.includes(';')) {
        // Split semicolon-delimited values
        const values = cell.split(';').map(v => v.trim());
        values.forEach(value => {
          if (headerIndex < headers.length) {
            const numValue = parseFloat(value);
            row[headers[headerIndex]] = isNaN(numValue) ? value : numValue;
            headerIndex++;
          }
        });
      } else {
        if (headerIndex < headers.length) {
          const value = cell.trim();
          // Check if it's a timestamp or date
          if (cellIndex === 0 && (value.includes('/') || value.includes(':') || value.includes('-'))) {
            row[headers[headerIndex]] = value;
          } else {
            const numValue = parseFloat(value);
            row[headers[headerIndex]] = isNaN(numValue) ? value : numValue;
          }
          headerIndex++;
        }
      }
    });
    
    if (Object.keys(row).length > 0) {
      data.push(row);
    }
  }
  
  return {
    headers,
    data,
    isMultiMetric: true,
    originalFormat: 'compound',
  };
}

/**
 * Clean and deduplicate headers
 */
function cleanHeaders(headers: string[]): string[] {
  const cleaned: string[] = [];
  const seen = new Map<string, number>();
  
  headers.forEach(header => {
    let cleanHeader = header.trim();
    
    // Remove common prefixes if they make the header too long
    cleanHeader = cleanHeader.replace(/^IOITSecure\d+\s*>\s*/g, '');
    
    // Handle duplicates
    if (seen.has(cleanHeader)) {
      const count = seen.get(cleanHeader)! + 1;
      seen.set(cleanHeader, count);
      cleanHeader = `${cleanHeader} ${count}`;
    } else {
      seen.set(cleanHeader, 1);
    }
    
    cleaned.push(cleanHeader);
  });
  
  return cleaned;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result.map(cell => cell.replace(/^"|"$/g, '').trim());
}

/**
 * Main CSV parser that auto-detects format
 */
export function parseCSV(csvText: string): ParsedCSVResult {
  if (!csvText || csvText.trim().length === 0) {
    throw new Error('Empty CSV content');
  }
  
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }
  
  // Detect format
  const isCompound = detectCompoundFormat(lines[0], lines[1]);
  
  try {
    if (isCompound) {
      return parseCompoundCSV(csvText);
    } else {
      return parseStandardCSV(csvText);
    }
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate CSV content before parsing
 */
export function validateCSV(file: File): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ valid: false, error: 'No file provided' });
      return;
    }
    
    if (!file.name.endsWith('.csv')) {
      resolve({ valid: false, error: 'File must be a CSV file' });
      return;
    }
    
    if (file.size === 0) {
      resolve({ valid: false, error: 'File is empty' });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      resolve({ valid: false, error: 'File size must be less than 10MB' });
      return;
    }
    
    resolve({ valid: true });
  });
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  try {
    // Handle various timestamp formats
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      return timestamp;
    }
    
    // Return formatted timestamp
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

/**
 * Group metrics by category (e.g., Voltage, PF, etc.)
 */
export function groupMetricsByCategory(headers: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  
  headers.forEach(header => {
    let category = 'Other';
    
    if (header.includes('Voltage')) {
      category = 'Voltage';
    } else if (header.includes('PF') || header.includes('Power Factor')) {
      category = 'Power Factor';
    } else if (header.includes('Current')) {
      category = 'Current';
    } else if (header.includes('Power')) {
      category = 'Power';
    } else if (header.includes('TIME') || header.includes('Time')) {
      category = 'Time';
    }
    
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(header);
  });
  
  return groups;
}
