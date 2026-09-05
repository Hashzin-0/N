'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '@/components/ThemeProvider';
import GooeySvgFilter from '@/components/GooeySvgFilter';

interface GooeyTabPanelProps {
  isActive: boolean;
  filterId?: string;
  children: React.ReactNode;
  className?: string;
}

export default function GooeyTabPanel({
  isActive,
  filterId = 'tab-gooey',
  children,
  className = '',
}: GooeyTabPanelProps) {
  const { isDark } = useTheme();
  const unsupported =
    /safari/i.test(navigator.userAgent) &&
    !/chrome|chromium|android/i.test(navigator.userAgent) ||
    /firefox/i.test(navigator.userAgent);
  const blobColor = isDark ? '#121511' : '#FDFBF7';
  const filterStyle = unsupported ? undefined : { filter: `url(#${filterId})` };

  return (
    <div className={`relative ${className}`.trim()}>
      {/* Filtered background blob — creates the organic gooey edge */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="gooey-blob"
            className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
            style={filterStyle}
            initial={{ opacity: 0, scaleY: 0.85, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1, originY: 0 }}
            exit={{ opacity: 0, scaleY: 0.85, originY: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <div
              className="w-full h-full"
              style={{ backgroundColor: blobColor }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crisp content layer — no filter, text stays sharp */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            key="tab-content"
            className="relative z-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
