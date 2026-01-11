
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppStep, UserAnswers, LoveResult, SectionScore } from './types';
import { QUESTIONS, LIKERT_SCALE, SECTIONS } from './constants';
import Layout from './components/Layout';
import { generateDeepReport } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.HOME);
  const [userName, setUserName] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [result, setResult] = useState<LoveResult | null>(null);
  const [deepReport, setDeepReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Video Recording States
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(15);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const calculateResults = useCallback(async () => {
    setIsGeneratingReport(true);
    
    const rawTotal = (Object.values(answers) as number[]).reduce((acc: number, curr: number) => acc + curr, 0);
    const scaledScore = rawTotal * 2;

    const sectionScores: SectionScore[] = SECTIONS.map((sectionName) => {
      const sectionQuestions = QUESTIONS.filter(q => q.section === sectionName);
      const sectionSum = sectionQuestions.reduce((acc, q) => acc + (answers[q.id] || 0), 0);
      return {
        name: sectionName,
        score: sectionSum,
        maxScore: 10,
        percentage: (sectionSum / 10) * 100
      };
    });

    let category = "Unknown";
    let colorClass = "bg-neutral-500";
    let accentGradient = "from-neutral-500 to-neutral-700";
    let glowColor = "rgba(115, 115, 115, 0.2)";
    let description = "";

    if (scaledScore >= 85) {
      category = "Resilient & Secure";
      colorClass = "bg-green-500";
      accentGradient = "from-green-400 to-emerald-600";
      glowColor = "rgba(52, 211, 153, 0.3)";
      description = "Your connection is characterized by high mutual trust and emotional availability. You have a fortress of security.";
    } else if (scaledScore >= 70) {
      category = "Stable & Growing";
      colorClass = "bg-emerald-400";
      accentGradient = "from-emerald-400 to-cyan-600";
      glowColor = "rgba(52, 211, 153, 0.2)";
      description = "A solid foundation exists. You are in a 'green zone', but proactive maintenance will keep the structure robust.";
    } else if (scaledScore >= 50) {
      category = "Vulnerable & Precarious";
      colorClass = "bg-yellow-500";
      accentGradient = "from-yellow-400 to-orange-500";
      glowColor = "rgba(251, 191, 36, 0.2)";
      description = "Frequent disconnects or repair failures are stressing the relationship fabric. Attention is required to prevent deeper cracks.";
    } else {
      category = "High Alert & Insecure";
      colorClass = "bg-red-500";
      accentGradient = "from-red-500 to-rose-700";
      glowColor = "rgba(239, 68, 68, 0.3)";
      description = "Significant attachment wounds or chronic conflict patterns require urgent attention. The system is under critical stress.";
    }

    const aiReport = await generateDeepReport(scaledScore, sectionScores, userName);
    setDeepReport(aiReport);

    setResult({
      category,
      score: scaledScore,
      colorClass,
      description,
      advice: "See deep analysis below.",
      sectionScores,
      accentGradient,
      glowColor
    } as any);
    
    setStep(AppStep.REACTION_PROMPT);
    setIsGeneratingReport(false);
  }, [answers, userName]);

  const startRecordingFlow = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep(AppStep.REACTION_RECORDING);
      setCountdown(3);
    } catch (err) {
      console.error("Camera access denied", err);
      setStep(AppStep.RESULTS);
    }
  };

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      startActualRecording();
      setCountdown(null);
    }
  }, [countdown]);

  const startActualRecording = () => {
    if (!canvasRef.current || !videoRef.current || !streamRef.current || !result) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    
    const canvasStream = canvas.captureStream(30);
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      canvasStream.addTrack(audioTrack);
    }

    const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Love-Scanner-Reaction-${userName}.webm`;
      a.click();
      setStep(AppStep.RESULTS);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;

    let startTime = Date.now();
    const duration = 15000;

    const drawFrame = () => {
      if (mediaRecorder.state === 'inactive') return;
      
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 15 - Math.floor(elapsed / 1000));
      setRecordingTimeLeft(remaining);

      if (elapsed >= duration) {
        mediaRecorder.stop();
        return;
      }

      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw Overlay
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 15;
        ctx.fillText(`${result.score}%`, canvas.width / 2, canvas.height - 100);
        
        ctx.font = 'bold 30px Inter, Arial, sans-serif';
        ctx.fillText('STABILITY INDEX', canvas.width / 2, canvas.height - 60);

        ctx.shadowBlur = 0;
        // REC indicator
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(60, 60, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`REC ${remaining}s`, 90, 70);
      }

      requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  const handleDownload = () => {
    if (!result) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Base
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 1200, 630);

    // Dynamic Mesh Gradient Effect on Canvas
    const bgGrad = ctx.createRadialGradient(600, 315, 0, 600, 315, 800);
    bgGrad.addColorStop(0, '#0a0a0a');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Accent glow based on category
    const accentGrad = ctx.createRadialGradient(1000, 100, 0, 1000, 100, 500);
    if (result.score >= 70) {
        accentGrad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    } else if (result.score >= 50) {
        accentGrad.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
    } else {
        accentGrad.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
    }
    accentGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Branding Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Inter, Arial, sans-serif';
    ctx.letterSpacing = "4px";
    ctx.fillText('LOVE SCANNER', 80, 80);
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '500 14px Inter, Arial, sans-serif';
    ctx.letterSpacing = "2px";
    ctx.fillText('STABILITY & ATTACHMENT DIAGNOSTIC', 280, 80);

    // Separator line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 110);
    ctx.lineTo(1120, 110);
    ctx.stroke();

    // User Profile
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 16px Inter, Arial, sans-serif';
    ctx.letterSpacing = "1px";
    ctx.fillText(`PROFILE PREPARED FOR: ${userName.toUpperCase()}`, 80, 150);

    // Main Score Display
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 180px Inter, Arial, sans-serif';
    ctx.letterSpacing = "-5px";
    ctx.fillText(`${result.score}%`, 80, 320);

    // Score Label
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 20px Inter, Arial, sans-serif';
    ctx.letterSpacing = "2px";
    ctx.fillText('STABILITY INDEX', 550, 240);

    // Category Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Inter, Arial, sans-serif';
    ctx.letterSpacing = "-2px";
    ctx.fillText(result.category.toUpperCase(), 80, 390);

    // Dimensional Bar
    ctx.fillStyle = '#111111';
    if (ctx.roundRect) ctx.roundRect(80, 440, 1040, 12, 6); else ctx.fillRect(80, 440, 1040, 12);
    ctx.fill();

    const barGrad = ctx.createLinearGradient(80, 0, 1120, 0);
    barGrad.addColorStop(0, '#ef4444');
    barGrad.addColorStop(0.5, '#f59e0b');
    barGrad.addColorStop(1, '#10b981');
    ctx.fillStyle = barGrad;
    const barWidth = Math.max(20, (result.score / 100) * 1040);
    if (ctx.roundRect) ctx.roundRect(80, 440, barWidth, 12, 6); else ctx.fillRect(80, 440, barWidth, 12);
    ctx.fill();

    // Description
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '300 24px Inter, Arial, sans-serif';
    const words = result.description.split(' ');
    let line = '';
    let y = 500;
    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 1000 && n > 0) {
        ctx.fillText(line, 80, y);
        line = words[n] + ' ';
        y += 40;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 80, y);

    // Domain & Disclaimer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, Arial, sans-serif';
    ctx.letterSpacing = "1px";
    ctx.textAlign = 'right';
    ctx.fillText('lovescanner.io', 1120, 600);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#444444';
    ctx.font = 'bold 12px Inter, Arial, sans-serif';
    ctx.letterSpacing = "1px";
    ctx.fillText('THIS IS A DIAGNOSTIC INSIGHT ONLY. NOT PROFESSIONAL CLINICAL ADVICE.', 80, 600);

    // Trigger Download
    const link = document.createElement('a');
    link.download = `Love-Scanner-Summary-${userName || 'Profile'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Love Scanner - Stability & Attachment Test',
      text: `I just scanned my relationship stability on Love Scanner. See your score too!`,
      url: 'https://www.lovescanner.io',
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText('https://www.lovescanner.io');
        alert('Link copied to clipboard! Share it with your partner.');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQuestionIndex].id]: value };
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setStep(AppStep.ANALYZING);
    }
  };

  useEffect(() => {
    if (step === AppStep.ANALYZING) {
      calculateResults();
    }
  }, [step, calculateResults]);

  const reset = () => {
    setStep(AppStep.HOME);
    setUserName('');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResult(null);
    setDeepReport('');
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.3)]';
    if (percentage >= 60) return 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.2)]';
    if (percentage >= 40) return 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(251,191,36,0.2)]';
    return 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
  };

  const formatReport = (report: string) => {
    const sections = report.split(/(EXECUTIVE SUMMARY|ARCHITECTURAL DEEP DIVE|STRATEGIC RECOMMENDATIONS):/g);
    
    if (sections.length < 2) return <p className="p-4">{report}</p>;

    const elements = [];
    for (let i = 1; i < sections.length; i += 2) {
      const header = sections[i];
      const content = sections[i + 1];
      
      let headerColor = "text-white";
      if (header.includes("EXECUTIVE")) headerColor = "text-emerald-400";
      if (header.includes("DEEP DIVE")) headerColor = "text-amber-400";
      if (header.includes("RECOMMENDATIONS")) headerColor = "text-rose-400";

      const paragraphs = content.trim().split('\n').filter(p => p.trim() !== '');

      elements.push(
        <div key={header} className="mb-14 last:mb-0">
          <h4 className={`text-[10px] font-black uppercase tracking-[0.5em] mb-8 ${headerColor} flex items-center gap-3`}>
            <span className={`w-3 h-0.5 ${headerColor.replace('text-', 'bg-')}`}></span>
            {header}
            <span className="flex-grow h-px bg-neutral-900 ml-2"></span>
          </h4>
          <div className="text-neutral-300 leading-relaxed font-light pl-4 space-y-6 text-base md:text-lg border-l-2 border-neutral-900">
            {paragraphs.map((p, idx) => {
              const trimmed = p.trim();
              const isNumbered = /^\d+\./.test(trimmed);
              const isBullet = /^[•\-]/.test(trimmed);

              if (isNumbered || isBullet) {
                return (
                  <div key={idx} className="flex gap-4 items-start bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <span className={`${headerColor} font-black text-sm pt-0.5`}>{trimmed.split('.')[0]}.</span>
                    <span className="text-neutral-200">{trimmed.replace(/^\d+\.\s*/, '').replace(/^[•\-]\s*/, '')}</span>
                  </div>
                );
              }
              
              return (
                <p key={idx} className="font-light text-neutral-400">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>
      );
    }
    return elements;
  };

  const renderHome = () => (
    <div className="text-center space-y-24 py-12 md:py-20 animate-in fade-in duration-1000 slide-in-from-bottom-12">
      <div className="space-y-12">
        <div className="space-y-4">
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.6em] text-white/40 animate-pulse">Advanced Attachment Diagnostic System</p>
          <h1 className="text-5xl md:text-[8rem] font-[900] tracking-tighter leading-none text-gradient-shimmer drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            LOVE SCANNER
          </h1>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-8 px-4">
          <p className="text-3xl md:text-5xl text-white font-extralight leading-[1.1] tracking-tight">
            "A healthy relationship is a <span className="font-bold italic text-neutral-400 underline decoration-neutral-800 underline-offset-8">structural</span> achievement."
          </p>
          <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-2xl mx-auto font-light border-l-2 border-neutral-900 pl-8 text-left">
            Unlock the structural blueprint of your romantic connection. This scanner evaluates 10 critical dimensions of attachment resilience using peer-reviewed psychological frameworks.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        <button 
          onClick={() => setStep(AppStep.NAME_INPUT)}
          className="group relative px-20 py-8 bg-white text-black font-black uppercase tracking-[0.4em] text-xs transition-all rounded-full shadow-[0_20px_80px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 overflow-hidden"
        >
          <span className="relative z-10">Initiate Full Scan</span>
          <div className="absolute inset-0 bg-neutral-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>

        <button 
          onClick={handleShare}
          className="group relative flex items-center gap-4 px-12 py-5 glass hover:bg-white/10 text-white/70 border border-white/5 rounded-full transition-all font-black uppercase tracking-[0.3em] text-[10px] hover:scale-105 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684m0 2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share the quiz with your partner</span>
        </button>
        
        <div className="flex items-center gap-4 text-neutral-600 font-bold uppercase tracking-widest text-[10px]">
          <span className="w-8 h-px bg-neutral-900"></span>
          Diagnostic Version 2.5.0
          <span className="w-8 h-px bg-neutral-900"></span>
        </div>
      </div>
    </div>
  );

  const renderNameInput = () => (
    <div className="max-w-md mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-700">
      <div className="space-y-4 text-center">
        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em]">Your first name</label>
        <p className="text-[9px] text-neutral-600 uppercase tracking-[0.2em] -mt-2">this name dont have to be real</p>
        <input 
          autoFocus
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="First Name Only"
          className="w-full bg-transparent border-b-2 border-neutral-800 p-6 text-4xl font-black focus:border-white focus:outline-none transition-all text-center placeholder:text-neutral-800"
          onKeyDown={(e) => e.key === 'Enter' && userName && setStep(AppStep.QUESTIONNAIRE)}
        />
      </div>
      <button 
        disabled={!userName}
        onClick={() => setStep(AppStep.QUESTIONNAIRE)}
        className={`w-full py-5 uppercase font-black tracking-[0.3em] text-xs rounded-full transition-all ${userName ? 'bg-white text-black shadow-xl' : 'bg-neutral-900 text-neutral-700 cursor-not-allowed border border-white/5'}`}
      >
        Start assessment
      </button>
    </div>
  );

  const renderQuestionnaire = () => {
    const q = QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;
    
    return (
      <div className="space-y-16 animate-in slide-in-from-right-12 duration-700">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">
            <span className="bg-neutral-900 px-3 py-1 rounded-md border border-white/5">{q.section}</span>
            <span>{currentQuestionIndex + 1} / {QUESTIONS.length}</span>
          </div>
          <div className="h-1 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-700 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="min-h-[220px] flex items-center justify-center px-4">
          <h2 className="text-3xl md:text-5xl font-extralight text-center leading-tight tracking-tight text-white/90">
            "{q.text}"
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-2xl mx-auto">
          {LIKERT_SCALE.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className="group flex items-center justify-between p-7 glass rounded-2xl hover:bg-white/10 transition-all text-left border border-white/5 hover:border-white/20"
            >
              <span className="text-lg font-light text-neutral-400 group-hover:text-white transition-colors">{option.label}</span>
              <div className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center group-hover:border-white/50 group-hover:scale-110 transition-all">
                <div className="w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100"></div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalyzing = () => (
    <div className="text-center py-24 space-y-10">
      <div className="relative mx-auto w-32 h-32">
        <div className="absolute inset-0 border-[6px] border-neutral-900 rounded-3xl"></div>
        <div className="absolute inset-0 border-[6px] border-t-white border-transparent rounded-3xl animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white/50">
          SCAN
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-3xl font-black tracking-tighter animate-pulse">SYNTHESIZING...</h3>
        <p className="text-neutral-500 text-[10px] uppercase tracking-[0.5em] font-bold">Structural Intelligence In Progress</p>
      </div>
    </div>
  );

  const renderReactionPrompt = () => (
    <div className="text-center py-24 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-700">
      <div className="space-y-4">
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter">PREPARING DISCLOSURE</h2>
        <p className="text-neutral-500 text-xs uppercase tracking-[0.4em] font-bold">Diagnostic Evidence Required</p>
      </div>
      <div className="glass p-10 rounded-[3rem] border border-white/5 max-w-2xl mx-auto space-y-8">
        <p className="text-xl font-light leading-relaxed text-neutral-300">
          Would you like to record a <span className="text-white font-bold">15-second reaction video</span> of your final stability score?
        </p>
        <p className="text-sm text-neutral-500 italic">
          The video will be saved locally to your device and your score will be embedded in the frame.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={startRecordingFlow}
            className="py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            Yes, Capture Reaction
          </button>
          <button 
            onClick={() => setStep(AppStep.RESULTS)}
            className="py-5 glass text-white font-black uppercase tracking-widest text-xs rounded-full hover:bg-white/5 transition-all"
          >
            No, Reveal Now
          </button>
        </div>
      </div>
    </div>
  );

  const renderReactionRecording = () => (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="relative w-full max-w-3xl aspect-video rounded-[2rem] overflow-hidden border-4 border-neutral-900 bg-black shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <canvas 
          ref={canvasRef} 
          width={1280} 
          height={720} 
          className="hidden"
        />
        
        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
            <div className="text-9xl font-black text-white animate-ping">
              {countdown}
            </div>
          </div>
        )}

        {/* Recording Overlay UI */}
        {countdown === null && (
            <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse"></div>
                        <span className="text-white font-black uppercase tracking-widest text-lg">REC {recordingTimeLeft}s</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white/60">
                        EVIDENCE MODE
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Confidential Score</span>
                    <span className="text-7xl font-black text-white drop-shadow-2xl">{result?.score}%</span>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] mt-2">STABILITY INDEX</span>
                </div>
            </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black tracking-tighter text-white/80">REACTION EVIDENCE CAPTURE</h3>
        <p className="text-neutral-500 text-[10px] uppercase tracking-[0.5em] font-bold">Subject: {userName}</p>
      </div>
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-black tracking-tighter">DIAGNOSTIC INSIGHTS FAQ</h2>
        <p className="text-neutral-500 text-xs uppercase tracking-[0.2em]">Understanding the Framework</p>
      </div>

      <div className="space-y-6">
        {[
          {
            q: "What is the Love Scanner?",
            a: "It is a structural diagnostic tool that maps the stability of romantic connections using peer-reviewed psychological frameworks: the Gottman Method and Attachment Theory."
          },
          {
            q: "What is the Gottman Method?",
            a: "Developed by Drs. John and Julie Gottman, this framework focuses on the 'Sound Relationship House'—emphasizing emotional responsiveness, repair attempts, and conflict management as key indicators of longevity."
          },
          {
            q: "How does Attachment Theory factor in?",
            a: "Attachment theory explains how we perceive and respond to intimacy. Our test evaluates dimensions of security, anxiousness, and avoidance to determine your core relationship style."
          },
          {
            q: "How accurate is this scan?",
            a: "While highly effective for self-reflection and identifying 'growth zones,' this is a diagnostic aid, not a clinical determination. It provides a snapshot of current relational dynamics."
          },
          {
            q: "Is my data stored?",
            a: "No. The Love Scanner is session-based. Your responses and results exist only within your current browser window and are cleared upon refresh or exit."
          }
        ].map((faq, i) => (
          <div key={i} className="glass p-8 rounded-3xl border border-white/5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/80">{faq.q}</h4>
            <p className="text-neutral-400 font-light leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-6">
        <button 
          onClick={() => setStep(AppStep.HOME)}
          className="px-8 py-4 glass rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
        >
          Back to Insights
        </button>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!result) return null;

    const theme = (result as any);

    return (
      <div className="space-y-16 animate-in fade-in zoom-in-95 duration-1000">
        <div 
          className="glass rounded-[2rem] p-10 md:p-16 overflow-hidden relative border border-white/5 shadow-2xl transition-all duration-1000"
          style={{ boxShadow: `0 20px 80px -20px ${theme.glowColor || 'rgba(0,0,0,0.5)'}` }}
        >
          <div className={`absolute top-0 right-0 h-full w-2.5 bg-gradient-to-b ${theme.accentGradient} opacity-80`}></div>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">Stability Profile for {userName}</span>
                <h2 className={`text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-neutral-500 leading-tight py-2`}>
                  {result.category}
                </h2>
              </div>
              <p className="text-neutral-300 leading-relaxed text-xl font-extralight italic">
                {result.description}
              </p>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black tracking-[0.4em] uppercase text-white/50">
                  <span>Structural Integrity</span>
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r ${theme.accentGradient} font-black`}>{result.score}%</span>
                </div>
                
                <div className="relative group/mainbar cursor-help">
                  <div className="h-6 bg-neutral-950 rounded-full overflow-hidden border border-white/10 p-1 flex items-center">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${theme.accentGradient} rounded-full`}
                      style={{ width: `${result.score}%` }}
                    ></div>
                  </div>
                  
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover/mainbar:opacity-100 transition-all duration-300 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-2xl pointer-events-none whitespace-nowrap z-50 transform group-hover/mainbar:-translate-y-1">
                    {result.score}% INDEX • {result.category}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <h4 className="text-[10px] font-black tracking-[0.4em] uppercase text-neutral-500 border-b border-neutral-900 pb-4">Dimension Metrics</h4>
              <div className="space-y-6">
                {result.sectionScores.map((s) => (
                  <div key={s.name} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest items-center">
                      <span className="max-w-[160px] leading-tight">{s.name}</span>
                      <span className="text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">{s.score}/10</span>
                    </div>
                    <div className="h-2 bg-neutral-950 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-1000 delay-500 ${getBarColor(s.percentage)}`}
                        style={{ width: `${s.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <h3 className="text-3xl font-[900] tracking-tighter flex items-center gap-6 text-white/90">
             <span className="flex-grow h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent"></span>
             STRUCTURAL DEEP REPORT
             <span className="flex-grow h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent"></span>
          </h3>
          <div className="glass rounded-[3rem] p-12 md:p-20 text-neutral-300 border border-white/5 shadow-2xl shadow-black/50">
            {formatReport(deepReport)}
          </div>
        </div>

        <div className="flex flex-col items-center space-y-10 pt-12">
            <div className="w-full flex flex-col items-center gap-6">
                <button 
                  onClick={() => window.open('https://www.buymeacoffee.com/lovescanner', '_blank')}
                  className="group relative flex items-center gap-4 px-12 py-6 bg-[#BD5FFF] hover:bg-[#a64edf] text-white rounded-[2.5rem] transition-all shadow-[0_25px_60px_-10px_rgba(189,95,255,0.4)] font-black uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95"
                >
                  <img src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg" alt="Buy me a coffee" className="w-7 filter invert" />
                  <span>Empower Love, Fuel Coffee</span>
                </button>

                <button 
                  onClick={handleShare}
                  className="group relative flex items-center gap-4 px-12 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[2.5rem] transition-all font-black uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684m0 2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share with your partner</span>
                </button>
            </div>

            <button 
              onClick={handleDownload}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 via-red-500 to-orange-500 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all rounded-full shadow-xl shadow-purple-500/20"
            >
              Download Assessment Summary
            </button>
        </div>
      </div>
    );
  };

  return (
    <Layout 
      onHomeClick={reset} 
      onFaqClick={() => setStep(AppStep.FAQ)}
      showHomeButton={step !== AppStep.HOME && step !== AppStep.FAQ}
    >
      {step === AppStep.HOME && renderHome()}
      {step === AppStep.NAME_INPUT && renderNameInput()}
      {step === AppStep.QUESTIONNAIRE && renderQuestionnaire()}
      {step === AppStep.ANALYZING && renderAnalyzing()}
      {step === AppStep.REACTION_PROMPT && renderReactionPrompt()}
      {step === AppStep.REACTION_RECORDING && renderReactionRecording()}
      {step === AppStep.RESULTS && renderResults()}
      {step === AppStep.FAQ && renderFAQ()}
    </Layout>
  );
};

export default App;
