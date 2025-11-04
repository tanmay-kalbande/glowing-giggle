// components/common/NamePromptModal.tsx
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeInUp" style={{animationDuration: '0.3s'}}>
            <div className="bg-surface rounded-xl shadow-xl w-11/12 max-w-md m-4 p-6">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                        <i className="fas fa-user text-3xl text-primary"></i>
                    </div>
                    <h3 className="font-inter text-2xl font-bold text-primary mb-2">
                        स्वागत आहे! 🙏
                    </h3>
                    <p className="text-text-secondary text-sm">
                        रेटिंग देण्यासाठी कृपया तुमचे नाव टाका
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

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                            <i className="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                            <span>तुमचे नाव फक्त रेटिंग सोबत दिसेल. हे फक्त एकदाच विचारले जाईल.</span>
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={onSkip}
                            className="flex-1 py-3 px-4 bg-gray-200 text-text-secondary font-bold rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            सध्या नाही
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            पुढे जा
                        </button>
                    </div>
                </form>

                <p className="text-xs text-text-secondary text-center mt-4">
                    तुम्ही कधीही सेटिंग्जमधून तुमचे नाव बदलू शकता
                </p>
            </div>
        </div>
    );
};

export default NamePromptModal;
