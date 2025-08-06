import React from 'react'

function Header() {
  return (
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
}

export default Header