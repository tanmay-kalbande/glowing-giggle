// components/common/NamePromptModal.tsx - Updated with optional messaging
import React, { useState } from 'react';

interface NamePromptModalProps {
    onNameSubmit: (name: string) => void;
    onSkip: () => void;
}

const NamePromptModal: React.FC<NamePromptModalProps> = ({ onNameSubmit, onSkip }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError('कृपया तुमचे नाव टाका');
            return;
        }

        if (name.trim().length < 2) {
            setError('नाव किमान २ अक्षरांचे असावे');
            return;
        }

        onNameSubmit(name.trim());
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeInUp backdrop-blur-sm" style={{animationDuration: '0.3s'}}>
            <div className="bg-surface rounded-xl shadow-xl w-11/12 max-w-md m-4 p-6">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full mb-4">
                        <i className="fas fa-user text-3xl text-white"></i>
                    </div>
                    <h3 className="font-inter text-2xl font-bold text-primary mb-2">
                        🙏 स्वागत आहे!
                    </h3>
                    <p className="text-text-secondary text-sm">
                        तुमचे नाव शेअर करा आणि आमच्या कम्युनिटीचा भाग व्हा
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="तुमचे नाव (उदा. राहुल पाटील)"
                            className="w-full p-3 border-2 border-border-color rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={onSkip}
                            className="flex-1 py-3 px-4 bg-gray-200 text-text-secondary font-bold rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-forward"></i>
                            नाही, धन्यवाद
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-check"></i>
                            नाव सेव्ह करा
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NamePromptModal;
