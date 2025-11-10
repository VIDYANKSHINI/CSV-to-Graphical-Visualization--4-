import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Search, Table2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface DataTableProps {
  data: Record<string, any>[];
  headers: string[];
}

export function DataTable({ data, headers }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading] = useState(false);

  const filteredData = data.filter(row => 
    Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-none glass-card shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-purple-950/30 border-b border-purple-100 dark:border-purple-900/50">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Table2 className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <CardTitle className="gradient-text">Data Preview</CardTitle>
              <CardDescription className="text-purple-600 dark:text-purple-400">
                Showing {filteredData.length} of {data.length} rows
              </CardDescription>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mt-4"
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
            <Input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl glass-card border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500"
            />
          </motion.div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-96 w-full">
              <div className="min-w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index} className="whitespace-nowrap px-6 py-4">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((row, rowIndex) => (
                        <motion.tr
                          key={rowIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: rowIndex * 0.02, duration: 0.2 }}
                          className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700"
                        >
                          {headers.map((header, colIndex) => (
                            <TableCell key={colIndex} className="whitespace-nowrap px-6 py-4">
                              {String(row[header] ?? '')}
                            </TableCell>
                          ))}
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={headers.length} className="text-center py-12">
                          <div className="text-gray-500">
                            <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No data found</p>
                            <p className="text-sm">Try adjusting your search</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
