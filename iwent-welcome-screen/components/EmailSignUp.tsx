
import React, { useState } from 'react';
import { api, setAuthToken } from '../api';

interface EmailSignUpProps {
  onBack: () => void;
  onLogin: () => void;
  onSignUpSuccess: () => void;
}

export const EmailSignUp: React.FC<EmailSignUpProps> = ({ onBack, onLogin, onSignUpSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');

  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/15 transition-all duration-300 text-[15px]";
  const labelClasses = "text-[12px] font-bold text-white/40 uppercase tracking-widest mb-1.5 ml-1 block";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const fullName = `${name} ${surname}`.trim();
      // Call real API
      const response = await api.auth.register({
        name: fullName,
        email,
        password,
        city: city || 'Istanbul' // Default or input
      });

      // Store token
      setAuthToken(response.accessToken);

      setIsSuccess(true);
      
      setTimeout(() => {
        onSignUpSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const PasswordToggle = ({ isVisible, onToggle }: { isVisible: boolean, onToggle: () => void }) => (
    <button 
      type="button" 
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors flex items-center justify-center h-full pr-1"
    >
      <span className="material-icons-round text-xl">
        {isVisible ? 'visibility_off' : 'visibility'}
      </span>
    </button>
  );

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-8 animate-in fade-in duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,230,118,0.5)] animate-bounce relative z-10">
            <span className="material-icons-round text-black text-5xl">check</span>
          </div>
        </div>
        <h2 className="text-3xl font-black text-white text-center mb-4 tracking-tight">Hoş Geldin!</h2>
        <p className="text-white/60 text-center font-medium leading-relaxed">
          Hesabın başarıyla oluşturuldu.<br />Harika etkinlikler seni bekliyor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-8 pb-12 pt-24 w-full max-w-sm mx-auto h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <button 
        onClick={onBack}
        className="absolute top-16 left-6 z-50 text-white/70 hover:text-white transition-colors p-2"
        aria-label="Geri"
      >
        <span className="material-icons-round text-3xl">chevron_left</span>
      </button>

      <div className="w-full text-center mb-10">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Aramıza Katıl</h2>
      </div>

      <form className="w-full space-y-5" onSubmit={handleSignUp}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>İsim</label>
            <input 
              required 
              type="text" 
              placeholder="Can" 
              className={inputClasses} 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClasses}>Soyisim</label>
            <input 
              required 
              type="text" 
              placeholder="Yılmaz" 
              className={inputClasses} 
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>E-posta</label>
          <input 
            required 
            type="email" 
            placeholder="can@ornek.com" 
            className={inputClasses} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClasses}>Şifre</label>
          <div className="relative">
            <input 
              required
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              className={inputClasses} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordToggle 
              isVisible={showPassword} 
              onToggle={() => setShowPassword(!showPassword)} 
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Şifre Tekrar</label>
          <div className="relative">
            <input 
              required
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="••••••••" 
              className={inputClasses} 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <PasswordToggle 
              isVisible={showConfirmPassword} 
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Şehir</label>
            <input 
              type="text" 
              placeholder="İstanbul" 
              className={inputClasses}
              value={city}
              onChange={(e) => setCity(e.target.value)} 
            />
          </div>
          <div>
            <label className={labelClasses}>Yaş</label>
            <input type="number" placeholder="24" className={inputClasses} />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-primary text-black font-extrabold text-[17px] py-[18px] rounded-2xl shadow-[0_8px_30px_rgb(0,230,118,0.3)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 mt-4 flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              Oluşturuluyor...
            </>
          ) : 'Hesap Oluştur'}
        </button>
      </form>

      <div className="w-full text-center mt-6">
        <button onClick={onLogin} className="text-white/60 text-[15px] font-medium group">
          Zaten bir hesabın var mı?{' '}
          <span className="text-primary font-bold group-hover:underline ml-1">Giriş Yap</span>
        </button>
      </div>
    </div>
  );
};
