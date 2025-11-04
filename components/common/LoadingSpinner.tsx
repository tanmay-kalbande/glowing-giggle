
import React from 'react';

const LoadingSpinner: React.FC = () => (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="w-16 h-16 border-4 border-t-primary border-gray-200 rounded-full animate-spin"></div>
    </div>
);

export default LoadingSpinner;
