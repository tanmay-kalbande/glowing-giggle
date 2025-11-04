import React from 'react';

const Footer: React.FC<{ onAdminLoginClick: () => void }> = ({ onAdminLoginClick }) => (
    <footer className="bg-primary text-white py-6 mt-12 text-center">
        <div className="relative z-10 space-y-4 max-w-4xl mx-auto px-4">
            <h3 className="font-inter text-xl font-bold">तुमचा व्यवसाय वाढवा!</h3>
            <p className="text-sm opacity-90 max-w-xl mx-auto">
                तुमच्या व्यवसायाची माहिती आमच्या निर्देशिकेत जोडून संपूर्ण गावापर्यंत पोहोचा. नोंदणी प्रक्रिया अगदी सोपी आणि विनामूल्य आहे.
            </p>
            <div className="flex justify-center pt-2">
                 <button
                    onClick={onAdminLoginClick}
                    className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-full transition-all transform hover:scale-105 shadow-lg"
                >
                    <i className="fas fa-user-shield text-lg"></i>
                    <span className="text-sm font-bold">
                        ॲडमिन लॉगिन / व्यवसाय जोडा
                    </span>
                </button>
            </div>
            <div className="text-xs opacity-80 pt-2">
                © {new Date().getFullYear()} Jawala Vyapar
            </div>
        </div>
    </footer>
);

export default Footer;
