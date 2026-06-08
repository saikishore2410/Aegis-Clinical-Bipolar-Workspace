import React, { useState, useEffect } from 'react';
import { BipolarLog } from '../types';
import { Sparkles, Hourglass, ShieldAlert, Heart, RefreshCw, AlertTriangle, Pill } from 'lucide-react';

interface SpeedCappedLoggerProps {
  onSaveLog: (logData: Partial<BipolarLog>) => void;
  isEscrowActive: boolean;
}

export function SpeedCappedLogger({ onSaveLog, isEscrowActive }: SpeedCappedLoggerProps) {
  // Balanced manic parameters
  const [mood, setMood] = useState<number>(7);
  const [anxiety, setAnxiety] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(7);
  const [sleepDuration, setSleepDuration] = useState<number>(6.5);
  const [sleepDisruption, setSleepDisruption] = useState<'none' | 'mild' | 'severe'>('none');
  const [steps, setSteps] = useState<number>(10000);
  const [zonalta, setZonalta] = useState<boolean>(true);
  const [endoxifen, setEndoxifen] = useState<boolean>(true);
  const [medNotes, setMedNotes] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);

  // Friction state
  const [showFrictionScreen, setShowFrictionScreen] = useState<boolean>(false);
  const [breathCount, setBreathCount] = useState<number>(4);
  const [breathInstruction, setBreathInstruction] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [isBreathingDone, setIsBreathingDone] = useState<boolean>(false);
  const [submittingLock, setSubmittingLock] = useState<boolean>(false);

  const availableSideEffects = ["Tremor", "Nausea", "Headache", "Dry Mouth", "Drowsiness"];

  useEffect(() => {
    let timer: any;
    if (showFrictionScreen && breathCount > 0) {
      timer = setTimeout(() => {
        setBreathCount(prev => prev - 1);
        if (breathCount === 4) setBreathInstruction('Hold');
        if (breathCount === 2) setBreathInstruction('Exhale');
      }, 1200);
    } else if (showFrictionScreen && breathCount === 0) {
      setIsBreathingDone(true);
    }
    return () => clearTimeout(timer);
  }, [showFrictionScreen, breathCount]);

  const toggleSideEffect = (effect: string) => {
    setSelectedSideEffects(prev =>
      prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect]
    );
  };

  const handleTriggerSubmissionCheck = (e: React.FormEvent) => {
    e.preventDefault();
    // Intercept with physical/behavioral cooling friction
    setBreathCount(4);
    setBreathInstruction('Inhale');
    setIsBreathingDone(false);
    setShowFrictionScreen(true);
  };

  const handleFinalSubmit = () => {
    setSubmittingLock(true);
    setTimeout(() => {
      onSaveLog({
        mood,
        anxiety,
        energy,
        sleepDuration,
        sleepDisruption,
        steps,
        medicationCompliance: {
          zonaltaTaken: zonalta,
          endoxifenTaken: endoxifen,
          notes: medNotes || "Logged in Speed-Capped focus mode"
        },
        sideEffects: selectedSideEffects,
        notes: notes || "Daily entry submitted under Speed-Capped cognitive friction gates.",
        loggedAtMode: "manic"
      });
      setSubmittingLock(false);
      setShowFrictionScreen(false);
    }, 1500); // Artificial delay to slow down user
  };

  return (
    <div className="relative">
      
      {/* Visual cooling grid layout */}
      <form onSubmit={handleTriggerSubmissionCheck} className="space-y-6">
        
        {/* Grounding Advisory */}
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl flex items-start gap-3 animate-fade-in">
          <div className="p-1 px-1.5 bg-sky-100 border border-sky-300 rounded text-sky-700 font-mono text-[9px] font-bold shrink-0">
            CAPPED
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800 font-display">
              Impulse-Control Guided Layout active
            </h4>
            <p className="text-[11px] text-stone-600 font-sans leading-relaxed">
              This panel deploys strict structural grids and active timers to guard against overstimulated touch velocity. Please declare details intentionally.
            </p>
          </div>
        </div>

        {/* Structured Slate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Mood 1 to 10 Gauge */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <span className="block text-[10px] font-mono tracking-widest text-stone-500 uppercase">
              Metric 01 / Clinical Mood
            </span>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-600 font-sans">Level of Elation:</span>
              <span className="text-base font-bold font-mono text-amber-600">{mood} <span className="text-xs text-stone-400">/10</span></span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[9px] text-stone-500 font-sans">
              <span>Severe Depression (1)</span>
              <span>Mild (5)</span>
              <span>Extreme Mania (10)</span>
            </div>
          </div>

          {/* Anxiety Scale */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <span className="block text-[10px] font-mono tracking-widest text-stone-500 uppercase">
              Metric 02 / Somatic Anxiety
            </span>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-600 font-sans">Agitation Rating:</span>
              <span className="text-base font-bold font-mono text-pink-600">{anxiety} <span className="text-xs text-stone-400">/10</span></span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={anxiety}
              onChange={(e) => setAnxiety(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[9px] text-stone-500 font-sans">
              <span>Peaceful / Calm</span>
              <span>Restless</span>
              <span>Severe Panic</span>
            </div>
          </div>

          {/* Cognitive Energy level */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <span className="block text-[10px] font-mono tracking-widest text-stone-500 uppercase">
              Metric 03 / Kinetic Energy
            </span>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-600 font-sans">Executive Power:</span>
              <span className="text-base font-bold font-mono text-sky-600">{energy} <span className="text-xs text-stone-400">/10</span></span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[9px] text-stone-500 font-sans">
              <span>Catatonic Fatigue</span>
              <span>Steady</span>
              <span>Hyperactive</span>
            </div>
          </div>

        </div>

        {/* Telemetry inputs: sleep & steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Smartwatch sleep simulation */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <label className="block text-[10px] font-mono tracking-widest text-stone-500 uppercase">
              Automated Telemetry: Sleep Logged
            </label>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-600 font-sans">Duration in hours:</span>
              <span className="text-sm font-bold font-mono text-teal-600">{sleepDuration} hrs</span>
            </div>
            <input
              type="number"
              step="0.1"
              value={sleepDuration}
              onChange={(e) => setSleepDuration(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm font-mono text-stone-800 focus:outline-none focus:border-teal-500"
            />
            {sleepDuration < 5 && (
              <div className="text-[10px] text-red-650 flex items-center gap-1 font-semibold leading-none">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>Values under 5h may trigger active escrows.</span>
              </div>
            )}
          </div>

          {/* Smartwatch steps */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <label className="block text-[10px] font-mono tracking-widest text-stone-500 uppercase">
              Passive Telemetry: Step Count
            </label>
            <div className="flex justify-between items-center">
              <span className="text-xs text-stone-600 font-sans">Daily physical steps:</span>
              <span className="text-sm font-bold font-mono text-stone-700">{steps.toLocaleString()}</span>
            </div>
            <input
              type="number"
              value={steps}
              onChange={(e) => setSteps(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm font-mono text-stone-800 focus:outline-none focus:border-teal-500"
            />
          </div>

        </div>

        {/* Medication Compliance ledger */}
        <div className="p-4 bg-stone-50/50 border border-stone-200 rounded-xl space-y-4">
          <span className="block text-[10px] font-mono tracking-widest text-stone-500 uppercase">
            Medication Compliance Audit
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setZonalta(prev => !prev)}
              className={`p-3 rounded-lg border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                zonalta ? 'bg-indigo-50 border-indigo-250 text-indigo-750' : 'bg-white border-stone-200 text-stone-400'
              }`}
            >
              <span className="font-semibold uppercase tracking-wider">Zonalta taken today</span>
              <span className="font-mono text-[9px] px-1 bg-stone-100 rounded">{zonalta ? 'YES' : 'SKIP'}</span>
            </button>
            <button
              type="button"
              onClick={() => setEndoxifen(prev => !prev)}
              className={`p-3 rounded-lg border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                endoxifen ? 'bg-indigo-50 border-indigo-250 text-indigo-750' : 'bg-white border-stone-200 text-stone-400'
              }`}
            >
              <span className="font-semibold uppercase tracking-wider">Endoxifen taken today</span>
              <span className="font-mono text-[9px] px-1 bg-stone-100 rounded">{endoxifen ? 'YES' : 'SKIP'}</span>
            </button>
          </div>

          <div className="space-y-3 pt-2 border-t border-stone-200">
            <label className="block text-[10px] font-mono text-stone-500 uppercase">
              Identify side effects experienced:
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSideEffects.map((effect) => {
                const isSelected = selectedSideEffects.includes(effect);
                return (
                  <button
                    key={effect}
                    type="button"
                    onClick={() => toggleSideEffect(effect)}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF5FF] border-blue-300 text-blue-700'
                        : 'bg-white border-stone-200 text-stone-500'
                    }`}
                  >
                    {effect}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Written Notes */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
          <label className="block text-[10px] font-mono tracking-widest text-stone-500 uppercase">
            Written Diary Entry Remarks
          </label>
          <textarea
            rows={3}
            placeholder="Document your stream-of-consciousness thoughts here. Grounding is key..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-lg p-3 text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none focus:border-teal-500 leading-relaxed resize-none"
          />
        </div>

        {/* Trigger check button */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 border border-sky-400/20 text-white font-bold font-sans rounded-xl text-xs uppercase tracking-widest cursor-pointer active:scale-98 transition-all"
          >
            🔒 Proceed to Coherence Gate Check
          </button>
        </div>

      </form>

      {/* Speed-Cap / Friction overlay screen */}
      {showFrictionScreen && (
        <div className="absolute inset-0 bg-[#FAF9F6] backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-30 border border-stone-200 animate-fade-in">
          
          <div className="max-w-md space-y-6">
            
            {/* Hourglass spinner */}
            <div className="flex justify-center">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-full animate-meditation-pulse">
                <Hourglass className="w-8 h-8 text-sky-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-sky-850 font-display uppercase tracking-wider">
                Physical Cooling Friction Gate
              </h4>
              <p className="text-xs text-stone-605 font-sans leading-relaxed">
                Manic or racing states produce hyperactivity and overactive impulses. As part of clinical safety protocols, please perform a 4-second biological breathing trace to authorize log verification.
              </p>
            </div>

            {/* Breathing Visual Circle */}
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="w-24 h-24 rounded-full border-4 border-sky-200/50 flex items-center justify-center relative">
                
                {/* Simulated contract/expand ring */}
                <div className={`absolute rounded-full bg-sky-500/10 transition-all duration-1000 ${
                  breathInstruction === 'Inhale' ? 'w-20 h-20 opacity-40 scale-110' :
                  breathInstruction === 'Hold' ? 'w-22 h-22 opacity-70 scale-120' :
                  'w-12 h-12 opacity-20 scale-95'
                }`} />

                <div className="text-center">
                  <span className="block text-[10px] font-bold text-sky-700 uppercase tracking-widest font-mono">
                    {breathInstruction}
                  </span>
                  <span className="block text-2xl font-bold font-mono text-stone-850 mt-1">
                    {breathCount}
                  </span>
                </div>

              </div>
              <p className="text-[10px] text-stone-400 font-sans uppercase tracking-wide">
                Breathe following the expanding indicator
              </p>
            </div>

            {/* Actions once breathing is complete */}
            {isBreathingDone ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-xs leading-normal text-teal-800 font-sans text-center">
                  ✔️ Coherence check validated. Breathing trace successfully completed. You may now commit the state securely.
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFrictionScreen(false)}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    Cancel Log
                  </button>
                  <button
                    type="button"
                    disabled={submittingLock}
                    onClick={handleFinalSubmit}
                    className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg cursor-pointer transition-all flex justify-center items-center gap-1.5"
                  >
                    {submittingLock ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Authorize Secure Log'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-stone-450 font-mono">
                [Biometric friction validator running...]
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
