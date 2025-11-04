import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Business, Category, BusinessData } from './types';
import { User } from '@supabase/supabase-js';
import * as SupabaseService from './supabaseClient';
import * as CacheService from './cacheService';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AiAssistant from './components/AiAssistant';
import CategoryGrid from './components/CategoryGrid';
import BusinessList from './components/BusinessList';
import BusinessDetailModal from './components/BusinessDetailModal';

// Admin Components
import LoginModal from './components/admin/LoginModal';
import AdminDashboard from './components/admin/AdminDashboard';
import EditBusinessList from './components/admin/EditBusinessList';
import BusinessForm from './components/admin/BusinessForm';

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [businessData, setBusinessData] = useState<BusinessData>({ categories: [], businesses: [] });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewedBusiness, setViewedBusiness] = useState<Business | null>(null);
    
    // PWA Install state
    const [isInstallable, setIsInstallable] = useState(false);
    const deferredPromptRef = useRef<any>(null);

    // Admin state
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [adminView, setAdminView] = useState<'dashboard' | 'add' | 'edit-list' | null>(null);
    const [businessToEdit, setBusinessToEdit] = useState<Business | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load initial data & PWA prompt handler
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            deferredPromptRef.current = e;
            setIsInstallable(true);
            console.log('📱 PWA install prompt ready');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const loadData = async () => {
            try {
                const cachedData = await Promise.all([
                    CacheService.getCachedBusinesses(),
                    CacheService.getCachedCategories(),
                ]).catch(() => [[], []]);

                if (cachedData[0].length > 0) {
                    setBusinessData({
                        categories: cachedData[1].sort((a, b) => a.name.localeCompare(b.name)),
                        businesses: cachedData[0]
                    });
                    setIsLoading(false);
                }

                const syncResult = await CacheService.smartSync(
                    SupabaseService.getDataVersion,
                    async () => {
                        const [categories, businesses] = await Promise.all([
                            SupabaseService.fetchCategories(),
                            SupabaseService.fetchBusinesses()
                        ]);
                        return { categories, businesses };
                    }
                );

                if (syncResult.action !== 'no_change' || businessData.businesses.length === 0) {
                    console.log(`📱 Data ${syncResult.fromCache ? 'from cache' : 'synced from server'}`);
                    setBusinessData({
                        categories: syncResult.categories.sort((a, b) => a.name.localeCompare(b.name)),
                        businesses: syncResult.businesses
                    });
                }
                
                // --- Handle Shared URL ---
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                let businessIdFromUrl: string | null = null;

                if (pathParts[0] === 'business' && pathParts.length >= 2) {
                    // Get ID from URL: /business/slug/id
                    businessIdFromUrl = pathParts[pathParts.length - 1];
                } else {
                    // Fallback for old URL: /?businessId=...
                    businessIdFromUrl = new URLSearchParams(window.location.search).get('businessId');
                }

                if (businessIdFromUrl) {
                    const businessToView = syncResult.businesses.find(b => b.id === businessIdFromUrl);
                    if (businessToView) {
                        setTimeout(() => {
                            setViewedBusiness(businessToView);
                            // Clean the URL to the base path
                            window.history.replaceState({}, document.title, '/');
                        }, 100);
                    }
                }
                // --- End Handle Shared URL ---

                const user = await SupabaseService.getCurrentUser();
                if (user) {
                    const isAdmin = await SupabaseService.isUserAdmin(user.id);
                    if (isAdmin) setCurrentUser(user);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                alert('डेटा लोड करताना त्रुटी आली. पेज रीफ्रेश करा.');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        const subscription = SupabaseService.subscribeToBusinessChanges(async (payload) => {
            console.log('🔄 Real-time change detected:', payload.eventType);
            
            if (payload.eventType === 'INSERT' && payload.new) {
                const newBusiness = SupabaseService.dbBusinessToBusiness(payload.new);
                await CacheService.updateCachedBusiness(newBusiness);
                setBusinessData(prev => ({ ...prev, businesses: [newBusiness, ...prev.businesses] }));
            } else if (payload.eventType === 'UPDATE' && payload.new) {
                const updatedBusiness = SupabaseService.dbBusinessToBusiness(payload.new);
                await CacheService.updateCachedBusiness(updatedBusiness);
                setBusinessData(prev => ({ ...prev, businesses: prev.businesses.map(b => b.id === updatedBusiness.id ? updatedBusiness : b) }));
            } else if (payload.eventType === 'DELETE' && payload.old) {
                await CacheService.deleteCachedBusiness(payload.old.id);
                setBusinessData(prev => ({ ...prev, businesses: prev.businesses.filter(b => b.id !== payload.old.id) }));
            }
            
            try {
                const newVersion = await SupabaseService.getDataVersion();
                await CacheService.setLocalVersion({ ...newVersion, last_sync: Date.now() });
            } catch (error) {
                console.error('Failed to update version:', error);
            }
        });

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (deferredPromptRef.current) {
            deferredPromptRef.current.prompt();
            deferredPromptRef.current.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('✅ PWA installed');
                }
                setIsInstallable(false);
                deferredPromptRef.current = null;
            });
        }
    };

    const handleCategorySelect = useCallback((categoryId: string | null) => {
        setSelectedCategory(categoryId);
        if (categoryId !== null) {
          const businessListElement = document.getElementById('business-list-anchor');
          businessListElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);
    
    const handleAdminLoginClick = () => setShowLogin(true);
    
    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        setShowLogin(false);
        setAdminView('dashboard');
    };

    const handleLogout = async () => {
        try {
            await SupabaseService.signOut();
            setCurrentUser(null);
            setAdminView(null);
            alert('तुम्ही यशस्वीरित्या लॉगआउट झाला आहात.');
        } catch (error) {
            console.error('Logout error:', error);
            alert('लॉगआउट करताना त्रुटी आली.');
        }
    };

    const handleCloseAdmin = () => { 
        setAdminView(null); 
        setBusinessToEdit(null); 
    };

    const handleSaveBusiness = async (businessToSave: Business) => {
        setIsSaving(true);
        try {
            if (businessToSave.id) {
                await SupabaseService.updateBusiness(businessToSave);
                alert('व्यवसाय यशस्वीरित्या अपडेट झाला!');
            } else {
                await SupabaseService.addBusiness(businessToSave);
                alert('व्यवसाय यशस्वीरित्या जोडला गेला!');
            }
            setAdminView('dashboard');
            setBusinessToEdit(null);
        } catch (error: any) {
            console.error('Save error:', error);
            alert(`व्यवसाय सेव्ह करताना त्रुटी: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBusiness = async (businessId: string) => {
        await SupabaseService.deleteBusiness(businessId);
        alert('व्यवसाय यशस्वीरित्या हटवला!');
    };

    const filteredBusinesses = useMemo(() => {
        const baseList = businessData.businesses;
        const searchTermLower = searchTerm.toLowerCase();

        if (searchTerm) {
            return baseList.filter(business =>
                business.shopName.toLowerCase().includes(searchTermLower) ||
                business.ownerName.toLowerCase().includes(searchTermLower) ||
                business.contactNumber.includes(searchTermLower)
            );
        }

        if (selectedCategory) {
            return baseList.filter(business => business.category === selectedCategory);
        }

        return baseList;
    }, [businessData.businesses, searchTerm, selectedCategory]);

    const businessCounts = useMemo(() => {
        return businessData.businesses.reduce((acc, business) => {
            acc[business.category] = (acc[business.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [businessData.businesses]);

    if (isLoading) return <LoadingSpinner />;

    const selectedCategoryDetails = selectedCategory ? businessData.categories.find(c => c.id === selectedCategory) : null;
    const isSearching = searchTerm.length > 0;

    return (
        <div className="min-h-screen flex flex-col">
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-4xl flex-grow">
                <Header isInstallable={isInstallable} onInstallClick={handleInstallClick} />
                <AiAssistant 
                    businesses={businessData.businesses} 
                    categories={businessData.categories} 
                    onViewBusiness={setViewedBusiness} 
                    query={searchTerm} 
                    onQueryChange={setSearchTerm} 
                />

                {!isSearching && (
                    <div className="mb-12">
                        <CategoryGrid categories={businessData.categories} businessCounts={businessCounts} selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />
                    </div>
                )}
                
                <div id="business-list-anchor" className="scroll-mt-6"></div>
                
                {isSearching && filteredBusinesses.length > 0 && (
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold font-inter text-text-primary">"<span className="text-primary">{searchTerm}</span>" साठी शोध परिणाम <span className="text-xl font-normal text-text-secondary ml-2">({filteredBusinesses.length})</span></h2>
                    </div>
                )}
                
                {!isSearching && selectedCategoryDetails && (
                     <div className="text-center mb-8">
                        <i className={`${selectedCategoryDetails.icon} text-4xl text-primary mb-2`}></i>
                        <h2 className="text-3xl font-bold font-inter text-text-primary">{selectedCategoryDetails.name}<span className="text-xl font-normal text-text-secondary ml-2">({filteredBusinesses.length})</span></h2>
                    </div>
                )}

                <div id="business-list">
                    <BusinessList 
                        businesses={filteredBusinesses} 
                        categories={businessData.categories} 
                        selectedCategoryId={selectedCategory} 
                        onViewDetails={setViewedBusiness}
                        isSearching={isSearching} 
                    />
                </div>
            </main>

            <BusinessDetailModal business={viewedBusiness} onClose={() => setViewedBusiness(null)} />
            
            {/* --- Admin Modals --- */}
            {showLogin && <LoginModal onLoginSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />}
            
            {currentUser && adminView === 'dashboard' && <AdminDashboard 
                onAdd={() => { setBusinessToEdit(null); setAdminView('add'); }}
                onEdit={() => setAdminView('edit-list')}
                onLogout={handleLogout}
                onClose={handleCloseAdmin}
            />}

            {currentUser && adminView === 'edit-list' && <EditBusinessList
                businesses={businessData.businesses}
                onSelect={(business) => { setBusinessToEdit(business); setAdminView('add'); }}
                onDelete={handleDeleteBusiness}
                onBack={() => setAdminView('dashboard')}
                onClose={handleCloseAdmin}
            />}

            {currentUser && adminView === 'add' && <BusinessForm
                categories={businessData.categories}
                onSave={handleSaveBusiness}
                existingBusiness={businessToEdit}
                isSaving={isSaving}
                onClose={() => {
                    setAdminView(businessToEdit ? 'edit-list' : 'dashboard');
                    setBusinessToEdit(null);
                }}
            />}

            <Footer onAdminLoginClick={currentUser ? () => setAdminView('dashboard') : handleAdminLoginClick} />
        </div>
    );
};

export default App;
