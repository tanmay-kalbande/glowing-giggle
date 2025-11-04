import React from 'react';

interface HeaderProps {
    isInstallable: boolean;
    onInstallClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isInstallable, onInstallClick }) => (
    <header className="relative bg-gradient-to-br from-primary to-secondary text-white text-center p-6 rounded-lg mb-6 shadow-header animate-fadeInUp">
        <h1 className="font-inter text-3xl md:text-4xl font-bold tracking-tight">
          जवळा व्यवसाय निर्देशिका
        </h1>
        <p className="mt-1 text-md opacity-90">तुमच्या गावातील सर्व व्यवसाय एकाच ठिकाणी!</p>
        
        {isInstallable && (
            <button
                onClick={onInstallClick}
                className="absolute top-3 right-3 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg"
                title="अ‍ॅप ইনস্টল करा"
            >
                <i className="fas fa-download"></i>
                <span className="hidden sm:inline">Install App</span>
            </button>
        )}
    </header>
);

export default Header;
