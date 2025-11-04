import React from 'react';
import { Business, Category } from '../types';
import BusinessCard from './BusinessCard';

interface BusinessListProps {
    businesses: Business[];
    categories: Category[];
    selectedCategoryId: string | null;
    onViewDetails: (business: Business) => void;
    isSearching?: boolean;
}

const NoResults: React.FC<{isSearching: boolean}> = ({ isSearching }) => (
    <div className="flex flex-col items-center text-center p-12 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-card animate-fadeInUp">
        <span className="text-7xl mb-5">🔍</span>
        <h3 className="text-3xl font-bold font-inter text-text-primary">
            {isSearching ? "शोध परिणाम नाहीत" : "या श्रेणीमध्ये व्यवसाय नाहीत"}
        </h3>
        <p className="text-text-secondary mt-2 text-lg">
            {isSearching ? "कृपया तुमचा शोध बदला." : "कृपया वेगळी श्रेणी निवडा."}
        </p>
    </div>
);

const BusinessList: React.FC<BusinessListProps> = ({ businesses, categories, selectedCategoryId, onViewDetails, isSearching = false }) => {
    const categoryMap = React.useMemo(() => new Map<string, Category>(categories.map(cat => [cat.id, cat])), [categories]);

    if (businesses.length === 0) {
        return <NoResults isSearching={isSearching} />;
    }
    
    const renderBusinessCards = (businessList: Business[]) => (
        businessList.map((business, index) => {
            const category = categoryMap.get(business.category);
            return (
                <div key={business.id} className="animate-fadeInUp" style={{ animationDelay: `${index * 50}ms` }}>
                    <BusinessCard 
                        business={business} 
                        onViewDetails={onViewDetails}
                        categoryName={category?.name}
                        categoryIcon={category?.icon}
                    />
                </div>
            )
        })
    );

    if (selectedCategoryId || isSearching) {
        return (
            <div className="space-y-4">
                {renderBusinessCards(businesses)}
            </div>
        );
    }

    const groupedBusinesses = businesses.reduce((acc, business) => {
        (acc[business.category] = acc[business.category] || []).push(business);
        return acc;
    }, {} as Record<string, Business[]>);


    return (
        <div className="space-y-12">
            {Object.entries(groupedBusinesses).map(([categoryId, businessGroup], groupIndex) => {
                const category = categoryMap.get(categoryId);
                if (!category) return null;
                
                return (
                    <div key={categoryId} className="animate-fadeInUp" style={{ animationDelay: `${groupIndex * 100}ms`}}>
                        <div className="flex items-center gap-4 mb-5 pb-3 border-b-2 border-secondary sticky top-2 z-10 bg-background/80 backdrop-blur-sm">
                             <i className={`${category.icon} text-2xl text-secondary`}></i>
                            <h3 className="text-2xl font-bold font-inter text-primary">{category.name}</h3>
                        </div>
                        <div className="space-y-4">
                            {renderBusinessCards(businessGroup)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default BusinessList;
