
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import * as SupabaseService from '../../supabaseClient';

interface LoginModalProps {
    onLoginSuccess: (user: User) => void;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { user } = await SupabaseService.signIn(email, password);
            onLoginSuccess(user);
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'लॉगिन अयशस्वी. कृपया पुन्हा प्रयत्न करा.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-xl shadow-xl w-11/12 max-w-sm m-4 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="font-inter text-2xl font-bold text-primary mb-4 text-center">ॲडमिन लॉगिन</h3>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="ईमेल" 
                        className="w-full p-3 border-2 border-border-color rounded-lg" 
                        required 
                        disabled={isLoading}
                    />
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="पासवर्ड" 
                        className="w-full p-3 border-2 border-border-color rounded-lg" 
                        required 
                        disabled={isLoading}
                    />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'लॉगिन करत आहे...' : 'लॉगिन करा'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
