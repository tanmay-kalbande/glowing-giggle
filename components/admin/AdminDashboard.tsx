import React, { useState, useEffect } from 'react';
import { AdminStatistics, getAdminStatistics } from '../../supabaseClient';

interface AdminDashboardProps {
    onAdd: () => void;
    onEdit: () => void;
    onClose: () => void;
    onLogout: () => void;
}

const StatCard: React.FC<{ 
    icon: string; 
    label: string; 
    value: string | number; 
    color: string;
    subtext?: string;
}> = ({ icon, label, value, color, subtext }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white shadow-lg transform transition-all hover:scale-105`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-white/80 text-sm font-semibold">{label}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
                {subtext && <p className="text-white/70 text-xs mt-1">{subtext}</p>}
            </div>
            <i className={`${icon} text-4xl opacity-30`}></i>
        </div>
    </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAdd, onEdit, onClose, onLogout }) => {
    const [stats, setStats] = useState<AdminStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [showStats, setShowStats] = useState(false);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        setLoading(true);
        try {
            const data = await getAdminStatistics();
            setStats(data);
        } catch (error) {
            console.error('Failed to load statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl my-4 max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className="p-6 border-b border-border-color bg-gradient-to-r from-primary to-secondary text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <i className="fas fa-user-shield text-3xl"></i>
                            <div>
                                <h3 className="font-inter text-2xl font-bold">ॲडमिन पॅनल</h3>
                                <p className="text-sm opacity-90">व्यवसाय व्यवस्थापन</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowStats(!showStats)}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <i className={`fas fa-chart-${showStats ? 'line' : 'pie'}`}></i>
                            <span className="hidden sm:inline">{showStats ? 'कार्ये' : 'आकडेवारी'}</span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {!showStats ? (
                        // Actions View
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <p className="text-text-secondary">येथून तुम्ही नवीन व्यवसाय जोडू शकता, संपादित करू शकता किंवा लॉगआउट करू शकता.</p>
                            </div>

                            {/* Quick Stats Preview */}
                            {stats && !loading && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                    <StatCard 
                                        icon="fas fa-store"
                                        label="एकूण व्यवसाय"
                                        value={stats.total_businesses}
                                        color="from-blue-500 to-blue-600"
                                    />
                                    <StatCard 
                                        icon="fas fa-star"
                                        label="एकूण रेटिंग"
                                        value={stats.total_ratings}
                                        color="from-yellow-500 to-yellow-600"
                                    />
                                    <StatCard 
                                        icon="fas fa-chart-line"
                                        label="सरासरी रेटिंग"
                                        value={stats.avg_rating_overall.toFixed(1)}
                                        color="from-green-500 to-green-600"
                                    />
                                    <StatCard 
                                        icon="fas fa-bicycle"
                                        label="डिलिव्हरी"
                                        value={stats.businesses_with_delivery}
                                        color="from-purple-500 to-purple-600"
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button 
                                    onClick={onAdd} 
                                    className="w-full text-lg py-4 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-lg transform hover:scale-[1.02]"
                                >
                                    <i className="fas fa-plus-circle text-xl"></i> 
                                    नवीन व्यवसाय जोडा
                                </button>
                                <button 
                                    onClick={onEdit} 
                                    className="w-full text-lg py-4 px-6 bg-secondary text-white font-bold rounded-lg hover:bg-secondary/90 transition-all flex items-center justify-center gap-3 shadow-lg transform hover:scale-[1.02]"
                                >
                                    <i className="fas fa-pen-to-square text-xl"></i> 
                                    व्यवसाय संपादित करा
                                </button>
                                <button 
                                    onClick={onLogout} 
                                    className="w-full text-lg py-4 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-lg transform hover:scale-[1.02]"
                                >
                                    <i className="fas fa-right-from-bracket text-xl"></i> 
                                    लॉगआउट
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Statistics View
                        <div className="space-y-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-12 h-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin"></div>
                                    <p className="ml-4 text-text-secondary">आकडेवारी लोड करत आहे...</p>
                                </div>
                            ) : stats ? (
                                <>
                                    {/* Overview Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        <StatCard 
                                            icon="fas fa-store"
                                            label="एकूण व्यवसाय"
                                            value={stats.total_businesses}
                                            color="from-blue-500 to-blue-600"
                                        />
                                        <StatCard 
                                            icon="fas fa-th-large"
                                            label="श्रेण्या"
                                            value={stats.total_categories}
                                            color="from-indigo-500 to-indigo-600"
                                        />
                                        <StatCard 
                                            icon="fas fa-star"
                                            label="एकूण रेटिंग"
                                            value={stats.total_ratings}
                                            color="from-yellow-500 to-yellow-600"
                                        />
                                        <StatCard 
                                            icon="fas fa-chart-line"
                                            label="सरासरी रेटिंग"
                                            value={stats.avg_rating_overall.toFixed(2)}
                                            color="from-green-500 to-green-600"
                                            subtext="/ 5.0"
                                        />
                                        <StatCard 
                                            icon="fas fa-bicycle"
                                            label="डिलिव्हरी उपलब्ध"
                                            value={stats.businesses_with_delivery}
                                            color="from-purple-500 to-purple-600"
                                        />
                                    </div>

                                    {/* Two Column Layout */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Top Rated Businesses */}
                                        <div className="bg-white rounded-xl p-5 shadow-card">
                                            <h4 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                                                <i className="fas fa-trophy text-yellow-500"></i>
                                                शीर्ष रेट केलेले व्यवसाय
                                            </h4>
                                            {stats.top_rated_businesses && stats.top_rated_businesses.length > 0 ? (
                                                <div className="space-y-3">
                                                    {stats.top_rated_businesses.map((business, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-text-primary truncate">{business.shop_name}</p>
                                                                <p className="text-sm text-text-secondary truncate">{business.owner_name}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                                                <div className="text-right">
                                                                    <p className="font-bold text-yellow-600">{business.avg_rating.toFixed(1)}</p>
                                                                    <p className="text-xs text-text-secondary">({business.rating_count})</p>
                                                                </div>
                                                                <i className="fas fa-star text-yellow-500"></i>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-text-secondary text-center py-8">अजून रेटिंग नाहीत</p>
                                            )}
                                        </div>

                                        {/* Recent Businesses */}
                                        <div className="bg-white rounded-xl p-5 shadow-card">
                                            <h4 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                                                <i className="fas fa-clock text-blue-500"></i>
                                                अलीकडील व्यवसाय
                                            </h4>
                                            {stats.recent_businesses && stats.recent_businesses.length > 0 ? (
                                                <div className="space-y-3">
                                                    {stats.recent_businesses.map((business, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-text-primary truncate">{business.shop_name}</p>
                                                                <p className="text-sm text-text-secondary truncate">{business.owner_name}</p>
                                                            </div>
                                                            <div className="text-xs text-text-secondary ml-3 flex-shrink-0">
                                                                {new Date(business.created_at).toLocaleDateString('mr-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short'
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-text-secondary text-center py-8">कोणतेही व्यवसाय नाहीत</p>
                                            )}
                                        </div>

                                        {/* Category Statistics */}
                                        <div className="bg-white rounded-xl p-5 shadow-card">
                                            <h4 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                                                <i className="fas fa-chart-pie text-green-500"></i>
                                                श्रेणी आकडेवारी
                                            </h4>
                                            {stats.category_stats && stats.category_stats.length > 0 ? (
                                                <div className="space-y-2">
                                                    {stats.category_stats.slice(0, 8).map((cat, index) => (
                                                        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                            <span className="text-sm font-medium text-text-primary">{cat.category_name}</span>
                                                            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">{cat.business_count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-text-secondary text-center py-8">कोणत्याही श्रेणी नाहीत</p>
                                            )}
                                        </div>

                                        {/* Recent Ratings */}
                                        <div className="bg-white rounded-xl p-5 shadow-card">
                                            <h4 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                                                <i className="fas fa-history text-purple-500"></i>
                                                अलीकडील रेटिंग्स
                                            </h4>
                                            {stats.recent_ratings && stats.recent_ratings.length > 0 ? (
                                                <div className="space-y-3 max-h-72 overflow-y-auto">
                                                    {stats.recent_ratings.map((rating, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-text-primary text-sm truncate">{rating.business_name}</p>
                                                                {rating.user_name && (
                                                                    <p className="text-xs text-text-secondary truncate">~ {rating.user_name}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                                                <span className="font-bold text-yellow-600">{rating.rating}</span>
                                                                <i className="fas fa-star text-yellow-500 text-sm"></i>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-text-secondary text-center py-8">अजून रेटिंग नाहीत</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <i className="fas fa-exclamation-circle text-5xl text-gray-300 mb-4"></i>
                                    <p className="text-text-secondary">आकडेवारी लोड करता आली नाही</p>
                                    <button 
                                        onClick={loadStatistics}
                                        className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        पुन्हा प्रयत्न करा
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="p-4 bg-gray-50 border-t border-border-color flex justify-center items-center gap-4">
                    <button 
                        onClick={onClose} 
                        className="text-sm text-text-secondary hover:text-primary font-semibold transition-colors"
                    >
                        बंद करा
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AdminDashboard;
