
import React from 'react';

interface InstallPromptProps {
    onInstall: () => void;
    onDismiss: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-primary to-secondary text-white p-4 z-50 animate-fadeInUp flex items-center justify-center gap-4 shadow-lg">
            <div className="flex-grow text-center sm:text-left">
                <p className="font-bold">तुमच्या होम स्क्रीनवर ॲप ইনস্টল करा!</p>
                <p className="text-sm opacity-90">जलद प्रवेशासाठी आणि उत्तम अनुभवासाठी.</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <button 
                    onClick={onInstall}
                    className="bg-white text-primary font-bold py-2 px-5 rounded-full hover:bg-gray-200 transition-colors"
                >
                    इंस्टॉल करा
                </button>
                <button 
                    onClick={onDismiss}
                    className="text-white/80 hover:text-white"
                    aria-label="Dismiss"
                >
                    <i className="fas fa-times text-2xl"></i>
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
