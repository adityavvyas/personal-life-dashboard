'use client';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      overflow: 'hidden',
    }}>
      {/* Dynamic blurred orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0, -100, 0],
          y: [0, 50, 100, 50, 0],
          scale: [1, 1.2, 1, 0.8, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          width: '50vw',
          height: '50vw',
          maxHeight: '600px',
          maxWidth: '600px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(66, 153, 225, 0.3) 0%, rgba(102, 126, 234, 0.3) 100%)',
          filter: 'blur(100px)',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      <motion.div
        animate={{
          x: [0, -150, 0, 150, 0],
          y: [0, -100, -50, -100, 0],
          scale: [1, 0.8, 1, 1.2, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '40vw',
          height: '40vw',
          maxHeight: '500px',
          maxWidth: '500px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(159, 122, 234, 0.2) 100%)',
          filter: 'blur(90px)',
          transform: 'translate(50%, 50%)'
        }}
      />
      
      <motion.div
        animate={{
          x: [0, 50, -50, 50, 0],
          y: [0, -50, 50, -50, 0],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '60vw',
          height: '60vw',
          maxHeight: '700px',
          maxWidth: '700px',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          background: 'linear-gradient(135deg, rgba(237, 137, 54, 0.15) 0%, rgba(221, 107, 32, 0.15) 100%)',
          filter: 'blur(120px)',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      {/* Noise overlay for premium texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.02,
        background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        pointerEvents: 'none'
      }} />
    </div>
  );
}
