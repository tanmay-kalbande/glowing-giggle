import React, { useState, useEffect } from 'react';

interface InstallPromptProps {
    show: boolean;
    onDismiss: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ show, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    // Check if the user is on an iOS device
    const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    useEffect(() => {
        // Only show for iOS if it hasn't been dismissed before
        if (isIOS() && show) {
            const dismissed = localStorage.getItem('iosInstallPromptDismissed');
            if (!dismissed) {
                setIsVisible(true);
            }
        }
    }, [show]);

    const handleDismiss = () => {
        localStorage.setItem('iosInstallPromptDismissed', 'true');
        setIsVisible(false);
        onDismiss();
    };

    if (!isVisible || !isIOS()) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-primary to-secondary text-white p-4 z-50 animate-fadeInUp flex items-center justify-center gap-4 shadow-lg">
            <div className="flex-grow text-center sm:text-left">
                <p className="font-bold">तुमच्या होम स्क्रीनवर ॲप ইনস্টল करा!</p>
                <p className="text-sm opacity-90">खालील शेअर बटण <i className="fas fa-share-square"></i> टॅप करा आणि 'Add to Home Screen' निवडा.</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <button 
                    onClick={handleDismiss}
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
