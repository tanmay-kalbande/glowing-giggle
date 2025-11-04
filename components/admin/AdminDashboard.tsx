
import React from 'react';

interface AdminDashboardProps {
    onAdd: () => void;
    onEdit: () => void;
    onClose: () => void;
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAdd, onEdit, onClose, onLogout }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeInUp" style={{animationDuration: '0.3s'}} onClick={onClose}>
        <div className="bg-surface rounded-xl shadow-xl w-11/12 max-w-sm m-4 p-6 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-inter text-2xl font-bold text-primary mb-6">ॲडमिन पॅनल</h3>
            <div className="space-y-4">
                <button onClick={onAdd} className="w-full text-lg py-4 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3">
                    <i className="fas fa-plus-circle"></i> नवीन व्यवसाय जोडा
                </button>
                <button onClick={onEdit} className="w-full text-lg py-4 px-6 bg-secondary text-white font-bold rounded-lg hover:bg-secondary/90 transition-all flex items-center justify-center gap-3">
                    <i className="fas fa-edit"></i> व्यवसाय संपादित करा
                </button>
                <button onClick={onLogout} className="w-full text-lg py-4 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                    <i className="fas fa-sign-out-alt"></i> लॉगआउट
                </button>
            </div>
            <button onClick={onClose} className="mt-6 text-sm text-text-secondary hover:underline">बंद करा</button>
        </div>
    </div>
);

export default AdminDashboard;
