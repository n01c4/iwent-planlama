
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Menu } from './Menu';
import { Language } from '../App';
import { api, User } from '../api';

interface ProfileProps {
  onLogout: () => void;
  onEventClick?: (event: any) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onScrollAction?: (visible: boolean) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onLogout, onEventClick, language, setLanguage, onScrollAction }) => {
  const [showEditPage, setShowEditPage] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCompletionExpanded, setIsCompletionExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);
  
  // Real Profile State
  const [userData, setUserData] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('Şehrin ritmini yakala 🕺'); // Default
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState('https://i.pravatar.cc/150?u=user');

  // Additional fields (simulated for now as User schema is simple)
  const [gender, setGender] = useState('Erkek');
  const [birthday, setBirthday] = useState('1998-05-12');
  const [interests, setInterests] = useState('Tekno, Jazz, Festival');
  
  // Social States
  const [instagram, setInstagram] = useState('@');
  const [tiktok, setTiktok] = useState('');
  const [twitter, setTwitter] = useState('');
  const [soundcloud, setSoundcloud] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.user.me();
        const user = res.data;
        setUserData(user);
        setName(user.name || user.email.split('@')[0]);
        setLocation(user.city || '');
        if (user.avatarUrl) setProfileImage(user.avatarUrl);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    if (!userData) return;
    try {
      await api.user.update({
        name,
        city: location,
        // API doesn't support other fields yet in simple schema, but UI preserves them in state
      });
      setShowEditPage(false);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  // Dynamic Completion Logic
  const completion = useMemo(() => {
    const fields = [name, bio, location, interests];
    const filledFields = fields.filter(field => field && field.trim().length > 0).length;
    const percentage = Math.round((filledFields / fields.length) * 100);
    return Math.min(percentage, 100);
  }, [name, bio, location, interests]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    // Smart scroll logic for both navigation and profile completion bar
    if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setIsCompletionExpanded(false);
      onScrollAction?.(false);
    } else {
      setIsCompletionExpanded(true);
      onScrollAction?.(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const labelClasses = "text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 ml-1 block";
  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-[20px] px-5 py-4 text-white font-bold focus:outline-none focus:border-primary/50 transition-all text-[15px] placeholder:text-white/10";

  if (showMenu) {
    return <Menu language={language} setLanguage={setLanguage} onBack={() => setShowMenu(false)} onLogout={onLogout} onEventClick={onEventClick} />;
  }

  if (!userData) {
    return <div className="flex items-center justify-center h-full text-white">Yükleniyor...</div>;
  }

  return (
    <div 
      className="flex-1 flex flex-col bg-black h-full animate-in fade-in slide-in-from-right-4 duration-500 font-display overflow-y-auto no-scrollbar pb-40"
      onScroll={handleScroll}
    >
      {showEditPage ? (
        <div className="fixed inset-0 z-[600] bg-black flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar pb-32">
          <header className="px-6 pt-14 pb-4 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur-xl z-20 border-b border-white/5">
            <button onClick={() => setShowEditPage(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform">
              <span className="material-icons-round">arrow_back</span>
            </button>
            <h2 className="text-lg font-black tracking-tighter uppercase">{language === 'TR' ? 'PROFİLİ DÜZENLE' : 'EDIT PROFILE'}</h2>
            <div className="w-10"></div>
          </header>

          <div className="px-6 space-y-8 pt-8">
             {/* Profile Image Edit */}
             <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-primary/20 p-1">
                    <img src={profileImage} className="w-full h-full object-cover rounded-[32px]" alt="" />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-11 h-11 bg-primary rounded-2xl border-4 border-black flex items-center justify-center text-black shadow-lg active:scale-90 transition-transform"
                  >
                    <span className="material-icons-round text-[22px]">camera_alt</span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setProfileImage(URL.createObjectURL(file));
                  }} />
                </div>
             </div>

             {/* Progress in Edit View */}
             <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] font-black text-white/60">{language === 'TR' ? 'Profil Tamamlama' : 'Profile Completion'}</span>
                  <span className="text-primary font-black text-[14px]">{completion}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary shadow-[0_0_10px_#00E676] transition-all duration-700" style={{ width: `${completion}%` }}></div>
                </div>
             </div>

             {/* Basic Info */}
             <div className="space-y-6">
                <div>
                    <label className={labelClasses}>{language === 'TR' ? 'İSİM' : 'NAME'}</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} placeholder="İsim" />
                </div>

                <div>
                    <label className={labelClasses}>{language === 'TR' ? 'BİO' : 'BIO'}</label>
                    <textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} className={`${inputClasses} resize-none`} placeholder="Şehrin ritmini yakala..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>{language === 'TR' ? 'CİNSİYET' : 'GENDER'}</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClasses}>
                      <option>Erkek</option>
                      <option>Kadın</option>
                      <option>Diğer</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>{language === 'TR' ? 'DOĞUM TARİHİ' : 'BIRTHDAY'}</label>
                    <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inputClasses} />
                  </div>
                </div>

                <div>
                    <label className={labelClasses}>{language === 'TR' ? 'KONUM' : 'LOCATION'}</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClasses} placeholder="Şehir" />
                </div>

                <div>
                    <label className={labelClasses}>{language === 'TR' ? 'İLGİ ALANLARI' : 'INTERESTS'}</label>
                    <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} className={inputClasses} placeholder="Müzik, Sanat..." />
                </div>

                {/* Social Media Grid */}
                <div className="pt-4 space-y-4">
                  <h3 className={labelClasses}>{language === 'TR' ? 'SOSYAL MEDYA' : 'SOCIAL MEDIA'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Instagram */}
                    <div className="bg-[#0F0F0F] border border-white/5 rounded-[32px] p-1.5 relative group transition-all duration-300 hover:border-white/10 focus-within:border-primary/50 focus-within:shadow-[0_0_30px_rgba(0,230,118,0.1)]">
                        <div className="h-full w-full bg-[#141414] rounded-[28px] p-4 flex flex-col items-center justify-center gap-3 overflow-hidden relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#E4405F] blur-[50px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-lg relative z-10 group-focus-within:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                value={instagram} 
                                onChange={(e) => setInstagram(e.target.value)}
                                className="w-full bg-transparent text-center text-white font-bold text-xs focus:outline-none placeholder:text-white/10 relative z-10"
                                placeholder="Instagram"
                            />
                        </div>
                    </div>

                    {/* TikTok */}
                    <div className="bg-[#0F0F0F] border border-white/5 rounded-[32px] p-1.5 relative group transition-all duration-300 hover:border-white/10 focus-within:border-primary/50 focus-within:shadow-[0_0_30px_rgba(0,230,118,0.1)]">
                        <div className="h-full w-full bg-[#141414] rounded-[28px] p-4 flex flex-col items-center justify-center gap-3 overflow-hidden relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#00f2ea] blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            
                            <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-lg relative z-10 group-focus-within:scale-110 transition-transform duration-300 border border-white/10">
                                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01V14.5c0 1.93-.77 3.66-2.12 4.96-1.35 1.3-3.15 2.1-5.11 2.1-1.96 0-3.76-.8-5.11-2.1-1.35-1.3-2.12-3.03-2.12-4.96 0-1.93.77-3.66 2.12-4.96C5.64 8.24 7.44 7.44 9.4 7.44c.4 0 .79.03 1.17.1v4.08c-.38-.06-.77-.09-1.17-.09-1.31 0-2.49.53-3.34 1.39-.85.86-1.38 2.04-1.38 3.35 0 1.31.53 2.49 1.38 3.35.85.86 2.03 1.39 3.34 1.39 1.31 0 2.49-.53 3.34-1.39.85-.86 1.38-2.04 1.38-3.35V.02z"/>
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                value={tiktok} 
                                onChange={(e) => setTiktok(e.target.value)}
                                className="w-full bg-transparent text-center text-white font-bold text-xs focus:outline-none placeholder:text-white/10 relative z-10"
                                placeholder="TikTok"
                            />
                        </div>
                    </div>

                    {/* Twitter (X) */}
                    <div className="bg-[#0F0F0F] border border-white/5 rounded-[32px] p-1.5 relative group transition-all duration-300 hover:border-white/10 focus-within:border-primary/50 focus-within:shadow-[0_0_30px_rgba(0,230,118,0.1)]">
                        <div className="h-full w-full bg-[#141414] rounded-[28px] p-4 flex flex-col items-center justify-center gap-3 overflow-hidden relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white blur-[50px] opacity-5 group-hover:opacity-10 transition-opacity"></div>
                            
                            <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-lg relative z-10 group-focus-within:scale-110 transition-transform duration-300 border border-white/10">
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                value={twitter} 
                                onChange={(e) => setTwitter(e.target.value)}
                                className="w-full bg-transparent text-center text-white font-bold text-xs focus:outline-none placeholder:text-white/10 relative z-10"
                                placeholder="Twitter (X)"
                            />
                        </div>
                    </div>

                    {/* SoundCloud */}
                    <div className="bg-[#0F0F0F] border border-white/5 rounded-[32px] p-1.5 relative group transition-all duration-300 hover:border-white/10 focus-within:border-primary/50 focus-within:shadow-[0_0_30px_rgba(0,230,118,0.1)]">
                        <div className="h-full w-full bg-[#141414] rounded-[28px] p-4 flex flex-col items-center justify-center gap-3 overflow-hidden relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#FF5500] blur-[50px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            
                            <div className="w-14 h-14 rounded-full bg-[#FF5500] flex items-center justify-center shadow-lg relative z-10 group-focus-within:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.56 8.87V17h-1.35V8.92c0-.28.1-.54.3-.73.2-.2.45-.3.73-.3.25 0 .5.08.7.26.2.18.3.43.3.72h-.68zm-9.85 5.56v2.58h1.36v-2.58zm1.69-1.56v5.7h1.35v-5.7zm1.7-1.32v8.34h1.34v-8.34zm1.7-.87v10.08h1.35V10.68zm1.69-1.2v12.48h1.35V9.48zm5.95 2.13c0-2.03-1.65-3.69-3.68-3.69-.15 0-.28 0-.42.02v9.06h4.1v-5.39z"/>
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                value={soundcloud} 
                                onChange={(e) => setSoundcloud(e.target.value)}
                                className="w-full bg-transparent text-center text-white font-bold text-xs focus:outline-none placeholder:text-white/10 relative z-10"
                                placeholder="SoundCloud"
                            />
                        </div>
                    </div>
                  </div>
                </div>
             </div>

             <button onClick={handleSave} className="w-full h-16 bg-primary rounded-[24px] flex items-center justify-center text-black font-black uppercase tracking-[0.25em] shadow-[0_10px_30px_rgba(0,230,118,0.2)] active:scale-95 transition-transform mt-10">
                {language === 'TR' ? 'KAYDET' : 'SAVE'}
             </button>
          </div>
        </div>
      ) : (
        <>
          <header className="px-6 pt-14 pb-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-20 border-b border-white/5">
            <div className="flex-1"></div>
            <button onClick={() => setShowMenu(true)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-transform">
              <span className="material-icons-round">more_vert</span>
            </button>
          </header>

          <div className="flex flex-col items-center px-6 pt-10 pb-8 text-center">
            <div className="w-28 h-28 rounded-[36px] overflow-hidden border-4 border-primary/20 p-1 shadow-[0_0_30px_rgba(0,230,118,0.2)]">
                <img src={profileImage} className="w-full h-full object-cover rounded-[28px]" alt={name} />
            </div>
            <h1 className="mt-6 text-3xl font-black text-white tracking-tighter">{name}</h1>
            <p className="text-white/40 font-bold text-[14px] mt-1 italic">"{bio}"</p>
          </div>

          <div className="grid grid-cols-2 gap-4 px-6 mb-10 text-center">
            <div className="bg-white/5 border border-white/10 rounded-[28px] py-6 shadow-xl">
              <span className="text-2xl font-black text-white">128</span>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1 block">{language === 'TR' ? 'ARKADAŞ' : 'FRIENDS'}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[28px] py-6 shadow-xl">
              <span className="text-2xl font-black text-white">56</span>
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1 block">{language === 'TR' ? 'TAKİP' : 'FOLLOWING'}</span>
            </div>
          </div>

          <div className="px-6 mb-8">
            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-6 space-y-4 shadow-2xl transition-all duration-500 overflow-hidden">
              <div 
                className={`transition-all duration-700 ease-in-out overflow-hidden ${isCompletionExpanded ? 'max-h-[100px] opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}
              >
                {completion < 100 && (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-[14px] font-black text-white">{language === 'TR' ? 'Profilini Tamamla' : 'Complete Your Profile'}</h3>
                      <span className="text-primary text-[12px] font-black">{completion}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary shadow-[0_0_10px_#00E676] transition-all duration-1000" 
                        style={{ width: `${completion}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={() => setShowEditPage(true)} 
                className="w-full py-4 bg-white/[0.04] border border-white/10 rounded-3xl text-[13px] font-black uppercase tracking-widest hover:bg-white/[0.08] active:scale-95 transition-all"
              >
                {language === 'TR' ? 'PROFİLİ DÜZENLE' : 'EDIT PROFILE'}
              </button>
            </div>
          </div>

          <div className="px-6 mb-10">
            <div className="flex justify-between items-center mb-6 px-1">
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white mt-1">iWent</span>
              </div>
            </div>
            {/* Placeholder for ticket history, as user object is simple currently */}
            <div className="space-y-5">
               <div className="text-center text-white/30 text-sm py-4">Henüz bilet geçmişi yok</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
