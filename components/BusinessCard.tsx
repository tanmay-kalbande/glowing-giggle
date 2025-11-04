import React from 'react';
import { Business } from '../types';
import { formatPhoneNumber } from '@/utils';

interface BusinessCardProps {
    business: Business;
    categoryIcon?: string;
    categoryName?: string;
    onViewDetails: (business: Business) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, categoryIcon, categoryName, onViewDetails }) => {
    return (
        <div className="group bg-surface rounded-xl shadow-card transition-shadow duration-300 hover:shadow-card-hover overflow-hidden flex flex-col">
            {/* Card Header */}
            <div className="p-4 bg-gray-50 border-b border-border-color flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                    <i className={`${categoryIcon || 'fa-solid fa-store'} text-xl text-secondary`}></i>
                    <span className="text-sm font-semibold text-text-secondary truncate">{categoryName || 'Business'}</span>
                </div>
                {business.homeDelivery && (
                    <div className="flex-shrink-0 bg-secondary text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5" title="होम डिलिव्हरी उपलब्ध">
                        <i className="fas fa-bicycle"></i>
                        <span>डिलिव्हरी</span>
                    </div>
                )}
            </div>

            {/* Card Body */}
            <div className="p-4 flex-grow">
                <h4 className="font-inter text-xl font-bold text-primary truncate group-hover:whitespace-normal" title={business.shopName}>{business.shopName}</h4>
                <p className="flex items-center gap-3 mt-2 text-text-secondary">
                    <i className="fas fa-user w-4 text-center text-gray-400"></i>
                    <span>{business.ownerName}</span>
                </p>
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                     <p className="flex items-center gap-3 text-text-primary">
                        <i className="fas fa-phone w-4 text-center text-gray-400"></i>
                        <span className="font-semibold tracking-wider text-md">{formatPhoneNumber(business.contactNumber)}</span>
                    </p>
                </div>
            </div>

            {/* Card Footer Actions */}
            <div className="border-t border-border-color bg-gray-50/50 grid grid-cols-2">
                 <a 
                    href={`tel:${business.contactNumber}`} 
                    aria-label={`Call ${business.ownerName}`}
                    className="flex items-center justify-center gap-2 py-3 text-primary font-bold transition-colors hover:bg-primary/10"
                >
                    <i className="fas fa-phone"></i>
                    <span>कॉल करा</span>
                </a>
                 <button
                    onClick={() => onViewDetails(business)}
                    aria-label="View more details"
                    className="flex items-center justify-center gap-2 py-3 text-secondary font-bold transition-colors hover:bg-secondary/10 border-l border-border-color"
                >
                    <i className="fas fa-eye"></i>
                    <span>अधिक पहा</span>
                </button>
            </div>
        </div>
    );
};

export default BusinessCard;
