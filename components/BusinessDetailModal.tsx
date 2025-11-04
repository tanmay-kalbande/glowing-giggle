import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { formatPhoneNumber, getDeviceId, hasRated, markAsRated } from '@/utils';
import * as SupabaseService from '../supabaseClient';
import StarRating from './common/StarRating';

const InfoCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-surface rounded-lg shadow-subtle p-5 space-y-4">
        {children}
    </div>
);

const InfoItem: React.FC<{ icon: string; label: string; value?: string | React.ReactNode; href?: string; isHighlight?: boolean }> = ({ icon, label, value, href, isHighlight }) => {
    if (!value) return null;
    const valueClasses = `text-text-secondary ${isHighlight ? 'font-bold text-green-700' : ''}`;
    return (
        <div className="flex items-start gap-4">
            <i className={`fas ${icon} w-5 text-center text-secondary text-lg pt-1`}></i>
            <div>
                <p className="font-semibold text-text-secondary text-sm">{label}</p>
                {typeof value === 'string' ? (
                     <a href={href} target="_blank" rel="noopener noreferrer" className={href ? "text-primary hover:underline" : valueClasses}>{value}</a>
                ) : (
                    <div className={valueClasses}>{value}</div>
                )}
            </div>
        </div>
    );
};

interface BusinessDetailModalProps {
    business: Business | null;
    onClose: () => void;
    onRatingSubmitted: (businessId: string, newRating: number) => void;
}

const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({ business, onClose, onRatingSubmitted }) => {
    const [isSharing, setIsSharing] = useState(false);
    const [userHasRated, setUserHasRated] = useState(false);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [ratingMessage, setRatingMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
    const [currentRating, setCurrentRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isCheckingRatingStatus, setIsCheckingRatingStatus] = useState(true);

    useEffect(() => {
        const checkRatingStatus = async () => {
            if (!business) return;
            
            setIsCheckingRatingStatus(true);
            
            // Check local storage first (fast)
            const localCheck = hasRated(business.id);
            setUserHasRated(localCheck);
            
            // Then verify with server (authoritative)
            try {
                const deviceId = getDeviceId();
                const serverCheck = await SupabaseService.hasDeviceRated(business.id, deviceId);
                
                if (serverCheck !== localCheck) {
                    // Sync local storage with server state
                    if (serverCheck) {
                        markAsRated(business.id);
                    }
                    setUserHasRated(serverCheck);
                }
            } catch (error) {
                console.error('Error checking rating status:', error);
                // Use local check as fallback
            } finally {
                setIsCheckingRatingStatus(false);
            }
        };
        
        checkRatingStatus();
        setCurrentRating(business?.avgRating || 0);
    }, [business]);

    const handleRatingSubmit = async (rating: number) => {
        if (!business || userHasRated || isSubmittingRating) return;
        
        setIsSubmittingRating(true);
        setRatingMessage(null);
        
        try {
            const result = await SupabaseService.addBusinessRating({
                businessId: business.id,
                rating,
                deviceId: getDeviceId(),
            });
            
            // Mark as rated locally
            markAsRated(business.id);
            setUserHasRated(true);
            
            // Update local state with new rating stats
            if (result.newAvgRating !== undefined) {
                setCurrentRating(result.newAvgRating);
            }
            
            // Show success message
            setRatingMessage({
                text: result.message || 'तुमचे रेटिंग स्वीकारले आहे, धन्यवाद!',
                type: 'success'
            });
            
            // Notify parent component
            onRatingSubmitted(business.id, rating);
            
            // Clear success message after 3 seconds
            setTimeout(() => setRatingMessage(null), 3000);
            
        } catch (error: any) {
            console.error("Failed to submit rating", error);
            
            // Show error message
            const errorText = error.message || 'रेटिंग सबमिट करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.';
            setRatingMessage({
                text: errorText,
                type: 'error'
            });
            
            // If server says already rated, sync local state
            if (error.message && error.message.includes('आधीच')) {
                markAsRated(business.id);
                setUserHasRated(true);
            }
            
            // Clear error message after 5 seconds
            setTimeout(() => setRatingMessage(null), 5000);
            
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const shareBusinessDetails = async () => {
        if (!business) return;
        setIsSharing(true);
        const baseUrl = `${window.location.origin}${window.location.pathname}`;
        const shareUrl = `${baseUrl}?businessId=${business.id}`;
        const details = [`*${business.shopName}*`, `👤 ${business.ownerName}`, `📞 ${formatPhoneNumber(business.contactNumber)}`];
        if (business.address) details.push(`📍 ${business.address}`);
        if (business.services && business.services.length > 0) details.push(`🛠️ सेवा: ${business.services.join(', ')}`);
        details.push(`\n_~ जवळा व्यवसाय निर्देशिका द्वारे पाठवले ~_`);
        const shareText = details.join('\n');
        
        try {
            if (navigator.share) {
                await navigator.share({ title: `${business.shopName} | जवळा व्यवसाय निर्देशिका`, text: shareText, url: shareUrl });
            } else {
                await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
                alert('शेअरिंग समर्थित नाही. तपशील आणि लिंक क्लिपबोर्डवर कॉपी केली आहे!');
            }
        } catch (error) {
            console.error('Sharing failed:', error);
        } finally {
            setIsSharing(false);
        }
    };
    
    if (!business) return null;
    
    const mapUrl = business.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}` : undefined;
    const displayRating = currentRating || business.avgRating || 0;
    const displayCount = business.ratingCount || 0;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 animate-fadeInUp" style={{animationDuration: '0.3s'}} onClick={onClose}>
            <div className="bg-background rounded-xl shadow-xl w-11/12 max-w-md m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="bg-secondary p-5 rounded-t-xl text-white relative">
                    <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white text-3xl w-8 h-8 flex items-center justify-center transition-colors">&times;</button>
                    <h3 className="font-inter text-2xl font-bold">{business.shopName}</h3>
                    <p className="opacity-90 text-base">{business.ownerName}</p>
                </header>

                <main className="p-4 space-y-3 overflow-y-auto">
                    <InfoCard>
                        <a href={`tel:${business.contactNumber}`} className="flex items-start gap-4 group">
                            <i className="fas fa-phone-alt w-5 text-center text-secondary text-lg pt-1 group-hover:text-primary transition-colors"></i>
                            <div>
                                <p className="font-semibold text-text-secondary text-sm">संपर्क</p>
                                <p className="text-lg text-primary font-bold tracking-wider group-hover:underline">{formatPhoneNumber(business.contactNumber)}</p>
                            </div>
                        </a>
                    </InfoCard>

                    <InfoCard>
                        <div className="flex flex-col items-center">
                            {isCheckingRatingStatus ? (
                                <div className="py-4">
                                    <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
                                    <p className="text-sm text-text-secondary mt-2">रेटिंग स्थिती तपासत आहे...</p>
                                </div>
                            ) : (
                                <>
                                    <p className="font-bold text-text-primary mb-2">
                                        {userHasRated ? '⭐ तुम्ही रेट केले आहे' : 'या व्यवसायाला रेट करा'}
                                    </p>
                                    <div className="relative">
                                        <StarRating 
                                            rating={displayRating} 
                                            onRatingChange={handleRatingSubmit} 
                                            disabled={userHasRated || isSubmittingRating || isCheckingRatingStatus}
                                            size="lg"
                                        />
                                        {!userHasRated && !isSubmittingRating && (
                                            <p className="text-xs text-text-secondary mt-1 text-center">
                                                ⭐ पर क्लिक करून रेट करा
                                            </p>
                                        )}
                                    </div>
                                    {displayCount > 0 && (
                                        <p className="text-sm text-text-secondary mt-2">
                                            <span className="font-bold">{displayRating.toFixed(1)}</span> / 5.0 ({displayCount} रेटिंग)
                                        </p>
                                    )}
                                    {isSubmittingRating && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <i className="fas fa-spinner fa-spin text-primary"></i>
                                            <p className="text-sm text-primary animate-pulse">रेटिंग सबमिट करत आहे...</p>
                                        </div>
                                    )}
                                    {ratingMessage && (
                                        <div className={`mt-3 p-3 rounded-lg text-sm font-semibold text-center ${
                                            ratingMessage.type === 'success' 
                                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                            {ratingMessage.type === 'success' && '✓ '}
                                            {ratingMessage.type === 'error' && '⚠ '}
                                            {ratingMessage.text}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </InfoCard>

                    {(business.address || business.openingHours || business.homeDelivery) && (
                        <InfoCard>
                            <InfoItem icon="fa-map-marker-alt" label="पत्ता" value={business.address} href={mapUrl} />
                            <InfoItem icon="fa-clock" label="वेळ" value={business.openingHours} />
                            {business.homeDelivery && 
                                <InfoItem icon="fa-bicycle" label="होम डिलिव्हरी" value="उपलब्ध" isHighlight={true} />
                            }
                        </InfoCard>
                    )}

                    {business.services && business.services.length > 0 && 
                        <InfoCard>
                             <div>
                                <h4 className="font-bold text-text-primary mb-3">सेवा/उत्पादने:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {business.services.map(s => <span key={s} className="bg-secondary/20 text-secondary-dark text-sm font-semibold px-3 py-1 rounded-full">{s}</span>)}
                                </div>
                            </div>
                        </InfoCard>
                    }
                </main>

                <footer className="p-3 border-t border-border-color grid grid-cols-2 gap-3 bg-background/70 rounded-b-xl">
                    <a href={`https://wa.me/91${business.contactNumber}?text=${encodeURIComponent('नमस्कार, मी "जवळा व्यवसाय निर्देशिका" वरून आपला संपर्क घेतला आहे.')}`} target="_blank" rel="noopener noreferrer" className="w-full text-center py-3 rounded-lg transition-all flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold"><i className="fab fa-whatsapp text-xl"></i> WhatsApp</a>
                    <button onClick={shareBusinessDetails} disabled={isSharing} className="w-full text-center py-3 rounded-lg transition-all flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-bold disabled:bg-gray-400">
                        {isSharing ? <><i className="fas fa-spinner fa-spin"></i> शेअर करत आहे...</> : <><i className="fas fa-share text-xl"></i> शेअर करा</>}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default BusinessDetailModal;
