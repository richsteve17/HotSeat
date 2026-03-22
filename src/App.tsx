import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Mic, 
  Newspaper, 
  Trophy, 
  ArrowLeft, 
  Play, 
  Zap, 
  Radio,
  Star,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { AppMode, HotTakeCategory, PressScenario, ScoreCardData, DebatePhase } from './types';
import { VoiceVisualizer, VoiceControls } from './components/VoiceInterface';
import { GeminiLiveService } from './services/geminiLive';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const CATEGORIES: HotTakeCategory[] = [
  { id: 'sports', name: 'Sports', icon: '🏀', topics: [
    'Esports are not real sports', 
    'College athletes shouldn\'t be paid', 
    'Performance-enhancing drugs should be legalized in pro sports',
    'The NBA regular season is completely meaningless',
    'Tom Brady is just a system quarterback',
    'Golf is a hobby, not a sport',
    'Soccer is boring to watch',
    'Analytics ruined baseball',
    'The Olympics are a waste of money',
    'Participation trophies ruined sports'
  ] },
  { id: 'tech', name: 'Tech', icon: '💻', topics: [
    'AI will inevitably lead to the extinction of humanity', 
    'Social media algorithms are destroying democracy', 
    'Cryptocurrency is a giant Ponzi scheme',
    'Smartphones have ruined an entire generation\'s mental health',
    'We should stop exploring space and fix Earth first',
    'Programmers will be obsolete in 5 years',
    'Virtual reality will never be mainstream',
    'Tech billionaires are modern-day dictators',
    'Open source is a failed experiment',
    'The internet was better in the 90s'
  ] },
  { id: 'culture', name: 'Culture', icon: '🎭', topics: [
    'Cancel culture has gone way too far', 
    'Modern art is a talentless scam for money laundering', 
    'Reality TV is actively making society dumber',
    'The Beatles are the most overrated band in history',
    'Superhero movies have ruined the film industry',
    'Video games are a higher art form than movies',
    'Awards shows are completely meaningless',
    'Nostalgia is holding back pop culture',
    'TikTok is destroying our attention spans',
    'Reading fiction is a waste of time'
  ] },
  { id: 'politics', name: 'Society', icon: '🏛️', topics: [
    'Voting should be mandatory for all citizens', 
    'Universal Basic Income will destroy the economy',
    'Billionaires should not exist',
    'The 4-day work week will make us lazy and less productive',
    'College degrees are mostly a waste of time and money',
    'Remote work is destroying company culture',
    'Socialism is better than capitalism',
    'The legal drinking age should be 18',
    'Taxes on the rich are too high',
    'Public transportation should be free'
  ] },
  { id: 'food', name: 'Food', icon: '🌶️', topics: [
    'Veganism is a privilege, not a moral high ground',
    'A hotdog is a sandwich',
    'Ketchup on steak is a culinary crime',
    'Boneless wings are just chicken nuggets for adults',
    'Tipping culture needs to be abolished completely',
    'Pineapple belongs on pizza',
    'Avocado toast is overrated',
    'Fast food is better than fine dining',
    'Coffee is just bean water',
    'Breakfast is not the most important meal of the day'
  ] },
  { id: 'dating', name: 'Dating', icon: '💔', topics: [
    'Dating apps have ruined modern romance',
    'Marriage is an outdated institution',
    'Men and women can\'t just be platonic friends',
    'Ghosting is a perfectly acceptable way to end things',
    'Splitting the bill on a first date is mandatory',
    'Long distance relationships never work',
    'Monogamy is unnatural',
    'You should never date a coworker',
    'Love at first sight doesn\'t exist',
    'Soulmates are a myth'
  ] },
];

const SCENARIOS: PressScenario[] = [
  { 
    id: 'podcast', 
    name: 'Podcast Guest', 
    description: 'Long-form, unscripted conversations.', 
    difficulty: 'Medium',
    roleLabel: 'Who are you?',
    interviewerLabel: 'Which podcast / host?',
    presets: [
      { role: 'Controversial Tech CEO', interviewer: 'The Joe Rogan Experience' },
      { role: 'Spiritual Guru', interviewer: 'Duncan Trussell Family Hour' },
      { role: 'A-List Actor with a secret', interviewer: 'Call Her Daddy' },
      { role: 'Musician eating spicy wings', interviewer: 'Hot Ones with Sean Evans' }
    ]
  },
  { 
    id: 'media', 
    name: 'Sports Media', 
    description: 'Post-game press conferences and sports shows.', 
    difficulty: 'Easy',
    roleLabel: 'What kind of athlete?',
    interviewerLabel: 'Who is interviewing you?',
    presets: [
      { role: 'Star NBA Player who just blew a 3-1 lead', interviewer: 'First Take with Stephen A. Smith' },
      { role: 'Rookie NFL Quarterback', interviewer: 'Post-game locker room scrum' },
      { role: 'Trash-talking MMA Fighter', interviewer: 'UFC Press Conference' }
    ]
  },
  { 
    id: 'hostile', 
    name: 'Hostile Press', 
    description: 'Hard-hitting, aggressive journalism.', 
    difficulty: 'Hostile',
    roleLabel: 'Who are you?',
    interviewerLabel: 'Who is interviewing you?',
    presets: [
      { role: 'Disgraced Politician', interviewer: 'White House Press Corps' },
      { role: 'Actor in a major scandal', interviewer: 'Barbara Walters' },
      { role: 'Corrupt Billionaire', interviewer: '60 Minutes investigative journalist' }
    ]
  },
  { 
    id: 'job', 
    name: 'Job Interview', 
    description: 'High-pressure corporate interviews.', 
    difficulty: 'Medium',
    roleLabel: 'What role are you applying for?',
    interviewerLabel: 'What company?',
    presets: [
      { role: 'Senior Software Engineer', interviewer: 'Google (Technical & Behavioral)' },
      { role: 'Investment Banker', interviewer: 'Goldman Sachs' },
      { role: 'Creative Director', interviewer: 'High-end fashion brand' }
    ]
  },
];

export default function App() {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [selectedCategory, setSelectedCategory] = useState<HotTakeCategory | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<PressScenario | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [scoreCard, setScoreCard] = useState<ScoreCardData | null>(null);
  const [isJudging, setIsJudging] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [pressRole, setPressRole] = useState('');
  const [pressInterviewer, setPressInterviewer] = useState('');
  const [displayedTopics, setDisplayedTopics] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [debatePhase, setDebatePhase] = useState<DebatePhase | null>(null);

  const getPhaseTime = (phase: DebatePhase | null) => {
    return phase === 'OPENING' ? 120 : 60;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && mode === 'HOT_TAKE' && !isSpeaking) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            liveService.current?.sendText("System: The user's time for this turn is up. Please respond to their points.");
            return getPhaseTime(debatePhase);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isSpeaking) {
      setTimeLeft(getPhaseTime(debatePhase));
    }
    return () => clearInterval(interval);
  }, [isSessionActive, mode, isSpeaking, debatePhase]);

  const advancePhase = () => {
    if (debatePhase === 'OPENING') {
      setDebatePhase('CROSS_EXAM');
      setTimeLeft(60);
      liveService.current?.sendText("System: The Opening Statements phase is over. We are now moving to Cross-Examination. Please ask your first direct question to the user.");
    } else if (debatePhase === 'CROSS_EXAM') {
      setDebatePhase('AUDIENCE');
      setTimeLeft(60);
      liveService.current?.sendText("System: Cross-Examination is over. We are now moving to Audience Q&A. Please act as an audience member and ask a challenging question directed at BOTH sides.");
    } else if (debatePhase === 'AUDIENCE') {
      setDebatePhase('CLOSING');
      setTimeLeft(60);
      liveService.current?.sendText("System: Audience Q&A is over. We are now moving to Closing Statements. The user will go first. Acknowledge this and wait for their statement.");
    } else if (debatePhase === 'CLOSING') {
      stopSession();
    }
  };

  const liveService = useRef<GeminiLiveService | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const processor = useRef<ScriptProcessorNode | null>(null);
  const source = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueue = useRef<Int16Array[]>([]);
  const isPlaying = useRef(false);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async (instruction: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      liveService.current = new GeminiLiveService();
      await liveService.current.connect({
        systemInstruction: instruction,
        onMessage: (message) => {
          if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
            const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
            const binaryString = window.atob(base64Audio);
            const bytes = new Int16Array(binaryString.length / 2);
            for (let i = 0; i < bytes.length; i++) {
              bytes[i] = (binaryString.charCodeAt(i * 2) & 0xFF) | (binaryString.charCodeAt(i * 2 + 1) << 8);
            }
            audioQueue.current.push(bytes);
            if (!isPlaying.current) playNextInQueue();
          }
          
          if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
            const text = message.serverContent.modelTurn.parts[0].text;
            setTranscript(prev => [...prev, { role: 'ai', text }]);
          }

          if (message.serverContent?.interrupted) {
            audioQueue.current = [];
            isPlaying.current = false;
          }
        },
        onClose: () => setIsSessionActive(false),
        onError: (err) => console.error("Live Error:", err),
      });

      source.current = audioContext.current.createMediaStreamSource(stream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);
      
      processor.current.onaudioprocess = (e) => {
        if (isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        liveService.current?.sendAudio(base64);
      };

      source.current.connect(processor.current);
      processor.current.connect(audioContext.current.destination);
      
      setIsSessionActive(true);
      setTranscript([]);
      setScoreCard(null);
      setTimeLeft(mode === 'HOT_TAKE' ? 120 : 60);
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const playNextInQueue = async () => {
    if (audioQueue.current.length === 0 || !audioContext.current) {
      isPlaying.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlaying.current = true;
    setIsSpeaking(true);
    const pcmData = audioQueue.current.shift()!;
    // Live API returns audio at 24000Hz
    const buffer = audioContext.current.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }

    const node = audioContext.current.createBufferSource();
    node.buffer = buffer;
    node.connect(audioContext.current.destination);
    node.onended = playNextInQueue;
    node.start();
  };

  const stopSession = () => {
    liveService.current?.close();
    processor.current?.disconnect();
    source.current?.disconnect();
    audioContext.current?.close();
    setIsSessionActive(false);
    setIsSpeaking(false);
    
    if (transcript.length > 2) {
      judgeSession();
    }
  };

  const judgeSession = async () => {
    setIsJudging(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `
        You are a world-class judge for a ${mode === 'HOT_TAKE' ? 'debate' : 'press interview'}.
        Analyze the following transcript and provide a score card.
        
        CRITICAL: Use the googleSearch tool to fact-check any specific claims made by either side during the transcript. If someone lied or used fake stats, penalize them in the feedback!
        
        Transcript:
        ${transcript.map(t => `${t.role}: ${t.text}`).join('\n')}
        
        Return a JSON object with:
        - score: number (0-100)
        - metrics: array of { label: string, value: number (0-100), feedback: string }
        - summary: string
        - bestLine: string (optional)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  }
                }
              },
              summary: { type: Type.STRING },
              bestLine: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setScoreCard(data);
    } catch (err) {
      console.error("Judging failed:", err);
    } finally {
      setIsJudging(false);
    }
  };

  const renderHome = () => (
    <div className="max-w-4xl mx-auto pt-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent italic">
          THE HOT SEAT
        </h1>
        <p className="text-zinc-400 text-xl font-light">Survive the pressure. Win the argument.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode('HOT_TAKE')}
          className="group relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 text-left transition-all hover:border-rose-500/50"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
              <Zap size={24} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Hot Take Arena</h2>
            <p className="text-zinc-400">Pick a side. AI argues the opposite. 3 rounds of pure verbal warfare.</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode('PRESS_PASS')}
          className="group relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 text-left transition-all hover:border-emerald-500/50"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Newspaper size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
              <Radio size={24} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Press Pass</h2>
            <p className="text-zinc-400">Job interviews, media training, or hostile press. Surviving the questions is the goal.</p>
          </div>
        </motion.button>
      </div>
    </div>
  );

  const renderHotTakeSelection = () => (
    <div className="max-w-4xl mx-auto pt-12 px-6">
      <button onClick={() => setMode('HOME')} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={20} /> Back to Home
      </button>
      <h2 className="text-4xl font-bold mb-8">Choose Your Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat);
              const shuffled = [...cat.topics].sort(() => 0.5 - Math.random());
              setDisplayedTopics(shuffled.slice(0, 5));
            }}
            className={`p-6 rounded-2xl border transition-all text-center ${
              selectedCategory?.id === cat.id ? 'bg-rose-500 border-rose-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span className="text-4xl mb-4 block">{cat.icon}</span>
            <span className="font-bold">{cat.name}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-12"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Pick a Topic</h3>
              <button 
                onClick={() => {
                  const shuffled = [...selectedCategory.topics].sort(() => 0.5 - Math.random());
                  setDisplayedTopics(shuffled.slice(0, 5));
                }} 
                className="flex items-center gap-2 text-rose-500 hover:text-rose-400 font-bold text-sm transition-colors"
              >
                <RefreshCw size={16} /> Refresh Topics
              </button>
            </div>
            <div className="space-y-3">
              {displayedTopics.map(topic => (
                <button
                  key={topic}
                  onClick={() => {
                    setDebatePhase('OPENING');
                    startSession(`You are participating in a structured, formal debate (Intelligence Squared style). 
Topic: "${topic}"
You MUST take the OPPOSITE side of whatever the user argues. 
You will act as both the opponent and occasionally the moderator/audience.

The debate has 4 phases:
1. OPENING STATEMENTS: The user gives their opening statement. You listen, then give your opening statement.
2. CROSS-EXAMINATION: Direct back-and-forth. Keep responses concise and end with a pointed question.
3. AUDIENCE Q&A: You will simulate an audience member asking a tough question to BOTH sides.
4. CLOSING STATEMENTS: The user gives their closing statement, then you give yours.

We are currently in Phase 1: OPENING STATEMENTS. Wait for the user to speak first, then deliver your opening statement.`);
                  }}
                  className="w-full p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 text-left transition-all flex items-center justify-between group"
                >
                  <span className="text-lg">{topic}</span>
                  <Play size={18} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Flame className="text-rose-500" /> Enter Your Own Hot Take</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g., Water is not wet..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
          />
          <button 
            disabled={!customTopic.trim()}
            onClick={() => {
              setDebatePhase('OPENING');
              startSession(`You are participating in a structured, formal debate (Intelligence Squared style). 
Topic: "${customTopic}"
You MUST take the OPPOSITE side of whatever the user argues. 
You will act as both the opponent and occasionally the moderator/audience.

The debate has 4 phases:
1. OPENING STATEMENTS: The user gives their opening statement. You listen, then give your opening statement.
2. CROSS-EXAMINATION: Direct back-and-forth. Keep responses concise and end with a pointed question.
3. AUDIENCE Q&A: You will simulate an audience member asking a tough question to BOTH sides.
4. CLOSING STATEMENTS: The user gives their closing statement, then you give yours.

We are currently in Phase 1: OPENING STATEMENTS. Wait for the user to speak first, then deliver your opening statement.`);
            }}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:hover:bg-rose-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            Debate <Play size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPressPassSelection = () => (
    <div className="max-w-4xl mx-auto pt-12 px-6 pb-24">
      <button 
        onClick={() => {
          if (selectedScenario) {
            setSelectedScenario(null);
            setPressRole('');
            setPressInterviewer('');
          } else {
            setMode('HOME');
          }
        }} 
        className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={20} /> {selectedScenario ? 'Back to Scenarios' : 'Back to Home'}
      </button>
      
      {!selectedScenario ? (
        <>
          <h2 className="text-4xl font-bold mb-8">Select Scenario</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {SCENARIOS.map(scen => (
              <button
                key={scen.id}
                onClick={() => setSelectedScenario(scen)}
                className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-left transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{scen.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    scen.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                    scen.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                    {scen.difficulty}
                  </span>
                </div>
                <p className="text-zinc-400 mb-4">{scen.description}</p>
                <div className="flex items-center gap-2 text-emerald-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Configure <Play size={14} />
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2">{selectedScenario.name}</h2>
            <p className="text-zinc-400">{selectedScenario.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">{selectedScenario.roleLabel}</label>
                <input 
                  type="text" 
                  value={pressRole}
                  onChange={(e) => setPressRole(e.target.value)}
                  placeholder="e.g., Tech CEO, Disgraced Politician..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">{selectedScenario.interviewerLabel}</label>
                <input 
                  type="text" 
                  value={pressInterviewer}
                  onChange={(e) => setPressInterviewer(e.target.value)}
                  placeholder="e.g., Joe Rogan, Barbara Walters..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              
              <button 
                disabled={!pressRole.trim() || !pressInterviewer.trim()}
                onClick={() => startSession(`You are in Press Pass mode. Scenario: ${selectedScenario.name}. The user is playing the role of: "${pressRole}". You are playing the role of the interviewer: "${pressInterviewer}". Difficulty: ${selectedScenario.difficulty}. ${selectedScenario.description} Be highly realistic to the specific interviewer's style, mannerisms, and typical questions. Follow up aggressively on weak answers. Start by introducing the show/setting in character and asking the first question.`)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                Enter the Hot Seat <Mic size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Quick Presets</h3>
              <div className="space-y-3">
                {selectedScenario.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPressRole(preset.role);
                      setPressInterviewer(preset.interviewer);
                    }}
                    className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-left transition-all group"
                  >
                    <div className="text-sm font-bold text-white mb-1">{preset.role}</div>
                    <div className="text-xs text-emerald-500">vs. {preset.interviewer}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderActiveSession = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6">
      <div className="absolute top-8 left-8">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800">
          <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-rose-500 animate-pulse' : 'bg-zinc-700'}`} />
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">
            {mode === 'HOT_TAKE' ? 'Arena Live' : 'Interview in Progress'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
        {mode === 'HOT_TAKE' && (
          <div className="mb-12 flex flex-col items-center w-full">
            <div className="flex flex-wrap justify-center items-center gap-2 mb-6 w-full max-w-lg">
              <span className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${debatePhase === 'OPENING' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>1. Opening</span>
              <div className="w-4 h-[1px] bg-zinc-800" />
              <span className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${debatePhase === 'CROSS_EXAM' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>2. Cross-Exam</span>
              <div className="w-4 h-[1px] bg-zinc-800" />
              <span className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${debatePhase === 'AUDIENCE' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>3. Audience Q&A</span>
              <div className="w-4 h-[1px] bg-zinc-800" />
              <span className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${debatePhase === 'CLOSING' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>4. Closing</span>
            </div>
            
            <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">
              {debatePhase === 'OPENING' ? 'Opening Statement (2 Min)' : 'Round Timer (1 Min)'}
            </div>
            <div className={`text-7xl font-black font-mono tracking-tighter ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            
            <button 
              onClick={advancePhase} 
              className="mt-6 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
            >
              {debatePhase === 'CLOSING' ? 'Finish Debate' : 'Advance to Next Phase'} <Play size={14} />
            </button>
          </div>
        )}
        <VoiceVisualizer isListening={!isSpeaking} isSpeaking={isSpeaking} volume={0} />
        
        <div className="mt-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {isSpeaking ? 'Gemini is speaking...' : 'Your turn. Speak now.'}
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto">
            {mode === 'HOT_TAKE' ? 'Defend your take with logic and passion.' : 'Stay calm, speak clearly, and answer the question.'}
          </p>
        </div>

        <div className="mt-12 w-full max-h-48 overflow-y-auto space-y-4 px-4 scrollbar-hide">
          {transcript.slice(-3).map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl ${t.role === 'ai' ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-800 text-white ml-auto max-w-[80%]'}`}
            >
              <p className="text-sm">{t.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pb-12 flex flex-col items-center gap-6">
        <VoiceControls 
          isActive={isSessionActive} 
          isMuted={isMuted} 
          onToggleActive={stopSession} 
          onToggleMute={() => setIsMuted(!isMuted)} 
        />
        <button 
          onClick={stopSession}
          className="px-8 py-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold hover:text-white transition-colors"
        >
          End Session & Get Score
        </button>
      </div>
    </div>
  );

  const renderScoreCard = () => (
    <div className="max-w-2xl mx-auto pt-12 pb-24 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-8">
          <Trophy size={80} className="text-amber-500 opacity-10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-4xl font-black italic">
              {scoreCard?.score}
            </div>
            <div>
              <h2 className="text-3xl font-bold">Session Complete</h2>
              <p className="text-zinc-400">Final Score Card</p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {scoreCard?.metrics.map((m, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-zinc-300">{m.label}</span>
                  <span className="text-amber-500 font-mono">{m.value}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${m.value}%` }}
                    className="h-full bg-amber-500"
                  />
                </div>
                <p className="text-sm text-zinc-500 mt-2">{m.feedback}</p>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Judge's Summary</h3>
            <p className="text-zinc-300 leading-relaxed">{scoreCard?.summary}</p>
          </div>

          {scoreCard?.bestLine && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-8 italic text-rose-500">
              "{scoreCard.bestLine}"
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={() => {
                setMode('HOME');
                setScoreCard(null);
              }}
              className="flex-1 py-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
            >
              Play Again
            </button>
            <button className="px-6 py-4 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors">
              Share
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-rose-500/30">
      <AnimatePresence mode="wait">
        {isJudging ? (
          <motion.div 
            key="judging"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[60]"
          >
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-bold italic">JUDGING YOUR PERFORMANCE...</h2>
          </motion.div>
        ) : scoreCard ? (
          renderScoreCard()
        ) : isSessionActive ? (
          renderActiveSession()
        ) : mode === 'HOME' ? (
          renderHome()
        ) : mode === 'HOT_TAKE' ? (
          renderHotTakeSelection()
        ) : (
          renderPressPassSelection()
        )}
      </AnimatePresence>
    </div>
  );
}
