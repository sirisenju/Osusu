// src/App.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { FiUsers, FiLogIn, FiRepeat, FiGift, FiCheck, FiChevronDown, FiMessageSquare, FiTwitter, FiLinkedin, FiGithub } from 'react-icons/fi';
import { FaQuoteLeft } from 'react-icons/fa';

import 'swiper/css';
import 'swiper/css/pagination';

// import heroBg from './assets/hero-bg.jpg';

// --- ANIMATION VARIANTS ---
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.2 } },
};

// --- COMPONENTS ---

const GlassCard = ({ children, className }) => (
  <div className={`bg-light/50 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
    {children}
  </div>
);

const CTAButton = ({ children, className }) => (
  <motion.button
    className={`bg-gradient-to-r from-primary to-secondary text-white font-heading font-semibold px-7 py-3 rounded-full transition-transform duration-300 ${className}`}
    whileHover={{ scale: 1.05, y: -3, boxShadow: '0 10px 20px rgba(138, 43, 226, 0.3)' }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
  </motion.button>
);


const Navbar = () => (
  <motion.nav
    className="fixed w-full top-0 left-0 z-50 bg-dark/50 backdrop-blur-lg border-b border-white/5"
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      <div className="font-heading text-2xl font-bold gradient-text">OSUSU</div>
      <ul className="hidden md:flex items-center gap-8 font-body font-medium text-text-secondary">
        <li><a href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</a></li>
        <li><a href="#plans" className="hover:text-text-primary transition-colors">Plans</a></li>
        <li><a href="#faq" className="hover:text-text-primary transition-colors">FAQ</a></li>
      </ul>
      <CTAButton>Join Now</CTAButton>
    </div>
  </motion.nav>
);

const Hero = () => (
  <section id="home" className="min-h-screen flex items-center justify-center relative bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(./assets/investment-coins.jpg)` }}>
    <div className="absolute inset-0 bg-dark/60 z-10" />
    <div className="relative z-20 container mx-auto px-6 text-center">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <GlassCard className="max-w-4xl mx-auto p-8 md:p-12">
          <motion.h1 variants={fadeIn} className="font-heading text-4xl md:text-6xl font-bold mb-4">
            Community-Powered <span className="gradient-text">Capital</span>
          </motion.h1>
          <motion.p variants={fadeIn} className="text-lg md:text-xl text-text-primary/90 max-w-2xl mx-auto mb-8">
            Welcome to OSUSU, the digital group savings platform. Pool funds with your trusted circle, access interest-free capital, and accelerate your financial ambitions.
          </motion.p>
          <motion.div variants={fadeIn}>
            <CTAButton>Explore Pooling Plans</CTAButton>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  </section>
);


const plansData = [
  { title: 'Starter Pool', price: '50', features: ['Up to 5 members', 'Monthly Payouts', 'Basic Vetting', 'Email Support'], isPopular: false },
  { title: 'Growth Pool', price: '250', features: ['Up to 10 members', 'Flexible Payout Schedule', 'Enhanced Vetting', 'Priority Support', 'Financial Tracking Tools'], isPopular: true },
  { title: 'Venture Pool', price: '1000', features: ['Up to 15 members', 'Custom Payout Options', 'Comprehensive Vetting', 'Dedicated Account Manager', 'Investment Opportunities'], isPopular: false },
];

const Plans = () => (
  <section id="plans" className="py-20 bg-dark">
    <div className="container mx-auto px-6">
      <h2 className="text-center font-heading text-4xl font-bold mb-4">Choose Your <span className="gradient-text">Plan</span></h2>
      <p className="text-center text-text-secondary max-w-2xl mx-auto mb-12">We have a plan for every level of ambition and financial goal. Start small or go big.</p>
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        {plansData.map((plan, index) => (
          <motion.div
            key={index}
            variants={fadeIn}
            className={`relative p-8 rounded-2xl flex flex-col transition-transform duration-300 ${plan.isPopular ? 'border-2 border-primary scale-105 bg-light' : 'bg-light/50 border border-white/10'}`}
          >
            {plan.isPopular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1.5 rounded-full text-xs font-bold font-heading">MOST POPULAR</div>}
            <h3 className="font-heading text-2xl font-bold text-center mb-2">{plan.title}</h3>
            <div className="text-center mb-6">
              <span className="font-heading text-5xl font-bold">${plan.price}</span>
              <span className="text-text-secondary">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <FiCheck className="text-primary" size={20} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <CTAButton className="w-full mt-auto">Select Plan</CTAButton>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);


const HowItWorks = () => {
    const steps = [
        { icon: <FiUsers />, title: 'Form a Circle', description: 'Join a public circle or invite trusted friends to a private one.' },
        { icon: <FiLogIn />, title: 'Contribute Funds', description: 'Each member contributes a fixed amount into the shared pool every month.' },
        { icon: <FiRepeat />, title: 'Rotate Payouts', description: 'One member receives the full lump sum each month, until everyone has had a turn.' },
        { icon: <FiGift />, title: 'Fuel Your Dreams', description: 'Use your interest-free capital to achieve your personal or business goals.' },
    ];
    return (
        <section id="how-it-works" className="py-20 bg-light">
            <div className="container mx-auto px-6">
                <h2 className="text-center font-heading text-4xl font-bold mb-4">Simple Steps to <span className="gradient-text">Success</span></h2>
                <p className="text-center text-text-secondary max-w-2xl mx-auto mb-12">Our process is transparent, secure, and designed for collective success.</p>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    {steps.map((step, index) => (
                        <motion.div key={index} variants={fadeIn}>
                            <GlassCard className="p-8 text-center h-full">
                                <div className="flex justify-center mb-4">
                                    <div className="text-5xl gradient-text">{step.icon}</div>
                                </div>
                                <h3 className="font-heading text-xl font-bold mb-2">{step.title}</h3>
                                <p className="text-text-secondary text-sm">{step.description}</p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};


const testimonialsData = [
  { name: 'Aisha Bello', role: 'Boutique Owner', comment: 'OSUSU was the key to launching my first retail location. No banks, no interest, just a community that had my back.', avatar: 'https://i.pravatar.cc/150?img=1' },
  { name: 'David Chen', role: 'Freelance Developer', comment: 'I saved for a new workspace setup in a third of the time. The discipline of the monthly contribution was a game-changer.', avatar: 'https://i.pravatar.cc/150?img=3' },
  { name: 'Maria Garcia', role: 'Graduate Student', comment: 'I finally paid off a nagging student loan with my payout. It felt incredibly empowering!', avatar: 'https://i.pravatar.cc/150?img=5' },
];

const Testimonials = () => (
    <section id="testimonials" className="py-20 bg-dark">
        <div className="container mx-auto px-6">
            <h2 className="text-center font-heading text-4xl font-bold mb-12">What Our <span className="gradient-text">Members Say</span></h2>
            <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={30}
                slidesPerView={1}
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={true}
                breakpoints={{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
            >
                {testimonialsData.map((t, i) => (
                    <SwiperSlide key={i} className="pb-12">
                        <GlassCard className="p-8 h-full flex flex-col relative">
                            <FaQuoteLeft className="absolute top-6 left-6 text-5xl text-white/5" />
                            <p className="text-text-primary/90 italic mb-6 flex-grow z-10">"{t.comment}"</p>
                            <div className="flex items-center z-10">
                                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full mr-4 border-2 border-primary"/>
                                <div>
                                    <h4 className="font-heading font-bold">{t.name}</h4>
                                    <p className="text-sm text-text-secondary">{t.role}</p>
                                </div>
                            </div>
                        </GlassCard>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    </section>
);


const faqData = [
  { question: 'Is OSUSU a loan?', answer: 'No, it\'s a form of collaborative saving. You are essentially getting early access to your own future savings. Since it\'s your group\'s money, there is no interest.' },
  { question: 'How is the payout order decided?', answer: 'The circle members decide the order before the pooling begins. It can be through a lottery, mutual agreement, or based on who has the most urgent need.' },
  { question: 'What makes OSUSU secure?', answer: 'We use identity verification, secure payment processing, and a transparent digital ledger. For added peace of mind, our Growth and Venture plans include payment protection options.' },
  { question: 'Are there any fees?', answer: 'We charge a small platform fee on each contribution to cover operational costs, security, and support. This fee varies by plan and is completely transparent.' },
];

const FAQItem = ({ item, isOpen, onClick }) => (
    <div className="border-b border-white/10">
        <button onClick={onClick} className="w-full flex justify-between items-center text-left py-6">
            <h3 className="font-heading text-lg font-semibold">{item.question}</h3>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><FiChevronDown size={24} /></motion.div>
        </button>
        <AnimatePresence>
            {isOpen && <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <p className="pb-6 pr-8 text-text-secondary">{item.answer}</p>
            </motion.div>}
        </AnimatePresence>
    </div>
);

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);
    return (
        <section id="faq" className="py-20 bg-light">
            <div className="container mx-auto px-6">
                <h2 className="text-center font-heading text-4xl font-bold mb-4">Your <span className="gradient-text">Questions</span>, Answered</h2>
                <div className="max-w-3xl mx-auto mt-12">
                    {faqData.map((item, index) => (
                        <FAQItem key={index} item={item} isOpen={openIndex === index} onClick={() => setOpenIndex(openIndex === index ? null : index)} />
                    ))}
                </div>
            </div>
        </section>
    );
};


const Footer = () => (
    <footer className="py-12 bg-dark border-t border-white/5">
        <div className="container mx-auto px-6 text-center text-text-secondary">
            <h3 className="font-heading text-2xl font-bold gradient-text">OSUSU</h3>
            <p className="max-w-md mx-auto my-4">The future of finance is collaborative. Join the movement.</p>
            <div className="flex justify-center gap-6 my-8">
                <a href="#" className="hover:text-primary transition-colors"><FiTwitter size={24} /></a>
                <a href="#" className="hover:text-primary transition-colors"><FiLinkedin size={24} /></a>
                <a href="#" className="hover:text-primary transition-colors"><FiGithub size={24} /></a>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} OSUSU Platform. All Rights Reserved.</p>
        </div>
    </footer>
);

const FloatingChat = () => (
    <motion.div
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center cursor-pointer shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: 'spring' }}
        whileHover={{ scale: 1.1, rotate: 15 }}
    >
        <FiMessageSquare size={32} className="text-white" />
    </motion.div>
);

function App() {
  return (
    <div>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Plans />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
}

export default App;