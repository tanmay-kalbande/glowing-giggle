import React, { useState, useEffect } from 'react';
import { Business, Category } from '../../types';
import CustomDropdown from './CustomDropdown';

interface BusinessFormProps { 
    categories: Category[];
    onClose: () => void;
    onSave: (business: Business) => void;
    existingBusiness: Business | null;
    isSaving: boolean;
}

const BusinessForm: React.FC<BusinessFormProps> = ({ categories, onClose, onSave, existingBusiness, isSaving }) => {
    const [formData, setFormData] = useState<Omit<Partial<Business>, 'services'> & { services?: string }>({});
    const isEditing = !!existingBusiness;

    useEffect(() => {
        if (existingBusiness) {
            setFormData({
                ...existingBusiness,
                services: existingBusiness.services ? existingBusiness.services.join(', ') : '',
            });
        } else {
             setFormData({ paymentOptions: ['Cash', 'UPI'], category: categories[0]?.id || '' });
        }
    }, [existingBusiness, categories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked, value } = e.target;
        if (name === 'homeDelivery') {
            setFormData({ ...formData, homeDelivery: checked });
        } else {
            const currentOptions = formData.paymentOptions || [];
            const newOptions = checked ? [...currentOptions, value] : currentOptions.filter(opt => opt !== value);
            setFormData({ ...formData, paymentOptions: newOptions });
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const businessToSave: Business = {
            id: existingBusiness?.id || '',
            shopName: formData.shopName || '',
            ownerName: formData.ownerName || '',
            contactNumber: formData.contactNumber || '',
            category: formData.category || 'other',
            address: formData.address,
            openingHours: formData.openingHours,
            homeDelivery: formData.homeDelivery,
            paymentOptions: formData.paymentOptions,
            services: typeof formData.services === 'string' ? formData.services.split(',').map(s => s.trim()).filter(Boolean) : [],
        };
        onSave(businessToSave);
    };
    
    const inputStyles = "w-full p-3 border-2 border-border-color rounded-lg bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeInUp" style={{animationDuration: '0.3s'}} onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow-xl w-11/12 max-w-2xl m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border-color flex justify-between items-center flex-shrink-0">
                     <h3 className="font-inter text-xl font-bold text-primary">{isEditing ? 'व्यवसाय अपडेट करा' : 'नवीन व्यवसाय जोडा'}</h3>
                     <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center">&times;</button>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto">
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <legend className="font-bold text-lg text-primary mb-2 col-span-full">मुख्य माहिती</legend>
                        <input name="shopName" value={formData.shopName || ''} onChange={handleChange} placeholder="दुकानाचे नाव" className={inputStyles} required disabled={isSaving} />
                        <input name="ownerName" value={formData.ownerName || ''} onChange={handleChange} placeholder="मालकाचे नाव" className={inputStyles} required disabled={isSaving} />
                        <input name="contactNumber" type="tel" value={formData.contactNumber || ''} onChange={handleChange} placeholder="संपर्क क्रमांक (10 अंक)" className={`${inputStyles} md:col-span-2`} required pattern="\d{10}" title="कृपया 10 अंकी मोबाईल नंबर टाका" disabled={isSaving} />
                         <CustomDropdown options={categories} selectedId={formData.category} onChange={id => setFormData({...formData, category: id})} placeholder="श्रेणी निवडा" />
                    </fieldset>
                    
                    <fieldset className="space-y-4">
                         <legend className="font-bold text-lg text-primary mb-2">अतिरिक्त माहिती</legend>
                         <textarea name="address" value={formData.address || ''} onChange={handleChange} placeholder="पत्ता" className={`${inputStyles}`} rows={2} disabled={isSaving} />
                         <input name="openingHours" value={formData.openingHours || ''} onChange={handleChange} placeholder="उघडण्याची वेळ (उदा. सकाळी १० ते रात्री ९)" className={`${inputStyles}`} disabled={isSaving} />
                         <textarea name="services" value={formData.services || ''} onChange={handleChange} placeholder="सेवा/उत्पादने (कॉमाने वेगळे करा)" className={`${inputStyles}`} rows={3} disabled={isSaving} />
                    </fieldset>
                    
                     <fieldset className="flex flex-col md:flex-row gap-4">
                         <legend className="font-bold text-lg text-primary mb-2 md:mb-0 w-full md:w-auto">सेटिंग्ज</legend>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <input type="checkbox" id="homeDelivery" name="homeDelivery" checked={formData.homeDelivery || false} onChange={handleCheckboxChange} disabled={isSaving} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="homeDelivery">होम डिलिव्हरी</label>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="mr-2 font-semibold">पेमेंट:</span>
                            <label className="flex items-center gap-2"><input type="checkbox" value="UPI" checked={formData.paymentOptions?.includes('UPI') || false} onChange={handleCheckboxChange} disabled={isSaving} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"/> UPI</label>
                            <label className="flex items-center gap-2"><input type="checkbox" value="Cash" checked={formData.paymentOptions?.includes('Cash') || false} onChange={handleCheckboxChange} disabled={isSaving} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"/> Cash</label>
                            <label className="flex items-center gap-2"><input type="checkbox" value="Card" checked={formData.paymentOptions?.includes('Card') || false} onChange={handleCheckboxChange} disabled={isSaving} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"/> Card</label>
                        </div>
                   </fieldset>
                </main>

                <footer className="p-4 border-t border-border-color bg-gray-50/80 flex justify-end items-center gap-3 flex-shrink-0 sticky bottom-0">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-6 py-2 bg-gray-200 text-text-secondary font-bold rounded-lg hover:bg-gray-300 transition-colors">रद्द करा</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSaving && <i className="fas fa-spinner fa-spin"></i>}
                        {isSaving ? 'सेव्ह करत आहे...' : (isEditing ? 'अपडेट करा' : 'व्यवसाय जोडा')}
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default BusinessForm;
