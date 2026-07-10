'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';

export default function CustomDatePicker({ value, onChange, placeholder = 'Select date', style = {}, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const datepickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datepickerRef.current && !datepickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDate = value ? new Date(value) : null;
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (day) => {
    // Return yyyy-mm-dd
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  return (
    <div ref={datepickerRef} style={{ position: 'relative', width: '100%', ...style }} className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'var(--bg-color)',
          border: 'var(--border-delicate)',
          borderRadius: 'var(--radius-md)',
          color: selectedDate ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'var(--transition-fast)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={16} color="var(--text-muted)" />
          {selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="datepicker-popup"
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              width: '280px',
              zIndex: 100,
              padding: '1rem'
            }}
          >
            <style>{`
              .datepicker-popup {
                background: rgba(255, 255, 255, 0.65);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(0,0,0,0.1);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-lg);
              }
              [data-theme="dark"] .datepicker-popup {
                background: rgba(30, 30, 35, 0.95) !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
              }
              .datepicker-day {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                border: none;
                background: transparent;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s ease;
                color: var(--text-primary);
              }
              .datepicker-day:hover {
                background: rgba(0,0,0,0.05);
              }
              [data-theme="dark"] .datepicker-day:hover {
                background: rgba(255,255,255,0.1);
              }
              .datepicker-day.selected {
                background: var(--accent-primary) !important;
                color: white !important;
                font-weight: 600;
              }
            `}</style>
            
            
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button type="button" onClick={prevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronLeft size={18} /></button>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <button type="button" onClick={nextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem', textAlign: 'center' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{day}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', justifyItems: 'center' }}>
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {days.map(day => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toString()}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={`datepicker-day ${isSelected ? 'selected' : ''}`}
                    style={{
                      border: isToday && !isSelected ? '1px solid var(--accent-primary)' : 'none',
                    }}
                  >
                    {format(day, 'd')}
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
