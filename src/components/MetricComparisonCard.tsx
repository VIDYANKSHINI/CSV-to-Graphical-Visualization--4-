import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface MetricComparisonCardProps {
  metricName: string;
  currentValue: number;
  previousValue?: number;
  unit?: string;
  color?: string;
}

export function MetricComparisonCard({
  metricName,
  currentValue,
  previousValue,
  unit = '',
  color = 'blue',
}: MetricComparisonCardProps) {
  const change = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
  };

  const gradientClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow rounded-2xl overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${gradientClass}`} />
        <CardHeader className="pb-3">
          <CardDescription className="text-xs uppercase tracking-wide">
            {metricName}
          </CardDescription>
          <CardTitle className="text-3xl">
            {currentValue.toFixed(2)}
            {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previousValue !== undefined && !isNeutral && (
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-sm ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">vs previous</span>
            </div>
          )}
          {isNeutral && previousValue !== undefined && (
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">No change</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
