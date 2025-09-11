"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NumberScrollProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function NumberScroll({
  value,
  duration = 0.8,
  className = "",
  prefix = "",
  suffix = "",
  decimals = 2,
}: NumberScrollProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      
      const startValue = displayValue;
      const endValue = value;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        
        // Easing function for smooth animation with bounce
        const easeOutBounce = (t: number) => {
          if (t < 1 / 2.75) {
            return 7.5625 * t * t;
          } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
          } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
          } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
          }
        };
        
        const currentValue = startValue + (endValue - startValue) * easeOutBounce(progress);
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, duration, displayValue]);

  const formatValue = (val: number) => {
    return val.toFixed(decimals);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={displayValue}
          initial={{ y: 20, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.8 }}
          transition={{ 
            duration: 0.4, 
            ease: "easeOut",
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          className="flex items-center"
        >
          <span className="text-muted-foreground text-sm">
            {prefix}{formatValue(displayValue)}{suffix}
          </span>
          {isAnimating && (
            <motion.div
              className="ml-1"
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.2, 1],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 0.3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              ↓↑
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

