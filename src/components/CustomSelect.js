'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder = 'Select an option', style = {}, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState('down'); // 'down' or 'up'
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate whether to open up or down
  const handleToggle = useCallback(() => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownMaxHeight = 220;

      if (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow) {
        setOpenDirection('up');
      } else {
        setOpenDirection('down');
      }
    }
    setIsOpen(!isOpen);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const dropdownPositionStyle = openDirection === 'up'
    ? { bottom: 'calc(100% + 0.5rem)', top: 'auto' }
    : { top: 'calc(100% + 0.5rem)', bottom: 'auto' };

  const animateFrom = openDirection === 'up' ? 10 : -10;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }} className={className}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'var(--bg-color)',
          border: 'var(--border-delicate)',
          borderRadius: 'var(--radius-md)',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'var(--transition-fast)'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color="var(--text-muted)" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: animateFrom, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: animateFrom, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: 'absolute',
              ...dropdownPositionStyle,
              left: 0,
              minWidth: '100%',
              width: 'max-content',
              maxWidth: '300px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-delicate)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            <style>{`
              .custom-select-dropdown-list {
                max-height: 250px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: var(--text-muted) transparent;
                scroll-behavior: smooth;
              }
              .custom-select-dropdown-list::-webkit-scrollbar {
                width: 6px;
              }
              .custom-select-dropdown-list::-webkit-scrollbar-track {
                background: transparent;
                margin: 4px 0;
              }
              .custom-select-dropdown-list::-webkit-scrollbar-thumb {
                background: var(--border-strong);
                border-radius: 6px;
              }
              .custom-select-dropdown-list::-webkit-scrollbar-thumb:hover {
                background: var(--text-muted);
              }
              .custom-select-option {
                transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: pointer;
                border-radius: 6px;
                margin: 2px 4px;
              }
              .custom-select-option:hover {
                background: var(--bg-color);
                transform: translateX(4px);
              }
              .custom-select-option.is-active {
                background: var(--bg-color);
                font-weight: 600;
              }
            `}</style>
            <div className="custom-select-dropdown-list" style={{ padding: '0.25rem 0' }}>
              {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`custom-select-option ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    style={{
                      width: 'calc(100% - 8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 500 : 400,
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      gap: '1rem'
                    }}
                  >
                    {opt.label}
                    {isActive && (
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: 'var(--accent-success, #10b981)',
                        display: 'inline-block'
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

