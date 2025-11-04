import React from 'react';
import { Business } from '../types';
import { formatPhoneNumber } from '@/utils';
import StarRating from './common/StarRating';

interface BusinessCardProps {
    business: Business;
    onViewDetails: (business: Business) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onViewDetails }) => {
    return (
        <div className={`relative group bg-surface rounded-xl shadow-card transition-all duration-300 border-l-4 border-transparent hover:border-primary hover:shadow-card-hover hover:scale-[1.02] p-5 ${business.homeDelivery || (business.ratingCount && business.ratingCount > 0) ? 'pb-8' : ''}`}>
            
            {/* Bottom badges container */}
            <div className="absolute bottom-0 right-0 flex items-center gap-2">
                {/* Rating badge - Always show */}
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-tl-lg flex items-center gap-1.5 shadow-md" title={business.ratingCount && business.ratingCount > 0 ? `${business.ratingCount} रेटिंग्स` : 'अजून रेटिंग नाही'}>
                    {business.ratingCount && business.ratingCount > 0 ? (
                        <>
                            <span className="text-sm">{(business.avgRating || 0).toFixed(1)}</span>
                            <i className="fas fa-star text-xs"></i>
                        </>
                    ) : (
                        <>
                            <span className="text-sm opacity-80">-</span>
                            <i className="far fa-star text-xs opacity-80"></i>
                        </>
                    )}
                </div>
                
                {/* Delivery badge */}
                {business.homeDelivery && (
                    <div className="bg-secondary text-white text-xs font-bold px-3 py-1 rounded-br-xl flex items-center gap-1.5 shadow-md" title="होम डिलिव्हरी उपलब्ध">
                        <i className="fas fa-bicycle"></i>
                        <span>डिलिव्हरी</span>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-start gap-4">
                {/* Left side: Info */}
                <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                         <h4 className="font-inter text-lg font-bold text-primary pr-4 truncate group-hover:whitespace-normal" title={business.shopName}>{business.shopName}</h4>
                    </div>
                    <div className="mt-2 space-y-1.5 text-text-secondary">
                        <p className="flex items-center gap-3">
                            <i className="fas fa-user w-4 text-center text-gray-400"></i>
                            <span>{business.ownerName}</span>
                        </p>
                        <p className="flex items-center gap-3">
                            <i className="fas fa-phone w-4 text-center text-gray-400"></i>
                            <span className="font-semibold text-text-primary tracking-wider">{formatPhoneNumber(business.contactNumber)}</span>
                        </p>
                    </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex flex-col items-center justify-center gap-2 pt-1 flex-shrink-0">
                    <a 
                        href={`tel:${business.contactNumber}`} 
                        aria-label={`Call ${business.ownerName}`}
                        className="flex items-center justify-center w-9 h-9 bg-primary text-white rounded-full shadow-md transition-all transform hover:scale-110 hover:shadow-lg"
                    >
                        <i className="fas fa-phone text-lg"></i>
                    </a>
                    <button
                        onClick={() => onViewDetails(business)}
                        aria-label="View more details"
                        className="flex items-center justify-center w-9 h-9 bg-gray-200 text-text-secondary rounded-full transition-all transform hover:scale-110 hover:bg-gray-300"
                    >
                        <i className="fas fa-ellipsis text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BusinessCard;
