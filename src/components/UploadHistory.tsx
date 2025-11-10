import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileText, Clock, Download, History, RefreshCw, AlertCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';

interface UploadMetadata {
  id: string;
  userId: string;
  fileName: string;
  storagePath: string;
  uploadedAt: string;
  fileSize: number;
}

interface UploadHistoryProps {
  history: UploadMetadata[];
  onLoadFile: (uploadId: string) => void;
  isLoading?: boolean;
  onRetry?: () => void;
  error?: string | null;
}

export function UploadHistory({ 
  history, 
  onLoadFile, 
  isLoading = false, 
  onRetry,
  error = null 
}: UploadHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-none glass-card shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-purple-950/30 border-b border-purple-100 dark:border-purple-900/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <History className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <CardTitle className="gradient-text">Upload History</CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-400">
                  Your recent CSV uploads ({history.length} files)
                </CardDescription>
              </div>
            </div>
            {onRetry && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  disabled={isLoading}
                  className="rounded-xl border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Alert variant="destructive" className="dark:bg-red-950/30 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    {onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="ml-4"
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <ScrollArea className="h-96 w-full pr-4">
            {isLoading && history.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading upload history...</p>
                </div>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.map((upload, index) => (
                  <motion.div
                    key={upload.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300 flex-shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate mb-1">{upload.fileName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{formatDate(upload.uploadedAt)}</span>
                          <span>•</span>
                          <span className="text-xs">{formatFileSize(upload.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLoadFile(upload.id)}
                        className="rounded-xl border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 dark:border-blue-600 dark:text-blue-400"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Load
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-full inline-block mb-4">
                  <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-lg mb-2 text-gray-700 dark:text-gray-300">No upload history yet</h4>
                <p className="text-gray-500 dark:text-gray-400">Upload a CSV file to get started</p>
              </motion.div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
