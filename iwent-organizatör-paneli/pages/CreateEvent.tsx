import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, Image as ImageIcon, Ticket, 
  Video, Plus, Trash2, Eye, Save, Send, AlertCircle, Info, CheckCircle2,
  ExternalLink, Sparkles, Wand2, Loader2, RefreshCw, Undo2, Check, BarChart3,
  Instagram, Layout, Smartphone, Monitor, Palette, Layers, Download, Maximize2, Aperture, Type, PlayCircle
} from 'lucide-react';
import { useEvents } from '../context/EventContext';
import { EventStatus, Event } from '../types';
import { GoogleGenAI } from "@google/genai";

type Step = 'info' | 'media' | 'tickets' | 'preview';
type AiTone = 'energetic' | 'elegant' | 'minimal' | 'emotional';
type AiLength = 'short' | 'medium' | 'long';

// Visual Gen Types
type VisualMode = 'poster' | 'instagram';
type InstaFormat = 'feed_square' | 'feed_portrait' | 'story';
type VisualStyle = 'minimal' | 'dark' | 'neon' | 'elegant' | 'experimental';

interface TicketTypeData {
  id: string;
  name: string;
  price: number;
  quota: number;
  description: string;
  sold: number;
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { addEvent } = useEvents();
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    location: '',
    description: '',
    imageUrl: '',
    videoUrl: '',
    tickets: [] as TicketTypeData[]
  });

  // AI Visual Generation State
  const [visualMode, setVisualMode] = useState<VisualMode>('poster');
  const [instaFormat, setInstaFormat] = useState<InstaFormat>('feed_square');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('neon');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedVisuals, setGeneratedVisuals] = useState<string[]>([]);
  const [selectedVisualIdx, setSelectedVisualIdx] = useState(0);
  const [isBrandSafe, setIsBrandSafe] = useState(true);

  // AI Text Generation State
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiTone, setAiTone] = useState<AiTone>('energetic');
  const [aiLength, setAiLength] = useState<AiLength>('medium');
  const [isSeoEnabled, setIsSeoEnabled] = useState(true);
  const [isWriting, setIsWriting] = useState(false);
  const [previousDescription, setPreviousDescription] = useState('');
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addTicketType = () => {
    setFormData({
      ...formData,
      tickets: [
        ...formData.tickets,
        { id: Date.now().toString(), name: '', price: 0, quota: 100, description: '', sold: 0 }
      ]
    });
  };

  const updateTicket = (id: string, field: keyof TicketTypeData, value: string | number) => {
    setFormData({
      ...formData,
      tickets: formData.tickets.map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  const removeTicket = (id: string) => {
    setFormData({
      ...formData,
      tickets: formData.tickets.filter(t => t.id !== id)
    });
  };

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYouTubeId(formData.videoUrl);

  // --- MOCK AI TEXT GENERATOR ---
  const handleGenerateDescription = () => {
    setIsWriting(true);
    if (formData.description) setPreviousDescription(formData.description);

    setTimeout(() => {
        const title = formData.title || "Bu Muhteşem Etkinlik";
        const location = formData.location || "Şehrin en iyi mekanı";
        const date = formData.date || "yakında";

        const templates: Record<AiTone, string[]> = {
            energetic: [
                `Hazır mısın? ${title}, ${location}'ı sallamaya geliyor! 🔥 Enerjinin hiç düşmeyeceği, müziğin ve eğlencenin doruğa çıkacağı bu gecede yerini hemen ayırt.`,
                `${title} ile sınırları zorlamaya var mısın? 🚀 ${date} tarihinde ${location} sahnesinde buluşuyoruz.`
            ],
            elegant: [
                `Sizi ${location}'ın büyüleyici atmosferinde gerçekleşecek olan ${title} etkinliğine davet ediyoruz. ✨`,
                `${title}, seçkin misafirlerini ${location}'da ağırlamaya hazırlanıyor.`
            ],
            minimal: [
                `${title}. ${location}. ${date}. Orada ol.`,
                `Sadece müzik, sadece sen. ${title} @ ${location}.`
            ],
            emotional: [
                `Bazı anlar vardır, kelimeler yetersiz kalır... ${title}, ruhunuza dokunmak için ${location}'da. ❤️`,
                `Hayallerin gerçeğe dönüştüğü o gece... ${title} ile ${location} sahnesinde.`
            ]
        };

        let text = templates[aiTone][Math.floor(Math.random() * templates[aiTone].length)];
        
        if (aiLength === 'long') {
            text += `\n\nEtkinlik Detayları:\nBu gece sadece sahne performanslarıyla değil, özel sürprizlerle de dolu olacak. Arkadaşlarını topla ve ${location}'ın eşsiz ambiyansının tadını çıkar.`;
        }

        if (isSeoEnabled) {
            const keywords = [`#${title.replace(/\s/g, '')}`, `#${location.replace(/\s/g, '')}Etkinlikleri`, "#GeceHayatı", "#CanlıMüzik"];
            setGeneratedKeywords(keywords);
            text += `\n\n${keywords.join(' ')}`;
        } else {
            setGeneratedKeywords([]);
        }

        setFormData(prev => ({ ...prev, description: text }));
        setIsWriting(false);
    }, 1500);
  };

  const handleUndoDescription = () => {
      setFormData(prev => ({ ...prev, description: previousDescription }));
      setPreviousDescription('');
  };

  // --- MOCK VISUAL GENERATOR ---
  const handleGenerateVisuals = () => {
    setIsGeneratingImage(true);
    setGeneratedVisuals([]);
    
    // Simulate Processing Time
    setTimeout(() => {
        const seed = Date.now();
        // Determine dimensions based on mode/format for picsum to mimic different aspect ratios
        let w = 1080;
        let h = 1080;
        
        if (visualMode === 'poster') {
            w = 1000; h = 1414; // A4ish ratio
        } else if (visualMode === 'instagram') {
             if (instaFormat === 'feed_portrait') { w = 1080; h = 1350; }
             if (instaFormat === 'story') { w = 1080; h = 1920; }
        }

        // Generate 4 variants
        const newVisuals = [
            `https://picsum.photos/seed/${seed}/${w}/${h}`,
            `https://picsum.photos/seed/${seed+123}/${w}/${h}`,
            `https://picsum.photos/seed/${seed+456}/${w}/${h}`,
            `https://picsum.photos/seed/${seed+789}/${w}/${h}`
        ];
        
        setGeneratedVisuals(newVisuals);
        setSelectedVisualIdx(0);
        setIsGeneratingImage(false);
    }, 2500);
  };

  const handleSelectVisual = () => {
      if (generatedVisuals.length > 0) {
          setFormData(prev => ({ ...prev, imageUrl: generatedVisuals[selectedVisualIdx] }));
      }
  };

  const handleSave = async (status: EventStatus) => {
    setIsSaving(true);
    const newEvent: Event = {
        id: Date.now().toString(), 
        title: formData.title || 'Yeni Etkinlik',
        date: formData.date ? `${formData.date}T${formData.time || '00:00:00'}` : new Date().toISOString(),
        location: formData.location || 'Konum Belirtilmedi',
        status: status,
        ticketTypes: formData.tickets,
        revenue: 0,
        image: formData.imageUrl || `https://picsum.photos/1200/600?random=${Date.now()}`
    };
    try {
        await addEvent(newEvent);
        navigate('/events');
    } catch (e) {
        alert('Hata oluştu.');
    } finally {
        setIsSaving(false);
    }
  };

  const steps = [
    { id: 'info', label: 'Genel Bilgiler', icon: Info },
    { id: 'media', label: 'Görsel & Medya', icon: ImageIcon },
    { id: 'tickets', label: 'Biletler', icon: Ticket },
    { id: 'preview', label: 'Önizleme', icon: Eye },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8 min-h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yeni Etkinlik Oluştur</h1>
          <p className="text-slate-500 text-sm">Etkinlik detaylarını girerek hemen satışa başla.</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
          {steps.map((step, index) => {
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            const isCurrent = step.id === currentStep;
            
            return (
              <button 
                key={step.id}
                onClick={() => setCurrentStep(step.id as Step)}
                className={`flex flex-col items-center gap-2 group bg-slate-50 p-2 rounded-xl transition-all ${isCurrent ? 'scale-110' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30' 
                      : 'bg-white border-slate-300 text-slate-400 group-hover:border-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  isCurrent ? 'text-brand-700' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex-1">
        {/* Step 1: Info */}
        {currentStep === 'info' && (
          <div className="p-8 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Temel Bilgiler</h2>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Etkinlik Adı</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Örn: Yaz Festivali 2024"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Kategori</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  >
                    <option value="">Seçiniz</option>
                    <option value="music">Konser & Festival</option>
                    <option value="theater">Tiyatro & Sahne</option>
                    <option value="education">Eğitim & Workshop</option>
                    <option value="sports">Spor</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Konum / Mekan</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Mekan ara..."
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tarih</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Saat</label>
                  <input 
                    type="time" 
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Açıklama</label>
                    <button 
                        onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${isAiPanelOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                    >
                        <Wand2 size={14} className={isAiPanelOpen ? 'text-indigo-600' : ''} />
                        {isAiPanelOpen ? 'AI Asistanını Gizle' : 'AI ile Yaz'}
                    </button>
                </div>

                {/* AI Assistant Panel */}
                {isAiPanelOpen && (
                    <div className="bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-200/20 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                <Sparkles size={16} className="text-indigo-500" />
                                iWent Yazar Asistanı
                            </h3>

                            <div className="flex flex-wrap gap-4 mb-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Ton</label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'energetic', label: 'Enerjik 🔥' },
                                            { id: 'elegant', label: 'Seçkin ✨' },
                                            { id: 'minimal', label: 'Minimal 🕶️' },
                                            { id: 'emotional', label: 'Duygusal ❤️' },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setAiTone(t.id as AiTone)}
                                                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${aiTone === t.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white border-indigo-100 text-indigo-700 hover:border-indigo-300'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Uzunluk</label>
                                    <div className="flex bg-white rounded-lg border border-indigo-100 p-0.5">
                                        {['short', 'medium', 'long'].map(l => (
                                            <button
                                                key={l}
                                                onClick={() => setAiLength(l as AiLength)}
                                                className={`px-3 py-1 text-xs rounded-md transition-all ${aiLength === l ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:text-indigo-600'}`}
                                            >
                                                {l === 'short' ? 'Kısa' : l === 'medium' ? 'Orta' : 'Uzun'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-indigo-100 pt-3">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isSeoEnabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isSeoEnabled ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={isSeoEnabled} onChange={() => setIsSeoEnabled(!isSeoEnabled)} />
                                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">SEO Modu</span>
                                </label>

                                <div className="flex gap-2">
                                    {previousDescription && (
                                        <button 
                                            onClick={handleUndoDescription}
                                            className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                            title="Son değişikliği geri al"
                                        >
                                            <Undo2 size={14} />
                                            Geri Al
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleGenerateDescription}
                                        disabled={isWriting}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                                    >
                                        {isWriting ? <><Loader2 size={14} className="animate-spin"/> Yazılıyor...</> : <><RefreshCw size={14} /> Oluştur</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative group">
                    <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={6} 
                        placeholder="Etkinlik detayları, sanatçılar, kurallar..."
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${isAiPanelOpen ? 'border-indigo-200 focus:ring-indigo-500/20 focus:border-indigo-500' : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'}`} 
                    />
                    
                    {/* SEO Insights Overlay */}
                    {isSeoEnabled && generatedKeywords.length > 0 && (
                        <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-1.5 max-w-[80%] opacity-90">
                            <div className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-green-700 border border-green-200 shadow-sm flex items-center gap-1">
                                <BarChart3 size={10} />
                                SEO Skoru: 92/100
                            </div>
                            {generatedKeywords.map((kw, idx) => (
                                <span key={idx} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-medium border border-indigo-100">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Media */}
        {currentStep === 'media' && (
          <div className="p-8 animate-in slide-in-from-right-4 duration-300">
             <h2 className="text-lg font-bold text-slate-900 mb-6">Görsel ve Medya</h2>
             <div className="space-y-8">
                
                {/* AI Visual Studio */}
                <div className="bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 border border-violet-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-violet-100 bg-white/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">AI Görsel Stüdyosu</h3>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-violet-500 font-semibold uppercase tracking-wider bg-violet-50 px-1.5 rounded-full border border-violet-100">
                                        Model: Nano Banana
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setVisualMode('poster')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${visualMode === 'poster' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Layout size={14} />
                                Afiş
                            </button>
                            <button 
                                onClick={() => setVisualMode('instagram')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${visualMode === 'instagram' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Instagram size={14} />
                                Instagram
                            </button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Controls Column */}
                        <div className="lg:col-span-4 space-y-5">

                            {visualMode === 'instagram' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Layers size={14} /> Format
                                    </label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setInstaFormat('feed_square')}
                                            className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${instaFormat === 'feed_square' ? 'bg-violet-50 border-violet-500 text-violet-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
                                            <span className="text-[10px]">Kare (1:1)</span>
                                        </button>
                                        <button 
                                            onClick={() => setInstaFormat('feed_portrait')}
                                            className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${instaFormat === 'feed_portrait' ? 'bg-violet-50 border-violet-500 text-violet-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            <div className="w-3 h-4 border-2 border-current rounded-sm"></div>
                                            <span className="text-[10px]">Dikey (4:5)</span>
                                        </button>
                                        <button 
                                            onClick={() => setInstaFormat('story')}
                                            className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${instaFormat === 'story' ? 'bg-violet-50 border-violet-500 text-violet-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            <div className="w-3 h-5 border-2 border-current rounded-sm"></div>
                                            <span className="text-[10px]">Story (9:16)</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Type size={14} /> Prompt (İpucu)
                                    </label>
                                    <button className="text-[10px] font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1.5 bg-slate-100 hover:bg-brand-50 px-2.5 py-1.5 rounded-full transition-all border border-slate-200 hover:border-brand-200">
                                        <PlayCircle size={12} />
                                        Nasıl Kullanılır?
                                    </button>
                                </div>
                                <textarea 
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    rows={3}
                                    placeholder={`${formData.title || 'Etkinlik'} için ${visualStyle} tarzında bir görsel...`}
                                    className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                                />
                            </div>

                            <button 
                                onClick={handleGenerateVisuals}
                                disabled={isGeneratingImage}
                                className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                            >
                                {isGeneratingImage ? <><Loader2 size={18} className="animate-spin" /> Çiziliyor...</> : <><Wand2 size={18} /> Görsel Oluştur</>}
                            </button>
                        </div>

                        {/* Preview Column */}
                        <div className="lg:col-span-8 bg-slate-50 rounded-xl border border-slate-200 flex flex-col relative min-h-[400px]">
                            {/* Main Preview Area */}
                            <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                                {isGeneratingImage ? (
                                    <div className="text-center space-y-4 animate-pulse">
                                        <div className="w-24 h-24 bg-violet-100 rounded-full mx-auto flex items-center justify-center">
                                            <Sparkles size={40} className="text-violet-400 animate-spin-slow" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-700">Yapay Zeka Çalışıyor...</h4>
                                            <p className="text-slate-400 text-sm">Nano Banana modeli detayları işliyor</p>
                                        </div>
                                    </div>
                                ) : generatedVisuals.length > 0 ? (
                                    <div className="relative group w-full h-full flex items-center justify-center">
                                        <img 
                                            src={generatedVisuals[selectedVisualIdx]} 
                                            alt="Generated" 
                                            className={`shadow-2xl rounded-lg transition-all object-cover ${
                                                visualMode === 'poster' ? 'max-h-[450px] aspect-[1/1.414]' :
                                                instaFormat === 'story' ? 'max-h-[450px] aspect-[9/16]' :
                                                instaFormat === 'feed_portrait' ? 'max-h-[400px] aspect-[4/5]' : 'max-h-[400px] aspect-square'
                                            }`}
                                        />
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 backdrop-blur-sm">
                                                <Maximize2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400 max-w-xs">
                                        <Aperture size={48} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-medium">Henüz görsel oluşturulmadı.</p>
                                        <p className="text-sm mt-1">Sol taraftan ayarları seçip "Görsel Oluştur" butonuna basın.</p>
                                    </div>
                                )}
                            </div>

                            {/* Carousel & Actions Footer */}
                            {generatedVisuals.length > 0 && !isGeneratingImage && (
                                <div className="p-4 bg-white border-t border-slate-200 rounded-b-xl flex items-center gap-4">
                                    <div className="flex gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
                                        {generatedVisuals.map((img, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setSelectedVisualIdx(idx)}
                                                className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedVisualIdx === idx ? 'border-violet-600 ring-2 ring-violet-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            >
                                                <img src={img} className="w-full h-full object-cover" alt={`Variant ${idx}`} />
                                            </button>
                                        ))}
                                        <button 
                                            onClick={handleGenerateVisuals}
                                            className="w-16 h-16 flex-shrink-0 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all gap-1"
                                        >
                                            <RefreshCw size={16} />
                                            <span className="text-[9px] font-bold">Yenile</span>
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-2 border-l pl-4 border-slate-100">
                                        <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="İndir">
                                            <Download size={20} />
                                        </button>
                                        <button 
                                            onClick={handleSelectVisual}
                                            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shadow-lg shadow-slate-900/10"
                                        >
                                            <Check size={16} />
                                            Bu Görseli Kullan
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Seçilen Etkinlik Görseli</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden">
                        {formData.imageUrl ? (
                             <div className="absolute inset-0 z-10 bg-slate-900 flex items-center justify-center">
                                <img src={formData.imageUrl} alt="Uploaded" className="h-full w-full object-contain" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setFormData({...formData, imageUrl: ''}); }}
                                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                             </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors text-slate-400">
                                    <ImageIcon size={32} />
                                </div>
                                <p className="text-slate-900 font-medium">Görseli sürükleyip bırakın</p>
                                <p className="text-slate-500 text-sm mt-1">veya dosya seçmek için tıklayın</p>
                                <p className="text-xs text-slate-400 mt-4">PNG, JPG (Max. 5MB)</p>
                            </>
                        )}
                        <input type="file" className="hidden" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tanıtım Videosu (Opsiyonel)</label>
                    <div className="relative">
                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="url" 
                            name="videoUrl"
                            value={formData.videoUrl}
                            onChange={handleInputChange}
                            placeholder="Youtube video bağlantısı..."
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                        />
                    </div>
                    
                    {formData.videoUrl && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            {youtubeId ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200 group">
                                    <img 
                                        src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`} 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                                        }}
                                        alt="Video Thumbnail" 
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-75 transition-opacity" 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                                             <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1.5 text-white text-xs font-medium">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                        Youtube Önizleme
                                    </div>
                                    <a 
                                      href={formData.videoUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-lg text-white transition-colors"
                                    >
                                      <ExternalLink size={16} />
                                    </a>
                                </div>
                            ) : (
                                <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-start gap-2 border border-amber-100">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>Önizleme oluşturulamadı. Lütfen geçerli bir Youtube bağlantısı girdiğinizden emin olun.</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
             </div>
          </div>
        )}

        {/* Step 3: Tickets */}
        {currentStep === 'tickets' && (
          <div className="p-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Bilet Türleri</h2>
                <button 
                    onClick={addTicketType}
                    className="text-sm font-medium text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                    <Plus size={16} /> Bilet Ekle
                </button>
            </div>

            <div className="space-y-4">
                {formData.tickets.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Ticket className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-500">Henüz bilet türü eklenmedi.</p>
                        <button onClick={addTicketType} className="text-brand-600 font-medium text-sm mt-2 hover:underline">İlk bileti ekle</button>
                    </div>
                )}

                {formData.tickets.map((ticket, index) => (
                    <div key={ticket.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4 relative group">
                        <button 
                            onClick={() => removeTicket(ticket.id)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Bilet Adı</label>
                                <input 
                                    type="text" 
                                    placeholder="Örn: Genel Giriş"
                                    value={ticket.name}
                                    onChange={(e) => updateTicket(ticket.id, 'name', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-all" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Fiyat (₺)</label>
                                <input 
                                    type="number" 
                                    value={ticket.price}
                                    onChange={(e) => updateTicket(ticket.id, 'price', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-all" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Kontenjan</label>
                                <input 
                                    type="number" 
                                    value={ticket.quota}
                                    onChange={(e) => updateTicket(ticket.id, 'quota', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-all" 
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Açıklama (Opsiyonel)</label>
                                <input 
                                    type="text" 
                                    placeholder="Bu bilet neleri kapsıyor?"
                                    value={ticket.description}
                                    onChange={(e) => updateTicket(ticket.id, 'description', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 transition-all" 
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {currentStep === 'preview' && (
          <div className="p-8 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Önizleme</h2>
            
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-lg max-w-sm mx-auto">
                <div className="h-48 bg-slate-200 relative group cursor-pointer">
                     {/* Placeholder for image */}
                     <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 overflow-hidden">
                        {formData.imageUrl ? (
                            <img src={formData.imageUrl} alt="Event Cover" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon size={48} />
                        )}
                        
                        {youtubeId && (
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              {/* Simple Play Icon overlay if video exists */}
                           </div>
                        )}
                     </div>
                     <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm z-10">
                        {formData.category || 'Kategori'}
                     </div>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{formData.title || 'Etkinlik Başlığı'}</h3>
                    <div className="flex flex-col gap-2 text-sm text-slate-600 mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-brand-500" />
                            <span>{formData.date || 'Tarih'} • {formData.time || 'Saat'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-brand-500" />
                            <span>{formData.location || 'Konum'}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        {formData.tickets.length > 0 ? (
                             formData.tickets.map(t => (
                                <div key={t.id} className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-700">{t.name}</span>
                                    <span className="font-bold text-brand-600">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.price)}
                                    </span>
                                </div>
                             ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center italic">Bilet bilgisi girilmedi</p>
                        )}
                    </div>

                    <button className="w-full mt-6 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors">
                        Bilet Al
                    </button>
                </div>
            </div>

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800 text-sm max-w-2xl mx-auto">
                <AlertCircle className="flex-shrink-0" size={20} />
                <p>Yayınlamadan önce tüm bilgilerin doğruluğundan emin olun. Etkinlik yayınlandıktan sonra tarih ve bilet fiyatlarında yapılan değişiklikler kısıtlanabilir.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {/* Sticky footer that respects sidebar width because it's in the flow */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 -mx-8 -mb-8 mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
             <button 
                onClick={() => {
                    const idx = steps.findIndex(s => s.id === currentStep);
                    if (idx > 0) setCurrentStep(steps[idx - 1].id as Step);
                }}
                disabled={currentStep === 'info'}
                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
                Geri
             </button>

             <div className="flex items-center gap-3">
                <button 
                    onClick={() => handleSave(EventStatus.DRAFT)}
                    disabled={isSaving}
                    className="px-6 py-2.5 text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    {isSaving ? 'Kaydediliyor...' : 'Taslak Kaydet'}
                </button>
                
                {currentStep !== 'preview' ? (
                    <button 
                        onClick={() => {
                            const idx = steps.findIndex(s => s.id === currentStep);
                            if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id as Step);
                        }}
                        className="px-6 py-2.5 bg-brand-600 text-white font-medium hover:bg-brand-700 rounded-lg transition-colors shadow-lg shadow-brand-500/30"
                    >
                        Devam Et
                    </button>
                ) : (
                    <button 
                        onClick={() => handleSave(EventStatus.PUBLISHED)}
                        className="px-8 py-2.5 bg-green-600 text-white font-medium hover:bg-green-700 rounded-lg transition-colors shadow-lg shadow-green-500/30 flex items-center gap-2"
                    >
                        <Send size={18} />
                        Yayınla
                    </button>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;