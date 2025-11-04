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
    const [ratingMessage, setRatingMessage] = useState('');

    useEffect(() => {
        if (business) {
            setUserHasRated(hasRated(business.id));
        }
    }, [business]);

    const handleRatingSubmit = async (rating: number) => {
        if (!business) return;
        setIsSubmittingRating(true);
        setRatingMessage('');
        try {
            await SupabaseService.addBusinessRating({
                businessId: business.id,
                rating,
                deviceId: getDeviceId(),
            });
            markAsRated(business.id);
            setUserHasRated(true);
            setRatingMessage('तुमचे रेटिंग स्वीकारले आहे, धन्यवाद!');
            onRatingSubmitted(business.id, rating); // Notify parent to optimistically update
        } catch (error: any) {
            console.error("Failed to submit rating", error);
            setRatingMessage(error.message || 'रेटिंग सबमिट करताना त्रुटी आली.');
            // If server says we've already rated, sync local storage
            if (error.message.includes('already rated')) {
                markAsRated(business.id);
                setUserHasRated(true);
            }
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

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 animate-fadeInUp" style={{animationDuration: '0.3s'}} onClick={onClose}>
            <div className="bg-background rounded-xl shadow-xl w-11/12 max-w-md m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="bg-secondary p-5 rounded-t-xl text-white relative">
                    <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white text-3xl w-8 h-8 flex items-center justify-center">&times;</button>
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
                            <p className="font-bold text-text-primary mb-2">{userHasRated ? 'सरासरी रेटिंग' : 'या व्यवसायाला रेट करा'}</p>
                            <StarRating 
                                rating={business.avgRating || 0} 
                                onRatingChange={handleRatingSubmit} 
                                disabled={userHasRated || isSubmittingRating}
                                size="lg"
                            />
                            {business.ratingCount && business.ratingCount > 0 && (
                                <p className="text-sm text-text-secondary mt-1">({business.ratingCount} रेटिंग)</p>
                            )}
                            {isSubmittingRating && <p className="text-sm text-primary mt-2 animate-pulse">रेटिंग सबमिट करत आहे...</p>}
                            {ratingMessage && <p className={`text-sm mt-2 font-semibold ${ratingMessage.includes('धन्यवाद') ? 'text-green-600' : 'text-red-600'}`}>{ratingMessage}</p>}
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
