# CSV Format Support Guide

## Overview

The CSV Visualizer now supports **two types of CSV formats**:

1. **Standard CSV** - Traditional comma-separated values
2. **Multi-Metric Compound CSV** - Semicolon-delimited values within cells (like your IoT sensor data)

---

## Supported Formats

### 1. Standard CSV Format

Traditional CSV format with one value per column.

**Example:**
```csv
Date,Temperature,Humidity,Pressure
2025-01-01,23.5,65,1013
2025-01-02,24.1,63,1015
2025-01-03,22.8,68,1012
```

**Characteristics:**
- Simple comma-separated structure
- One header per column
- One value per cell
- Standard format used by Excel, Google Sheets, etc.

---

### 2. Multi-Metric Compound CSV Format

Advanced format where multiple metrics are combined in single cells using semicolons.

**Example (IoT Sensor Data):**
```csv
TIME;IOITSecure447 > R Ph Voltage;IOITSecure447 > Y Ph Voltage;IOITSecure447 > B Ph Voltage;IOITSecure447 > R-PF;IOITSecure447 > Y-PF;IOITSecure447 > B-PF
06/09/2025 00:00:00,235,21;236,38;236,35;236,06;0.933;0.850;0.998
06/09/2025 00:00:03,235,47;236,38;236,35;236,06;0.930;0.851;0.998
06/09/2025 00:00:06,235,26;236,14;236,17;236,23;0.933;0.851;0.998
```

**Characteristics:**
- First cell contains semicolon-delimited header names
- Each data row has semicolon-delimited values matching the header structure
- Commonly used in industrial IoT systems, power monitoring, and multi-sensor data logging
- Supports timestamp/date columns

---

## How the Parser Works

### Automatic Format Detection

The parser automatically detects which format your CSV uses:

1. **Checks the first two rows** for semicolon patterns
2. **If semicolons are found** in both header and data rows → Multi-Metric mode
3. **Otherwise** → Standard CSV mode

### Multi-Metric Parsing Process

For compound format CSVs:

1. **Split Headers**: `TIME;Voltage;Current;Power` → `["TIME", "Voltage", "Current", "Power"]`
2. **Clean Headers**: Removes redundant prefixes (e.g., "IOITSecure447 >") for readability
3. **Handle Duplicates**: Appends numbers to duplicate headers (e.g., "Voltage 1", "Voltage 2")
4. **Split Data**: Each row's values are split by semicolon and matched to headers
5. **Type Detection**: Automatically converts numeric strings to numbers
6. **Date Detection**: Identifies timestamp/date columns for time-series features

---

## Features for Multi-Metric Data

### 1. Metric Categorization

Automatically groups metrics into categories:

- **Voltage** - Metrics containing "Voltage"
- **Power Factor** - Metrics with "PF" or "Power Factor"
- **Current** - Metrics containing "Current"
- **Power** - Metrics with "Power" (excluding Power Factor)
- **Frequency** - Metrics with "Frequency"
- **Time** - Timestamp columns

### 2. Smart Y-Axis Selection

When viewing charts, metrics are grouped by category in the Y-axis dropdown for easier navigation:

```
Voltage
├─ R Ph Voltage
├─ Y Ph Voltage
└─ B Ph Voltage

Power Factor
├─ R-PF
├─ Y-PF
└─ B-PF
```

### 3. Time-Based Grouping

For time-series data with timestamps:

- **Days** - Group by day of week (Mon, Tue, Wed...)
- **Weeks** - Group by week number (Week 1, Week 2...)
- **Months** - Group by month (Jan, Feb, Mar...)

Aggregation methods:
- **Sum** - Add all values in the time period
- **Average** - Calculate mean
- **Count** - Count occurrences

### 4. Multi-Metric Visualization

- **Info Banner** shows when multi-metric data is loaded
- **Category Grouping** in axis selectors
- **Smart Defaults** - Automatically selects time column for X-axis and voltage/primary metric for Y-axis
- **Multi-Series Charts** - Compare up to 3 metrics simultaneously

---

## Your Specific CSV Format

Based on your image, your CSV has:

**Header Structure:**
```
TIME;IOITSecure447 > R Ph Voltage;IOITSecure447 > Y Ph Voltage;IOITSecure447 > B Ph Voltage;IOITSecure447 > Average Phase Voltage;IOITSecure447 > R-PF;IOITSecure447 > Y-PF;IOITSecure447 > B-PF
```

**After Parsing, Headers Become:**
```
TIME
R Ph Voltage
Y Ph Voltage
B Ph Voltage
Average Phase Voltage
R-PF
Y-PF
B-PF
```

**Data Rows:**
Each row has a timestamp followed by semicolon-separated values:
```
06/09/2025 00:00:00,235,21;236,38;236,35;236,06;0.933;0.850;0.998
```

**Becomes:**
```json
{
  "TIME": "06/09/2025 00:00:00",
  "R Ph Voltage": 235.21,
  "Y Ph Voltage": 236.38,
  "B Ph Voltage": 236.35,
  "Average Phase Voltage": 236.06,
  "R-PF": 0.933,
  "Y-PF": 0.850,
  "B-PF": 0.998
}
```

---

## Visualization Examples

### Example 1: Voltage Over Time

**Setup:**
- X-Axis: TIME
- Y-Axis: R Ph Voltage
- Chart Type: Line Chart
- Time Grouping: None (raw data)

**Result:** Shows voltage fluctuations over time with precise timestamps

### Example 2: Average Voltage by Hour

**Setup:**
- X-Axis: TIME
- Y-Axis: Average Phase Voltage
- Chart Type: Area Chart
- Time Grouping: Hours (custom implementation)

**Result:** Smoothed visualization of hourly voltage patterns

### Example 3: Power Factor Comparison

**Setup:**
- Multi-Series Mode
- X-Axis: TIME
- Y-Axes: R-PF, Y-PF, B-PF
- Chart Type: Line Chart

**Result:** Compare power factors across all three phases

---

## Supported Date/Time Formats

The parser recognizes these timestamp formats:

- ISO 8601: `2025-01-01T10:30:00`
- European: `06/09/2025 00:00:00`
- US: `01/06/2025 12:30 PM`
- Date only: `2025-01-01`
- Various separators: `/`, `-`, space

---

## File Size Limits

- **Maximum file size:** 10 MB
- **Recommended rows:** Up to 10,000 for optimal performance
- **Columns:** No hard limit, but UI is optimized for up to 50 metrics

---

## Error Handling

### Common Issues and Solutions

**Issue:** "Failed to parse CSV"
- **Solution:** Ensure consistent delimiter usage (semicolons within cells, commas between cells)
- Check that all data rows have the same number of values as the header

**Issue:** "Empty CSV content"
- **Solution:** File must have at least a header row and one data row

**Issue:** Charts not displaying correctly
- **Solution:** Ensure numeric columns contain valid numbers (decimals with comma or period)

---

## Advanced Features

### Client-Side Parsing

CSV parsing happens in your browser for:
- **Privacy** - Your data never leaves your device during parsing
- **Speed** - No network round-trip for format detection
- **Offline Support** - Works without internet connection

### Fallback Mechanism

If client-side parsing fails, the system automatically:
1. Falls back to server-side parsing
2. Attempts standard CSV parsing
3. Provides detailed error messages

---

## Best Practices

### For Multi-Metric CSVs

1. **Consistent Structure** - Ensure all rows have the same number of semicolon-separated values
2. **Clean Headers** - Use descriptive names; prefixes will be automatically removed
3. **Numeric Values** - Use consistent decimal separators (comma or period)
4. **Timestamps** - Include time column for time-series analysis features

### For Standard CSVs

1. **No Empty Headers** - Every column should have a name
2. **Consistent Data Types** - Keep column types consistent throughout
3. **No Special Characters** - Avoid special characters in headers (or wrap in quotes)

---

## API Reference

### parseCSV Function

```typescript
interface ParsedCSVResult {
  headers: string[];          // Array of column headers
  data: Record<string, any>[]; // Array of data objects
  isMultiMetric: boolean;     // True if compound format detected
  originalFormat: 'standard' | 'compound';
}

function parseCSV(csvText: string): ParsedCSVResult
```

### Usage Example

```typescript
import { parseCSV } from './utils/csvParser';

const csvContent = `...your CSV content...`;
const result = parseCSV(csvContent);

console.log(result.headers);      // ["TIME", "R Ph Voltage", ...]
console.log(result.data.length);  // Number of rows
console.log(result.isMultiMetric); // true/false
```

---

## Testing Your CSV

### Quick Validation Checklist

✅ File is .csv format
✅ File size < 10 MB
✅ Has at least 2 rows (header + data)
✅ Semicolons used consistently within cells (if multi-metric)
✅ Commas separate main columns
✅ Numeric values are valid
✅ Timestamps in recognizable format

---

## Future Enhancements

Planned features:
- Support for tab-delimited and pipe-delimited formats
- Custom delimiter configuration
- Excel file support (.xlsx, .xls)
- JSON and XML import
- Real-time data streaming
- Advanced time-series analytics

---

## Support

If you encounter issues with your CSV format:

1. Check the **CSV Format Info** in the upload interface
2. View **error messages** in toast notifications
3. Use browser console (F12) for detailed parsing logs
4. Verify your file matches one of the supported formats

---

## Summary

Your IoT sensor CSV with semicolon-delimited compound format is **fully supported**! The parser will:

✨ Automatically detect the format
✨ Clean and organize metric names
✨ Group metrics by category
✨ Enable time-based analysis
✨ Provide intelligent default selections
✨ Support multi-metric comparisons

Upload your file and let the visualizer handle the rest!
