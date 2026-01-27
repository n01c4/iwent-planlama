
import React, { useState } from 'react';

interface LoginProps {
  onBack: () => void;
  onSignUp: () => void;
  onLoginSuccess: () => void;
}

const IMAGES = {
  row1: [
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1514525253344-f81f3c749b1a?auto=format&fit=crop&q=80&w=400',
  ],
  row2: [
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1523580494863-6f30312245d5?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
  ],
  row3: [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=400',
  ]
};

export const Login: React.FC<LoginProps> = ({ onBack, onSignUp, onLoginSuccess }) => {
  const [awareChecked, setAwareChecked] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isFormValid = email.trim() !== '' && password.trim() !== '' && awareChecked;

  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/15 transition-all duration-300 text-[16px]";
  const checkboxWrapper = "flex items-center gap-3 cursor-pointer group select-none";
  const checkboxSquare = (checked: boolean) => `w-6 h-6 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
    checked ? 'bg-primary border-primary' : 'bg-transparent border-white/20 group-hover:border-white/40'
  }`;

  return (
    <div className="flex-1 flex flex-col w-full h-full animate-in fade-in duration-700 bg-black overflow-hidden">
      {/* Background Strips */}
      <div className="absolute top-0 left-0 right-0 h-[45%] z-0 pointer-events-none opacity-60">
        <div className="h-full flex flex-col gap-2 py-4">
          <div className="relative overflow-hidden h-1/3">
            <div className="flex gap-2 animate-scroll-right whitespace-nowrap">
              {[...IMAGES.row1, ...IMAGES.row1].map((src, i) => (
                <img key={i} src={src} className="h-full aspect-video object-cover rounded-lg border border-white/10" alt="" />
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden h-1/3">
            <div className="flex gap-2 animate-scroll-left whitespace-nowrap">
              {[...IMAGES.row2, ...IMAGES.row2].map((src, i) => (
                <img key={i} src={src} className="h-full aspect-video object-cover rounded-lg border border-white/10" alt="" />
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden h-1/3">
            <div className="flex gap-2 animate-scroll-right-slow whitespace-nowrap">
              {[...IMAGES.row3, ...IMAGES.row3].map((src, i) => (
                <img key={i} src={src} className="h-full aspect-video object-cover rounded-lg border border-white/10" alt="" />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
      </div>

      <button 
        onClick={onBack}
        className="absolute top-16 left-6 z-50 text-white/70 hover:text-white transition-colors p-2"
      >
        <span className="material-icons-round text-3xl">chevron_left</span>
      </button>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-end px-8 pb-12 w-full max-w-sm mx-auto">
        <div className="w-full text-center mb-8">
           <h2 className="text-4xl font-serif font-bold text-white drop-shadow-lg">Tekrar Hoş Geldin</h2>
        </div>

        <form className="w-full space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="E-posta" 
            className={inputClasses}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Şifre" 
              className={inputClasses}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1 flex items-center justify-center"
            >
              <span className="material-icons-round text-[22px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          <div className="space-y-4 pt-2">
            <label className={checkboxWrapper} onClick={() => setRememberMe(!rememberMe)}>
              <div className={checkboxSquare(rememberMe)}>
                {rememberMe && <span className="material-icons-round text-black text-[18px]">check</span>}
              </div>
              <span className="text-white/60 text-[14px] font-medium">Beni Hatırla</span>
            </label>

            <label className={checkboxWrapper} onClick={() => setAwareChecked(!awareChecked)}>
              <div className={checkboxSquare(awareChecked)}>
                {awareChecked && <span className="material-icons-round text-black text-[18px]">check</span>}
              </div>
              <span className="text-white/60 text-[14px] font-medium leading-tight">Ekrana baktığımın farkındayım.</span>
            </label>
          </div>

          <button 
            disabled={!isFormValid}
            onClick={onLoginSuccess}
            className={`w-full font-extrabold text-[17px] py-[20px] rounded-2xl transition-all duration-300 mt-6 ${
              isFormValid 
                ? 'bg-primary text-black shadow-[0_8px_30px_rgb(0,230,118,0.3)] hover:brightness-110 active:scale-[0.98]' 
                : 'bg-white/10 text-white/20 cursor-not-allowed border border-white/5'
            }`}
          >
            Giriş Yap
          </button>
        </form>

        <div className="w-full text-center mt-10">
          <button onClick={onSignUp} className="text-white/60 text-[15px] font-medium group">
            Henüz bir hesabın yok mu?{' '}
            <span className="text-primary font-bold group-hover:underline ml-1">Kayıt Ol</span>
          </button>
        </div>
      </div>
    </div>
  );
};
