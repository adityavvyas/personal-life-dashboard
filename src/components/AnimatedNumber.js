'use client';
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

export default function AnimatedNumber({ value, prefix = '', suffix = '', minimumFractionDigits = 0, duration = 1.5, delay = 0, times, ease = "easeOut" }) {
  const nodeRef = useRef(null);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease,
      times,
      onUpdate: (latest) => {
        if (nodeRef.current) {
          nodeRef.current.textContent = `${prefix}${latest.toLocaleString('en-IN', {
            minimumFractionDigits,
            maximumFractionDigits: minimumFractionDigits
          })}${suffix}`;
        }
      }
    });
    return () => controls.stop();
  }, [value, prefix, suffix, minimumFractionDigits, motionValue, duration, delay, times, ease]);

  return <motion.span ref={nodeRef}>{prefix}{(0).toLocaleString('en-IN', { minimumFractionDigits })}{suffix}</motion.span>;
}
