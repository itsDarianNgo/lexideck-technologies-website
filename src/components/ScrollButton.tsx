import React from 'react';

interface ScrollButtonProps {
    targetId: string;
    label?: string;
}

const ScrollButton: React.FC<ScrollButtonProps> = ({ targetId, label = 'Scroll Down' }) => {
    const handleScroll = () => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <button
            onClick={handleScroll}
            className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300"
            aria-label={`Scroll to ${targetId}`}
        >
            {label}
        </button>
    );
};

export default ScrollButton;
