
import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../../types';

interface CustomDropdownProps {
    options: Category[];
    selectedId: string | undefined;
    onChange: (id: string) => void;
    placeholder: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, selectedId, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(opt => opt.id === selectedId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full md:col-span-2" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-3 border-2 border-border-color rounded-lg text-left bg-surface flex justify-between items-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                <span className={selectedOption ? 'text-text-primary' : 'text-text-secondary/80'}>{selectedOption ? selectedOption.name : placeholder}</span>
                <i className={`fas fa-chevron-down text-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && (
                <ul className="absolute z-20 w-full mt-1 bg-surface border-2 border-border-color rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fadeInUp" style={{ animationDuration: '200ms' }}>
                    {options.map(option => (
                        <li key={option.id} onClick={() => { onChange(option.id); setIsOpen(false); }} className={`p-3 cursor-pointer hover:bg-primary/10 transition-colors ${selectedId === option.id ? 'bg-primary/10 font-semibold text-primary' : ''}`}>{option.name}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CustomDropdown;
