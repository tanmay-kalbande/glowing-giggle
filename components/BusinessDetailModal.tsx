import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { formatPhoneNumber, getDeviceId, hasRated, markAsRated, getUserName, hasBeenPromptedForName, setUserName, markNamePrompted } from '@/utils';
import * as SupabaseService from '../supabaseClient';
import StarRating from './common/StarRating';
import NamePromptModal from './common/NamePromptModal';

const InfoCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-4 space-y-3 border border-gray-100">
        {children}
    </div>
);

const InfoItem: React.FC<{ icon: string; label: string; value?: string | React.ReactNode; href?: string; isHighlight?: boolean }> = ({ icon, label, value, href, isHighlight }) => {
    if (!value) return null;
    const valueClasses = `text-text-secondary ${isHighlight ? 'font-bold text-green-700' : ''}`;
    return (
        <div className="flex items-start gap-3">
            <i className={`fas ${icon} w-4 text-center text-secondary text-base pt-0.5`}></i>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-text-secondary text-xs mb-0.5">{label}</p>
                {typeof value === 'string' ? (
                     <a href={href} target="_blank" rel="noopener noreferrer" className={href ? "text-primary hover:underline text-sm" : `${valueClasses} text-sm`}>{value}</a>
                ) : (
                    <div className={`${valueClasses} text-sm`}>{value}</div>
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
    
    // Name state
    const [userName, setUserNameState] = useState<string | null>(null);
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [userRating, setUserRating] = useState<number>(0);
    
    // Local state for ratings
    const [displayRating, setDisplayRating] = useState(0);
    const [displayCount, setDisplayCount] = useState(0);
    const [isLoadingRatings, setIsLoadingRatings] = useState(true);

    // Load rating data whenever business changes
    useEffect(() => {
        const loadRatingData = async () => {
            if (!business) return;
            
            setIsLoadingRatings(true);
            setRatingMessage(null); // Clear any previous messages
            
            try {
                // Check if user has rated
                const localCheck = hasRated(business.id);
                const deviceId = getDeviceId();
                const serverCheck = await SupabaseService.hasDeviceRated(business.id, deviceId);
                
                // Sync local with server
                if (serverCheck && !localCheck) {
                    markAsRated(business.id);
                }
                
                setUserHasRated(serverCheck);
                
                // Get user name if available
                const storedName = getUserName();
                setUserNameState(storedName);
                
                // Fetch fresh rating statistics
                const stats = await SupabaseService.getBusinessRatingStats(business.id);
                setDisplayRating(stats.avgRating);
                setDisplayCount(stats.ratingCount);
                
                // If user has rated, try to get their specific rating
                if (serverCheck) {
                    const ratings = await SupabaseService.getBusinessRatings(business.id);
                    const userRatingEntry = ratings.find(r => r.user_name === storedName);
                    if (userRatingEntry) {
                        setUserRating(userRatingEntry.rating);
                    }
                }
                
                // Show soft name prompt on first app use (delayed, non-blocking)
                if (!hasBeenPromptedForName() && !storedName) {
                    setTimeout(() => setShowNamePrompt(true), 1500);
                }
                
            } catch (error) {
                console.error('Error loading rating data:', error);
                // Fallback to business prop data
                setDisplayRating(business.avgRating || 0);
                setDisplayCount(business.ratingCount || 0);
            } finally {
                setIsLoadingRatings(false);
            }
        };
        
        loadRatingData();
    }, [business?.id]); // Only re-run when business ID changes

    // Handle name submission
    const handleNameSubmit = (name: string) => {
        setUserName(name);
        setUserNameState(name);
        setShowNamePrompt(false);
    };

    // Handle name prompt skip
    const handleNameSkip = () => {
        markNamePrompted();
        setShowNamePrompt(false);
    };

    const handleRatingSubmit = async (rating: number) => {
        if (!business || isSubmittingRating) return;
        
        // Smooth edit flow - no confirmation needed
        const isEditing = userHasRated && userRating > 0;
        
        setIsSubmittingRating(true);
        setRatingMessage(null);
        
        try {
            // Optimistically update local rating immediately
            const previousRating = userRating;
            setUserRating(rating);
            
            // Calculate optimistic display
            if (isEditing) {
                // Editing: remove old rating and add new one
                const totalWithoutOld = (displayRating * displayCount) - previousRating;
                const newAvg = (totalWithoutOld + rating) / displayCount;
                setDisplayRating(newAvg);
            } else {
                // New rating: add to total
                const newCount = displayCount + 1;
                const totalRating = (displayRating * displayCount) + rating;
                const newAvg = totalRating / newCount;
                setDisplayRating(newAvg);
                setDisplayCount(newCount);
            }
            
            const result = await SupabaseService.addBusinessRating({
                businessId: business.id,
                rating,
                deviceId: getDeviceId(),
                userName: userName || undefined,
            });
            
            // Mark as rated locally
            if (!userHasRated) {
                markAsRated(business.id);
                setUserHasRated(true);
            }
            
            // Update with server's actual values
            if (result.newAvgRating !== undefined && result.newRatingCount !== undefined) {
                setDisplayRating(result.newAvgRating);
                setDisplayCount(result.newRatingCount);
            }
            
            // Show success message
            const messageText = isEditing 
                ? '✓ तुमचे रेटिंग अपडेट झाले!' 
                : (result.message || '✓ धन्यवाद! तुमचे रेटिंग सेव्ह झाले.');
            
            setRatingMessage({
                text: messageText,
                type: 'success'
            });
            
            // Notify parent component
            onRatingSubmitted(business.id, rating);
            
            // Clear message after 2 seconds
            setTimeout(() => setRatingMessage(null), 2000);
            
        } catch (error: any) {
            console.error("Failed to submit rating", error);
            
            // Revert optimistic update
            setUserRating(previousRating);
            
            const errorText = error.message || 'रेटिंग सबमिट करताना त्रुटी आली.';
            setRatingMessage({
                text: errorText,
                type: 'error'
            });
            
            // Clear error after 4 seconds
            setTimeout(() => setRatingMessage(null), 4000);
            
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
        <>
            {/* Name Prompt Modal */}
            {showNamePrompt && (
                <NamePromptModal 
                    onNameSubmit={handleNameSubmit}
                    onSkip={handleNameSkip}
                />
            )}
            
            {/* Main Business Detail Modal */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 animate-fadeInUp p-4" style={{animationDuration: '0.2s'}} onClick={onClose}>
                <div className="bg-gradient-to-br from-background to-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Compact Header */}
                    <header className="bg-gradient-to-r from-primary to-secondary p-4 text-white relative">
                        <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white text-2xl w-8 h-8 flex items-center justify-center transition-colors bg-white/10 rounded-full hover:bg-white/20">&times;</button>
                        <h3 className="font-inter text-xl font-bold pr-10">{business.shopName}</h3>
                        <p className="opacity-90 text-sm mt-0.5">{business.ownerName}</p>
                    </header>

                    <main className="p-4 space-y-3 overflow-y-auto flex-1">
                        {/* Contact Card */}
                        <InfoCard>
                            <a href={`tel:${business.contactNumber}`} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <i className="fas fa-phone-alt text-primary text-lg"></i>
                                </div>
                                <div>
                                    <p className="font-medium text-text-secondary text-xs">संपर्क</p>
                                    <p className="text-base text-primary font-bold tracking-wider group-hover:underline">{formatPhoneNumber(business.contactNumber)}</p>
                                </div>
                            </a>
                        </InfoCard>

                        {/* Elegant Rating Card */}
                        <InfoCard>
                            {isLoadingRatings ? (
                                <div className="py-6 flex flex-col items-center">
                                    <i className="fas fa-spinner fa-spin text-xl text-primary mb-2"></i>
                                    <p className="text-xs text-text-secondary">रेटिंग लोड करत आहे...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Rating Display */}
                                    <div className="text-center pb-3 border-b border-gray-100">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <span className="text-3xl font-bold text-primary">
                                                {displayCount > 0 ? displayRating.toFixed(1) : '-'}
                                            </span>
                                            <div className="text-left">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <i key={i} className={`fas fa-star text-xs ${i < Math.round(displayRating) ? 'text-yellow-500' : 'text-gray-300'}`}></i>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-text-secondary mt-0.5">
                                                    {displayCount > 0 ? `${displayCount} ${displayCount === 1 ? 'रेटिंग' : 'रेटिंग्स'}` : 'रेटिंग नाही'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interactive Rating Section */}
                                    <div className="flex flex-col items-center py-2">
                                        <StarRating 
                                            rating={userRating} 
                                            onRatingChange={handleRatingSubmit}
                                            disabled={isSubmittingRating}
                                            size="lg"
                                            showLabel={!userHasRated}
                                            interactive={true}
                                        />
                                        
                                        {/* User Status */}
                                        <div className="mt-3 text-center">
                                            {userHasRated ? (
                                                <p className="text-xs text-green-600 font-medium flex items-center gap-1.5 justify-center">
                                                    <i className="fas fa-check-circle"></i>
                                                    तुमचे रेटिंग: {userRating} ⭐ {userName && `(${userName})`}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-primary font-medium">
                                                    {isSubmittingRating ? 'रेटिंग सेव्ह करत आहे...' : '⭐ रेट करण्यासाठी स्टार क्लिक करा'}
                                                </p>
                                            )}
                                            
                                            {/* Name prompt link */}
                                            {!userName && !userHasRated && (
                                                <button 
                                                    onClick={() => setShowNamePrompt(true)}
                                                    className="text-xs text-secondary hover:underline mt-1 flex items-center gap-1 justify-center mx-auto"
                                                >
                                                    <i className="fas fa-user-plus text-xs"></i>
                                                    नाव जोडा (ऐच्छिक)
                                                </button>
                                            )}
                                        </div>

                                        {/* Messages */}
                                        {ratingMessage && (
                                            <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium text-center animate-fadeInUp ${
                                                ratingMessage.type === 'success' 
                                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                                {ratingMessage.text}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </InfoCard>

                        {/* Additional Info */}
                        {(business.address || business.openingHours || business.homeDelivery) && (
                            <InfoCard>
                                <InfoItem icon="fa-map-marker-alt" label="पत्ता" value={business.address} href={mapUrl} />
                                <InfoItem icon="fa-clock" label="वेळ" value={business.openingHours} />
                                {business.homeDelivery && 
                                    <InfoItem icon="fa-bicycle" label="होम डिलिव्हरी" value="उपलब्ध ✓" isHighlight={true} />
                                }
                            </InfoCard>
                        )}

                        {/* Services */}
                        {business.services && business.services.length > 0 && 
                            <InfoCard>
                                <div>
                                    <h4 className="font-semibold text-sm text-text-primary mb-2 flex items-center gap-2">
                                        <i className="fas fa-tools text-secondary"></i>
                                        सेवा/उत्पादने
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {business.services.map(s => (
                                            <span key={s} className="bg-secondary/10 text-secondary-dark text-xs font-medium px-2 py-1 rounded-full border border-secondary/20">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </InfoCard>
                        }
                    </main>

                    {/* Compact Footer */}
                    <footer className="p-3 border-t border-gray-100 grid grid-cols-2 gap-2 bg-white/50 backdrop-blur-sm">
                        <a 
                            href={`https://wa.me/91${business.contactNumber}?text=${encodeURIComponent('नमस्कार, मी "जवळा व्यवसाय निर्देशिका" वरून आपला संपर्क घेतला आहे.')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-full text-center py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
                        >
                            <i className="fab fa-whatsapp text-lg"></i> WhatsApp
                        </a>
                        <button 
                            onClick={shareBusinessDetails} 
                            disabled={isSharing} 
                            className="w-full text-center py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-semibold disabled:bg-gray-400 text-sm"
                        >
                            {isSharing ? (
                                <><i className="fas fa-spinner fa-spin"></i> शेअर...</>
                            ) : (
                                <><i className="fas fa-share"></i> शेअर</>
                            )}
                        </button>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default BusinessDetailModal;
