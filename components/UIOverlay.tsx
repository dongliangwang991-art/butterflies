import React, { useState, useRef, useEffect } from 'react';
import { Memory, MemoryType, AppMode, ChatMessage, DiaryEntry, Achievement, HolidayMode } from '../types';
import { Send, Plus, X, Sparkles, MessageCircle, Search, Star, Mic, MicOff, BookOpen, Trophy } from 'lucide-react';

interface UIOverlayProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  memories: Memory[];
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  onAddMemory: (text: string) => void;
  activeMemory: Memory | null;
  onCloseMemory: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Voice Props
  isListening: boolean;
  toggleListening: () => void;
  voiceTranscript: string;
  voiceEnergy: number;

  // Living World Props
  diaryEntries: DiaryEntry[];
  unseenDiaryCount: number;
  recentAchievement: Achievement | null;
  clearAchievement: () => void;
  holidayMode: HolidayMode;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  mode,
  setMode,
  memories,
  chatHistory,
  onSendMessage,
  onAddMemory,
  activeMemory,
  onCloseMemory,
  searchTerm,
  setSearchTerm,
  isListening,
  toggleListening,
  voiceTranscript,
  voiceEnergy,
  diaryEntries,
  unseenDiaryCount,
  recentAchievement,
  clearAchievement,
  holidayMode
}) => {
  const [inputText, setInputText] = useState('');
  const [memoryInput, setMemoryInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync transcript to active input
  useEffect(() => {
      if (isListening && voiceTranscript) {
          if (mode === AppMode.ADD_MEMORY) {
              setMemoryInput(prev => prev ? prev + ' ' + voiceTranscript : voiceTranscript);
          } else if (mode === AppMode.CHAT) {
              setInputText(prev => prev ? prev + ' ' + voiceTranscript : voiceTranscript);
          }
      }
  }, [voiceTranscript, isListening, mode]);

  // Auto clear achievement toast
  useEffect(() => {
    if (recentAchievement) {
        const timer = setTimeout(() => {
            clearAchievement();
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [recentAchievement, clearAchievement]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, mode]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryInput.trim()) return;
    onAddMemory(memoryInput);
    setMemoryInput('');
    setMode(AppMode.EXPLORE);
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between overflow-hidden font-sans">
      
      {/* HUD Header */}
      <header className="p-8 flex justify-between items-start pointer-events-auto">
        <div className="animate-fade-in-down">
          <h1 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-indigo-200 font-mystic tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            AURELIA
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-indigo-200/60 tracking-[0.2em] font-light mt-1 uppercase">记忆宇宙</p>
            {holidayMode === HolidayMode.WINTER_SOLSTICE && (
                <span className="text-xs text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full bg-blue-900/20">❄️ 极夜模式</span>
            )}
            {holidayMode === HolidayMode.BIRTHDAY && (
                <span className="text-xs text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full bg-amber-900/20">🎂 庆典模式</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 animate-fade-in-down delay-100">
             <div className="flex gap-3">
                
                {/* Voice Toggle */}
                <button 
                    onClick={toggleListening}
                    className={`relative p-3 rounded-full border transition-all duration-300 backdrop-blur-md overflow-hidden ${isListening ? 'bg-red-500/20 border-red-400 text-red-200 shadow-[0_0_20px_rgba(248,113,113,0.4)]' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                    {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                    {isListening && (
                        <div 
                            className="absolute inset-0 bg-red-500/30 transition-transform duration-75 origin-bottom pointer-events-none"
                            style={{ transform: `scaleY(${voiceEnergy * 3})` }}
                        />
                    )}
                </button>

                {/* Aurelia's Diary */}
                <button 
                    onClick={() => setMode(mode === AppMode.DIARY ? AppMode.EXPLORE : AppMode.DIARY)}
                    className={`relative p-3 rounded-full border transition-all duration-500 backdrop-blur-md ${mode === AppMode.DIARY ? 'bg-indigo-500/20 border-indigo-300 text-white' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <BookOpen size={18} />
                    {unseenDiaryCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-bounce">
                            {unseenDiaryCount}
                        </span>
                    )}
                </button>


                {/* Search Toggle */}
                <button 
                    onClick={() => setMode(mode === AppMode.SEARCH ? AppMode.EXPLORE : AppMode.SEARCH)}
                    className={`p-3 rounded-full border transition-all duration-500 backdrop-blur-md ${mode === AppMode.SEARCH ? 'bg-indigo-500/20 border-indigo-300 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <Search size={18} />
                </button>

                <button 
                    onClick={() => setMode(AppMode.CHAT)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all duration-500 backdrop-blur-md ${mode === AppMode.CHAT ? 'bg-white/10 border-white/50 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-black/20 border-white/10 text-gray-300 hover:bg-white/5'}`}
                >
                    <MessageCircle size={16} />
                    <span className="font-mystic text-sm">对话</span>
                </button>

                <button 
                    onClick={() => setMode(AppMode.ADD_MEMORY)}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-amber-500/80 to-purple-600/80 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/20 hover:scale-105 transition-all duration-300"
                >
                    <Plus size={16} />
                    <span className="font-mystic text-sm">结晶</span>
                </button>
             </div>

             {/* Search Bar (Expandable) */}
             {mode === AppMode.SEARCH && (
                 <div className="relative w-64 animate-slide-in-right">
                     <input 
                        type="text" 
                        placeholder="搜索星座..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-indigo-500/30 rounded-lg py-2 px-4 text-white text-sm focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
                        autoFocus
                     />
                 </div>
             )}
        </div>
      </header>
      
      {/* Listening Status Indicator */}
      {isListening && (
          <div className="absolute top-24 right-8 pointer-events-none animate-pulse text-xs text-red-300 font-mystic tracking-widest bg-black/50 px-3 py-1 rounded-full border border-red-900/50">
              正在聆听灵魂共鸣...
          </div>
      )}

      {/* Achievement Toast */}
      {recentAchievement && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in-down">
              <div className="glass-panel px-6 py-4 rounded-xl border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-full">
                      <Trophy className="text-amber-300" size={24} />
                  </div>
                  <div>
                      <h4 className="text-amber-200 font-mystic text-lg">成就解锁</h4>
                      <p className="text-white font-bold">{recentAchievement.title}</p>
                      <p className="text-gray-400 text-xs">{recentAchievement.reward}</p>
                  </div>
              </div>
          </div>
      )}

      {/* Main Content Layer */}
      <div className="flex-1 relative pointer-events-auto">
        
        {/* Memory Creator */}
        {mode === AppMode.ADD_MEMORY && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in z-50">
            <div className="w-full max-w-xl glass-panel p-10 rounded-3xl relative">
              <button onClick={() => setMode(AppMode.EXPLORE)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"><X /></button>
              
              <div className="flex flex-col items-center mb-8">
                  <Sparkles className="text-amber-300 mb-4 animate-pulse" size={32} />
                  <h2 className="text-3xl text-transparent bg-clip-text bg-gradient-to-br from-amber-100 to-purple-200 font-mystic text-center">
                    编织记忆
                  </h2>
                  <p className="text-gray-400 text-sm mt-2 text-center max-w-md">
                      诉说或书写。这是现实的坚硬碎片，还是梦境的转瞬低语？
                  </p>
              </div>

              <form onSubmit={handleMemorySubmit}>
                <textarea
                  value={memoryInput}
                  onChange={(e) => setMemoryInput(e.target.value)}
                  placeholder="我记得..."
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-5 text-lg text-white font-light focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all mb-6 resize-none placeholder-gray-600"
                  autoFocus
                />
                <div className="flex justify-center">
                   <button 
                     type="submit"
                     className="px-10 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-mystic tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center gap-3"
                   >
                     <span>释放以此归星</span>
                     <Star size={14} className="text-amber-200"/>
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Aurelia's Diary Panel */}
        {mode === AppMode.DIARY && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in z-50">
                <div className="w-full max-w-2xl h-[600px] glass-panel rounded-3xl relative flex flex-col overflow-hidden border-indigo-500/30">
                     <button onClick={() => setMode(AppMode.EXPLORE)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors z-10"><X /></button>
                     
                     <div className="p-8 border-b border-white/10 bg-indigo-950/30">
                         <div className="flex items-center gap-3">
                            <BookOpen className="text-indigo-300" />
                            <h2 className="text-2xl font-mystic text-indigo-100">艾瑞莉亚的观察日志</h2>
                         </div>
                         <p className="text-indigo-200/50 text-sm mt-2">灵魂旅人的秘密编年史。</p>
                     </div>

                     <div className="flex-1 overflow-y-auto p-8 space-y-8">
                         {diaryEntries.length === 0 ? (
                             <div className="text-center text-gray-500 mt-20 italic">
                                 "观测才刚刚开始..."
                             </div>
                         ) : (
                             diaryEntries.map(entry => (
                                 <div key={entry.id} className="relative pl-8 border-l border-indigo-500/20">
                                     <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                     <div className="text-xs text-indigo-300 font-mystic tracking-widest mb-2">{entry.date}</div>
                                     <h3 className="text-xl text-white font-serif mb-3">{entry.title}</h3>
                                     <p className="text-gray-300 font-light leading-relaxed italic">
                                         "{entry.content}"
                                     </p>
                                 </div>
                             ))
                         )}
                     </div>
                </div>
            </div>
        )}

        {/* Chat Panel */}
        {mode === AppMode.CHAT && (
            <div className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] glass-panel border-l border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-slide-in-right z-40 backdrop-blur-xl bg-black/60">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-amber-300 shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                        <h3 className="text-xl text-white font-mystic tracking-wide">艾瑞莉亚</h3>
                    </div>
                    <button onClick={() => setMode(AppMode.EXPLORE)} className="text-white/30 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 text-sm leading-relaxed ${
                                msg.sender === 'user' 
                                ? 'bg-indigo-900/40 border border-indigo-500/20 text-indigo-100 rounded-2xl rounded-tr-sm' 
                                : 'bg-white/5 border border-white/5 text-gray-200 rounded-2xl rounded-tl-sm shadow-inner'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20">
                    <form onSubmit={handleChatSubmit} className="relative group">
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="向虚空低语..."
                            className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 pr-12 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder-gray-500 font-light"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-300 hover:text-white transition-colors opacity-70 hover:opacity-100">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* Memory View Card (Sculpting Mode) */}
        {activeMemory && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/80 backdrop-blur-md z-50 animate-fade-in">
                <div className={`max-w-3xl w-full border rounded-3xl p-12 relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden transition-colors duration-1000 ${activeMemory.type === MemoryType.REAL ? 'border-amber-900/30 bg-gradient-to-b from-gray-900 to-black' : 'border-indigo-900/30 bg-gradient-to-b from-gray-900 to-black'}`}>
                    
                    {/* Background Glow */}
                    <div className={`absolute -top-20 -left-20 w-60 h-60 rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000`} style={{ backgroundColor: activeMemory.visuals?.customColor || (activeMemory.type === MemoryType.REAL ? '#F59E0B' : '#8B5CF6') }}></div>
                    <div className={`absolute -bottom-20 -right-20 w-60 h-60 rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000`} style={{ backgroundColor: activeMemory.visuals?.customColor || (activeMemory.type === MemoryType.REAL ? '#F97316' : '#A855F7') }}></div>

                    <button onClick={onCloseMemory} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors z-10">
                        <X size={28} />
                    </button>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase border ${activeMemory.type === MemoryType.REAL ? 'bg-amber-900/20 text-amber-200 border-amber-700/30' : 'bg-indigo-900/20 text-indigo-200 border-indigo-700/30'}`}>
                                {activeMemory.type === MemoryType.REAL ? '现实' : '梦境'}
                            </div>
                            <span className="text-gray-600 text-xs font-mystic">
                                 {new Date(activeMemory.timestamp).toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>

                        <p className="text-3xl md:text-4xl text-white font-mystic leading-relaxed mb-10 drop-shadow-lg">
                            "{activeMemory.content}"
                        </p>

                        <div className="flex flex-wrap gap-3 mb-10">
                            {activeMemory.keywords.map((k, i) => (
                                <span key={i} className="text-xs text-gray-400 border border-white/10 bg-white/5 px-3 py-1.5 rounded-full tracking-wide hover:bg-white/10 transition-colors">#{k}</span>
                            ))}
                        </div>

                        <div className={`p-6 rounded-xl border ${activeMemory.type === MemoryType.REAL ? 'border-amber-500/10 bg-amber-900/5' : 'border-indigo-500/10 bg-indigo-900/5'}`}>
                            <p className="text-sm text-gray-400 leading-7 font-light">
                                <span className={`font-mystic font-semibold mr-2 ${activeMemory.type === MemoryType.REAL ? 'text-amber-300' : 'text-indigo-300'}`}>艾瑞莉亚的回响:</span>
                                这个碎片与情感的共鸣强度为 {Math.round(activeMemory.emotion * 100)}%。
                            </p>
                            {isListening && (
                                <div className="mt-4 flex items-center gap-3 text-indigo-300 animate-pulse">
                                    <Mic size={14} />
                                    <span className="text-xs uppercase tracking-widest">声音塑形中... 描述这种感觉。</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
             </div>
        )}
      </div>

      {/* Footer Stats */}
      <footer className="p-8 text-white/20 text-xs flex justify-between pointer-events-auto font-mystic tracking-widest uppercase">
         <div className="flex gap-4">
             <span className="hover:text-amber-200/50 transition-colors cursor-default">现实: {memories.filter(m => m.type === MemoryType.REAL).length}</span>
             <span className="hover:text-indigo-200/50 transition-colors cursor-default">梦境: {memories.filter(m => m.type === MemoryType.DREAM).length}</span>
         </div>
         <div className="flex gap-4">
             {/* Dev controls for demo */}
             <button onClick={() => console.log('Version 1.5')} className="hover:text-white transition-colors">原型 v1.5 // 鲜活世界</button>
         </div>
      </footer>
    </div>
  );
};

export default UIOverlay;