import React, { useState, useEffect, useRef } from 'react';
import ButterflyScene from './components/ButterflyScene';
import UIOverlay from './components/UIOverlay';
import { Memory, ChatMessage, AppMode, MemoryType, AtmosphereState, HolidayMode, Achievement, AureliaSkin, DiaryEntry, UserStats } from './types';
import { geminiService } from './services/geminiService';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Add WebkitSpeechRecognition Type Support
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

// DEFINED ACHIEVEMENTS
const ACHIEVEMENTS_LIST: Achievement[] = [
    { id: 'dreamweaver', title: '织梦者', description: '记录了 3 个梦境', icon: 'moon', unlocked: false, reward: '解锁星光形态', skinUnlock: AureliaSkin.STARLIGHT },
    { id: 'deepdiver', title: '潜渊者', description: '访问了深渊中的记忆', icon: 'anchor', unlocked: false, reward: '暂时还没解锁什么... 目前。' },
    { id: 'stargazer', title: '观星者', description: '使用了星座搜索', icon: 'search', unlocked: false, reward: '知识' }
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.EXPLORE);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Living World State
  const [holidayMode, setHolidayMode] = useState<HolidayMode>(HolidayMode.NONE);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_LIST);
  const [userStats, setUserStats] = useState<UserStats>({ dreamsRecorded: 0, realMemoriesRecorded: 0, totalMemories: 0, deepDives: 0, searchCount: 0 });
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);
  const [aureliaSkin, setAureliaSkin] = useState<AureliaSkin>(AureliaSkin.DEFAULT);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [unseenDiaryCount, setUnseenDiaryCount] = useState(0);

  // Atmosphere State
  const [atmosphere, setAtmosphere] = useState<AtmosphereState>({
      fogColor: '#020205',
      fogDensity: 0.012,
      ambientLightColor: '#111122',
      bloomStrength: 1.0
  });

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceEnergy, setVoiceEnergy] = useState(0); // 0.0 to 1.0
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'aurelia',
      text: '我是艾瑞莉亚。星辰正在聆听。你愿意分享来自现实的沉重真相，还是梦境中的转瞬低语？',
      timestamp: Date.now()
    }
  ]);

  // --- INITIALIZATION & SEED ---
  useEffect(() => {
    const seed: Memory[] = [
      { 
        id: '1', 
        content: '我飞过一座完全由彩色玻璃构成的城市。太阳正在落下，街道变成了流动的黄金河流。', 
        type: MemoryType.DREAM, 
        emotion: 0.95, 
        keywords: ['飞行', '玻璃', '黄金', '日落'], 
        timestamp: Date.now(), 
        position: [8, 5, 2] 
      },
      { 
        id: '2', 
        content: '周二下雨的图书馆里旧书的味道。灰尘在灰色的光线中起舞。', 
        type: MemoryType.REAL, 
        emotion: 0.6, 
        keywords: ['书籍', '雨', '怀旧'], 
        timestamp: Date.now() - 100000, 
        position: [-6, 2, -1] 
      },
      {
          id: '5',
          content: '一片深邃黑暗的海洋，寂静沉重。我试图尖叫，但只吐出了气泡。这是遗忘的深渊。',
          type: MemoryType.DREAM, 
          emotion: 0.1,
          keywords: ['海洋', '寂静', '深渊', '恐惧'],
          timestamp: Date.now() - 500000,
          position: [5, -10, 5]
      }
    ];
    setMemories(seed);
    
    // Init Stats
    setUserStats(prev => ({
        ...prev,
        dreamsRecorded: seed.filter(m => m.type === MemoryType.DREAM).length,
        realMemoriesRecorded: seed.filter(m => m.type === MemoryType.REAL).length,
        totalMemories: seed.length
    }));

    // Check Holiday
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();

    if (month === 12 && day >= 21 && day <= 23) {
        setHolidayMode(HolidayMode.WINTER_SOLSTICE);
        setChatHistory(prev => [...prev, { id: generateId(), sender: 'aurelia', text: '冬至已至。长夜漫漫，但我们的余烬依然温暖。', timestamp: Date.now() }]);
    } 
    // Demo: Use a specific date override if needed, or uncomment for testing:
    // setHolidayMode(HolidayMode.WINTER_SOLSTICE);

  }, []);

  // --- ACHIEVEMENT SYSTEM ---
  const checkAchievements = (stats: UserStats) => {
      const newAchievements = [...achievements];
      let unlocked = false;

      // Dreamweaver
      if (stats.dreamsRecorded >= 3 && !newAchievements.find(a => a.id === 'dreamweaver')?.unlocked) {
          const ach = newAchievements.find(a => a.id === 'dreamweaver');
          if (ach) {
              ach.unlocked = true;
              setRecentAchievement(ach);
              if (ach.skinUnlock) setAureliaSkin(ach.skinUnlock);
              unlocked = true;
          }
      }

      // Deep Diver
      if (stats.deepDives >= 1 && !newAchievements.find(a => a.id === 'deepdiver')?.unlocked) {
           const ach = newAchievements.find(a => a.id === 'deepdiver');
           if (ach) {
               ach.unlocked = true;
               setRecentAchievement(ach);
               unlocked = true;
           }
      }

       // Stargazer
       if (stats.searchCount >= 1 && !newAchievements.find(a => a.id === 'stargazer')?.unlocked) {
            const ach = newAchievements.find(a => a.id === 'stargazer');
            if (ach) {
                ach.unlocked = true;
                setRecentAchievement(ach);
                unlocked = true;
            }
       }

      if (unlocked) setAchievements(newAchievements);
  };

  // --- DIARY SYSTEM ---
  const maybeGenerateDiary = async (newStats: UserStats) => {
      // 20% chance to generate a log when stats change
      if (Math.random() > 0.8) {
          const entry = await geminiService.generateDiaryEntry(newStats);
          setDiaryEntries(prev => [entry, ...prev]);
          setUnseenDiaryCount(prev => prev + 1);
      }
  };

  // --- AUDIO & SPEECH SETUP ---
  const toggleListening = async () => {
      if (isListening) {
          stopListening();
      } else {
          startListening();
      }
  };

  const startListening = async () => {
    try {
        // 1. Web Audio API for Visualizer
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const updateEnergy = () => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            
            // Average volume
            let sum = 0;
            for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            const energy = avg / 255; // Normalize 0-1
            
            setVoiceEnergy(energy);
            animationFrameRef.current = requestAnimationFrame(updateEnergy);
        };
        updateEnergy();

        // 2. Speech Recognition for Text
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'zh-CN'; // Changed to Chinese
            
            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                        handleFinalSpeech(finalTranscript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setVoiceTranscript(interimTranscript);
            };

            recognition.start();
            recognitionRef.current = recognition;
        }

        setIsListening(true);
    } catch (err) {
        console.error("Audio Access Error:", err);
        alert("麦克风访问被拒绝或不支持。");
    }
  };

  const stopListening = () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      
      setIsListening(false);
      setVoiceEnergy(0);
      setVoiceTranscript('');
  };

  // --- LOGIC: HANDLE SPEECH COMMANDS ---
  const handleFinalSpeech = async (text: string) => {
      // Clear transcript view
      setVoiceTranscript('');
      
      console.log("Speech Final:", text);

      // Routing logic based on Mode
      if (mode === AppMode.VIEW_MEMORY && activeMemory) {
          // SCULPTING MODE
          // Provide immediate feedback?
          const res = await geminiService.sculptMemory(activeMemory, text);
          
          // Update local memory state with new visuals
          setMemories(prev => prev.map(m => {
              if (m.id === activeMemory.id) {
                  return { ...m, visuals: { ...m.visuals, ...res.visuals } };
              }
              return m;
          }));
          
          // Update active memory reference to reflect changes
          setActiveMemory(prev => prev ? ({ ...prev, visuals: { ...prev.visuals, ...res.visuals } }) : null);

          // Add Aurelia's poetic response to chat history quietly
          setChatHistory(prev => [...prev, { id: generateId(), sender: 'aurelia', text: `[塑形] ${res.poeticResponse}`, timestamp: Date.now() }]);

      } else if (mode === AppMode.EXPLORE || mode === AppMode.SEARCH) {
          // ATMOSPHERE / SOUNDSCAPE MODE
          // "Make it feel like a rainy night"
          const res = await geminiService.generateAtmosphere(text);
          setAtmosphere(res.atmosphere);
          setChatHistory(prev => [...prev, { id: generateId(), sender: 'aurelia', text: `[氛围流转] ${res.poeticResponse}`, timestamp: Date.now() }]);
      }
  };


  // --- STANDARD INTERACTIONS ---

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: generateId(), sender: 'user', text, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);

    const historyForGemini = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const responseText = await geminiService.chatWithAurelia(historyForGemini, text);

    const botMsg: ChatMessage = { id: generateId(), sender: 'aurelia', text: responseText, timestamp: Date.now() };
    setChatHistory(prev => [...prev, botMsg]);
  };

  const handleAddMemory = async (text: string) => {
    // 1. Analyze with Gemini
    const analysis = await geminiService.analyzeMemoryEntry(text);
    
    // 2. Determine Position based on Type
    const isDream = analysis.type === MemoryType.DREAM;
    
    const baseX = isDream ? (Math.random() * 15 + 4) : -(Math.random() * 15 + 4);
    const baseY = (Math.random() * 20) - 5;
    const baseZ = (Math.random() * 8) - 4;

    const newMemory: Memory = {
      id: generateId(),
      content: text,
      type: analysis.type,
      emotion: analysis.emotion,
      keywords: analysis.keywords,
      timestamp: Date.now(),
      position: [baseX, baseY, baseZ]
    };

    setMemories(prev => [...prev, newMemory]);
    
    // Update Stats & Check Achievements
    const newStats = {
        ...userStats,
        totalMemories: userStats.totalMemories + 1,
        dreamsRecorded: userStats.dreamsRecorded + (isDream ? 1 : 0),
        realMemoriesRecorded: userStats.realMemoriesRecorded + (!isDream ? 1 : 0)
    };
    setUserStats(newStats);
    checkAchievements(newStats);
    maybeGenerateDiary(newStats);
  };

  const handleMemoryClick = (memory: Memory) => {
    setActiveMemory(memory);
    setMode(AppMode.VIEW_MEMORY);
    
    // Check for Deep Diver
    if (memory.emotion < 0.2) {
        const newStats = { ...userStats, deepDives: userStats.deepDives + 1 };
        setUserStats(newStats);
        checkAchievements(newStats);
    }
  };

  const handleBackgroundClick = () => {
    if (activeMemory) {
        setActiveMemory(null);
        setMode(AppMode.EXPLORE);
    }
  };

  const handleSetSearchTerm = (term: string) => {
      setSearchTerm(term);
      if (term.length > 3) {
           const newStats = { ...userStats, searchCount: userStats.searchCount + 1 };
           setUserStats(newStats);
           checkAchievements(newStats);
      }
  };

  const handleDiaryOpen = () => {
      setMode(mode === AppMode.DIARY ? AppMode.EXPLORE : AppMode.DIARY);
      if (mode !== AppMode.DIARY) {
          setUnseenDiaryCount(0);
      }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <ButterflyScene 
        memories={memories} 
        onMemoryClick={handleMemoryClick}
        onBackgroundClick={handleBackgroundClick}
        isFocusMode={mode === AppMode.VIEW_MEMORY}
        searchTerm={searchTerm}
        atmosphere={atmosphere}
        voiceEnergy={voiceEnergy}
        holidayMode={holidayMode}
        aureliaSkin={aureliaSkin}
      />
      <UIOverlay 
        mode={mode}
        setMode={(m) => {
            if (m === AppMode.DIARY) handleDiaryOpen();
            else setMode(m);
        }}
        memories={memories}
        chatHistory={chatHistory}
        onSendMessage={handleSendMessage}
        onAddMemory={handleAddMemory}
        activeMemory={activeMemory}
        onCloseMemory={handleBackgroundClick}
        searchTerm={searchTerm}
        setSearchTerm={handleSetSearchTerm}
        isListening={isListening}
        toggleListening={toggleListening}
        voiceTranscript={voiceTranscript}
        voiceEnergy={voiceEnergy}
        diaryEntries={diaryEntries}
        unseenDiaryCount={unseenDiaryCount}
        recentAchievement={recentAchievement}
        clearAchievement={() => setRecentAchievement(null)}
        holidayMode={holidayMode}
      />
    </div>
  );
};

export default App;