import { motion } from 'motion/react';
import { Calendar, Clock, TrendingUp, CalendarDays, CalendarRange } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export type TimeInterval = 'days' | 'weeks' | 'months' | 'none';

interface TimeIntervalSelectorProps {
  value: TimeInterval;
  onChange: (value: TimeInterval) => void;
  className?: string;
  compact?: boolean;
  showTooltips?: boolean;
}

const intervals = [
  { 
    value: 'none' as TimeInterval, 
    label: 'Raw Data', 
    shortLabel: 'Raw', 
    icon: TrendingUp,
    description: 'Display all data points without grouping',
    color: 'from-gray-500 to-gray-600'
  },
  { 
    value: 'days' as TimeInterval, 
    label: 'By Days', 
    shortLabel: 'Days', 
    icon: CalendarDays,
    description: 'Group data by day of the week (Mon-Sun)',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    value: 'weeks' as TimeInterval, 
    label: 'By Weeks', 
    shortLabel: 'Weeks', 
    icon: CalendarRange,
    description: 'Group data by week number',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    value: 'months' as TimeInterval, 
    label: 'By Months', 
    shortLabel: 'Months', 
    icon: Calendar,
    description: 'Group data by month (Jan-Dec)',
    color: 'from-indigo-500 to-indigo-600'
  },
];

export function TimeIntervalSelector({ 
  value, 
  onChange, 
  className = '', 
  compact = false,
  showTooltips = true 
}: TimeIntervalSelectorProps) {
  return (
    <TooltipProvider>
      <div className={`inline-flex items-center gap-1 p-1 rounded-xl glass-card ${className}`}>
        {intervals.map((interval) => {
          const Icon = interval.icon;
          const isActive = value === interval.value;
          const displayLabel = compact ? interval.shortLabel : interval.label;
          
          const button = (
            <motion.button
              key={interval.value}
              onClick={() => onChange(interval.value)}
              className={`
                relative ${compact ? 'px-2 py-1.5' : 'px-4 py-2'} rounded-lg transition-all duration-200
                flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}
                ${isActive 
                  ? 'text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeInterval"
                  className={`absolute inset-0 rounded-lg bg-gradient-to-r ${interval.color} shadow-lg`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} relative z-10 ${isActive ? 'text-white' : ''}`} />
              <span className="relative z-10 whitespace-nowrap">{displayLabel}</span>
              
              {/* Active indicator badge */}
              {isActive && !compact && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative z-10 w-1.5 h-1.5 rounded-full bg-white ml-1"
                />
              )}
            </motion.button>
          );

          if (showTooltips && !compact) {
            return (
              <Tooltip key={interval.value} delayDuration={300}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="bg-gray-900 dark:bg-gray-800 text-white border-gray-700 max-w-xs"
                >
                  <p className="text-xs">{interval.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </div>
    </TooltipProvider>
  );
}
