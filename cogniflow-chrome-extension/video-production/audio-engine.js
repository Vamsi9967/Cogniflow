/**
 * CogniFlow Audio Engine
 * Synchronizes soundtrack audio, sound effects, and voice-over with the 35s motion timeline.
 * Connects to Web Audio MediaStreamDestination for video export.
 */
class CogniFlowAudioEngine {
  constructor() {
    this.ctx = null;
    this.audioElement = null;
    this.audioSourceNode = null;
    this.mediaStreamDestination = null;
    this.masterGain = null;
    this.isLoaded = false;
    this.isPlaying = false;
    this.voEnabled = true;
    this.synthVoice = null;
    this.lastVoTimestamp = -1;

    // VO Script Lines mapped to timestamps
    this.voScript = [
      { start: 0.4, text: "Every day, we switch between tools, tabs, and endless interruptions." },
      { start: 4.5, text: "And somewhere along the way, we lose our context." },
      { start: 8.6, text: "What if your browser could remember where your brain left off?" },
      { start: 12.6, text: "Meet CogniFlow — your AI workflow memory." },
      { start: 18.2, text: "It remembers context, summarizes progress, and helps you resume unfinished work." },
      { start: 25.4, text: "Less time rebuilding your thoughts. More time doing meaningful work." },
      { start: 30.6, text: "CogniFlow. Your work, remembered." }
    ];
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;

    // Export stream destination for video recording
    this.mediaStreamDestination = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.mediaStreamDestination);

    // Audio element for pre-rendered 35s PCM soundtrack
    this.audioElement = new Audio('assets/soundtrack.wav');
    this.audioElement.preload = 'auto';

    this.audioElement.addEventListener('canplaythrough', () => {
      this.isLoaded = true;
      console.log('CogniFlow soundtrack loaded successfully.');
    });

    try {
      this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.audioSourceNode.connect(this.masterGain);
    } catch (e) {
      console.warn('Audio node connection deferred:', e);
    }

    // Initialize Web Speech voice
    if ('speechSynthesis' in window) {
      const pickVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer natural English voices
        this.synthVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David'))) || voices.find(v => v.lang.startsWith('en'));
      };
      pickVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = pickVoice;
      }
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playAt(timeInSeconds) {
    this.ensureContext();
    if (this.audioElement) {
      this.audioElement.currentTime = timeInSeconds;
      this.audioElement.play().catch(e => console.log('Audio autoplay prevented:', e));
    }
    this.isPlaying = true;
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
  }

  seek(timeInSeconds) {
    if (this.audioElement) {
      this.audioElement.currentTime = timeInSeconds;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.lastVoTimestamp = timeInSeconds;
  }

  update(currentTime) {
    if (!this.isPlaying || !this.voEnabled) return;

    // Check voice-over cues
    for (const cue of this.voScript) {
      if (currentTime >= cue.start && this.lastVoTimestamp < cue.start && currentTime < (cue.start + 1.2)) {
        this.speak(cue.text);
        this.lastVoTimestamp = cue.start + 0.1;
        break;
      }
    }
  }

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.synthVoice) utterance.voice = this.synthVoice;
      utterance.rate = 0.98; // Calm, measured SaaS commercial pacing
      utterance.pitch = 1.0;
      utterance.volume = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  getAudioStream() {
    this.ensureContext();
    return this.mediaStreamDestination ? this.mediaStreamDestination.stream : null;
  }
}

window.audioEngine = new CogniFlowAudioEngine();
