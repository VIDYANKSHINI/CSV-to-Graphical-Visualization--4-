import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Download, Palette, BarChart3Icon, Calendar, TrendingUp, Info, Sparkles, Layers } from 'lucide-react';
import { ChartExportDialog } from './ChartExportDialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { TimeIntervalSelector, TimeInterval } from './TimeIntervalSelector';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';

interface ChartVisualizationProps {
  data: Record<string, any>[];
  headers: string[];
  isMultiMetric?: boolean;
}

type TimeGrouping = 'none' | 'days' | 'weeks' | 'months';
type AggregationMethod = 'sum' | 'average' | 'count';

const COLORS = ['#7C3AED', '#3B82F6', '#06B6D4', '#8B5CF6', '#A855F7', '#60A5FA', '#22D3EE', '#C4B5FD'];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ChartVisualization({ data, headers, isMultiMetric = false }: ChartVisualizationProps) {
  // Group metrics by category for multi-metric data
  const metricGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    
    headers.forEach(header => {
      let category = 'Other';
      
      if (header.toLowerCase().includes('voltage')) {
        category = 'Voltage';
      } else if (header.toLowerCase().includes('pf') || header.toLowerCase().includes('power factor')) {
        category = 'Power Factor';
      } else if (header.toLowerCase().includes('current')) {
        category = 'Current';
      } else if (header.toLowerCase().includes('power') && !header.toLowerCase().includes('factor')) {
        category = 'Power';
      } else if (header.toLowerCase().includes('time') || header.toLowerCase().includes('timestamp')) {
        category = 'Time';
      } else if (header.toLowerCase().includes('frequency')) {
        category = 'Frequency';
      }
      
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(header);
    });
    
    return groups;
  }, [headers]);

  const numericHeaders = headers.filter(header => 
    data.some(row => typeof row[header] === 'number')
  );

  // Detect date columns
  const dateHeaders = useMemo(() => {
    return headers.filter(header => {
      const sample = data.slice(0, 10);
      return sample.some(row => {
        const value = row[header];
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime()) && (
          typeof value === 'string' && (
            value.includes('-') || 
            value.includes('/') || 
            value.includes(':') ||
            value.match(/\d{4}/) ||
            value.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)
          )
        );
      });
    });
  }, [data, headers]);

  // Smart default axis selection
  const defaultXAxis = useMemo(() => {
    // Prefer time/timestamp columns
    const timeColumn = headers.find(h => 
      h.toLowerCase().includes('time') || 
      h.toLowerCase().includes('timestamp') ||
      dateHeaders.includes(h)
    );
    return timeColumn || headers[0] || '';
  }, [headers, dateHeaders]);

  const defaultYAxis = useMemo(() => {
    // Prefer voltage or first numeric column
    const voltageColumn = numericHeaders.find(h => h.toLowerCase().includes('voltage'));
    return voltageColumn || numericHeaders[0] || headers[1] || '';
  }, [numericHeaders, headers]);

  // Default to first 3 numeric columns for multi-series
  const defaultYAxes = useMemo(() => {
    return numericHeaders.slice(0, 3);
  }, [numericHeaders]);

  const [xAxis, setXAxis] = useState(defaultXAxis);
  const [yAxis, setYAxis] = useState(defaultYAxis);
  const [selectedYAxes, setSelectedYAxes] = useState<string[]>(defaultYAxes);
  const [selectedMetricGroup, setSelectedMetricGroup] = useState<string>('All');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'pie'>('line');
  const [colorScheme, setColorScheme] = useState('default');
  const [timeGrouping, setTimeGrouping] = useState<TimeInterval>('none');
  const [aggregationMethod, setAggregationMethod] = useState<AggregationMethod>('average');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Check if current xAxis is a date column
  const isDateAxis = dateHeaders.includes(xAxis);

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+E: Export chart
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setShowExportDialog(true);
      }
      
      // Ctrl+T: Cycle through time intervals
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        if (!isDateAxis) {
          toast.error('Please select a date/time column for X-axis to enable time grouping');
          return;
        }
        const intervals: TimeInterval[] = ['none', 'days', 'weeks', 'months'];
        const currentIndex = intervals.indexOf(timeGrouping);
        const nextIndex = (currentIndex + 1) % intervals.length;
        const nextInterval = intervals[nextIndex];
        setTimeGrouping(nextInterval);
        toast.success(`Time grouping: ${nextInterval === 'none' ? 'raw data' : nextInterval}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDateAxis, timeGrouping]);

  // Function to parse dates flexibly
  const parseDate = (value: any): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  };

  // Function to format date with seconds precision
  const formatDateWithSeconds = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  // Function to get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Aggregate data based on time grouping
  const processedData = useMemo(() => {
    if (timeGrouping === 'none') {
      // Return raw data with formatted timestamps for display
      const rawData = data.map(row => {
        const newRow = { ...row };
        
        // Format timestamp if it's a date axis
        if (isDateAxis) {
          const dateValue = row[xAxis];
          const date = parseDate(dateValue);
          if (date) {
            newRow[xAxis] = formatDateWithSeconds(date);
            newRow._originalTimestamp = dateValue;
          }
        }
        
        return newRow;
      });
      
      return rawData;
    }

    if (!isDateAxis) {
      return data.slice(0, 50);
    }

    const grouped = new Map<string, { values: Map<string, number[]>, count: number, label: string }>();

    data.forEach(row => {
      const dateValue = row[xAxis];
      const date = parseDate(dateValue);
      if (!date) return;

      let groupKey = '';
      let groupLabel = '';

      switch (timeGrouping) {
        case 'days':
          groupKey = `${date.getDay()}`;
          groupLabel = DAY_ABBR[date.getDay()];
          break;
        case 'weeks':
          const weekNum = getWeekNumber(date);
          groupKey = `${date.getFullYear()}-W${weekNum}`;
          groupLabel = `Week ${weekNum}`;
          break;
        case 'months':
          groupKey = `${date.getFullYear()}-${date.getMonth()}`;
          groupLabel = MONTH_ABBR[date.getMonth()];
          break;
      }

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, { values: new Map(), count: 0, label: groupLabel });
      }

      const group = grouped.get(groupKey)!;

      // Aggregate all selected Y axes
      const yAxesToAggregate = viewMode === 'multi' ? selectedYAxes : [yAxis];
      yAxesToAggregate.forEach(yAxisKey => {
        const yValue = row[yAxisKey];
        if (typeof yValue === 'number') {
          if (!group.values.has(yAxisKey)) {
            group.values.set(yAxisKey, []);
          }
          group.values.get(yAxisKey)!.push(yValue);
        }
      });
      
      group.count++;
    });

    // Convert grouped data to array and calculate aggregations
    const result = Array.from(grouped.entries()).map(([key, group]) => {
      const aggregatedRow: any = {
        [xAxis]: group.label,
        _originalKey: key,
      };

      // Aggregate each Y axis
      const yAxesToAggregate = viewMode === 'multi' ? selectedYAxes : [yAxis];
      yAxesToAggregate.forEach(yAxisKey => {
        const values = group.values.get(yAxisKey) || [];
        let aggregatedValue = 0;
        
        if (values.length > 0) {
          switch (aggregationMethod) {
            case 'sum':
              aggregatedValue = values.reduce((a, b) => a + b, 0);
              break;
            case 'average':
              aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
              break;
            case 'count':
              aggregatedValue = group.count;
              break;
          }
        }

        aggregatedRow[yAxisKey] = parseFloat(aggregatedValue.toFixed(2));
      });

      return aggregatedRow;
    });

    // Sort the results
    if (timeGrouping === 'days') {
      // Sort by day of week (Sunday = 0, Saturday = 6)
      result.sort((a, b) => {
        const dayA = DAY_ABBR.indexOf(a[xAxis]);
        const dayB = DAY_ABBR.indexOf(b[xAxis]);
        return dayA - dayB;
      });
    } else if (timeGrouping === 'weeks') {
      // Sort by week number
      result.sort((a, b) => a._originalKey.localeCompare(b._originalKey));
    } else if (timeGrouping === 'months') {
      // Sort by month
      result.sort((a, b) => {
        const monthA = MONTH_ABBR.indexOf(a[xAxis]);
        const monthB = MONTH_ABBR.indexOf(b[xAxis]);
        return monthA - monthB;
      });
    }

    return result;
  }, [data, xAxis, yAxis, selectedYAxes, viewMode, timeGrouping, aggregationMethod, isDateAxis]);

  // Toggle Y-axis selection
  const toggleYAxis = (axis: string) => {
    setSelectedYAxes(prev => {
      if (prev.includes(axis)) {
        // Don't allow deselecting all
        if (prev.length === 1) {
          toast.error('At least one metric must be selected');
          return prev;
        }
        return prev.filter(a => a !== axis);
      } else {
        // Limit to 8 metrics for readability
        if (prev.length >= 8) {
          toast.error('Maximum 8 metrics can be displayed simultaneously');
          return prev;
        }
        return [...prev, axis];
      }
    });
  };

  if (!data || data.length === 0) {
    return (
      <Card className="border-none shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>No data available to visualize</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleDownloadChart = () => {
    setShowExportDialog(true);
  };

  const handleTimeGroupingChange = (value: TimeGrouping) => {
    setTimeGrouping(value);
    toast.success(`Data grouped by ${value === 'none' ? 'default' : value}`);
  };

  // Custom tooltip for multi-series
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-xl border border-purple-200 dark:border-purple-800 shadow-lg">
          <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              <strong>{entry.name}:</strong> {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <ChartExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        chartType={chartType}
        chartData={processedData}
        chartRef={chartContainerRef}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-none glass-card shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-purple-950/30 border-b border-purple-100 dark:border-purple-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <CardTitle className="gradient-text">Data Visualization</CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-400 flex items-center gap-2 flex-wrap">
                  <span>Interactive charts powered by your data</span>
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                  >
                    Ctrl+T: cycle time intervals
                  </motion.span>
                </CardDescription>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadChart}
                className="rounded-xl border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Chart Mode Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl glass-card p-1">
                <TabsTrigger value="single" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                  📊 Single Series
                </TabsTrigger>
                <TabsTrigger value="multi" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                  <Layers className="w-4 h-4 mr-2" />
                  Multi-Series
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Chart Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Multi-Metric Info Banner */}
            {isMultiMetric && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 glass-card border-2 border-purple-200 dark:border-purple-800 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-purple-900 dark:text-purple-100">
                      <strong>Multi-Metric Dataset Detected</strong>
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {headers.length} metrics loaded • {data.length} time points • {metricGroups.size} categories
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Time Grouping Info Banner - Show when date axis is detected */}
            {isDateAxis && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 glass-card border-2 border-blue-200 dark:border-blue-800 rounded-2xl"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex-shrink-0">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-900 dark:text-blue-100 mb-1">
                      <strong>Time-Based Data Detected</strong>
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                      {timeGrouping === 'none' 
                        ? 'Showing exact timestamps with seconds precision' 
                        : 'Group your data by different time intervals to discover patterns and trends'}
                    </p>
                    {timeGrouping !== 'none' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <p className="text-blue-900 dark:text-blue-100 mb-1"><strong>📅 Days</strong></p>
                          <p className="text-blue-700 dark:text-blue-300">See patterns across weekdays</p>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                          <p className="text-purple-900 dark:text-purple-100 mb-1"><strong>📆 Weeks</strong></p>
                          <p className="text-purple-700 dark:text-purple-300">Track weekly trends</p>
                        </div>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                          <p className="text-indigo-900 dark:text-indigo-100 mb-1"><strong>📊 Months</strong></p>
                          <p className="text-indigo-700 dark:text-indigo-300">View seasonal patterns</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 glass-card rounded-2xl">
              <div className="space-y-2 md:col-span-1">
                <Label className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <BarChart3Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Chart Type
                </Label>
                <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                  <SelectTrigger className="rounded-xl border-purple-200 dark:border-purple-800 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl glass-card border-purple-200 dark:border-purple-800">
                    <SelectItem value="line">📈 Line Chart</SelectItem>
                    <SelectItem value="bar">📊 Bar Chart</SelectItem>
                    <SelectItem value="area">📉 Area Chart</SelectItem>
                    {viewMode === 'single' && <SelectItem value="pie">🥧 Pie Chart</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  X-Axis
                  {isDateAxis && timeGrouping !== 'none' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    >
                      Grouped by {timeGrouping}
                    </motion.span>
                  )}
                </Label>
                <Select value={xAxis} onValueChange={setXAxis}>
                  <SelectTrigger className="rounded-xl border-purple-200 dark:border-purple-800 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl glass-card border-purple-200 dark:border-purple-800 max-h-60 overflow-y-auto">
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>
                        {header.length > 30 ? `${header.slice(0, 30)}...` : header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Time Interval Selector - Always visible */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="pt-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      Time Interval Grouping
                      {!isDateAxis && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        >
                          ⚠ Date axis required
                        </motion.span>
                      )}
                    </Label>
                    {timeGrouping !== 'none' && isDateAxis && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      >
                        ✓ Active
                      </motion.span>
                    )}
                  </div>
                  <TimeIntervalSelector
                    value={timeGrouping}
                    onChange={(value) => {
                      if (!isDateAxis && value !== 'none') {
                        toast.error('Please select a date/time column for X-axis to enable time grouping');
                        return;
                      }
                      setTimeGrouping(value);
                      const message = value === 'none' 
                        ? 'Showing raw data points with exact timestamps' 
                        : `Data grouped by ${value} with ${aggregationMethod} aggregation`;
                      toast.success(message);
                    }}
                    className="w-full"
                    showTooltips={true}
                  />
                </motion.div>
              </div>

              {/* Single Series Y-Axis Selection */}
              {viewMode === 'single' && chartType !== 'pie' && (
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-purple-700 dark:text-purple-300">Y-Axis</Label>
                  <Select value={yAxis} onValueChange={setYAxis}>
                    <SelectTrigger className="rounded-xl border-purple-200 dark:border-purple-800 focus:ring-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl glass-card border-purple-200 dark:border-purple-800 max-h-60 overflow-y-auto">
                      {isMultiMetric ? (
                        // Group metrics by category for easier selection
                        Array.from(metricGroups.entries()).map(([category, metrics]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded-lg mx-1 my-1">
                              {category}
                            </div>
                            {metrics.map(header => (
                              <SelectItem key={header} value={header}>
                                {header.length > 30 ? `${header.slice(0, 30)}...` : header}
                              </SelectItem>
                            ))}
                          </div>
                        ))
                      ) : (
                        headers.map(header => (
                          <SelectItem key={header} value={header}>
                            {header.length > 30 ? `${header.slice(0, 30)}...` : header}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2 md:col-span-1">
                <Label className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Colors
                </Label>
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger className="rounded-xl border-purple-200 dark:border-purple-800 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl glass-card border-purple-200 dark:border-purple-800">
                    <SelectItem value="default">🎨 Purple-Blue</SelectItem>
                    <SelectItem value="warm">🔥 Warm</SelectItem>
                    <SelectItem value="cool">❄️ Cool</SelectItem>
                    <SelectItem value="monochrome">⚫ Monochrome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Multi-Series Y-Axis Selection */}
            {viewMode === 'multi' && chartType !== 'pie' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 glass-card rounded-2xl border-2 border-purple-200 dark:border-purple-700"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex-shrink-0">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-purple-900 dark:text-purple-100 mb-1 block">
                      Select Metrics to Display ({selectedYAxes.length} selected)
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Choose multiple metrics to compare on the same chart (max 8)
                    </p>
                  </div>
                </div>
                
                <ScrollArea className="h-48 rounded-xl border border-purple-200 dark:border-purple-800 p-3">
                  <div className="space-y-2">
                    {isMultiMetric ? (
                      // Group metrics by category
                      Array.from(metricGroups.entries()).map(([category, metrics]) => (
                        <div key={category} className="space-y-2">
                          <p className="text-xs text-purple-600 dark:text-purple-400 px-2 py-1 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            {category}
                          </p>
                          {metrics.filter(m => !m.toLowerCase().includes('time')).map(metric => (
                            <div key={metric} className="flex items-center space-x-2 p-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors">
                              <Checkbox
                                id={metric}
                                checked={selectedYAxes.includes(metric)}
                                onCheckedChange={() => toggleYAxis(metric)}
                              />
                              <label
                                htmlFor={metric}
                                className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-300"
                              >
                                {metric.length > 40 ? `${metric.slice(0, 40)}...` : metric}
                              </label>
                              {selectedYAxes.includes(metric) && (
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: COLORS[selectedYAxes.indexOf(metric) % COLORS.length] }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      numericHeaders.map(metric => (
                        <div key={metric} className="flex items-center space-x-2 p-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors">
                          <Checkbox
                            id={metric}
                            checked={selectedYAxes.includes(metric)}
                            onCheckedChange={() => toggleYAxis(metric)}
                          />
                          <label
                            htmlFor={metric}
                            className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-300"
                          >
                            {metric}
                          </label>
                          {selectedYAxes.includes(metric) && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[selectedYAxes.indexOf(metric) % COLORS.length] }}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {/* Aggregation Method - Only show if time grouping is active */}
            <AnimatePresence>
              {isDateAxis && timeGrouping !== 'none' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 glass-card rounded-2xl border-2 border-purple-200 dark:border-purple-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-purple-900 dark:text-purple-100 mb-1 block">Aggregation Method</Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        How should data be combined when grouping by {timeGrouping}?
                      </p>
                    </div>
                    <Select value={aggregationMethod} onValueChange={(value: any) => setAggregationMethod(value)}>
                      <SelectTrigger className="w-32 rounded-xl border-purple-200 dark:border-purple-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="sum">📊 Sum</SelectItem>
                        <SelectItem value="average">📈 Average</SelectItem>
                        <SelectItem value="count">🔢 Count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Data Insights - Show when grouping is active */}
            <AnimatePresence>
              {isDateAxis && timeGrouping !== 'none' && processedData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="p-4 glass-card rounded-2xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Data Points</p>
                    </div>
                    <p className="text-2xl text-purple-900 dark:text-purple-100">
                      {processedData.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Grouped from {data.length} records
                    </p>
                  </div>

                  <div className="p-4 glass-card rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Aggregation</p>
                    </div>
                    <p className="text-2xl text-blue-900 dark:text-blue-100 capitalize">
                      {aggregationMethod}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Method applied
                    </p>
                  </div>

                  <div className="p-4 glass-card rounded-2xl border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Time Span</p>
                    </div>
                    <p className="text-2xl text-indigo-900 dark:text-indigo-100 capitalize">
                      {timeGrouping}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Grouping interval
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Main Chart */}
          <AnimatePresence mode="wait">
            <motion.div
              ref={chartContainerRef}
              key={`${chartType}-${viewMode}-${timeGrouping}-${aggregationMethod}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full h-96 border rounded-2xl p-6 bg-white dark:bg-gray-900 shadow-inner"
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' && (
                  <BarChart data={processedData}>
                    {viewMode === 'multi' && selectedYAxes.map((_, index) => (
                      <defs key={`barGradient${index}`}>
                        <linearGradient id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                          <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                    ))}
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey={xAxis} 
                      stroke="#6B7280"
                      angle={isDateAxis && timeGrouping === 'none' ? -45 : 0}
                      textAnchor={isDateAxis && timeGrouping === 'none' ? 'end' : 'middle'}
                      height={isDateAxis && timeGrouping === 'none' ? 100 : 30}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#6B7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {viewMode === 'single' ? (
                      <Bar 
                        dataKey={yAxis} 
                        fill="#3B82F6" 
                        radius={[8, 8, 0, 0]}
                        animationDuration={800}
                      />
                    ) : (
                      selectedYAxes.map((axis, index) => (
                        <Bar 
                          key={axis}
                          dataKey={axis} 
                          fill={COLORS[index % COLORS.length]}
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                        />
                      ))
                    )}
                  </BarChart>
                )}

                {chartType === 'line' && (
                  <LineChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey={xAxis} 
                      stroke="#6B7280"
                      angle={isDateAxis && timeGrouping === 'none' ? -45 : 0}
                      textAnchor={isDateAxis && timeGrouping === 'none' ? 'end' : 'middle'}
                      height={isDateAxis && timeGrouping === 'none' ? 100 : 30}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#6B7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {viewMode === 'single' ? (
                      <Line 
                        type="monotone" 
                        dataKey={yAxis} 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                        animationDuration={800}
                      />
                    ) : (
                      selectedYAxes.map((axis, index) => (
                        <Line 
                          key={axis}
                          type="monotone" 
                          dataKey={axis} 
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5 }}
                          animationDuration={800}
                        />
                      ))
                    )}
                  </LineChart>
                )}

                {chartType === 'area' && (
                  <AreaChart data={processedData}>
                    {viewMode === 'multi' && selectedYAxes.map((_, index) => (
                      <defs key={`areaGradient${index}`}>
                        <linearGradient id={`areaGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    ))}
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey={xAxis} 
                      stroke="#6B7280"
                      angle={isDateAxis && timeGrouping === 'none' ? -45 : 0}
                      textAnchor={isDateAxis && timeGrouping === 'none' ? 'end' : 'middle'}
                      height={isDateAxis && timeGrouping === 'none' ? 100 : 30}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#6B7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {viewMode === 'single' ? (
                      <Area 
                        type="monotone" 
                        dataKey={yAxis} 
                        stroke="#2563EB" 
                        fill="#3B82F6"
                        strokeWidth={2}
                        fillOpacity={0.3}
                        animationDuration={800}
                      />
                    ) : (
                      selectedYAxes.map((axis, index) => (
                        <Area 
                          key={axis}
                          type="monotone" 
                          dataKey={axis} 
                          stroke={COLORS[index % COLORS.length]}
                          fill={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          fillOpacity={0.3}
                          animationDuration={800}
                        />
                      ))
                    )}
                  </AreaChart>
                )}

                {chartType === 'pie' && viewMode === 'single' && (
                  <PieChart>
                    <Pie
                      data={processedData.slice(0, 10)}
                      dataKey={yAxis}
                      nameKey={xAxis}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={(entry) => entry[xAxis]}
                      labelLine={{ stroke: '#6B7280' }}
                      animationDuration={800}
                    >
                      {processedData.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                      }} 
                    />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>

          {/* Chart Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 glass-card rounded-2xl border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex-shrink-0">
                <Info className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Chart Summary:</strong> {viewMode === 'single' ? 'Single' : 'Multi'}-series {chartType} chart
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  X-Axis: <strong>{xAxis}</strong> • 
                  {viewMode === 'single' ? (
                    <> Y-Axis: <strong>{yAxis}</strong></>
                  ) : (
                    <> Metrics: <strong>{selectedYAxes.length} selected</strong></>
                  )} • 
                  Data Points: <strong>{processedData.length}</strong>
                  {timeGrouping !== 'none' && <> • Grouped by <strong>{timeGrouping}</strong></>}
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
      </motion.div>
    </>
  );
}
