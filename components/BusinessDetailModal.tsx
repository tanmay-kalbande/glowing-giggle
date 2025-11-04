import React, { useState } from 'react';
import { Business } from '../types';
import { formatPhoneNumber } from '@/utils';

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
}

const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({ business, onClose }) => {
    const [isSharing, setIsSharing] = useState(false);

    const shareBusinessDetails = async () => {
        if (!business) return;
        setIsSharing(true);
    
        const baseUrl = `${window.location.origin}${window.location.pathname}`;
        const shareUrl = `${baseUrl}?businessId=${business.id}`;
    
        const details = [
            `*${business.shopName}*`,
            `👤 ${business.ownerName}`,
            `📞 ${formatPhoneNumber(business.contactNumber)}`,
        ];
    
        if (business.address) details.push(`📍 ${business.address}`);
        if (business.services && business.services.length > 0) details.push(`🛠️ सेवा: ${business.services.join(', ')}`);
        
        details.push(`\n_~ जवळा व्यवसाय निर्देशिका द्वारे पाठवले ~_`);
        const shareText = details.join('\n');
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${business.shopName} | जवळा व्यवसाय निर्देशिका`,
                    text: shareText, 
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Sharing failed:', error);
            } finally {
                setIsSharing(false);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
                alert('शेअरिंग समर्थित नाही. तपशील आणि लिंक क्लिपबोर्डवर कॉपी केली आहे!');
            } catch (err) {
                alert('तपशील कॉपी करू शकलो नाही.');
            } finally {
                setIsSharing(false);
            }
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
