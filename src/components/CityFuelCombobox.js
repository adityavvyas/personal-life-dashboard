'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, MapPin } from 'lucide-react';

const CITIES = [
  { slug: 'ahmedabad', label: 'Ahmedabad' },
  { slug: 'bangalore', label: 'Bangalore' },
  { slug: 'bhopal', label: 'Bhopal' },
  { slug: 'chandigarh', label: 'Chandigarh' },
  { slug: 'chennai', label: 'Chennai' },
  { slug: 'delhi', label: 'Delhi' },
  { slug: 'gurgaon', label: 'Gurgaon' },
  { slug: 'hyderabad', label: 'Hyderabad' },
  { slug: 'indore', label: 'Indore' },
  { slug: 'jaipur', label: 'Jaipur' },
  { slug: 'kolkata', label: 'Kolkata' },
  { slug: 'lucknow', label: 'Lucknow' },
  { slug: 'mumbai', label: 'Mumbai' },
  { slug: 'noida', label: 'Noida' },
  { slug: 'pune', label: 'Pune' }
];

export default function CityFuelCombobox({ value, onSelect, placeholder = 'Select a city', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const handleToggle = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) setSearch(''); // Reset search when opening
      return !prev;
    });
  }, []);

  const selectedOption = CITIES.find(c => c.slug === value);

  const filteredCities = useMemo(() => {
    if (!search.trim()) return CITIES;
    const lowerSearch = search.toLowerCase();
    return CITIES.filter(city => city.label.toLowerCase().includes(lowerSearch));
  }, [search]);

  return (
    <div ref={dropdownRef} className={className} style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
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
          background: 'var(--bg-surface)',
          border: 'var(--border-delicate)',
          borderRadius: 'var(--radius-md)',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'var(--transition-fast)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={16} color="var(--text-muted)" />
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color="var(--text-muted)" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              left: 0,
              minWidth: '100%',
              width: 'max-content',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-delicate)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
              zIndex: 100,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-delicate)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                    background: 'var(--bg-color)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
            </div>

            <style>{`
              .city-combobox-list {
                max-height: 250px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: var(--text-muted) transparent;
              }
              .city-combobox-list::-webkit-scrollbar {
                width: 6px;
              }
              .city-combobox-list::-webkit-scrollbar-track {
                background: transparent;
                margin: 4px 0;
              }
              .city-combobox-list::-webkit-scrollbar-thumb {
                background: var(--border-strong);
                border-radius: 6px;
              }
              .city-combobox-list::-webkit-scrollbar-thumb:hover {
                background: var(--text-muted);
              }
              .city-combobox-option {
                transition: all 0.2s;
                cursor: pointer;
                border-radius: 6px;
                margin: 2px 4px;
              }
              .city-combobox-option:hover {
                background: var(--bg-color);
                transform: translateX(4px);
              }
              .city-combobox-option.is-active {
                background: var(--bg-color);
                font-weight: 600;
              }
            `}</style>
            
            <div className="city-combobox-list" style={{ padding: '0.25rem 0' }}>
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => {
                  const isActive = city.slug === value;
                  return (
                    <button
                      key={city.slug}
                      type="button"
                      className={`city-combobox-option ${isActive ? 'is-active' : ''}`}
                      onClick={() => {
                        onSelect(city.slug);
                        setIsOpen(false);
                      }}
                      style={{
                        width: 'calc(100% - 8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 500 : 400,
                        fontSize: '0.85rem'
                      }}
                    >
                      {city.label}
                      {isActive && <Check size={14} color="var(--accent-success, #10b981)" />}
                    </button>
                  );
                })
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No cities found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
