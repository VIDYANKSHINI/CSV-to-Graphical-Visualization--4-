import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Download, FileImage, FileSpreadsheet, FileCode, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ChartExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chartType: string;
  chartData: any[];
  chartRef?: React.RefObject<HTMLDivElement>;
}

export function ChartExportDialog({
  isOpen,
  onClose,
  chartType,
  chartData,
  chartRef,
}: ChartExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'png' | 'csv' | 'json' | 'svg'>('png');
  const [isExporting, setIsExporting] = useState(false);

  const formats = [
    {
      value: 'png',
      label: 'PNG Image',
      description: 'High-quality chart screenshot',
      icon: FileImage,
    },
    {
      value: 'svg',
      label: 'SVG Vector',
      description: 'Scalable vector graphics',
      icon: FileImage,
    },
    {
      value: 'csv',
      label: 'CSV Data',
      description: 'Raw data in spreadsheet format',
      icon: FileSpreadsheet,
    },
    {
      value: 'json',
      label: 'JSON Data',
      description: 'Structured data format',
      icon: FileCode,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'csv') {
        // Convert data to CSV
        const csv = convertToCSV(chartData);
        downloadFile(csv, `chart-data-${Date.now()}.csv`, 'text/csv');
        toast.success('Chart data exported as CSV!');
      } else if (exportFormat === 'json') {
        // Convert data to JSON
        const json = JSON.stringify(chartData, null, 2);
        downloadFile(json, `chart-data-${Date.now()}.json`, 'application/json');
        toast.success('Chart data exported as JSON!');
      } else if (exportFormat === 'svg') {
        // Export SVG
        await exportAsSVG();
        toast.success('Chart exported as SVG!');
      } else if (exportFormat === 'png') {
        // Export PNG using html2canvas
        await exportAsPNG();
        toast.success('Chart exported as PNG!');
      }
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export chart. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPNG = async () => {
    // Dynamically import html2canvas
    const html2canvas = (await import('html2canvas')).default;
    
    if (!chartRef?.current) {
      toast.error('Chart not found');
      return;
    }

    // Capture the chart element
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chart-${chartType}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  };

  const exportAsSVG = async () => {
    if (!chartRef?.current) {
      toast.error('Chart not found');
      return;
    }

    // Find all SVG elements in the chart
    const svgElements = chartRef.current.querySelectorAll('svg');
    
    if (svgElements.length === 0) {
      toast.error('No chart found to export');
      return;
    }

    // Get the first SVG (the main chart)
    const svgElement = svgElements[0];
    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    // Add XML declaration and styling
    const svgBlob = new Blob(
      [`<?xml version="1.0" encoding="UTF-8"?>\n${svgData}`],
      { type: 'image/svg+xml;charset=utf-8' }
    );
    
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-${chartType}-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]): string => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
      ),
    ];
    
    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Export Chart
          </DialogTitle>
          <DialogDescription>
            Choose your preferred export format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <RadioGroup value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
            {formats.map((format, index) => (
              <motion.div
                key={format.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Label
                  htmlFor={format.value}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    exportFormat === format.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <RadioGroupItem value={format.value} id={format.value} className="sr-only" />
                  <div className={`p-2 rounded-lg ${
                    exportFormat === format.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    <format.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{format.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format.description}
                    </p>
                  </div>
                  {exportFormat === format.value && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </Label>
              </motion.div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="rounded-xl bg-blue-600 hover:bg-blue-700"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
