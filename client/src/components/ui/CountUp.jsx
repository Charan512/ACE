import { useEffect, useRef, useState } from 'react';

/**
 * CountUp — Animated number counter (React Bits inspired).
 * Counts from `start` to `end` over `duration` ms using requestAnimationFrame.
 * Uses an easeOutQuart curve for a premium deceleration feel.
 */
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

const CountUp = ({
  end,
  start = 0,
  duration = 1800,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [value, setValue] = useState(start);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = null;

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      setValue(Math.round(start + (end - start) * easedProgress));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, start, duration]);

  return (
    <span className={className}>
      {prefix}{value}{suffix}
    </span>
  );
};

export default CountUp;
