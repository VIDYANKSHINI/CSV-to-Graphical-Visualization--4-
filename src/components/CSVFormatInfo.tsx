import { motion } from 'motion/react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function CSVFormatInfo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">Supported CSV Formats</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Our parser supports both standard CSV and multi-metric compound formats with semicolon-delimited values.
        </AlertDescription>
      </Alert>

      <Card className="border-none shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            CSV Format Examples
          </CardTitle>
          <CardDescription>
            See examples of supported CSV formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="standard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="standard" className="rounded-xl">Standard CSV</TabsTrigger>
              <TabsTrigger value="compound" className="rounded-xl">Multi-Metric CSV</TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm">Standard Format</h4>
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-x-auto">
{`Date,Temperature,Humidity,Pressure
2025-01-01,23.5,65,1013
2025-01-02,24.1,63,1015
2025-01-03,22.8,68,1012`}
                </pre>
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Simple comma-separated values with one value per column</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compound" className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm">Multi-Metric Compound Format</h4>
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-x-auto">
{`TIME;R Ph Voltage;Y Ph Voltage;B Ph Voltage;R-PF;Y-PF;B-PF
06/09/2025 00:00:00;235,21;236,38;236,35;0.933;0.850;0.998
06/09/2025 00:00:03;235,47;236,38;236,35;0.930;0.851;0.998
06/09/2025 00:00:06;235,26;236,14;236,17;0.933;0.851;0.998`}
                </pre>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Semicolon-delimited headers in a single cell (e.g., "Metric1;Metric2;Metric3")</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Semicolon-delimited values matching the header structure</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Automatic detection and parsing of time-series data</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Automatic format detection</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Time-series data grouping (Days, Weeks, Months)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Multi-metric visualization with category grouping</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Smart header cleaning and deduplication</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Handles both comma and decimal formats</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
