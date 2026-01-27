import React, { useState } from 'react';
import { Language } from '../App';

interface MenuProps {
  onBack: () => void;
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onEventClick?: (event: any) => void;
}

type SubView = 'main' | 'tickets' | 'favorites' | 'settings' | 'faq' | 'about' | 'support' | 'blocked' | 'reviews' | 'social';

export const Menu: React.FC<MenuProps> = ({ onBack, onLogout, language, setLanguage, onEventClick }) => {
  const [subView, setSubView] = useState<SubView>('main');
  
  // Settings States
  const [settings, setSettings] = useState({
    notifications: true,
    privateProfile: false,
    location: true,
    messaging: true,
    marketing: true
  });

  // Social States
  const [socials, setSocials] = useState({
    spotify: true,
    instagram: true,
    twitter: false
  });

  const MENU_GROUPS = [
    {
      items: [
        { id: 'tickets', label: language === 'TR' ? 'Biletlerim' : 'My Tickets', icon: 'confirmation_number', view: 'tickets' as SubView },
        { id: 'favorites', label: language === 'TR' ? 'Favori Etkinliklerim' : 'Favorite Events', icon: 'calendar_today', view: 'favorites' as SubView },
        { id: 'reviews', label: language === 'TR' ? 'Değerlendirmelerim' : 'My Reviews', icon: 'star_outline', view: 'reviews' as SubView },
        { id: 'blocked', label: language === 'TR' ? 'Engelli Profiller' : 'Blocked Profiles', icon: 'shield', view: 'blocked' as SubView },
      ]
    },
    {
      items: [
        { id: 'settings', label: language === 'TR' ? 'Ayarlar' : 'Settings', icon: 'settings', view: 'settings' as SubView },
        { id: 'social', label: language === 'TR' ? 'Sosyal Medya Entegrasyonları' : 'Social Media Integrations', icon: 'share', view: 'social' as SubView },
      ]
    },
    {
      items: [
        { id: 'faq', label: language === 'TR' ? 'Sıkça Sorulan Sorular' : 'FAQ', icon: 'help_outline', view: 'faq' as SubView },
        { id: 'about', label: language === 'TR' ? 'App Hakkında' : 'About App', icon: 'info_outline', view: 'about' as SubView },
        { id: 'support', label: language === 'TR' ? 'Destek' : 'Support', icon: 'headset_mic', view: 'support' as SubView },
      ]
    }
  ];

  // Mock data for tickets with full event details
  const TICKET_EVENTS = [
    {
      id: 901,
      title: 'Neon Pulse Concert',
      date: '15 Haz 2024 • 20:00',
      location: 'Volkswagen Arena',
      price: '₺450',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
      category: 'Konser'
    },
    {
      id: 902,
      title: 'Jazz Night',
      date: '15 Haz 2024 • 20:00',
      location: 'Nardis Jazz Club',
      price: '₺400',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
      category: 'Müzik'
    }
  ];

  const REVIEWS = [
    {
      id: 1,
      event: 'Neon Pulse Concert',
      rating: 5,
      comment: language === 'TR' ? 'İnanılmaz bir atmosferdi! Işık şovları ve ses sistemi muazzamdı.' : 'Amazing atmosphere! Light shows and sound system were magnificent.',
      date: '16 Haz 2024',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200'
    },
    {
      id: 2,
      event: 'Jazz Night',
      rating: 4,
      comment: language === 'TR' ? 'Müzikler çok kaliteliydi fakat içerisi biraz fazla kalabalıktı.' : 'Music quality was great but it was a bit too crowded inside.',
      date: '16 Haz 2024',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200'
    }
  ];

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={`material-icons-round text-[16px] ${i < rating ? 'text-primary' : 'text-white/20'}`}>
        star
      </span>
    ));
  };

  const renderSubView = () => {
    switch (subView) {
      case 'blocked':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            {[
              { id: 1, name: 'Murat Kara', avatar: 'https://i.pravatar.cc/150?u=murat' },
              { id: 2, name: 'Selin Yıldız', avatar: 'https://i.pravatar.cc/150?u=selin' },
              { id: 3, name: 'Ahmet Yılmaz', avatar: 'https://i.pravatar.cc/150?u=ahmet' }
            ].map(user => (
              <div key={user.id} className="bg-white/5 border border-white/10 rounded-[28px] p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10">
                    <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                  </div>
                  <span className="font-bold text-white/80">{user.name}</span>
                </div>
                <button className="px-4 py-2 bg-red-500/10 text-red-500 text-[11px] font-black rounded-xl border border-red-500/20 active:scale-95 transition-all uppercase tracking-widest">
                  {language === 'TR' ? 'Engeli Kaldır' : 'Unblock'}
                </button>
              </div>
            ))}
          </div>
        );
      case 'tickets':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            {TICKET_EVENTS.map(event => (
              <div 
                key={event.id} 
                onClick={() => onEventClick?.(event)}
                className="bg-white/5 border border-white/10 rounded-[28px] p-5 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all hover:bg-white/10"
              >
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <span className="material-icons-round text-3xl">qr_code_2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate">{event.title}</h4>
                  <p className="text-xs text-white/40 font-medium">{event.date}</p>
                </div>
                <span className="material-icons-round text-white/20">chevron_right</span>
              </div>
            ))}
          </div>
        );
      case 'favorites':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-[28px] overflow-hidden">
              <img src="https://images.unsplash.com/photo-1514525253344-f81f3c749b1a?auto=format&fit=crop&q=80&w=400" className="w-full h-32 object-cover opacity-60" alt="" />
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">Symphony Under Stars</h4>
                  <p className="text-xs text-primary font-black uppercase tracking-widest">Klasik</p>
                </div>
                <button className="text-red-500"><span className="material-icons-round">favorite</span></button>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            {[
              { id: 'notifications', label: language === 'TR' ? 'Bildirimler' : 'Notifications' },
              { id: 'privateProfile', label: language === 'TR' ? 'Gizli Profil' : 'Private Profile' },
              { id: 'location', label: language === 'TR' ? 'Konum Servisleri' : 'Location Services' },
              { id: 'messaging', label: language === 'TR' ? 'Mesajlaşma İzinleri' : 'Messaging Permissions' },
              { id: 'marketing', label: language === 'TR' ? 'Pazarlama İletileri' : 'Marketing Communications' }
            ].map((item, idx) => {
              const isActive = settings[item.id as keyof typeof settings];
              return (
                <div 
                  key={idx} 
                  onClick={() => setSettings(prev => ({...prev, [item.id]: !isActive}))}
                  className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex items-center justify-between cursor-pointer active:bg-white/[0.08] transition-colors"
                >
                  <span className="font-bold text-white/80">{item.label}</span>
                  <button className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${isActive ? 'bg-primary' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              );
            })}
          </div>
        );
      case 'reviews':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
             {REVIEWS.map(review => (
               <div key={review.id} className="bg-white/5 border border-white/10 rounded-[28px] p-5">
                 <div className="flex items-start gap-4 mb-4">
                   <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                     <img src={review.image} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-white truncate">{review.event}</h4>
                     <div className="flex items-center gap-1 mt-1">
                       {renderStars(review.rating)}
                     </div>
                   </div>
                   <span className="text-[10px] font-bold text-white/30">{review.date}</span>
                 </div>
                 <p className="text-white/60 text-sm leading-relaxed font-medium">
                   "{review.comment}"
                 </p>
               </div>
             ))}
          </div>
        );
      case 'social':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            {[
              { id: 'spotify', label: 'Spotify', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg', color: '#1DB954' },
              { id: 'instagram', label: 'Instagram', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg', color: '#E4405F' },
              { id: 'twitter', label: 'Twitter (X)', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg', color: '#FFFFFF' }
            ].map((platform) => {
              const isConnected = socials[platform.id as keyof typeof socials];
              return (
                <div key={platform.id} className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white p-2 flex items-center justify-center">
                      <img src={platform.icon} className="w-full h-full object-contain" alt={platform.label} />
                    </div>
                    <span className="font-bold text-white/80">{platform.label}</span>
                  </div>
                  
                  <button 
                    onClick={() => setSocials(prev => ({...prev, [platform.id]: !isConnected}))}
                    className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      isConnected 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    {isConnected ? (language === 'TR' ? 'BAĞLI' : 'CONNECTED') : (language === 'TR' ? 'BAĞLA' : 'CONNECT')}
                  </button>
                </div>
              );
            })}
          </div>
        );
      case 'faq':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            {[
              { q: 'Biletimi nasıl iptal ederim?', a: 'Etkinlikten 24 saat öncesine kadar biletlerinizi Destek bölümünden iptal edebilirsiniz.' },
              { q: 'Ödeme yöntemleri nelerdir?', a: 'Tüm kredi kartları ve Apple/Google Pay ile ödeme yapabilirsiniz.' }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-[24px] p-6">
                <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-white/40 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        );
      case 'about':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center py-10">
            <h3 className="text-4xl font-black text-primary mb-2">iWENT</h3>
            <p className="text-white/40 font-bold mb-8">Version 2.4.0 (Build 892)</p>
            <div className="w-full bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-4 text-center">
              <p className="text-white/60 leading-relaxed font-medium">
                iWent, şehirdeki en iyi etkinlikleri keşfetmeniz ve sosyalleşmeniz için tasarlanmış bir deneyim platformudur.
              </p>
              <div className="pt-4 flex justify-center gap-6">
                 <span className="text-primary text-xs font-black border-b border-primary/30 pb-1 cursor-pointer">Kullanım Koşulları</span>
                 <span className="text-primary text-xs font-black border-b border-primary/30 pb-1 cursor-pointer">Gizlilik Politikası</span>
              </div>
            </div>
          </div>
        );
      case 'support':
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
             <div className="bg-primary/10 border border-primary/20 rounded-[32px] p-8 text-center">
                <span className="material-icons-round text-primary text-5xl mb-4">headset_mic</span>
                <h4 className="text-xl font-black text-white mb-2">Canlı Destek</h4>
                <p className="text-sm text-white/50 mb-6">Müşteri temsilcilerimiz size yardımcı olmak için hazır.</p>
                <button className="w-full py-4 bg-primary text-black font-black rounded-2xl">SOHBETİ BAŞLAT</button>
             </div>
             <div className="space-y-4">
                <h4 className="text-xs font-black text-white/20 uppercase tracking-widest ml-4">BİZE ULAŞIN</h4>
                <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex items-center gap-4">
                   <span className="material-icons-round text-white/30">mail_outline</span>
                   <span className="font-bold text-white/80">support@iwent.com</span>
                </div>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleBack = () => {
    if (subView === 'main') {
      onBack();
    } else {
      setSubView('main');
    }
  };

  const getTitle = () => {
    if (subView === 'main') return language === 'TR' ? 'Menü' : 'Menu';
    const item = MENU_GROUPS.flatMap(g => g.items).find(i => i.view === subView);
    return item?.label || (language === 'TR' ? 'Detay' : 'Detail');
  };

  return (
    <div className="fixed inset-0 z-[700] bg-black flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto no-scrollbar pb-12 font-display">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur-xl z-20">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white transition-all active:scale-90"
        >
          <span className="material-icons-round">chevron_left</span>
        </button>
        <h2 className="text-xl font-black tracking-tight text-white">{getTitle()}</h2>
        <div className="w-10"></div>
      </header>

      <div className="px-6 mt-4">
        {subView === 'main' ? (
          <>
            {/* Language Selection */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-[24px] p-4 flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="material-icons-round text-white/40">language</span>
                <span className="font-bold text-white/90">{language === 'TR' ? 'Dil Seçimi' : 'Language'}</span>
              </div>
              <div className="bg-black p-1 rounded-xl flex">
                <button 
                  onClick={() => setLanguage('TR')}
                  className={`px-5 py-2 rounded-lg text-[13px] font-black transition-all ${language === 'TR' ? 'bg-primary text-black' : 'text-white/40'}`}
                >
                  TR
                </button>
                <button 
                  onClick={() => setLanguage('EN')}
                  className={`px-5 py-2 rounded-lg text-[13px] font-black transition-all ${language === 'EN' ? 'bg-primary text-black' : 'text-white/40'}`}
                >
                  ENG
                </button>
              </div>
            </div>

            {/* Menu Groups */}
            {MENU_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="bg-white/[0.03] border border-white/[0.08] rounded-[24px] overflow-hidden mb-4">
                {group.items.map((item) => (
                  <div key={item.id} onClick={() => setSubView(item.view)} className="flex items-center justify-between p-5 active:bg-white/[0.05] transition-colors group cursor-pointer border-b border-white/[0.03] last:border-0">
                    <div className="flex items-center gap-4">
                      <span className="material-icons-round text-white/40 text-[22px]">{item.icon}</span>
                      <span className="font-bold text-white/80">{item.label}</span>
                    </div>
                    <span className="material-icons-round text-white/10 group-active:text-primary transition-colors">chevron_right</span>
                  </div>
                ))}
              </div>
            ))}

            {/* Logout Section */}
            <div 
              onClick={onLogout}
              className="bg-white/[0.03] border border-white/[0.08] rounded-[24px] p-5 flex items-center gap-4 cursor-pointer active:bg-red-500/10 transition-colors group mt-4"
            >
              <span className="material-icons-round text-red-500">logout</span>
              <span className="font-black text-red-500 uppercase tracking-widest text-sm">{language === 'TR' ? 'Çıkış Yap' : 'Logout'}</span>
            </div>
          </>
        ) : (
          renderSubView()
        )}
      </div>
    </div>
  );
};
