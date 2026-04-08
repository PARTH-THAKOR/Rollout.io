import React from 'react';
import { Search, MapPin, ChevronDown, Smartphone, ShoppingBag, Utensils, Star, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFlag } from './RolloutContext';
import heroBg from './assets/hero-bg.png';
import offerBanner from './assets/offer-banner.png';
import './App.css';

const Navbar = () => {
    return (
        <nav className="navbar container fade-in">
            <div className="nav-left">
                <div className="app-promo">
                    <Smartphone size={16} />
                    <span>Get the App</span>
                </div>
            </div>
            <div className="nav-right">
                <span>Investor Relations</span>
                <span>Add restaurant</span>
                <span>Log in</span>
                <span>Sign up</span>
            </div>
        </nav>
    );
};

const HeroSection = () => {
    const isV2 = useFlag('zomato-hero-banner-v2', true);
    const searchPlaceholder = useFlag('zomato-search-placeholder', 'Search for restaurant, cuisine or a dish');

    return (
        <div className={`hero ${isV2 ? 'hero-v2' : ''}`} style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroBg})` }}>
            <div className="hero-content container">
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hero-logo"
                >
                    zomato
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="hero-tagline"
                >
                    Discover the best food & drinks in Pune
                </motion.p>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="search-container glass"
                >
                    <div className="location-picker">
                        <MapPin size={20} className="icon-red" />
                        <input type="text" placeholder="Pune" readOnly />
                        <ChevronDown size={18} />
                    </div>
                    <div className="search-divider"></div>
                    <div className="search-input">
                        <Search size={20} className="icon-gray" />
                        <input type="text" placeholder={searchPlaceholder} />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const CategoryCards = () => {
    return (
        <div className="categories container">
            <div className="category-card">
                <div className="card-img" style={{ backgroundColor: '#E2F1F8' }}><ShoppingBag size={40} color="#1C1C1C" /></div>
                <h3>Order Online</h3>
                <p>Stay home and order to your doorstep</p>
            </div>
            <div className="category-card">
                <div className="card-img" style={{ backgroundColor: '#F0ECF8' }}><Utensils size={40} color="#1C1C1C" /></div>
                <h3>Dining</h3>
                <p>View the city's favourite dining venues</p>
            </div>
        </div>
    );
};

const OffersSection = () => {
    const config = useFlag('zomato-offers-config', { 
        title: 'Special Offer', 
        discount: '50% OFF', 
        active: true 
    });

    if (!config.active) return null;

    return (
        <div className="offers container">
            <div className="offer-banner" style={{ backgroundImage: `url(${offerBanner})` }}>
                <div className="offer-text">
                    <h2>{config.title}</h2>
                    <h1>{config.discount}</h1>
                    <button>Claim Now</button>
                </div>
            </div>
        </div>
    );
};

const TopBrands = () => {
    const show = useFlag('zomato-show-top-brands', true);
    if (!show) return null;

    const brands = [
        { name: 'KFC', logo: '🍗' },
        { name: 'Burger King', logo: '🍔' },
        { name: 'Domino\'s', logo: '🍕' },
        { name: 'Subway', logo: '🥖' },
        { name: 'Pizza Hut', logo: '🥧' },
        { name: 'McDonald\'s', logo: '🍟' }
    ];

    return (
        <div className="top-brands container">
            <h2>Top brands for you</h2>
            <div className="brands-list">
                {brands.map(brand => (
                    <div key={brand.name} className="brand-item">
                        <div className="brand-logo">{brand.logo}</div>
                        <span>{brand.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

function App() {
    const darkMode = useFlag('zomato-dark-mode', false);

    return (
        <div className="app-root" data-theme={darkMode ? 'dark' : 'light'}>
            <Navbar />
            <HeroSection />
            <CategoryCards />
            <OffersSection />
            <TopBrands />
            <footer className="footer container">
                <div className="footer-top">
                    <h2>zomato</h2>
                </div>
                <div className="footer-bottom">
                    <p>By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners. 2008-2026 © Zomato™ Ltd. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default App;
