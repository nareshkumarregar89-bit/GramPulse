import { useEffect, useState, useRef } from 'react';

/**
 * AnimatedCounter Component
 * Animates numeric values smoothly with an ease-out curve on initial load or value change.
 * Respects prefers-reduced-motion.
 */
export function AnimatedCounter({
  value = 0,
  duration = 750,
  formatter = (val) => val.toLocaleString(),
  className = ''
}) {
  const numericTarget = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);
  const prevTargetRef = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // If prefers reduced motion, set immediately
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(numericTarget);
      prevTargetRef.current = numericTarget;
      return;
    }

    const startValue = prevTargetRef.current;
    const diff = numericTarget - startValue;
    if (diff === 0) {
      setDisplayValue(numericTarget);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out expo formula for smooth landing
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startValue + diff * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(numericTarget);
        prevTargetRef.current = numericTarget;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [numericTarget, duration]);

  return <span className={className}>{formatter(displayValue)}</span>;
}
