
import React, { useState } from 'react';

interface PaymentProps {
  totalAmount: number;
  ticketCount: number;
  eventImage?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const Payment: React.FC<PaymentProps> = ({ totalAmount, ticketCount, eventImage, onBack, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('success');
    }, 2500);
  };

  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-[20px] px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300";
  const labelClasses = "text-[11px] font-black text-white/40 uppercase tracking-[0.15em] mb-2 ml-1 block";

  if (paymentStep === 'success') {
    return (
      <div className="fixed inset-0 z-[1300] bg-black flex flex-col animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
        <header className="px-6 pt-14 pb-6 flex items-center justify-center">
           <h2 className="text-xl font-black tracking-tight text-primary">İşlem Başarılı!</h2>
        </header>

        <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-12">
          {/* Virtual Ticket Card */}
          <div className="w-full max-w-sm relative group">
            <div className="bg-[#1a1a1a] rounded-t-[32px] border-x border-t border-white/10 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-icons-round text-8xl -rotate-12">confirmation_number</span>
              </div>
              
              <div className="relative z-10">
                <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full inline-block mb-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">ONAYLANDI</span>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 leading-tight">Electronic Night: Neon Pulse</h3>
                <div className="space-y-4 mt-6">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">TARİH</p>
                      <p className="font-bold text-white">15 Haz, 2024</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">SAAT</p>
                      <p className="font-bold text-white">20:00</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">KONUM</p>
                    <p className="font-bold text-white">Volkswagen Arena</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-6 bg-[#1a1a1a] flex items-center border-x border-white/10">
              <div className="absolute left-[-12px] w-6 h-6 bg-black rounded-full border-r border-white/10"></div>
              <div className="flex-1 border-b border-dashed border-white/20 mx-4"></div>
              <div className="absolute right-[-12px] w-6 h-6 bg-black rounded-full border-l border-white/10"></div>
            </div>

            <div className="bg-[#1a1a1a] rounded-b-[32px] border-x border-b border-white/10 p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(0,230,118,0.2)] mb-6 transition-transform group-hover:scale-105 duration-500">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=iWENT-TICKET-45892" 
                  alt="Ticket QR Code" 
                  className="w-32 h-32 grayscale contrast-125"
                />
              </div>
              <p className="text-[12px] font-black text-white/20 tracking-[0.4em] uppercase">IWENT-TICKET-45892</p>
              <div className="mt-6 text-center">
                <p className="text-sm font-bold text-white/60">{ticketCount} Adet Bilet</p>
              </div>
            </div>
          </div>

          <div className="mt-12 w-full max-w-sm space-y-4">
            <button className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white font-black hover:bg-white/10 transition-all">
              <span className="material-icons-round">download</span>
              Bileti Cihazıma Kaydet
            </button>
            <button 
              onClick={onSuccess}
              className="w-full h-16 bg-primary rounded-2xl flex items-center justify-center gap-3 text-black font-black shadow-[0_10px_30px_rgba(0,230,118,0.3)] hover:scale-[0.98] transition-all"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1200] bg-black flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto no-scrollbar">
      {/* Background Blur Image */}
      {eventImage && (
        <div className="absolute inset-0 z-0">
          <img src={eventImage} className="w-full h-full object-cover opacity-40 blur-2xl grayscale brightness-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black"></div>
        </div>
      )}

      <header className="px-6 pt-14 pb-6 flex items-center sticky top-0 bg-black/40 backdrop-blur-xl z-[1210] border-b border-white/5">
        <button onClick={onBack} className="text-white hover:text-primary transition-colors">
          <span className="material-icons-round text-3xl">arrow_back</span>
        </button>
        <div className="flex-1 text-center mr-8">
           <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">GÜVENLİ ÖDEME</p>
           <h2 className="text-lg font-black tracking-tight">Ödeme Bilgileri</h2>
        </div>
      </header>

      <div className="flex-1 px-6 space-y-8 pt-10 pb-40 relative z-10">
        {/* Payment Methods */}
        <div className="space-y-4">
          <label className={labelClasses}>ÖDEME YÖNTEMİ SEÇ</label>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setPaymentMethod('card')}
              className={`h-24 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'card' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(0,230,118,0.3)]' : 'bg-white/5 border-white/5 text-white/30'}`}
            >
              <span className="material-icons-round text-[28px]">credit_card</span>
              <span className="text-[10px] font-black tracking-wider">KART</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('apple')}
              className={`h-24 rounded-2xl border flex items-center justify-center transition-all ${paymentMethod === 'apple' ? 'bg-white/20 border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/5 text-white/30'}`}
            >
              <span className="material-icons-round text-[48px]">apple</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('google')}
              className={`h-24 rounded-2xl border flex items-center justify-center transition-all ${paymentMethod === 'google' ? 'bg-white/20 border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/5 text-white/30'}`}
            >
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Card Form */}
        <div className={`space-y-6 transition-all duration-500 relative ${paymentMethod === 'card' ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
          <div className="absolute top-0 right-0 z-20">
             <div className="bg-primary/20 backdrop-blur-md border border-primary/40 px-3 py-1.5 rounded-xl">
                <span className="text-primary font-black text-sm">₺{totalAmount}</span>
             </div>
          </div>

          <div>
            <label className={labelClasses}>KART ÜZERİNDEKİ İSİM</label>
            <input type="text" placeholder="CAN YILMAZ" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>KART NUMARASI</label>
            <div className="relative">
              <input type="text" placeholder="0000 0000 0000 0000" className={inputClasses} />
              <span className="material-icons-round absolute right-5 top-1/2 -translate-y-1/2 text-white/30">credit_card</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>S.K.T.</label>
              <input type="text" placeholder="08/26" className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>CVV</label>
              <div className="relative">
                <input type="password" placeholder="***" className={inputClasses} />
                <span className="material-icons-round absolute right-5 top-1/2 -translate-y-1/2 text-white/30">lock_outline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="flex items-start gap-4 p-6 rounded-[28px] bg-white/[0.03] border border-white/5 backdrop-blur-md">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
             <span className="material-icons-round text-primary text-xl">verified_user</span>
          </div>
          <p className="text-[12px] text-white/50 leading-relaxed font-medium">
            Ödemeniz 256-bit SSL sertifikası ile korunmaktadır. Kart bilgileriniz asla sunucularımızda saklanmaz.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black to-transparent z-[1250]">
        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full h-20 rounded-[28px] flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(0,230,118,0.4)] group overflow-hidden relative active:scale-95 transition-all ${isProcessing ? 'bg-primary/50 cursor-wait' : 'bg-primary'}`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
              <span className="text-black font-black text-xl">İşleniyor...</span>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="text-black font-black text-xl relative z-10">Ödemeyi Tamamla</span>
              <span className="material-icons-round text-black relative z-10 group-hover:translate-x-1 transition-transform">lock</span>
              <div className="absolute inset-0 bg-primary animate-pulse opacity-20 group-hover:opacity-40 transition-opacity"></div>
            </>
          )}
        </button>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1300] flex items-center justify-center animate-in fade-in duration-300">
           <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(0,230,118,0.6)] animate-bounce">
              <span className="material-icons-round text-black text-5xl">check</span>
           </div>
        </div>
      )}
    </div>
  );
};
