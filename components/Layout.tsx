
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onHomeClick?: () => void;
  onFaqClick?: () => void;
  showHomeButton?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, onHomeClick, onFaqClick, showHomeButton }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 flex flex-col min-h-screen">
      <nav className="flex justify-between items-center mb-16 px-2">
        {/* Logo */}
        <div 
          onClick={onHomeClick}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-red-500 via-yellow-400 to-green-400 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 group-hover:shadow-red-500/40 group-hover:rotate-3 transition-all duration-300">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-6 h-6 text-black group-hover:animate-pulse" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <span className="font-bold tracking-tighter text-xl hidden sm:block group-hover:text-white transition-colors duration-300">LOVE SCANNER</span>
        </div>

        {/* Action Button */}
        <button 
          onClick={onFaqClick}
          className="text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 glass rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
        >
          Insights FAQ
        </button>
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="mt-20 text-center space-y-10">
        {showHomeButton && (
          <button 
            onClick={onHomeClick}
            className="text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-[0.2em] border-b border-neutral-800 pb-2"
          >
            ← Back to Insights
          </button>
        )}
        
        <div className="bg-neutral-900/30 p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
          <p className="text-neutral-500 text-[10px] leading-relaxed uppercase tracking-widest font-medium">
            Structural Intelligence Notice: This diagnostic tool is designed for educational exploration and self-reflection based on the Gottman Method and Attachment Theory. It does not constitute professional therapy, clinical advice, or psychological intervention.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
