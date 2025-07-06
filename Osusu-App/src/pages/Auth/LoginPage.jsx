import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
};

const GlassCard = ({ children, className }) => (
  <div className={`bg-light/50 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
    {children}
  </div>
);

const CTAButton = ({ children, className, ...props }) => (
  <motion.button
    className={`bg-gradient-to-r from-primary to-secondary text-white font-heading font-semibold px-7 py-3 rounded-full transition-transform duration-300 ${className}`}
    whileHover={{ scale: 1.05, y: -3, boxShadow: '0 10px 20px rgba(138, 43, 226, 0.3)' }}
    whileTap={{ scale: 0.95 }}
    {...props}
  >
    {children}
  </motion.button>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    // TODO: Add real authentication logic here
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    // Simulate login success
    navigate('/');
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-dark bg-cover bg-center relative">
      <div className="absolute inset-0 bg-dark/70 z-10" />
      <div className="relative z-20 container mx-auto px-6">
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <GlassCard className="max-w-md mx-auto p-8 md:p-12">
            <h2 className="font-heading text-3xl font-bold mb-6 text-center">Login to OSUSU</h2>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block mb-2 font-medium">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-white/80 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-lg bg-white/80 border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <CTAButton type="submit" className="w-full mt-2">Login</CTAButton>
            </form>
            <div className="text-center mt-6 text-text-secondary">
              Don&apos;t have an account? <a href="#" className="text-primary font-semibold">Contact Admin</a>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
};

export default LoginPage;