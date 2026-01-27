
import React from 'react';

interface SignUpProps {
  onBack: () => void;
  onEmailSignUp: () => void;
  onLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onBack, onEmailSignUp, onLogin }) => {
  return (
    <div className="flex-1 flex flex-col items-center px-8 pb-12 w-full max-w-sm mx-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="absolute top-16 left-6 z-50 text-white/70 hover:text-white transition-colors p-2"
        aria-label="Geri"
      >
        <span className="material-icons-round text-3xl">chevron_left</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center w-full pt-10">
        <div className="relative group text-center">
            <h2 className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">iWENT</h2>
        </div>
      </div>

      <div className="w-full space-y-4 mb-12">
        <button 
          className="w-full bg-[#1DB954] hover:bg-[#1ed760] active:scale-[0.97] transition-all duration-200 text-black font-extrabold text-[17px] py-[18px] px-6 rounded-2xl flex items-center justify-center gap-4 shadow-[0_8px_30px_rgb(29,185,84,0.3)]"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.508 17.302c-.216.354-.675.467-1.03.249-2.872-1.755-6.486-2.152-10.742-1.177-.403.092-.807-.16-.9-.562-.091-.403.159-.807.562-.9 4.654-1.064 8.636-.613 11.862 1.357.354.216.467.675.248 1.033zm1.47-3.255c-.272.44-.847.578-1.287.307-3.287-2.02-8.303-2.607-12.192-1.427-.497.151-1.02-.128-1.171-.625-.15-.497.129-1.021.626-1.171 4.444-1.348 9.97-.689 13.717 1.61.441.272.578.847.307 1.306zm.126-3.388c-3.944-2.342-10.457-2.557-14.238-1.41-.606.184-1.24-.163-1.425-.77-.183-.606.163-1.24.77-1.425 4.341-1.318 11.537-1.064 16.05 1.616.545.324.726 1.03.402 1.575-.323.546-1.03.727-1.559.414z"/>
          </svg>
          Spotify ile devam et
        </button>

        <button 
          className="w-full bg-[#4285F4] hover:bg-[#5a95f5] active:scale-[0.97] transition-all duration-200 text-white font-extrabold text-[17px] py-[18px] px-6 rounded-2xl flex items-center justify-center gap-4 shadow-[0_8px_30px_rgb(66,133,244,0.3)]"
        >
          <div className="bg-white rounded-full p-1 flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          Google ile devam et
        </button>

        <div className="text-center pt-2">
          <button 
            onClick={onEmailSignUp}
            className="text-[11px] font-bold text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.2em]"
          >
            ya da e-posta kullan
          </button>
        </div>
      </div>

      <div className="w-full text-center">
        <button onClick={onLogin} className="text-white/60 text-[15px] font-medium group">
          Zaten bir hesabın var mı?{' '}
          <span className="text-primary font-bold group-hover:underline ml-1">Giriş Yap</span>
        </button>
      </div>
    </div>
  );
};
