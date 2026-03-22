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
  RefreshCw,
  Activity,
  MessageSquareWarning,
  FileText,
  AlertTriangle,
  Upload
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
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [scoreCard, setScoreCard] = useState<ScoreCardData | null>(null);
  const [initialPoll, setInitialPoll] = useState<{for: number, against: number, undecided: number} | null>(null);
  const [isJudging, setIsJudging] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [pressRole, setPressRole] = useState('');
  const [pressInterviewer, setPressInterviewer] = useState('');
  const [displayedTopics, setDisplayedTopics] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [debatePhase, setDebatePhase] = useState<DebatePhase | null>(null);
  const [contextText, setContextText] = useState('');
  const [isRoleSwapped, setIsRoleSwapped] = useState(false);
  const [liveAnalysis, setLiveAnalysis] = useState({ sentiment: 50, hint: 'Waiting for you to speak...', factCheck: null as string | null });
  const [roundAnnouncement, setRoundAnnouncement] = useState<string | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const announceRound = (text: string) => {
    setRoundAnnouncement(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
    setTimeout(() => setRoundAnnouncement(null), 3000);
  };

  const getPhaseTime = (phase: DebatePhase | null) => {
    return phase === 'OPENING' ? 120 : 60;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && mode === 'HOT_TAKE' && !isWaitingForAI && !isSpeaking) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, mode, isWaitingForAI, isSpeaking]);

  useEffect(() => {
    if (timeLeft === 0 && isSessionActive && mode === 'HOT_TAKE') {
      advancePhase();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSessionActive, mode]);

  const advancePhase = () => {
    audioQueue.current = [];
    if (currentAudioNode.current) {
      currentAudioNode.current.stop();
      currentAudioNode.current = null;
    }
    isPlaying.current = false;
    setIsSpeaking(false);
    setIsWaitingForAI(true);
    if (debatePhase === 'OPENING') {
      setDebatePhase('CROSS_EXAM');
      setTimeLeft(60);
      announceRound("Round 2: Cross Examination.");
      liveService.current?.sendText("System: The Opening Statements phase is over. We are now moving to Cross-Examination. Please ask your first direct question to the user.");
      liveService.current?.sendTurnComplete();
    } else if (debatePhase === 'CROSS_EXAM') {
      setDebatePhase('AUDIENCE');
      setTimeLeft(60);
      announceRound("Round 3: Audience Q and A.");
      liveService.current?.sendText("System: Cross-Examination is over. We are now moving to Audience Q&A. Please act as an audience member and ask a challenging question directed at BOTH sides.");
      liveService.current?.sendTurnComplete();
    } else if (debatePhase === 'AUDIENCE') {
      setDebatePhase('CLOSING');
      setTimeLeft(60);
      announceRound("Final Round: Closing Statements.");
      liveService.current?.sendText("System: Audience Q&A is over. We are now moving to Closing Statements. The user will go first. Acknowledge this and wait for their statement.");
      liveService.current?.sendTurnComplete();
    } else if (debatePhase === 'CLOSING') {
      announceRound("Debate Concluded.");
      stopSession();
    }
  };

  const liveService = useRef<GeminiLiveService | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const currentAudioNode = useRef<AudioBufferSourceNode | null>(null);
  const workletNode = useRef<AudioWorkletNode | null>(null);
  const source = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueue = useRef<Int16Array[]>([]);
  const isPlaying = useRef(false);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  useEffect(() => {
    if (!isSessionActive || transcript.length < 2) return;

    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);

    analysisTimeoutRef.current = setTimeout(async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const recent = transcript.slice(-4).map(t => `${t.role === 'user' ? 'HUMAN USER' : 'AI OPPONENT'}: ${t.text}`).join('\n');
        const prompt = `Analyze this ongoing ${mode === 'HOT_TAKE' ? 'debate' : 'interview'}.
        CRITICAL INSTRUCTIONS:
        1. sentiment (0-100): Do NOT guess vibes. Calculate this based strictly on visible causes: Did the HUMAN USER answer the direct question? Did they use fact support? Did they interrupt? Are they aligned with the audience? 50 is neutral.
        2. hint: A short, punchy 1-sentence tactical coaching tip for the HUMAN USER (e.g., "They are dodging, press them on the statistics"). DO NOT give advice to the AI OPPONENT. If the AI OPPONENT just spoke, tell the HUMAN USER how to counter it.
        3. factCheck: EXTREMELY STRICT THRESHOLD. You must pass these gates before triggering:
           - Gate 1: Extract the exact claim made in the last 2 messages.
           - Gate 2: Is it highly specific and externally verifiable? (Numbers, dates, quotes). If it's framing/ideology, ABSTAIN (return null).
           - Gate 3: Does enough objective evidence exist to check it? If no, ABSTAIN.
           If ALL gates pass, return the fact-check string. Otherwise, return null. "No trigger" is the expected outcome for most messages. Silence is better than fake certainty.
        
        Transcript:
        ${recent}`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sentiment: { type: Type.NUMBER },
                hint: { type: Type.STRING },
                factCheck: { type: Type.STRING, nullable: true }
              }
            }
          }
        });
        const data = JSON.parse(response.text);
        setLiveAnalysis(prev => ({
          sentiment: data.sentiment ?? prev.sentiment,
          hint: data.hint || prev.hint,
          factCheck: data.factCheck !== undefined ? data.factCheck : prev.factCheck
        }));
      } catch (err) {
        console.error("Live analysis failed", err);
      }
    }, 3000);

    return () => {
      if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    };
  }, [transcript, isSessionActive, mode]);

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const startSession = async (instruction: string) => {
    console.log("startSession called with instruction:", instruction);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      console.log("Got media stream");
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      await audioContext.current.audioWorklet.addModule('/audio-processor.js');
      console.log("Audio worklet added");

      liveService.current = new GeminiLiveService();
      console.log("GeminiLiveService created");
      await liveService.current.connect({
        systemInstruction: instruction,
        onMessage: (message) => {
          console.log("Message received in App.tsx");
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
            setTranscript(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'ai') {
                // Append chunk to the last AI message
                const newTranscript = [...prev];
                newTranscript[newTranscript.length - 1] = { ...last, text: last.text + text };
                return newTranscript;
              }
              return [...prev, { role: 'ai', text }];
            });
          }

          if (message.serverContent?.inputTranscription?.text) {
            const text = message.serverContent.inputTranscription.text;
            setTranscript(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'user') {
                // Append chunk to the last user message
                const newTranscript = [...prev];
                newTranscript[newTranscript.length - 1] = { ...last, text: last.text + text };
                return newTranscript;
              }
              return [...prev, { role: 'user', text }];
            });
          }

          if (message.serverContent?.interrupted) {
            audioQueue.current = [];
            if (currentAudioNode.current) {
              currentAudioNode.current.stop();
              currentAudioNode.current = null;
            }
            isPlaying.current = false;
            setIsSpeaking(false);
          }

          if (message.serverContent?.turnComplete) {
            setIsWaitingForAI(false);
          }
        },
        onClose: () => setIsSessionActive(false),
        onError: (err) => console.error("Live Error:", err),
      });
      console.log("Connected to GeminiLiveService");

      source.current = audioContext.current.createMediaStreamSource(stream);
      workletNode.current = new AudioWorkletNode(audioContext.current, 'audio-processor');
      
      workletNode.current.port.onmessage = (e) => {
        if (isMutedRef.current) return;
        const base64 = arrayBufferToBase64(e.data);
        liveService.current?.sendAudio(base64);
      };

      source.current.connect(workletNode.current);
      // Connect to a muted gain node to ensure processing without echo
      const gainNode = audioContext.current.createGain();
      gainNode.gain.value = 0;
      workletNode.current.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      setIsSessionActive(true);
      setTranscript([]);
      setScoreCard(null);
      setTimeLeft(mode === 'HOT_TAKE' ? 120 : 60);
      setIsRoleSwapped(false);
      setIsWaitingForAI(mode === 'HOT_TAKE' ? false : true);
      setLiveAnalysis({ sentiment: 50, hint: 'Waiting for you to speak...', factCheck: null });
      
      if (mode === 'HOT_TAKE') {
        const forVal = Math.floor(Math.random() * 30) + 25; // 25-54
        const againstVal = Math.floor(Math.random() * 30) + 25; // 25-54
        const undecidedVal = 100 - forVal - againstVal;
        setInitialPoll({ for: forVal, against: againstVal, undecided: Math.max(0, undecidedVal) });
        announceRound("Round 1: Opening Statements.");
      } else {
        setInitialPoll(null);
        liveService.current?.sendTurnComplete();
      }
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
    setIsWaitingForAI(false);
    const pcmData = audioQueue.current.shift()!;
    // Live API returns audio at 24000Hz
    const buffer = audioContext.current.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }

    const node = audioContext.current.createBufferSource();
    currentAudioNode.current = node;
    node.buffer = buffer;
    node.connect(audioContext.current.destination);
    node.onended = () => {
      if (currentAudioNode.current === node) {
        currentAudioNode.current = null;
      }
      playNextInQueue();
    };
    node.start();
  };

  const stopSession = () => {
    liveService.current?.close();
    workletNode.current?.disconnect();
    source.current?.disconnect();
    audioContext.current?.close();
    if (currentAudioNode.current) {
      currentAudioNode.current.stop();
      currentAudioNode.current = null;
    }
    setIsSessionActive(false);
    setIsSpeaking(false);
    setIsWaitingForAI(false);
    
    if (transcript.length > 2) {
      judgeSession();
    }
  };

  const judgeSession = async () => {
    setIsJudging(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `
        You are a world-class, highly consistent judge for a ${mode === 'HOT_TAKE' ? 'debate' : 'press interview'}.
        Analyze the following transcript and provide a highly specific, actionable score card.
        
        CORE JUDGMENT PRINCIPLES:
        1. Separate "delivered forcefully" from "actually addressed the point". Do NOT reward "confidence theater" or charismatic non-answers. If they dodged the question but sounded good, penalize the dodge heavily.
        2. Maintain stable, objective core judgment regardless of the specific persona or scenario. The truth and logic do not change based on the hat you are wearing. Apply mode-specific flavor on top of a rock-solid logical        CRITICAL: Do NOT provide generic feedback like "Persuasiveness 82". Your feedback MUST be tied to concrete actions in the transcript. 
        Example of good feedback: "You answered directly 6/9 times, used 3 concrete examples, got pinned twice on contradictions."
        Example of bad feedback: "You spoke well and had good points."
        
        Also, use the googleSearch tool to fact-check any specific claims made by either side. If someone lied or used fake stats, explicitly call it out in the feedback.
        
        ${mode === 'HOT_TAKE' && initialPoll ? `
        INTELLIGENCE SQUARED SCORING:
        The initial audience sentiment before the debate was:
        - For (User's side): ${initialPoll.for}%
        - Against (AI's side): ${initialPoll.against}%
        - Undecided: ${initialPoll.undecided}%
        
        Based on the transcript, determine the final audience sentiment. The winner is the side that swayed the most percentage points (the largest positive delta). Include the final poll numbers in your response.
        ` : ''}

        Transcript:
        ${transcript.map(t => `${t.role}: ${t.text}`).join('\n')}
        
        Return a JSON object with:
        - score: number (0-100)
        - metrics: array of { label: string (e.g., "Substance over Style", "Directness", "Evidence"), value: number (0-100), feedback: string (Highly specific, citing exact counts or instances) }
        - summary: string (A brutal, honest assessment of their performance, explicitly noting if they relied on confidence theater)
        - bestLine: string (The exact quote of their strongest moment, optional)
        ${mode === 'HOT_TAKE' ? `- finalPoll: object with { for: number, against: number, undecided: number } (must sum to 100)` : ''}
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
              bestLine: { type: Type.STRING },
              finalPoll: {
                type: Type.OBJECT,
                properties: {
                  for: { type: Type.NUMBER },
                  against: { type: Type.NUMBER },
                  undecided: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      });
      const data = JSON.parse(response.text);
      setScoreCard({
        score: data.score,
        metrics: data.metrics,
        summary: data.summary,
        bestLine: data.bestLine,
        initialPoll: initialPoll || undefined,
        finalPoll: data.finalPoll
      });
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
            <p className="text-zinc-400">Pick a side. AI argues the opposite. 4 phases of pure verbal warfare.</p>
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

  const renderContextInput = (type: 'HOT_TAKE' | 'PRESS_PASS') => {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContextText(prev => prev ? prev + '\n\n' + text : text);
      };
      reader.readAsText(file);
      
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const templates = type === 'HOT_TAKE' ? [
      { label: 'Debate Prep', text: 'My Core Argument: \nKey Evidence/Examples: \nBiggest vulnerability in my argument: ' },
      { label: 'Academic Defense', text: 'Thesis Topic: \nMain Findings: \nAnticipated Criticisms: ' }
    ] : [
      { label: 'Job Interview', text: 'Role applying for: \nCurrent background: \nKey strengths to highlight: \nWeaknesses/Gaps they might ask about: ' },
      { label: 'Product Pitch', text: 'Product/Company Name: \nElevator Pitch: \nTarget Audience: \nPotential criticisms/risks: ' },
      { label: 'Crisis PR', text: 'The Crisis/Issue: \nOur Official Stance: \nInformation we cannot share yet: ' }
    ];

    return (
      <div className={`mb-8 ${type === 'HOT_TAKE' ? 'p-6 bg-zinc-900 border border-zinc-800 rounded-2xl' : ''}`}>
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end mb-3 gap-2">
          <label className="block text-sm font-bold text-zinc-400 flex items-center gap-2">
            <FileText size={16} /> Background Context (Optional)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="file" 
              accept=".txt,.md,.csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1 text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-zinc-300 transition-colors ${type === 'HOT_TAKE' ? 'hover:border-rose-500/50 hover:text-rose-400' : 'hover:border-emerald-500/50 hover:text-emerald-400'}`}
            >
              <Upload size={12} /> Upload File (.txt)
            </button>
            <div className="w-px h-4 bg-zinc-700 mx-1"></div>
            <span className="text-xs text-zinc-500 py-1">Templates:</span>
            {templates.map(t => (
              <button 
                key={t.label}
                onClick={() => setContextText(t.text)}
                className={`text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-zinc-300 transition-colors ${type === 'HOT_TAKE' ? 'hover:border-rose-500/50 hover:text-rose-400' : 'hover:border-emerald-500/50 hover:text-emerald-400'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          placeholder="Paste your resume, press release, or click a template above to fill in the blanks..."
          className={`w-full h-32 ${type === 'HOT_TAKE' ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900 border-zinc-800'} border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors resize-none ${type === 'HOT_TAKE' ? 'focus:border-rose-500' : 'focus:border-emerald-500'}`}
        />
      </div>
    );
  };

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
            {renderContextInput('HOT_TAKE')}

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
Context/Background Info: "${contextText}"
You MUST take the OPPOSITE side of whatever the user argues. 
You will act as both the opponent and occasionally the moderator/audience.

CRITICAL RULES FOR INTERACTION:
1. DO NOT INTERRUPT. The user may pause to think. Wait patiently.
2. ONLY respond when you receive the system message: "System: The user has finished speaking."
3. Keep your arguments concise and punchy.

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
Context/Background Info: "${contextText}"
You MUST take the OPPOSITE side of whatever the user argues. 
You will act as both the opponent and occasionally the moderator/audience.

CRITICAL RULES FOR INTERACTION:
1. DO NOT INTERRUPT. The user may pause to think. Wait patiently.
2. ONLY respond when you receive the system message: "System: The user has finished speaking."
3. Keep your arguments concise and punchy.

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
              
              {renderContextInput('PRESS_PASS')}
              
              <button 
                disabled={!pressRole.trim() || !pressInterviewer.trim()}
                onClick={() => startSession(`You are in Press Pass mode. Scenario: ${selectedScenario.name}. The user is playing the role of: "${pressRole}". You are playing the role of the interviewer: "${pressInterviewer}". Difficulty: ${selectedScenario.difficulty}. ${selectedScenario.description} Context/Background Info: "${contextText}" 
CRITICAL RULES FOR INTERACTION:
1. DO NOT INTERRUPT. The user may pause to think. Wait patiently.
2. ONLY respond when you receive the system message: "System: The user has finished speaking."
Be highly realistic to the specific interviewer's style, mannerisms, and typical questions. Follow up aggressively on weak answers. Start by introducing the show/setting in character and asking the first question.`)}
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
      {/* Round Announcement Overlay */}
      <AnimatePresence>
        {roundAnnouncement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
            className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none bg-black/60 backdrop-blur-sm"
          >
            <h2 className="text-6xl md:text-8xl font-black text-rose-500 uppercase tracking-tighter text-center drop-shadow-[0_0_30px_rgba(244,63,94,0.8)]">
              {roundAnnouncement}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sentiment Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-zinc-900 flex">
        <motion.div 
          className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500"
          animate={{ width: `${liveAnalysis.sentiment}%` }}
          transition={{ type: 'spring', bounce: 0.2 }}
        />
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1 rounded-full bg-zinc-900/80 backdrop-blur border border-zinc-800 text-xs font-bold text-zinc-400">
        <Activity size={14} className={liveAnalysis.sentiment > 50 ? 'text-emerald-500' : 'text-rose-500'} />
        Crowd Sentiment: {liveAnalysis.sentiment}%
      </div>

      {/* Fact Check Alert */}
      <AnimatePresence>
        {liveAnalysis.factCheck && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute top-20 right-8 w-80 p-4 rounded-xl bg-rose-950/80 backdrop-blur border border-rose-500/50 text-rose-200 shadow-2xl z-50"
          >
            <div className="flex items-center gap-2 font-bold text-rose-400 mb-2">
              <AlertTriangle size={16} /> BS Meter Alert
            </div>
            <p className="text-sm leading-relaxed">{liveAnalysis.factCheck}</p>
            <button onClick={() => setLiveAnalysis(prev => ({...prev, factCheck: null}))} className="mt-3 text-xs text-rose-400 hover:text-rose-300 underline">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coach Earpiece */}
      <div className="absolute bottom-8 right-8 w-72 p-4 rounded-xl bg-indigo-950/80 backdrop-blur border border-indigo-500/50 text-indigo-200 shadow-2xl z-50">
        <div className="flex items-center gap-2 font-bold text-indigo-400 mb-2">
          <MessageSquareWarning size={16} /> Live Coach
        </div>
        <p className="text-sm leading-relaxed italic">"{liveAnalysis.hint}"</p>
      </div>

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
            
            <div className="flex gap-4 mt-6">
              <button 
                onClick={advancePhase} 
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
              >
                {debatePhase === 'CLOSING' ? 'Finish Debate' : 'Next Round'} <Play size={14} />
              </button>
            </div>
          </div>
        )}
        <VoiceVisualizer isListening={!isSpeaking} isSpeaking={isSpeaking} volume={0} />
        
        <div className="mt-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {isSpeaking ? 'Gemini is speaking...' : isWaitingForAI ? 'Gemini is thinking...' : 'Your turn. Speak now.'}
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto mb-6">
            {mode === 'HOT_TAKE' ? 'Defend your take with logic and passion.' : 'Stay calm, speak clearly, and answer the question.'}
          </p>
          {!isSpeaking && !isWaitingForAI && (
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => {
                  audioQueue.current = [];
                  if (currentAudioNode.current) {
                    currentAudioNode.current.stop();
                    currentAudioNode.current = null;
                  }
                  isPlaying.current = false;
                  setIsSpeaking(false);
                  setIsWaitingForAI(true);
                  liveService.current?.sendText("System: The user has finished speaking. Please respond immediately.");
                  liveService.current?.sendTurnComplete();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 rounded-full text-sm font-bold text-white transition-colors"
              >
                End Turn <CheckCircle2 size={16} />
              </button>
              {mode === 'HOT_TAKE' && (
                <button 
                  onClick={() => {
                    setIsRoleSwapped(!isRoleSwapped);
                    liveService.current?.sendText(`System: ROLE SWAP! You must now argue the user's original side, and the user will argue your original side. Acknowledge this immediately and make a point for your new side.`);
                    liveService.current?.sendTurnComplete();
                  }}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-colors ${isRoleSwapped ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'}`}
                >
                  <RefreshCw size={16} className={isRoleSwapped ? 'animate-spin' : ''} />
                  {isRoleSwapped ? 'Role Swapped!' : 'Role Swap Curveball'}
                </button>
              )}
            </div>
          )}
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
          End Game & Get Score
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

          {scoreCard?.initialPoll && scoreCard?.finalPoll && (
            <div className="mb-8 p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Intelligence Squared Polling</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-zinc-400 mb-2">BEFORE DEBATE</div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-emerald-500">For</span><span>{scoreCard.initialPoll.for}%</span></div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-rose-500">Against</span><span>{scoreCard.initialPoll.against}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Undecided</span><span>{scoreCard.initialPoll.undecided}%</span></div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-2">AFTER DEBATE</div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-emerald-500">For</span>
                    <span className="font-bold">{scoreCard.finalPoll.for}% <span className="text-xs font-normal">({scoreCard.finalPoll.for - scoreCard.initialPoll.for > 0 ? '+' : ''}{scoreCard.finalPoll.for - scoreCard.initialPoll.for})</span></span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-rose-500">Against</span>
                    <span className="font-bold">{scoreCard.finalPoll.against}% <span className="text-xs font-normal">({scoreCard.finalPoll.against - scoreCard.initialPoll.against > 0 ? '+' : ''}{scoreCard.finalPoll.against - scoreCard.initialPoll.against})</span></span>
                  </div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Undecided</span><span>{scoreCard.finalPoll.undecided}%</span></div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-700/50 text-center">
                <span className="font-bold text-amber-500">
                  {scoreCard.finalPoll.for - scoreCard.initialPoll.for > scoreCard.finalPoll.against - scoreCard.initialPoll.against 
                    ? "🏆 You won the debate by swaying more of the audience!" 
                    : "💀 The AI won the debate by swaying more of the audience."}
                </span>
              </div>
            </div>
          )}

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
