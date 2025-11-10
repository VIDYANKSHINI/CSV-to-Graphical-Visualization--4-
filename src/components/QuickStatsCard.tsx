import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { LucideIcon } from 'lucide-react';

interface QuickStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function QuickStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  trend,
}: QuickStatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100 dark:bg-blue-950',
    green: 'bg-green-100 dark:bg-green-950',
    orange: 'bg-orange-100 dark:bg-orange-950',
    purple: 'bg-purple-100 dark:bg-purple-950',
    red: 'bg-red-100 dark:bg-red-950',
    indigo: 'bg-indigo-100 dark:bg-indigo-950',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
  };

  const gradientClass = colorClasses[iconColor as keyof typeof colorClasses] || colorClasses.blue;
  const iconBgClass = iconBgClasses[iconColor as keyof typeof iconBgClasses] || iconBgClasses.blue;
  const iconColorClass = iconColorClasses[iconColor as keyof typeof iconColorClasses] || iconColorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow rounded-2xl overflow-hidden h-full">
        <div className={`h-1.5 bg-gradient-to-r ${gradientClass}`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
              <p className="text-3xl mb-1">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
              {trend && (
                <div className="mt-2 flex items-center gap-1">
                  <span
                    className={`text-sm ${
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${iconBgClass}`}>
              <Icon className={`w-6 h-6 ${iconColorClass}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
