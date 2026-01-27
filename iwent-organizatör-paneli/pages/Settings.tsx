import React, { useState } from 'react';
import { User, Building, CreditCard, Bell, Lock, Save, Camera, Globe, Facebook, Instagram, Twitter, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'organization', label: 'Organizasyon', icon: Building },
    { id: 'payment', label: 'Ödeme & Finans', icon: CreditCard },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'security', label: 'Güvenlik', icon: Lock },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500 mt-1">Hesap, organizasyon ve tercihlerinizi buradan yönetin.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'profile' && <ProfileSettings onSave={handleSave} isLoading={isLoading} />}
            {activeTab === 'organization' && <OrganizationSettings onSave={handleSave} isLoading={isLoading} />}
            {activeTab === 'payment' && <PaymentSettings onSave={handleSave} isLoading={isLoading} />}
            {activeTab === 'notifications' && <NotificationSettings onSave={handleSave} isLoading={isLoading} />}
            {activeTab === 'security' && <SecuritySettings onSave={handleSave} isLoading={isLoading} />}
            </div>
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  onSave: () => void;
  isLoading: boolean;
}

const ProfileSettings: React.FC<SectionProps> = ({ onSave, isLoading }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
            <h2 className="text-lg font-bold text-slate-900">Profil Bilgileri</h2>
            <p className="text-sm text-slate-500">Kişisel bilgilerinizi güncelleyin.</p>
        </div>
        <button 
            onClick={onSave}
            disabled={isLoading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
            {isLoading ? 'Kaydediliyor...' : <><Save size={16} /> Değişiklikleri Kaydet</>}
        </button>
    </div>

    <div className="flex items-center gap-6">
      <div className="relative group cursor-pointer">
        <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-sm overflow-hidden">
            <div className="w-full h-full bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                EY
            </div>
        </div>
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="text-white" size={24} />
        </div>
      </div>
      <div>
        <h3 className="font-medium text-slate-900">Profil Fotoğrafı</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">PNG, JPG veya GIF. Maksimum 2MB.</p>
        <div className="flex gap-3 mt-3">
            <button className="text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-200 bg-brand-50 px-3 py-1.5 rounded-md transition-colors">Yükle</button>
            <button className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">Kaldır</button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Ad</label>
        <input type="text" defaultValue="Emre" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Soyad</label>
        <input type="text" defaultValue="Yılmaz" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">E-posta</label>
        <input type="email" defaultValue="emre@iwent.com" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Telefon</label>
        <input type="tel" defaultValue="+90 555 123 45 67" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
      </div>
      <div className="md:col-span-2 space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Biyografi</label>
        <textarea rows={3} defaultValue="Deneyimli etkinlik organizatörü. Müzik festivalleri ve teknoloji konferansları üzerine uzmanlaşmış." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none" />
        <p className="text-xs text-slate-400 text-right">0/160</p>
      </div>
    </div>
  </div>
);

const OrganizationSettings: React.FC<SectionProps> = ({ onSave, isLoading }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
            <h2 className="text-lg font-bold text-slate-900">Organizasyon Profili</h2>
            <p className="text-sm text-slate-500">Etkinlik sayfasında görünecek bilgiler.</p>
        </div>
        <button 
            onClick={onSave}
            disabled={isLoading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
            {isLoading ? 'Kaydediliyor...' : <><Save size={16} /> Değişiklikleri Kaydet</>}
        </button>
    </div>

    <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Organizasyon Adı</label>
        <input type="text" defaultValue="iWent Events" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
    </div>

    <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Hakkında</label>
        <textarea rows={4} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" placeholder="Organizasyonunuz hakkında kısa bir açıklama..." />
    </div>

    <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Web Sitesi</label>
        <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="url" placeholder="https://..." className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
        </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Facebook</label>
            <div className="relative">
                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="kullaniciadi" className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
            </div>
        </div>
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Instagram</label>
            <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="kullaniciadi" className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
            </div>
        </div>
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Twitter / X</label>
            <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="kullaniciadi" className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
            </div>
        </div>
    </div>
  </div>
);

const PaymentSettings: React.FC<SectionProps> = ({ onSave, isLoading }) => (
  <div className="space-y-6">
     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
            <h2 className="text-lg font-bold text-slate-900">Fatura & Ödeme</h2>
            <p className="text-sm text-slate-500">Hakediş ödemeleri için banka ve vergi bilgileri.</p>
        </div>
        <button 
            onClick={onSave}
            disabled={isLoading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
            {isLoading ? 'Kaydediliyor...' : <><Save size={16} /> Değişiklikleri Kaydet</>}
        </button>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800">
        <AlertCircle size={20} className="flex-shrink-0" />
        <p className="text-sm">Ödeme alabilmek için vergi bilgilerinizi ve IBAN adresinizi eksiksiz doldurmanız gerekmektedir. Bilgilerin doğrulanması 1-3 iş günü sürebilir.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Resmi Şirket Unvanı</label>
            <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
        </div>
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Vergi Dairesi</label>
            <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
        </div>
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Vergi Numarası / TCKN</label>
            <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
        </div>
    </div>

    <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">IBAN</label>
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">TR</div>
            <input type="text" placeholder="00 0000 0000 0000 0000 0000 00" className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono" />
        </div>
    </div>
  </div>
);

const NotificationSettings: React.FC<SectionProps> = ({ onSave, isLoading }) => (
  <div className="space-y-6">
     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
            <h2 className="text-lg font-bold text-slate-900">Bildirim Tercihleri</h2>
            <p className="text-sm text-slate-500">Hangi konularda bildirim almak istediğinizi seçin.</p>
        </div>
        <button 
            onClick={onSave}
            disabled={isLoading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
            {isLoading ? 'Kaydediliyor...' : <><Save size={16} /> Değişiklikleri Kaydet</>}
        </button>
    </div>

    <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 pt-2">E-posta Bildirimleri</h3>
        <div className="space-y-3">
            {[
                { label: 'Yeni bilet satışı olduğunda', desc: 'Her satışta anlık e-posta al.' },
                { label: 'Günlük özet raporu', desc: 'Her sabah önceki günün özetini al.' },
                { label: 'Etkinlik onayı ve durum güncellemeleri', desc: 'Etkinliklerin durumu değiştiğinde haberdar ol.' },
                { label: 'Kampanya ve duyurular', desc: 'iWent platformundaki yeniliklerden haberdar ol.' }
            ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                    <input type="checkbox" id={`notif-${idx}`} defaultChecked className="mt-1 w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer" />
                    <label htmlFor={`notif-${idx}`} className="cursor-pointer">
                        <div className="text-sm font-medium text-slate-700">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                    </label>
                </div>
            ))}
        </div>
    </div>
  </div>
);

const SecuritySettings: React.FC<SectionProps> = ({ onSave, isLoading }) => (
  <div className="space-y-6">
     <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
            <h2 className="text-lg font-bold text-slate-900">Şifre & Güvenlik</h2>
            <p className="text-sm text-slate-500">Hesap güvenliğinizi sağlayın.</p>
        </div>
        <button 
            onClick={onSave}
            disabled={isLoading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
            {isLoading ? 'Kaydediliyor...' : <><Save size={16} /> Şifreyi Güncelle</>}
        </button>
    </div>

    <div className="max-w-md space-y-4">
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Mevcut Şifre</label>
            <input type="password" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
        </div>
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Yeni Şifre</label>
            <input type="password" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
        </div>
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Yeni Şifre (Tekrar)</label>
            <input type="password" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
        </div>
    </div>

    <div className="border-t border-slate-100 pt-6 mt-6">
        <h3 className="text-sm font-bold text-red-600 mb-2">Tehlikeli Bölge</h3>
        <p className="text-sm text-slate-600 mb-4">Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir ve geri getirilemez.</p>
        <button className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Hesabımı Sil
        </button>
    </div>
  </div>
);

export default Settings;