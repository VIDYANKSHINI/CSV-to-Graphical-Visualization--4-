import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { 
  LogOut, 
  User, 
  RefreshCw, 
  Menu, 
  X, 
  LayoutDashboard, 
  Upload as UploadIcon, 
  BarChart3,
  History,
  Settings,
  Moon,
  Sun,
  Keyboard,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { DataTable } from './DataTable';
import { ChartVisualization } from './ChartVisualization';
import { UploadHistory } from './UploadHistory';
import { OnboardingTooltip } from './OnboardingTooltip';
import { KeyboardShortcuts, useKeyboardShortcuts } from './KeyboardShortcuts';
import { EmptyState } from './EmptyState';
import { AccessibilityMenu } from './AccessibilityMenu';
import { QuickStatsCard } from './QuickStatsCard';
import { FloatingActionButton } from './FloatingActionButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { projectId } from '../utils/supabase/info';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';
import { parseCSV as parseCSVFile, ParsedCSVResult } from '../utils/csvParser';

interface DashboardProps {
  user: {
    email: string;
    name: string;
  };
  accessToken: string;
  onLogout: () => void;
}

interface UploadMetadata {
  id: string;
  userId: string;
  fileName: string;
  storagePath: string;
  uploadedAt: string;
  fileSize: number;
}

export function Dashboard({ user, accessToken, onLogout }: DashboardProps) {
  const [csvData, setCsvData] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [uploadHistory, setUploadHistory] = useState<UploadMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMultiMetric, setIsMultiMetric] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-2f7701f6`;

  // Keyboard shortcuts
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts({
    onUpload: () => setActiveTab('upload'),
    onDashboard: () => setActiveTab('dashboard'),
    onHistory: () => setActiveTab('history'),
    onExport: () => toast.info('Press Ctrl+E in chart view to export'),
  });

  useEffect(() => {
    // Try to load from localStorage first as fallback
    const loadLocalHistory = () => {
      try {
        const localHistory = localStorage.getItem('uploadHistory');
        if (localHistory) {
          const parsed = JSON.parse(localHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUploadHistory(parsed);
            console.log('Loaded upload history from localStorage');
          }
        }
      } catch (error) {
        console.error('Error loading history from localStorage:', error);
      }
    };

    loadLocalHistory();
    fetchUploadHistory();
    
    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
    }
    
    // Check screen size for responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const fetchUploadHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    
    try {
      // Get fresh token with better error handling
      const { getAccessToken } = await import('../utils/supabase/client');
      let freshToken;
      
      try {
        freshToken = await getAccessToken();
      } catch (tokenError) {
        console.error('Failed to get access token:', tokenError);
        // Use the existing accessToken as fallback
        freshToken = accessToken;
        if (!freshToken) {
          console.warn('No valid access token available, skipping upload history fetch');
          setHistoryError('Authentication required. Please login again.');
          setIsLoadingHistory(false);
          return;
        }
      }
      
      const response = await fetch(`${serverUrl}/upload-history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${freshToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const history = result.history || [];
        setUploadHistory(history);
        setHistoryError(null);
        
        // Save to localStorage as backup
        try {
          localStorage.setItem('uploadHistory', JSON.stringify(history));
        } catch (error) {
          console.error('Failed to save history to localStorage:', error);
        }
      } else if (response.status === 401) {
        // Authentication error
        console.warn('Authentication required for upload history');
        setHistoryError('Session expired. Please refresh or login again.');
      } else if (response.status === 404) {
        // Endpoint not found - likely server function not deployed
        console.warn('Upload history endpoint not available');
        setHistoryError('Upload history service is currently unavailable.');
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch upload history:', response.status, errorText);
        setHistoryError('Failed to load upload history. Please try again.');
        // Only show error toast if it's not the initial load
        if (uploadHistory.length > 0) {
          toast.error('Failed to load upload history');
        }
      }
    } catch (error) {
      console.error('Error fetching upload history:', error);
      // Check if it's a network error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Failed to fetch')) {
        console.warn('Network error or CORS issue - upload history not available');
        setHistoryError('Unable to connect to server. Upload history will be available when the server is ready.');
        // Don't show toast on initial load
      } else {
        setHistoryError('Network error while loading history');
        if (uploadHistory.length > 0) {
          toast.error('Network error while loading history');
        }
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Try server upload first, with fallback to client-side parsing
      let fileContent: string;
      let useServerUpload = true;

      try {
        // Get fresh token before upload
        const { getAccessToken } = await import('../utils/supabase/client');
        const freshToken = await getAccessToken();
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);

        const response = await fetch(`${serverUrl}/upload-csv`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${freshToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload error response:', errorText);
          
          // Check if it's an authentication error
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.');
            onLogout();
            return;
          }
          
          // If server upload fails, fall back to client-side
          useServerUpload = false;
          throw new Error('Server upload failed, using client-side parsing');
        }

        const result = await response.json();
        setCurrentFileName(result.fileName);
        fileContent = result.fileContent;
        
      } catch (serverError) {
        // Fallback to client-side parsing
        console.warn('Server upload failed, using client-side parsing:', serverError);
        useServerUpload = false;
        
        toast.info('Processing file locally...', { duration: 2000 });
        
        // Read file content directly
        fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsText(file);
        });
        
        setCurrentFileName(file.name);
      }

      // Parse CSV (works for both server and client-side)
      await parseCSV(fileContent);
      
      // Try to refresh history if server upload was used
      if (useServerUpload) {
        await fetchUploadHistory();
      }
      
      setActiveTab('dashboard');
      toast.success(`${file.name} ${useServerUpload ? 'uploaded' : 'loaded'} successfully!`);
      
    } catch (error) {
      console.error('Error processing file:', error);
      
      // Handle specific error cases
      if (error instanceof Error && error.message.includes('No valid session')) {
        toast.error('Session expired. Please log in again.');
        onLogout();
      } else {
        toast.error('Failed to process file. Please check the file format and try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const parseCSV = async (csvContent: string) => {
    try {
      // Try client-side parsing first for better format detection
      const parsed: ParsedCSVResult = parseCSVFile(csvContent);
      
      setHeaders(parsed.headers);
      setCsvData(parsed.data);
      setIsMultiMetric(parsed.isMultiMetric);
      
      if (parsed.isMultiMetric) {
        toast.success(`Loaded multi-metric data with ${parsed.headers.length} metrics`);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      
      // Fallback to server-side parsing
      try {
        const { getAccessToken } = await import('../utils/supabase/client');
        const freshToken = await getAccessToken();
        
        const response = await fetch(`${serverUrl}/parse-csv`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshToken}`,
          },
          body: JSON.stringify({ csvContent }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Parse error response:', errorText);
          
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.');
            onLogout();
            return;
          }
          
          throw new Error('Failed to parse CSV');
        }

        const result = await response.json();
        setHeaders(result.headers);
        setCsvData(result.data);
        setIsMultiMetric(false);
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
        
        if (fallbackError instanceof Error && fallbackError.message.includes('No valid session')) {
          toast.error('Session expired. Please log in again.');
          onLogout();
        } else {
          toast.error('Failed to parse CSV. Please check the file format and try again.');
        }
      }
    }
  };

  const handleLoadFile = async (uploadId: string) => {
    try {
      // Get fresh token
      const { getAccessToken } = await import('../utils/supabase/client');
      const freshToken = await getAccessToken();
      
      const response = await fetch(`${serverUrl}/upload/${uploadId}`, {
        headers: {
          'Authorization': `Bearer ${freshToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Load file error response:', errorText);
        
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          onLogout();
          return;
        }
        
        throw new Error('Failed to load file');
      }

      const result = await response.json();
      setCurrentFileName(result.metadata.fileName);
      await parseCSV(result.fileContent);
      setActiveTab('dashboard');
      toast.success('File loaded successfully!');
    } catch (error) {
      console.error('Error loading file:', error);
      
      if (error instanceof Error && error.message.includes('No valid session')) {
        toast.error('Session expired. Please log in again.');
        onLogout();
      } else {
        toast.error('Failed to load file. Please try again.');
      }
    }
  };

  const sidebarItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: csvData.length > 0 ? '●' : null },
    { id: 'upload', icon: UploadIcon, label: 'Upload CSV' },
    { id: 'visualizations', icon: BarChart3, label: 'Visualizations' },
    { id: 'history', icon: History, label: 'History', badge: uploadHistory.length > 0 ? uploadHistory.length.toString() : null },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Onboarding */}
      <OnboardingTooltip userName={user.name} />
      
      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-64 glass z-40 shadow-2xl border-r border-purple-200 dark:border-purple-900"
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="p-6 border-b border-purple-200 dark:border-purple-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <BarChart3 className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-lg gradient-text">CSV Visualizer</h2>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Data Portal</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950"
                    aria-label="Close sidebar"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto" role="navigation" aria-label="Main navigation">
                {sidebarItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                    }`}
                    aria-label={item.label}
                    aria-current={activeTab === item.id ? 'page' : undefined}
                    title={item.label}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge 
                        variant={activeTab === item.id ? 'secondary' : 'default'}
                        className="ml-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </motion.button>
                ))}
              </nav>

              {/* Help Section */}
              <div className="p-4 border-t border-purple-200 dark:border-purple-900 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl"
                  onClick={() => setShowShortcuts(true)}
                >
                  <Keyboard className="w-5 h-5" />
                  Keyboard Shortcuts
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl"
                  onClick={() => {
                    localStorage.removeItem('hasSeenOnboarding');
                    window.location.reload();
                  }}
                >
                  <HelpCircle className="w-5 h-5" />
                  Show Tutorial
                </Button>
              </div>

              {/* User Section */}
              <div className="p-4 border-t border-purple-200 dark:border-purple-900">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-card">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-purple-900 dark:text-purple-100">{user.name}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 glass border-b border-purple-200 dark:border-purple-900 shadow-lg">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30"
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {isSidebarOpen ? <ChevronLeft className="h-5 w-5 text-purple-600" /> : <Menu className="h-5 w-5 text-purple-600" />}
              </Button>
              
              <div>
                <h1 className="text-xl">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'upload' && 'Upload CSV'}
                  {activeTab === 'visualizations' && 'Visualizations'}
                  {activeTab === 'history' && 'Upload History'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  {activeTab === 'dashboard' && 'Transform your data into insights'}
                  {activeTab === 'upload' && 'Upload and process CSV files'}
                  {activeTab === 'visualizations' && 'Create beautiful charts'}
                  {activeTab === 'history' && 'View your past uploads'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AccessibilityMenu darkMode={darkMode} onDarkModeChange={setDarkMode} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel>
                    <div>
                      <p>{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowShortcuts(true)} className="cursor-pointer">
                    <Keyboard className="h-4 w-4 mr-2" />
                    Keyboard Shortcuts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Welcome Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 lg:p-8 text-white"
                >
                  <h2 className="text-2xl mb-2">Welcome back, {user.name.split(' ')[0]} 👋</h2>
                  <p className="text-blue-100 mb-6">Upload your CSV and visualize data instantly</p>
                  <Button
                    onClick={() => setActiveTab('upload')}
                    className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl shadow-lg"
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload CSV
                  </Button>
                </motion.div>

                {csvData.length > 0 ? (
                  <>
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <QuickStatsCard
                        title="Total Rows"
                        value={csvData.length.toLocaleString()}
                        subtitle="Data points loaded"
                        icon={BarChart3}
                        iconColor="blue"
                      />
                      <QuickStatsCard
                        title="Metrics"
                        value={headers.length}
                        subtitle={isMultiMetric ? 'Multi-metric dataset' : 'Standard columns'}
                        icon={LayoutDashboard}
                        iconColor="green"
                      />
                      <QuickStatsCard
                        title="Current File"
                        value={currentFileName.length > 15 ? `${currentFileName.slice(0, 12)}...` : currentFileName}
                        subtitle={`${(csvData.length * headers.length).toLocaleString()} total values`}
                        icon={UploadIcon}
                        iconColor="purple"
                      />
                      <QuickStatsCard
                        title="Uploads"
                        value={uploadHistory.length || '0'}
                        subtitle={uploadHistory.length > 0 ? 'Files in history' : 'No uploads yet'}
                        icon={History}
                        iconColor="orange"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg">Data Visualization</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {isMultiMetric ? 'Multi-metric time-series data' : 'Standard dataset'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchUploadHistory}
                        disabled={isLoadingHistory}
                        className="rounded-xl"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>

                    <Tabs defaultValue="visualize" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 rounded-xl">
                        <TabsTrigger value="visualize" className="rounded-xl">Visualize</TabsTrigger>
                        <TabsTrigger value="data" className="rounded-xl">Data Table</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="visualize" className="space-y-4">
                        <ChartVisualization data={csvData} headers={headers} isMultiMetric={isMultiMetric} />
                      </TabsContent>
                      
                      <TabsContent value="data" className="space-y-4">
                        <DataTable data={csvData} headers={headers} />
                      </TabsContent>
                    </Tabs>
                  </>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No data loaded"
                    description="Upload a CSV file to begin visualizing your data and creating beautiful charts."
                    actionLabel="Upload CSV"
                    onAction={() => setActiveTab('upload')}
                    className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600"
                  />
                )}
              </motion.div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
              </motion.div>
            )}

            {/* Visualizations Tab */}
            {activeTab === 'visualizations' && (
              <motion.div
                key="visualizations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {csvData.length > 0 ? (
                  <ChartVisualization data={csvData} headers={headers} isMultiMetric={isMultiMetric} />
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No data available"
                    description="Upload a CSV file first to create visualizations."
                    actionLabel="Upload CSV"
                    onAction={() => setActiveTab('upload')}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
                  />
                )}
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <UploadHistory 
                  history={uploadHistory} 
                  onLoadFile={handleLoadFile}
                  isLoading={isLoadingHistory}
                  onRetry={fetchUploadHistory}
                  error={historyError}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Action Button - Hidden on mobile when sidebar is closed */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('upload')}
          className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 transition-shadow"
          aria-label="Quick upload"
          title="Quick Upload (Ctrl+U)"
        >
          <UploadIcon className="w-6 h-6" />
        </motion.button>
      </motion.div>
    </div>
  );
}
