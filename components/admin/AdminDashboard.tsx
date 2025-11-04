import React from 'react';

interface AdminDashboardProps {
    onAdd: () => void;
    onEdit: () => void;
    onClose: () => void;
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAdd, onEdit, onClose, onLogout }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeInUp" style={{animationDuration: '0.3s'}} onClick={onClose}>
        <div className="bg-surface rounded-xl shadow-xl w-11/12 max-w-sm m-4" onClick={e => e.stopPropagation()}>
            <header className="p-4 border-b border-border-color flex items-center gap-3">
                <i className="fas fa-user-shield text-xl text-primary"></i>
                <h3 className="font-inter text-xl font-bold text-primary">ॲडमिन पॅनल</h3>
            </header>
            <main className="p-6">
                <p className="text-center text-text-secondary mb-6">येथून तुम्ही नवीन व्यवसाय जोडू शकता, संपादित करू शकता किंवा लॉगआउट करू शकता.</p>
                <div className="space-y-3">
                    <button onClick={onAdd} className="w-full text-lg py-3 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3">
                        <i className="fas fa-plus-circle"></i> नवीन व्यवसाय जोडा
                    </button>
                    <button onClick={onEdit} className="w-full text-lg py-3 px-6 bg-secondary text-white font-bold rounded-lg hover:bg-secondary/90 transition-all flex items-center justify-center gap-3">
                        <i className="fas fa-pen-to-square"></i> व्यवसाय संपादित करा
                    </button>
                    <button onClick={onLogout} className="w-full text-lg py-3 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                       <i className="fas fa-right-from-bracket"></i> लॉगआउट
                    </button>
                </div>
            </main>
            <footer className="p-3 bg-gray-50 border-t border-border-color text-center rounded-b-xl">
                 <button onClick={onClose} className="text-sm text-text-secondary hover:underline">बंद करा</button>
            </footer>
        </div>
    </div>
);

export default AdminDashboard;
