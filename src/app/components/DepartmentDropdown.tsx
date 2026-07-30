import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { DEPARTMENT_GROUPS } from '../constants/departments';

interface DepartmentDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DepartmentDropdown({ value, onChange, placeholder = "Select Department", className = "", disabled = false }: DepartmentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGroups = DEPARTMENT_GROUPS.map(group => ({
    ...group,
    options: group.options.filter(opt =>
      opt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.options.length > 0);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm transition-all ${
          disabled ? 'bg-slate-50 border-slate-200 cursor-not-allowed text-slate-500' :
          isOpen ? 'border-green-400 ring-2 ring-green-500/10 bg-white' : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
        }`}
      >
        <span className={value ? 'text-slate-700' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <X
              className="w-4 h-4 text-slate-300 hover:text-slate-500 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                No matching departments found
              </div>
            ) : (
              filteredGroups.map((group, gIdx) => (
                <div key={gIdx} className="mb-2 last:mb-0">
                  <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    {group.category}
                  </div>
                  {group.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      onClick={() => handleSelect(opt)}
                      className={`px-4 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                        value === opt ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                      {value === opt && <Check className="w-4 h-4 text-green-600" />}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
