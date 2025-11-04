
import React, { useState } from 'react';
import { Business } from '../../types';

interface EditBusinessListProps {
    businesses: Business[];
    onSelect: (business: Business) => void;
    onDelete: (businessId: string) => Promise<void>;
    onClose: () => void;
    onBack: () => void;
}

const EditBusinessList: React.FC<EditBusinessListProps> = ({ businesses, onSelect, onDelete, onClose, onBack }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (businessId: string, businessName: string) => {
        if (!window.confirm(`खात्री आहे का की तुम्ही "${businessName}" हटवू इच्छिता?`)) return;
        
        setDeletingId(businessId);
        try {
            await onDelete(businessId);
        } catch (error) {
            console.error('Delete error:', error);
            alert('व्यवसाय हटवताना त्रुटी आली');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeInUp" style={{animationDuration: '0.3s'}} onClick={onClose}>
            <div className="bg-surface rounded-xl shadow-xl w-11/12 max-w-lg m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border-color flex justify-between items-center sticky top-0 bg-surface/80 backdrop-blur-sm">
                    <h3 className="font-inter text-xl font-bold text-primary">व्यवसाय संपादित करा</h3>
                    <button onClick={onBack} className="text-sm text-text-secondary hover:underline flex items-center gap-2"><i className="fas fa-arrow-left"></i> मागे</button>
                </header>
                <ul className="overflow-y-auto p-4 space-y-2">
                    {businesses.slice().sort((a,b) => a.shopName.localeCompare(b.shopName)).map(b => (
                        <li key={b.id} className="flex justify-between items-center p-3 bg-background rounded-lg">
                            <div className="flex-1 min-w-0 pr-3">
                                <p className="font-semibold truncate">{b.shopName}</p>
                                <p className="text-sm text-text-secondary truncate">{b.ownerName}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button 
                                    onClick={() => onSelect(b)} 
                                    className="px-3 py-2 bg-secondary text-white font-semibold rounded-lg text-sm hover:bg-secondary/90"
                                >
                                    संपादित करा
                                </button>
                                <button 
                                    onClick={() => handleDelete(b.id, b.shopName)}
                                    disabled={deletingId === b.id}
                                    className="px-3 py-2 bg-red-600 text-white font-semibold rounded-lg text-sm hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {deletingId === b.id ? '...' : 'हटवा'}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                <footer className="p-3 border-t border-border-color text-center sticky bottom-0 bg-surface/80 backdrop-blur-sm">
                    <button onClick={onClose} className="text-sm text-text-secondary hover:underline">बंद करा</button>
                </footer>
            </div>
        </div>
    );
};

export default EditBusinessList;
