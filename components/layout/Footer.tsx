import React from 'react';

const Footer: React.FC<{ onAdminLoginClick: () => void }> = ({ onAdminLoginClick }) => (
    <footer className="bg-primary text-white p-8 mt-16 text-center">
        <div className="relative z-10 space-y-8">
            <h3 className="font-inter text-3xl font-bold">तुमचा व्यवसाय वाढवा!</h3>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
                तुमच्या व्यवसायाची माहिती आमच्या निर्देशिकेत जोडून संपूर्ण गावापर्यंत पोहोचा. नोंदणी प्रक्रिया अगदी सोपी आणि विनामूल्य आहे.
            </p>
            <div className="flex justify-center">
                 <button
                    onClick={onAdminLoginClick}
                    className="inline-flex items-center justify-center gap-4 px-10 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-full transition-all transform hover:scale-105 shadow-lg"
                >
                    <i className="fas fa-user-shield text-3xl"></i>
                    <span className="text-xl font-bold text-left leading-tight">
                        ॲडमिन लॉगिन / व्यवसाय<br/>जोडा
                    </span>
                </button>
            </div>
            <div className="text-base opacity-80 pt-6">
                © {new Date().getFullYear()} Jawala Vyapar
            </div>
        </div>
    </footer>
);

export default Footer;
