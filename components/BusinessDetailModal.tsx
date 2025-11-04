
import React, { useState } from 'react';
import { Business } from '../types';

const formatPhoneNumber = (phoneNumber: string): string => {
    if (phoneNumber.length === 10) {
        return `+91 ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;
    }
    return phoneNumber;
};

const DetailItem: React.FC<{icon: string, label: string, value?: string}> = ({icon, label, value}) => (
    value ? <div className="flex items-start gap-4">
        <i className={`fas ${icon} w-6 text-center text-secondary text-xl pt-1`}></i>
        <div>
            <p className="font-semibold text-text-primary">{label}</p>
            <p className="text-text-secondary">{value}</p>
        </div>
    </div> : null
);

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

    const paymentIconMap: Record<string, string> = {
        'UPI': 'fa-solid fa-qrcode', 'Cash': 'fa-solid fa-money-bill-wave', 'Card': 'fa-regular fa-credit-card'
    };
    
    const hasExtraDetails = business.address || business.openingHours || business.homeDelivery;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 animate-fadeInUp" style={{animationDuration: '0.3s'}} onClick={onClose}>
            <div className="bg-background rounded-xl shadow-xl w-11/12 max-w-md m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="bg-gradient-to-br from-primary to-secondary p-5 rounded-t-xl text-white relative">
                    <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white text-3xl w-8 h-8 flex items-center justify-center">&times;</button>
                    <h3 className="font-inter text-2xl font-bold">{business.shopName}</h3>
                    <p className="opacity-90 text-base">{business.ownerName}</p>
                </header>

                <main className="p-5 space-y-4 overflow-y-auto">
                    <a href={`tel:${business.contactNumber}`} className="flex items-center gap-4 p-4 bg-surface rounded-lg shadow-subtle">
                        <i className="fas fa-phone text-2xl text-primary"></i>
                        <div>
                            <p className="font-semibold text-text-primary">संपर्क</p>
                            <p className="text-lg text-primary font-bold tracking-wider">{formatPhoneNumber(business.contactNumber)}</p>
                        </div>
                    </a>

                    {hasExtraDetails && (
                      <div className="p-4 bg-surface rounded-lg shadow-subtle space-y-4">
                          <DetailItem icon="fa-map-marker-alt" label="पत्ता" value={business.address} />
                          <DetailItem icon="fa-clock" label="वेळ" value={business.openingHours} />
                          {business.homeDelivery && 
                              <div className="flex items-center gap-4">
                                  <i className="fas fa-bicycle w-6 text-center text-secondary text-xl"></i>
                                  <p className="font-bold text-green-700">होम डिलिव्हरी उपलब्ध</p>
                              </div>
                          }
                      </div>
                    )}

                    {business.services && business.services.length > 0 && 
                        <div className="p-4 bg-surface rounded-lg shadow-subtle">
                            <h4 className="font-bold text-text-primary mb-3">सेवा/उत्पादने:</h4>
                            <div className="flex flex-wrap gap-2">
                                {business.services.map(s => <span key={s} className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">{s}</span>)}
                            </div>
                        </div>
                    }
                    {business.paymentOptions && business.paymentOptions.length > 0 &&
                      <div className="p-4 bg-surface rounded-lg shadow-subtle">
                         <h4 className="font-bold text-text-primary mb-3">पेमेंट पर्याय:</h4>
                         <div className="flex items-center gap-6">
                             {business.paymentOptions.map(p => (
                               <div key={p} className="flex flex-col items-center gap-1 text-text-secondary">
                                 <i className={`${paymentIconMap[p] || 'fa-solid fa-dollar-sign'} text-3xl text-secondary`}></i>
                                 <span className="text-sm font-semibold">{p}</span>
                               </div>
                              ))}
                         </div>
                      </div>
                    }
                </main>

                <footer className="p-4 border-t border-border-color grid grid-cols-2 gap-3 bg-background/70 rounded-b-xl">
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
