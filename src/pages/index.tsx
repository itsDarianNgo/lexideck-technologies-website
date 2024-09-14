import React from 'react';
import HeroSection from '@/components/HeroSection';
import NextSection from '@/components/NextSection';

const HomePage: React.FC = () => {
    return (
        <div>
            <HeroSection />
            <NextSection />
            {/* Other sections can be added here */}
        </div>
    );
};

export default HomePage;
