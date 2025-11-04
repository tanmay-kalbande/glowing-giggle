
import React from 'react';

const Footer: React.FC<{ onAdminLoginClick: () => void }> = ({ onAdminLoginClick }) => (
    <footer className="bg-gradient-to-br from-primary to-secondary text-white p-8 mt-16 text-center shadow-header">
        <div className="relative z-10 space-y-6">
            <h3 className="font-inter text-2xl font-bold">तुमचा व्यवसाय वाढवा!</h3>
            <p className="text-md opacity-90 max-w-lg mx-auto">तुमच्या व्यवसायाची माहिती आमच्या निर्देशिकेत जोडून संपूर्ण गावापर्यंत पोहोचा. नोंदणी प्रक्रिया अगदी सोपी आणि विनामूल्य आहे.</p>
            <div className="flex flex-col items-center gap-3">
                 <button
                    onClick={onAdminLoginClick}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all transform hover:scale-105 shadow-lg font-semibold"
                >
                    <i className="fas fa-user-shield text-xl"></i>
                    <span className="text-lg font-bold">ॲडमिन लॉगिन / व्यवसाय जोडा</span>
                </button>
            </div>
            <div className="text-sm opacity-80 pt-4">
                © {new Date().getFullYear()} Jawala Vyapar
            </div>
        </div>
    </footer>
);

export default Footer;
