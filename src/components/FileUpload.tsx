import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload, FileText, X, Cloud, CheckCircle, Info, Sparkles } from 'lucide-react';
import { Progress } from './ui/progress';
import { CSVFormatInfo } from './CSVFormatInfo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function FileUpload({ onFileUpload, isUploading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onFileUpload(selectedFile);
      
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <Card className="border-none glass-card shadow-2xl rounded-3xl">
      <CardHeader className="border-b border-purple-100 dark:border-purple-900/50">
        <CardTitle className="flex items-center gap-3">
          <motion.div 
            className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg"
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Cloud className="w-6 h-6 text-white" />
          </motion.div>
          <span className="gradient-text">Upload CSV File</span>
        </CardTitle>
        <CardDescription className="text-purple-600 dark:text-purple-400">
          Drag and drop your CSV file or click to browse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          animate={{
            borderColor: dragActive ? '#7C3AED' : '#E9D5FF',
            backgroundColor: dragActive ? '#F5F3FF' : 'transparent',
          }}
          transition={{ duration: 0.2 }}
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
            dragActive 
              ? 'scale-105 shadow-2xl glow-animate' 
              : 'hover:border-purple-400 hover:shadow-xl dark:hover:border-purple-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <motion.div
                animate={{
                  y: dragActive ? -10 : 0,
                  scale: dragActive ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex justify-center"
              >
                <div className={`p-6 rounded-3xl ${dragActive ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl' : 'bg-purple-100 dark:bg-purple-950/30'}`}>
                  <Upload className={`h-12 w-12 ${dragActive ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
                </div>
              </motion.div>
              <div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="gradient-text inline-block text-lg"
                  >
                    Click to upload
                  </motion.span>
                  <span className="text-purple-700 dark:text-purple-300"> or drag and drop</span>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-purple-600 dark:text-purple-400">CSV files only (Max 10MB)</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-4 p-4 glass-card rounded-2xl">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="truncate max-w-md text-purple-900 dark:text-purple-100">{selectedFile.name}</p>
                  <p className="text-purple-600 dark:text-purple-400 text-sm">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    className="rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="relative h-3 bg-purple-100 dark:bg-purple-950/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-full relative"
                      transition={{ duration: 0.3 }}
                    >
                      {/* Glowing shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: 'linear',
                        }}
                      />
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between text-sm px-1">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      />
                      <p className="text-purple-700 dark:text-purple-300">
                        {uploadProgress < 100 ? 'Uploading and processing...' : 'Complete!'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 dark:text-purple-400">{uploadProgress}%</span>
                      {uploadProgress === 100 && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                  </div>
                </motion.div>
              )}
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upload and Visualize
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* CSV Format Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full rounded-xl justify-between hover:bg-blue-50"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  View Supported CSV Formats
                </span>
                <span className="text-xs text-gray-500">Click to expand</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <CSVFormatInfo />
            </CollapsibleContent>
          </Collapsible>
        </motion.div>

        {/* File requirements info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
        >
          <h4 className="text-sm mb-2 text-gray-700 dark:text-gray-300">File Requirements:</h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              CSV format with headers in the first row
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Maximum file size: 10MB
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              UTF-8 encoding recommended
            </li>
          </ul>
        </motion.div>
      </CardContent>
    </Card>
  );
}
