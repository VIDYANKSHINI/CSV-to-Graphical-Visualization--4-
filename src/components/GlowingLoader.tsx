import { motion } from 'motion/react';

interface GlowingLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GlowingLoader({ text = 'Loading...', size = 'md' }: GlowingLoaderProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {/* Glowing progress bar */}
      <div className={`w-64 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-full"
          style={{
            backgroundSize: '200% 100%',
          }}
          animate={{
            x: ['-100%', '100%'],
            backgroundPosition: ['0% 50%', '100% 50%'],
          }}
          transition={{
            x: {
              repeat: Infinity,
              duration: 1.5,
              ease: 'linear',
            },
            backgroundPosition: {
              repeat: Infinity,
              duration: 2,
              ease: 'linear',
            },
          }}
        />
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-purple-600 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Glowing orb */}
      <motion.div
        className="relative w-16 h-16"
        animate={{
          rotate: 360,
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'linear',
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-20 blur-xl" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-40 blur-lg" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600" />
      </motion.div>
    </div>
  );
}

export function GlowingProgress({ progress, text }: { progress: number; text?: string }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        >
          {/* Glowing effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
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
      {text && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{text}</span>
          <span className="font-medium text-purple-600 dark:text-purple-400">{progress}%</span>
        </div>
      )}
    </div>
  );
}
