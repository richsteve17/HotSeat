# 🎙️ The Hot Seat: Verbal Sparring & Media Training Simulator

A real-time, voice-driven application powered by the **Gemini Live API** that helps you master the art of debate, handle high-pressure interviews, and refine your public speaking skills.

## ✨ Features

### ⚡ Advanced AI Features (New!)
* **📄 Context Upload**: Paste your resume, a press release, or upload a `.txt` file before a session. The AI will read it and grill you specifically on your own material!
* **📈 Live Audience Sentiment Dial**: A dynamic, real-time meter that shifts based on *visible, measurable actions* (answering direct questions, citing facts, avoiding interruptions) rather than just "vibes".
* **💡 Live Earpiece (Real-Time Coach)**: A secondary AI constantly analyzes the transcript and whispers 1-sentence tactical hints to you (e.g., "They are dodging the question, press them on the statistics!").
* **🚨 Real-Time Fact-Checking (BS Meter)**: A highly disciplined fact-checker with a strict gating mechanism. It only triggers on highly specific, verifiable claims (numbers, dates, quotes) and abstains on debatable framing. Silence is better than fake certainty.
* **🔄 Role Swap Curveball**: In the Hot Take Arena, click the "Role Swap" button at any time to force the AI to argue *your* side, while you take *theirs*.

### 🥊 Hot Take Arena (Structured Debate)
Engage in formal, Intelligence Squared-style debates against an AI opponent that dynamically adapts to your arguments.
* **4 Structured Phases**:
  1. **Opening Statements (2 Min)**: Lay out your core arguments.
  2. **Cross-Examination (1 Min)**: Rapid back-and-forth direct questioning.
  3. **Audience Q&A (1 Min)**: The AI simulates a tough audience member asking a question to both sides.
  4. **Closing Statements (1 Min)**: Summarize your points and deliver a strong finish.
* **Dynamic Timers**: Visual countdowns keep the pressure on. If time runs out, the system automatically prompts the AI to respond.
* **Diverse Topics**: Choose from dozens of randomized topics across Sports, Tech, Culture, Society, Food, and Dating, or input your own custom hot take.

### 📸 Press Pass (Media Training)
Step into the hot seat and face realistic, high-pressure interview scenarios.
* **Custom Personas**: Define exactly *who you are* (e.g., "Disgraced Politician", "Tech CEO") and *who is interviewing you* (e.g., "Hostile Press Corps", "Joe Rogan").
* **Scenarios**:
  * **Podcast Guest**: Long-form, unscripted conversations.
  * **Sports Media**: Post-game press conferences and locker room scrums.
  * **Hostile Press**: Hard-hitting, aggressive investigative journalism.
  * **Job Interview**: High-pressure corporate behavioral and technical interviews.
* **Quick Presets**: Jump straight into fun, pre-configured scenarios.

### 🧠 Real-Time Voice & Analysis
* **Gemini Live API Integration**: Seamless, ultra-low latency voice conversations using the `@google/genai` SDK.
* **High-Performance Audio Pipeline**: Utilizes `AudioWorkletNode` for off-main-thread audio processing, preventing UI jank during intense sessions.
* **Full Transcriptions**: Captures and displays both AI and User speech transcripts in real-time.
* **Voice Visualizer**: Real-time visual feedback for speaking and listening states.
* **Post-Session Scorecard**: Get brutally honest, highly specific feedback tied to concrete actions in the transcript. The rubric strictly penalizes "confidence theater" (charismatic non-answers) and maintains stable, objective core judgment across all personas and scenarios.

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* A Gemini API Key with access to the Gemini Live API (`gemini-2.5-flash-native-audio-preview-12-2025`)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   *Note: For production deployments, it is highly recommended to proxy API requests through a backend server to secure your API key.*

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## 🛠️ Tech Stack

* **Frontend Framework**: React 18 with TypeScript
* **Build Tool**: Vite
* **Styling**: Tailwind CSS
* **Animations**: Framer Motion (`motion/react`)
* **Icons**: Lucide React
* **AI Integration**: `@google/genai` (Gemini Live API)
* **Audio Processing**: Web Audio API (`AudioWorkletNode` for high-performance, non-blocking PCM data extraction)

## 📁 Project Structure

* `/src/components`: Reusable UI components (VoiceVisualizer, ScoreCard, etc.)
* `/src/services`: Core business logic and API integrations (`geminiLive.ts`)
* `/public/audio-processor.js`: AudioWorklet processor for off-thread audio handling
* `/src/types.ts`: TypeScript interfaces and type definitions
* `/src/App.tsx`: Main application component, routing, and state management
* `/src/index.css`: Global styles and Tailwind configuration

## 🎮 How to Play

1. **Grant Microphone Access**: The app requires microphone permissions to communicate with the Gemini Live API.
2. **Select a Mode**: Choose between "Hot Take Arena" and "Press Pass" on the home screen.
3. **Configure your Session**: Pick a topic or set up your interview personas.
4. **Start Speaking**: The AI will listen and respond in real-time. Use the phase controls (in Hot Take mode) to advance the debate.
5. **End Session**: Click "End Session" to receive your personalized scorecard and feedback.

## 📝 Recent Technical Improvements

* **AudioWorklet Migration**: Upgraded from the deprecated `ScriptProcessorNode` to `AudioWorkletNode` to ensure smooth, jank-free performance by processing audio off the main thread.
* **Robust Base64 Encoding**: Implemented a chunked array buffer to Base64 encoder, preventing call stack size exceeded errors on large audio buffers.
* **Live State Management**: Fixed stale closure issues in audio processing callbacks using React refs for real-time mute toggling.
* **Comprehensive Transcriptions**: Enabled and integrated both `inputAudioTranscription` and `outputAudioTranscription` to ensure the judging pipeline has full context of both sides of the conversation.
