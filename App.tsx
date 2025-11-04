
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Business, Category } from './types';
import { User } from '@supabase/supabase-js';
import * as SupabaseService from './supabaseClient';
import * as CacheService from './cacheService';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CategoryGrid from './components/CategoryGrid';
import BusinessList from './components/BusinessList';
import BusinessDetailModal from './components/BusinessDetailModal';
import LoginModal from './components/admin/LoginModal';
import AdminDashboard from './components/admin/AdminDashboard';
import BusinessForm from './components/admin/BusinessForm';
import EditBusinessList from './components/admin/EditBusinessList';
import LoadingSpinner from './components/common/LoadingSpinner';
import AiAssistant from './components/AiAssistant';
import InstallPrompt from './components/common/InstallPrompt';

const App: React.FC = () => {
    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
    const [isBusinessFormOpen, setIsBusinessFormOpen] = useState(false);
    const [isEditListOpen, setIsEditListOpen] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Auth state
    const [user, setUser] = useState<User | null>(null);

    // PWA Install state
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await CacheService.smartSync(
                SupabaseService.getDataVersion,
                async () => ({
                    businesses: await SupabaseService.fetchBusinesses(),
                    categories: await SupabaseService.fetchCategories()
                })
            );
            setBusinesses(result.businesses);
            setCategories(result.categories);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        loadData();
        const checkUser = async () => {
            const currentUser = await SupabaseService.getCurrentUser();
            if (currentUser && await SupabaseService.isUserAdmin(currentUser.id)) {
                setUser(currentUser);
            }
        };
        checkUser();
    }, [loadData]);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) {
              setShowInstallPrompt(true);
            }
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    
    useEffect(() => {
        const subscription = SupabaseService.subscribeToBusinessChanges(async () => {
            await loadData();
        });
        return () => {
            subscription.unsubscribe();
        };
    }, [loadData]);

    const businessCounts = useMemo(() => {
        return businesses.reduce((acc, business) => {
            acc[business.category] = (acc[business.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [businesses]);
    
    const filteredBusinesses = useMemo(() => {
      let result = businesses;
      if (selectedCategory) {
          result = result.filter(b => b.category === selectedCategory);
      }
      return result;
    }, [businesses, selectedCategory]);

    const handleCategorySelect = (id: string | null) => {
        setSelectedCategory(id);
        setSearchQuery('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleViewDetails = (business: Business) => setSelectedBusiness(business);
    const handleLoginSuccess = (loggedInUser: User) => {
        setUser(loggedInUser);
        setIsLoginModalOpen(false);
        setIsAdminDashboardOpen(true);
    };
    const handleLogout = async () => {
        await SupabaseService.signOut();
        setUser(null);
        setIsAdminDashboardOpen(false);
    };
    
    const handleSaveBusiness = async (business: Business) => {
        setIsSaving(true);
        try {
            if (editingBusiness) {
                await SupabaseService.updateBusiness(business);
            } else {
                await SupabaseService.addBusiness(business);
            }
            setIsBusinessFormOpen(false);
            setEditingBusiness(null);
            setIsEditListOpen(false);
        } catch (error) {
            console.error("Error saving business:", error);
            alert("Failed to save business.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteBusiness = async (businessId: string) => {
        await SupabaseService.deleteBusiness(businessId);
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setIsInstallable(false);
        setShowInstallPrompt(false);
    };

    if (isLoading && businesses.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-background min-h-screen text-text-primary font-sans">
            <div className="container mx-auto p-4 max-w-4xl">
                <Header isInstallable={isInstallable} onInstallClick={handleInstallClick} />
                <main>
                   <AiAssistant 
                       businesses={businesses} 
                       categories={categories}
                       onViewBusiness={handleViewDetails}
                       query={searchQuery}
                       onQueryChange={setSearchQuery}
                   />
                    {selectedCategory && (
                        <button onClick={() => handleCategorySelect(null)} className="mb-4 flex items-center gap-2 text-primary font-semibold hover:underline">
                            <i className="fas fa-arrow-left"></i> सर्व श्रेण्या पहा
                        </button>
                    )}
                    <CategoryGrid 
                        categories={categories}
                        businessCounts={businessCounts}
                        selectedCategory={selectedCategory}
                        onCategorySelect={handleCategorySelect}
                    />
                    <div className="mt-8">
                        <BusinessList 
                            businesses={filteredBusinesses} 
                            categories={categories} 
                            selectedCategoryId={selectedCategory} 
                            onViewDetails={handleViewDetails}
                            isSearching={!!searchQuery}
                        />
                    </div>
                </main>
            </div>
            
            <Footer onAdminLoginClick={() => user ? setIsAdminDashboardOpen(true) : setIsLoginModalOpen(true)} />
            
            {selectedBusiness && <BusinessDetailModal business={selectedBusiness} onClose={() => setSelectedBusiness(null)} />}
            {isLoginModalOpen && <LoginModal onLoginSuccess={handleLoginSuccess} onClose={() => setIsLoginModalOpen(false)} />}
            
            {user && isAdminDashboardOpen && (
                <AdminDashboard 
                    onClose={() => setIsAdminDashboardOpen(false)}
                    onAdd={() => { setIsAdminDashboardOpen(false); setIsBusinessFormOpen(true); setEditingBusiness(null); }}
                    onEdit={() => { setIsAdminDashboardOpen(false); setIsEditListOpen(true); }}
                    onLogout={handleLogout}
                />
            )}
            
            {user && isBusinessFormOpen && (
                <BusinessForm 
                    categories={categories} 
                    onClose={() => { setIsBusinessFormOpen(false); setEditingBusiness(null); }} 
                    onSave={handleSaveBusiness} 
                    existingBusiness={editingBusiness}
                    isSaving={isSaving}
                />
            )}

            {user && isEditListOpen && (
                <EditBusinessList
                    businesses={businesses}
                    onSelect={(b) => { setEditingBusiness(b); setIsEditListOpen(false); setIsBusinessFormOpen(true); }}
                    onDelete={handleDeleteBusiness}
                    onClose={() => setIsEditListOpen(false)}
                    onBack={() => { setIsEditListOpen(false); setIsAdminDashboardOpen(true); }}
                />
            )}
            
            {showInstallPrompt && <InstallPrompt onInstall={handleInstallClick} onDismiss={() => setShowInstallPrompt(false)} />}
        </div>
    );
};

export default App;
