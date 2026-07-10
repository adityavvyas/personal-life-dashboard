'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch/mobile devices or narrow screens (DevTools mobile emulation)
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || (typeof window !== 'undefined' && window.innerWidth < 768);
    setIsTouchDevice(isTouch);
    
    const handleResize = () => setIsTouchDevice(window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      // Elements that should trigger the expanded cursor
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.interactive')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isTouchDevice]);

  // Don't render anything on touch devices
  if (isTouchDevice) return null;

  const variants = {
    default: {
      x: mousePosition.x - 8,
      y: mousePosition.y - 8,
      width: 16,
      height: 16,
      backgroundColor: 'var(--text-primary)',
      opacity: 0.6,
      border: '0px solid transparent'
    },
    hover: {
      x: mousePosition.x - 24,
      y: mousePosition.y - 24,
      width: 48,
      height: 48,
      backgroundColor: 'transparent',
      opacity: 0.8,
      border: '2px solid var(--text-primary)'
    }
  };

  return (
    <>
      <style>{`
        body {
          cursor: default; /* Keep native cursor for better UX */
        }
        a, button, .interactive {
          cursor: none !important;
        }
      `}</style>
      <motion.div
        className="custom-cursor"
        variants={variants}
        animate={isHovering ? 'hover' : 'default'}
        transition={{
          x: { type: "tween", duration: 0 },
          y: { type: "tween", duration: 0 },
          width: { type: "spring", stiffness: 500, damping: 28 },
          height: { type: "spring", stiffness: 500, damping: 28 },
          backgroundColor: { duration: 0.2 },
          border: { duration: 0.2 }
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          mixBlendMode: 'difference'
        }}
      />
    </>
  );
}
