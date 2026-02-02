import './index.css';
import { navigateTo, requestExpandedMode, context } from '@devvit/web/client';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

export const Splash = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    // Device detection:
    // On Desktop (wide screen), we want to play INLINE to act like a web game.
    // On Mobile (narrow screen), we want expanded mode for space.
    // We prioritize width check because user agents can be tricky in emulators.
    const isMobileWidth = window.innerWidth < 640; // Tailwinds 'sm' breakpoint

    // Also check for touch capability as a hint, but don't let it override desktop width
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isMobileWidth && isTouch) {
      requestExpandedMode(e.nativeEvent, 'game');
    } else {
      setIsPlaying(true);
    }
  };

  if (isPlaying) {
    return <App />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white overflow-hidden font-sans">
      {/* Background Effect */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 via-purple-900 to-slate-900 z-0 pointer-events-none"></div>

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center gap-8 p-6 w-full max-w-md">

        {/* Preview Image Card */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
          <img
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
            src="/Preview.png"
            alt="Game Preview"
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>

          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold tracking-widest uppercase bg-orange-500 rounded text-white shadow-lg">New Stage 6</span>
            <h2 className="text-white font-bold text-xl leading-tight">Goti: Daily Circuit</h2>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">
            Master the physics of the traditional Indian marble game.
          </p>
        </div>

        {/* Play Button */}
        <button
          className="group relative w-full max-w-xs flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-xl font-black text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:bg-orange-50 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 active:scale-95 overflow-hidden"
          onClick={handlePlay}
        >
          {/* Button Shine Effect */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine"></div>

          <span className="relative z-10 flex items-center gap-2">
            PLAY NOW
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-600">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
          Start your daily streak
        </p>

      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 flex gap-4 text-xs text-slate-500 z-10">
        <button className="hover:text-white transition-colors" onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}>
          Powered by Devvit
        </button>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
