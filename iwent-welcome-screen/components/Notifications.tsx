
import React from 'react';
import { Language } from '../App';

interface NotificationsProps {
  onBack: () => void;
  language: Language;
}

type NotificationType = 'friend_request' | 'friend_accepted' | 'event_suggestion' | 'new_group' | 'account_update';

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  avatar?: string;
  image?: string;
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack, language }) => {
  const MOCK_NOTIFICATIONS: NotificationItem[] = [
    {
      id: 1,
      type: 'friend_request',
      title: language === 'TR' ? 'Arkadaşlık İsteği' : 'Friend Request',
      description: language === 'TR' ? 'Melis Aksoy sana arkadaşlık isteği gönderdi.' : 'Melis Aksoy sent you a friend request.',
      time: '2dk',
      unread: true,
      avatar: 'https://i.pravatar.cc/150?u=melis'
    },
    {
      id: 2,
      type: 'new_group',
      title: language === 'TR' ? 'Yeni Grup Açıldı' : 'New Group Created',
      description: language === 'TR' ? 'Bilet aldığın "Neon Pulse" etkinliği için "Vip Tayfa" grubu kuruldu!' : 'A new group "Vip Tayfa" has been created for the "Neon Pulse" event you have tickets for!',
      time: '15dk',
      unread: true,
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=100'
    },
    {
      id: 3,
      type: 'friend_accepted',
      title: language === 'TR' ? 'İstek Kabul Edildi' : 'Request Accepted',
      description: language === 'TR' ? 'Emre Yıldız arkadaşlık isteğini kabul etti.' : 'Emre Yıldız accepted your friend request.',
      time: '1sa',
      unread: false,
      avatar: 'https://i.pravatar.cc/150?u=emre'
    },
    {
      id: 4,
      type: 'event_suggestion',
      title: language === 'TR' ? 'Senin İçin Seçtik' : 'Suggested for You',
      description: language === 'TR' ? 'Tarzına uygun yeni bir konser var: "Techno Sunday".' : 'There is a new concert that fits your style: "Techno Sunday".',
      time: '3sa',
      unread: false,
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=100'
    },
    {
      id: 5,
      type: 'account_update',
      title: language === 'TR' ? 'Yeni Etkinlik' : 'New Event',
      description: language === 'TR' ? 'Takip ettiğin "Zorlu PSM" 3 yeni etkinlik duyurdu.' : 'Following "Zorlu PSM" announced 3 new events.',
      time: '5sa',
      unread: false,
      avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=100'
    }
  ];

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return 'person_add';
      case 'event_suggestion':
        return 'auto_awesome';
      case 'new_group':
        return 'groups';
      case 'account_update':
        return 'notifications_active';
      default:
        return 'notifications';
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'friend_request': return 'bg-blue-500/20 text-blue-400';
      case 'event_suggestion': return 'bg-primary/20 text-primary';
      case 'new_group': return 'bg-purple-500/20 text-purple-400';
      case 'account_update': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-white/10 text-white/40';
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 font-display">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur-xl z-20 border-b border-white/5">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white transition-all active:scale-90"
        >
          <span className="material-icons-round">chevron_left</span>
        </button>
        <h2 className="text-xl font-black tracking-tight text-white">{language === 'TR' ? 'Bildirimler' : 'Notifications'}</h2>
        <button className="text-[12px] font-black text-primary uppercase tracking-widest px-3 py-1 bg-primary/10 rounded-lg">
          {language === 'TR' ? 'TEMİZLE' : 'CLEAR'}
        </button>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4 pb-20">
        {MOCK_NOTIFICATIONS.map((notif) => (
          <div 
            key={notif.id} 
            className={`relative p-5 rounded-[32px] border transition-all duration-300 active:scale-[0.98] cursor-pointer ${
              notif.unread ? 'bg-white/[0.08] border-white/10' : 'bg-white/[0.03] border-white/5'
            }`}
          >
            {/* Unread Dot */}
            {notif.unread && (
              <div className="absolute top-5 right-5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#00E676]"></div>
            )}

            <div className="flex gap-4">
              {/* Icon/Avatar Container */}
              <div className="shrink-0">
                {notif.avatar || notif.image ? (
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
                    <img src={notif.avatar || notif.image} className="w-full h-full object-cover" alt="" />
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getIconBg(notif.type)}`}>
                    <span className="material-icons-round text-2xl">{getIcon(notif.type)}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-[15px] font-black text-white tracking-tight">{notif.title}</h4>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">• {notif.time}</span>
                </div>
                <p className="text-[14px] text-white/60 font-medium leading-relaxed line-clamp-2">
                  {notif.description}
                </p>

                {/* Actions for Friend Request */}
                {notif.type === 'friend_request' && (
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 py-2.5 bg-primary rounded-xl text-black font-black text-[12px] uppercase tracking-wider active:scale-95 transition-transform">
                      {language === 'TR' ? 'KABUL ET' : 'ACCEPT'}
                    </button>
                    <button className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 font-black text-[12px] uppercase tracking-wider active:scale-95 transition-transform">
                      {language === 'TR' ? 'SİL' : 'DELETE'}
                    </button>
                  </div>
                )}

                {/* Action for Group/Event */}
                {(notif.type === 'new_group' || notif.type === 'event_suggestion') && (
                  <button className="mt-4 px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2 w-fit">
                    {language === 'TR' ? 'İNCELE' : 'VIEW'}
                    <span className="material-icons-round text-[16px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty State Mock */}
        <div className="pt-10 flex flex-col items-center opacity-10">
          <span className="material-icons-round text-6xl mb-2">notifications_none</span>
          <p className="font-black text-sm uppercase tracking-[0.4em]">{language === 'TR' ? 'BAŞKA BİLDİRİM YOK' : 'NO MORE NOTIFICATIONS'}</p>
        </div>
      </div>
    </div>
  );
};
