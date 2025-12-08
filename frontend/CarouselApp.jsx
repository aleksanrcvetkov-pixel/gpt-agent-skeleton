import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Copy, 
  Plus, 
  Trash2, 
  Layout, 
  Smartphone, 
  Palette, 
  Share2, 
  Type, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Wand2
} from 'lucide-react';

// --- Types & Constants ---

const TONES = [
  { id: 'expert', label: 'Экспертный', emoji: '🧐' },
  { id: 'funny', label: 'Веселый', emoji: '🤪' },
  { id: 'motivational', label: 'Мотивирующий', emoji: '🔥' },
];

const GRADIENTS = [
  { name: 'Neon Dusk', value: 'from-purple-600 to-pink-500 text-white' },
  { name: 'Ocean Breeze', value: 'from-blue-400 to-emerald-400 text-white' },
  { name: 'Sunset', value: 'from-orange-400 to-rose-500 text-white' },
  { name: 'Dark Mode', value: 'from-gray-800 to-gray-900 text-white' },
  { name: 'Minimal', value: 'from-gray-100 to-gray-200 text-gray-900' },
  { name: 'Midnight', value: 'from-slate-900 to-slate-800 text-white' },
];

const ASPECT_RATIOS = {
  feed: 'aspect-square', // 1:1
  story: 'aspect-[9/16]', // 9:16
};

// --- API Helper ---
const generateWithGemini = async (topic, tone) => {
  const apiKey = ""; // Injected by environment
  const prompt = `
    Act as a social media expert. Create a carousel of 4-6 slides about "${topic}".
    Tone: ${tone}.
    Language: Russian.
    
    Return ONLY a raw JSON array (no markdown code blocks) of objects with this structure:
    [
      {
        "title": "Short punchy title (max 5 words)",
        "content": "Brief explanation (max 20 words)",
        "emoji": "Single emoji"
      }
    ]
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API Error');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    // Clean up potential markdown formatting if model adds it despite instructions
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

// --- Custom Hook (Modified for Client-Side API) ---

function useCarouselAI() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('expert');
  const [slides, setSlides] = useState([
    {
      id: 1,
      title: 'Как начать?',
      content: 'Введите тему слева и нажмите кнопку генерации ✨',
      bg: GRADIENTS[0].value,
      emoji: '👋',
    },
    {
      id: 2,
      title: 'Редактор',
      content: 'Вы можете менять текст, фоны и добавлять слайды вручную.',
      bg: GRADIENTS[1].value,
      emoji: '🎨',
    },
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [format, setFormat] = useState('feed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateCarousel = useCallback(async () => {
    if (!topic.trim()) {
      showToast('Пожалуйста, введите тему', 'error');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const serverSlides = await generateWithGemini(topic, tone);

      if (!Array.isArray(serverSlides)) {
        throw new Error('Неверный формат ответа');
      }

      const newSlides = serverSlides.map((s, index) => ({
        id: Date.now() + index,
        title: s.title,
        content: s.content,
        emoji: s.emoji || '✨',
        bg: slides[index]?.bg || GRADIENTS[index % GRADIENTS.length].value,
      }));

      setSlides(newSlides);
      setActiveSlideIndex(0);
      showToast('Карусель создана!', 'success');
    } catch (err) {
      console.error(err);
      setError('Ошибка генерации. Попробуйте еще раз.');
      showToast('Ошибка при генерации', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [topic, tone, slides]);

  const updateSlide = useCallback((index, field, value) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }, []);

  const addSlide = useCallback(() => {
    setSlides(prev => {
      const lastSlide = prev[prev.length - 1];
      return [...prev, {
        id: Date.now(),
        title: 'Новый слайд',
        content: 'Текст...',
        bg: lastSlide?.bg || GRADIENTS[0].value,
        emoji: '📝',
      }];
    });
    setActiveSlideIndex(prev => prev + 1); // Go to new slide (which is at prev length + 1 - 1 ? No, just prev length)
    // Actually, state updates are async. We'll handle scroll in UI.
  }, []);

  const removeSlide = useCallback((index) => {
    setSlides(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((_, i) => i !== index);
      return filtered;
    });
    setActiveSlideIndex(prev => Math.max(0, prev - 1));
  }, []);

  const applyGradientToAll = useCallback((gradValue) => {
    setSlides(prev => prev.map(s => ({ ...s, bg: gradValue })));
    showToast('Фон применен ко всем слайдам');
  }, []);

  const copyToClipboard = useCallback(async () => {
    const text = slides.map((s, i) => `${i + 1}. ${s.title} ${s.emoji}\n${s.content}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('Текст скопирован!');
    } catch {
      showToast('Не удалось скопировать', 'error');
    }
  }, [slides]);

  return {
    topic, setTopic,
    tone, setTone,
    slides, setSlides,
    activeSlideIndex, setActiveSlideIndex,
    format, setFormat,
    isGenerating,
    error,
    toast,
    generateCarousel,
    updateSlide,
    addSlide,
    removeSlide,
    applyGradientToAll,
    copyToClipboard,
  };
}

// --- Components ---

const Toast = ({ message, type }) => (
  <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-full shadow-lg transform transition-all animate-fade-in-down ${
    type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
  }`}>
    <span className="font-medium flex items-center gap-2">
      {type === 'error' ? '⚠️' : '✅'} {message}
    </span>
  </div>
);

const SlidePreview = ({ slide, format, isActive, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-300 transform group
        ${isActive ? 'ring-4 ring-blue-500 scale-100 z-10 shadow-xl' : 'scale-90 opacity-70 hover:opacity-100 hover:scale-95'}
      `}
    >
      <div className={`
        ${ASPECT_RATIOS[format]} 
        bg-gradient-to-br ${slide.bg} 
        rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg overflow-hidden
        select-none
      `}>
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="text-5xl mb-4 drop-shadow-md transform group-hover:scale-110 transition-transform">{slide.emoji}</div>
        <h3 className="text-xl md:text-2xl font-bold mb-3 leading-tight drop-shadow-sm line-clamp-2">
          {slide.title}
        </h3>
        <p className="text-sm md:text-base opacity-90 font-medium leading-relaxed drop-shadow-sm line-clamp-4">
          {slide.content}
        </p>

        {/* Brand/Pagination Watermark Mockup */}
        <div className="absolute bottom-4 left-0 w-full flex justify-center opacity-50 space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const {
    topic, setTopic,
    tone, setTone,
    slides,
    activeSlideIndex, setActiveSlideIndex,
    format, setFormat,
    isGenerating,
    toast,
    generateCarousel,
    updateSlide,
    addSlide,
    removeSlide,
    applyGradientToAll,
    copyToClipboard,
  } = useCarouselAI();

  const activeSlide = slides[activeSlideIndex];
  const scrollContainerRef = useRef(null);

  // Auto scroll to active slide in mobile view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current.children[activeSlideIndex];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeSlideIndex]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-blue-200">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              CarouselAI
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={copyToClipboard}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Copy size={16} />
              Копировать текст
            </button>
            <a 
              href="#" // Mock export
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-200 transition-all hover:shadow-lg active:scale-95"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Экспорт</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & Editor */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Generator Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wand2 className="text-blue-500" size={20} />
              Генератор
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">О чем будет пост?</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: 5 советов для продуктивности..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none h-24 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тон</label>
                  <div className="relative">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white text-sm"
                    >
                      {TONES.map((t) => (
                        <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      ▼
                    </div>
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Формат</label>
                   <div className="flex bg-gray-100 rounded-xl p-1">
                     <button
                       onClick={() => setFormat('feed')}
                       className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                         format === 'feed' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                       }`}
                     >
                       <Layout size={14} className="mr-1" /> Пост
                     </button>
                     <button
                       onClick={() => setFormat('story')}
                       className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-all ${
                         format === 'story' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                       }`}
                     >
                       <Smartphone size={14} className="mr-1" /> Сторис
                     </button>
                   </div>
                </div>
              </div>

              <button
                onClick={generateCarousel}
                disabled={isGenerating}
                className={`w-full py-3 rounded-xl font-medium text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                  ${isGenerating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Думаю...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Сгенерировать
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Editor Card */}
          {activeSlide && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center">
                    {activeSlideIndex + 1}
                  </span>
                  Редактирование
                </h2>
                <button 
                  onClick={() => removeSlide(activeSlideIndex)}
                  disabled={slides.length <= 1}
                  className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-red-400 transition-colors p-1"
                  title="Удалить слайд"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Заголовок</label>
                  <input
                    type="text"
                    value={activeSlide.title}
                    onChange={(e) => updateSlide(activeSlideIndex, 'title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm font-medium"
                  />
                </div>
                
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Текст</label>
                    <textarea
                      value={activeSlide.content}
                      onChange={(e) => updateSlide(activeSlideIndex, 'content', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm resize-none"
                    />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Эмодзи</label>
                     <input
                      type="text"
                      value={activeSlide.emoji}
                      onChange={(e) => updateSlide(activeSlideIndex, 'emoji', e.target.value)}
                      className="w-12 h-12 text-center text-2xl rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-500 uppercase">Фон слайда</label>
                    <button 
                      onClick={() => applyGradientToAll(activeSlide.bg)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Применить ко всем
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {GRADIENTS.map((g) => (
                      <button
                        key={g.name}
                        onClick={() => updateSlide(activeSlideIndex, 'bg', g.value)}
                        className={`w-full aspect-square rounded-full bg-gradient-to-br ${g.value} ring-2 ring-offset-2 transition-all ${
                          activeSlide.bg === g.value ? 'ring-blue-500 scale-110' : 'ring-transparent hover:scale-105'
                        }`}
                        title={g.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-140px)] sticky top-24">
          <div className="flex-1 bg-gray-100/50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col overflow-hidden relative">
            
            {/* Mobile-style Status Bar Mockup */}
            <div className="h-8 flex items-center justify-between px-6 text-gray-400 text-xs font-medium select-none">
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-2.5 bg-current rounded-sm opacity-50"/>
                <div className="w-2.5 h-2.5 bg-current rounded-full opacity-50"/>
              </div>
            </div>

            {/* Carousel Viewport */}
            <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden hide-scrollbar snap-x snap-mandatory px-8 md:px-0 pb-8" ref={scrollContainerRef}>
              <div className="flex gap-6 md:gap-8 mx-auto px-4 items-center">
                {slides.map((slide, index) => (
                  <div key={slide.id} className="snap-center shrink-0 w-[280px] md:w-[320px]">
                    <SlidePreview 
                      slide={slide} 
                      format={format}
                      isActive={index === activeSlideIndex}
                      onClick={() => setActiveSlideIndex(index)}
                    />
                  </div>
                ))}
                
                {/* Add Slide Button (in preview flow) */}
                <button
                  onClick={addSlide}
                  className={`shrink-0 w-16 h-16 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center transition-all snap-center`}
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="h-12 flex items-center justify-center gap-2 pb-4">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === activeSlideIndex ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Arrows (Desktop) */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2 hidden md:block">
              <button 
                onClick={() => setActiveSlideIndex(i => Math.max(0, i - 1))}
                disabled={activeSlideIndex === 0}
                className="p-2 rounded-full bg-white/80 shadow-md hover:bg-white disabled:opacity-0 transition-all text-gray-700"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 hidden md:block">
              <button 
                onClick={() => setActiveSlideIndex(i => Math.min(slides.length - 1, i + 1))}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-2 rounded-full bg-white/80 shadow-md hover:bg-white disabled:opacity-0 transition-all text-gray-700"
              >
                <ChevronRight size={24} />
              </button>
            </div>

          </div>
          
          <p className="text-center text-gray-400 text-sm mt-4">
            Кликните на слайд, чтобы редактировать его
          </p>
        </div>
      </main>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
