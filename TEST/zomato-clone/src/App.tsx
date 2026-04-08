import { useState, useEffect } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFlag } from './RolloutContext';
import './App.css';

/* ── Fade-in wrapper ── */
const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
        {children}
    </motion.div>
);

/* ── Header ── */
const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);
    return (
        <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
            <div className="header-logo">zomato</div>
            <nav className="header-nav">
                <span>Investor Relations</span>
                <span>Add restaurant</span>
                <span>Log in</span>
                <button className="btn-primary">Sign up</button>
            </nav>
        </header>
    );
};

/* ── Search Bar ── */
const SearchBar = () => {
    const placeholder = useFlag('zomato-search-placeholder', 'Search for restaurant, cuisine or a dish');
    return (
        <FadeIn delay={0.4}>
            <div className="search-outer">
                <div className="search-bar">
                    <div className="loc-pill">
                        <MapPin size={16} />
                        <span>Pune</span>
                        <ChevronDown size={12} style={{ opacity: 0.4 }} />
                    </div>
                    <div className="search-divider" />
                    <Search size={20} className="search-icon" />
                    <input type="text" className="search-field" placeholder={placeholder} />
                </div>
            </div>
        </FadeIn>
    );
};

/* ── Hero ── */
const HeroSection = () => (
    <section className="hero-section">
        <div className="section-container">
            <FadeIn>
                <h1 className="hero-heading">
                    Discover the best<br />food & drinks
                </h1>
            </FadeIn>
            <FadeIn delay={0.15}>
                <p className="hero-desc">
                    Explore top-rated restaurants, local cuisines, and trending cafes in Pune.
                    Powered by Rollout.io feature flags.
                </p>
            </FadeIn>
            <SearchBar />
        </div>
    </section>
);

/* ── Bento Grid ── */
const BentoGrid = () => {
    const items = [
        { title: 'Order Online', desc: 'Stay home and order to your doorstep', cls: 'bento-hero', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200', badge: 'Popular' },
        { title: 'Dining Out', desc: 'Top-rated restaurants near you', cls: 'bento-wide', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200', badge: 'Trending' },
        { title: 'Nightlife', desc: 'Explore the city after dark', cls: '', img: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&q=80&w=800', badge: 'New' },
        { title: 'Pro Membership', desc: 'Exclusive deals & free delivery', cls: '', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800', badge: 'Exclusive' },
    ];

    return (
        <section className="section-container">
            <FadeIn>
                <div className="section-header">
                    <div>
                        <h2 className="section-title">What's on your mind?</h2>
                        <p className="section-subtitle">Explore curated collections around you</p>
                    </div>
                </div>
            </FadeIn>
            <div className="bento-grid">
                {items.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className={`bento-item ${item.cls}`}
                    >
                        <img src={item.img} alt={item.title} className="bento-img" loading="lazy" />
                        <div className="bento-overlay">
                            <div className="bento-badge">{item.badge}</div>
                            <h3>{item.title}</h3>
                            <p>{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

/* ── Stats ── */
const StatsSection = () => {
    const showStats = useFlag('zomato-show-top-brands', true);
    if (!showStats) return null;
    const stats = [
        { num: '1.2M+', label: 'Active Users' },
        { num: '85K+', label: 'Restaurants' },
        { num: '4.8', label: 'Avg Rating' },
        { num: '150+', label: 'Cities' },
    ];
    return (
        <FadeIn>
            <section className="stats-row">
                {stats.map((s, i) => (
                    <div className="stat-item" key={i}>
                        <div className="stat-num">{s.num}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </section>
        </FadeIn>
    );
};

/* ── Offer ── */
const OfferBanner = () => {
    const showBanner = useFlag('zomato-hero-banner-v2', true);
    const offersConfig = useFlag('zomato-offers-config', { title: 'Special Offers', discount: '50% OFF', active: true });

    if (!showBanner || !offersConfig?.active) return null;

    return (
        <section className="section-container">
            <FadeIn>
                <div className="offer-card">
                    <div>
                        <div className="offer-label">Member Exclusive</div>
                        <h2 className="offer-heading">{offersConfig.title}</h2>
                        <p className="offer-desc" style={{ fontSize: 40, fontWeight: 800, marginTop: 8, opacity: 1, color: 'var(--accent)' }}>{offersConfig.discount}</p>
                        <p className="offer-desc" style={{ marginTop: 16 }}>Use code ROLLOUT50 at checkout. Limited time offer.</p>
                    </div>
                    <button className="offer-btn">Claim Offer</button>
                </div>
            </FadeIn>
        </section>
    );
};

/* ── Footer ── */
const Footer = () => (
    <footer className="site-footer">
        <div className="section-container">
            <div className="footer-grid">
                <div>
                    <div className="header-logo">zomato</div>
                    <p className="footer-brand-desc">
                        Making food discovery and delivery seamless with intelligent feature management powered by Rollout.io SDK.
                    </p>
                </div>
                <div>
                    <div className="footer-col-title">About Zomato</div>
                    <ul className="footer-links">
                        <li>Who We Are</li>
                        <li>Blog</li>
                        <li>Work With Us</li>
                        <li>Investor Relations</li>
                        <li>Report Fraud</li>
                    </ul>
                </div>
                <div>
                    <div className="footer-col-title">For You</div>
                    <ul className="footer-links">
                        <li>Privacy</li>
                        <li>Terms</li>
                        <li>Security</li>
                        <li>Sitemap</li>
                    </ul>
                </div>
                <div>
                    <div className="footer-col-title">Learn More</div>
                    <ul className="footer-links">
                        <li>Partner With Us</li>
                        <li>Apps For You</li>
                        <li>Community</li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                
            </div>
            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-faint)' }}>
                Rollout.io - MIT License - Copyright (c) 2026 Rollout.io. All rights reserved.
            </div>
        </div>
    </footer>
);

/* ── App ── */
export default function App() {
    const darkMode = useFlag('zomato-dark-mode', false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    return (
        <div className={`app-shell ${darkMode ? 'dark' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
            <Header />
            <HeroSection />
            <BentoGrid />
            <StatsSection />
            <OfferBanner />
            <Footer />
        </div>
    );
}
