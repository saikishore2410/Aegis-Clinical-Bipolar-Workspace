import React, { useState } from 'react';
import { BipolarLog } from '../types';
import { Pill, Sun, Moon, Sparkles, Check, HelpCircle } from 'lucide-react';

interface LowEnergyLoggerProps {
  onSaveLog: (logData: Partial<BipolarLog>) => void;
  isEscrowActive: boolean;
}

export function LowEnergyLogger({ onSaveLog, isEscrowActive }: LowEnergyLoggerProps) {
  // Simple states
  const [mood, setMood] = useState<number>(3); // Default low-neutral mood
  const [sleepBand, setSleepBand] = useState<'low' | 'normal' | 'high'>('normal');
  const [zonalta, setZonalta] = useState<boolean>(true);
  const [endoxifen, setEndoxifen] = useState<boolean>(true);
  
  // Minimal side effects checklist
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const commonEffects = ["Dry Mouth", "Drowsiness", "Headache", "Tremor"];

  const toggleEffect = (effect: string) => {
    setSideEffects(prev =>
      prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mapping sleep band to logical hours for clinical telemetry backend
    let hours = 7.5;
    if (sleepBand === 'low') hours = 4.2;
    if (sleepBand === 'high') hours = 9.5;

    onSaveLog({
      mood,
      anxiety: 5, // Preset to normal baseline so brain doesn't have to choose
      energy: mood, // Energy aligns with mood rating in low-energy state
      sleepDuration: hours,
      sleepDisruption: sleepBand === 'low' ? 'severe' : 'none',
      steps: sleepBand === 'low' ? 3500 : 6500, // standard resting estimations
      medicationCompliance: {
        zonaltaTaken: zonalta,
        endoxifenTaken: endoxifen,
        notes: "Logged in Low-Energy quick access state"
      },
      sideEffects,
      notes: "Quick check-in completed via Low-Energy depressive UI layout",
      loggedAtMode: "depressive"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-1 md:p-2 space-y-6">
      
      {/* Visual Ambiance / Low sensory Header */}
      <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-2 animate-fade-in text-center">
        <div className="flex justify-center text-amber-500">
          <Sun className="w-8 h-8 animate-meditation-pulse text-amber-500" />
        </div>
        <h4 className="text-sm font-bold text-amber-800 font-display tracking-tight">Low-Energy Mode active (Muted sensory)</h4>
        <p className="text-xs text-stone-600 max-w-sm mx-auto font-sans leading-relaxed">
          Zero typing required. Oversized, easy buttons to eliminate decisions and reduce executive focus load.
        </p>
      </div>

      {/* Slide 1: How do you feel right now? */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest text-center">
          1. Current Mood Level
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { rate: 1, label: "Severe", bg: "bg-red-50 text-red-700 border-red-200" },
            { rate: 3, label: "Heavy", bg: "bg-amber-50 text-amber-700 border-amber-200" },
            { rate: 5, label: "Flat", bg: "bg-teal-50 text-teal-700 border-teal-200" },
            { rate: 7, label: "Light", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
            { rate: 9, label: "High", bg: "bg-rose-50 text-rose-700 border-rose-200" }
          ].map((item) => (
            <button
              key={item.rate}
              type="button"
              onClick={() => setMood(item.rate)}
              className={`py-4 md:py-5 rounded-2xl border text-center transition-all cursor-pointer ${
                mood === item.rate
                  ? 'border-amber-400 bg-amber-50/50 text-amber-800 scale-105 font-bold shadow-sm'
                  : 'border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              <div className="text-sm md:text-base font-mono">{item.rate}</div>
              <div className="text-[10px] sm:text-xs font-sans mt-0.5">{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Slide 2: Sleep band */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest text-center">
          2. Sleep Quality Last Night
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: 'low', label: "Barely / Low Sleep", desc: "< 5 hours" },
            { val: 'normal', label: "Stable Sleep", desc: "6 - 8 hours" },
            { val: 'high', label: "Heavy Sleep", desc: "+ 9 hours" }
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setSleepBand(item.val as any)}
              className={`py-3.5 px-2 rounded-2xl border text-center transition-all flex flex-col justify-center items-center cursor-pointer ${
                sleepBand === item.val
                  ? 'border-amber-400 bg-amber-100/30 text-amber-800 scale-105 font-bold shadow-sm'
                  : 'border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700'
              }`}
            >
              <Moon className="w-4 h-4 mb-1 text-teal-600" />
              <div className="text-xs font-sans font-semibold">{item.label}</div>
              <div className="text-[9px] font-mono text-stone-400 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Slide 3: Medications compliant */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest text-center">
          3. Medications Taken
        </label>
        <div className="grid grid-cols-2 gap-4">
          
          {/* Zonalta */}
          <button
            type="button"
            onClick={() => setZonalta(!zonalta)}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              zonalta
                ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800 shadow-sm'
                : 'bg-stone-50 border-stone-200 text-stone-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Pill className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xs font-bold uppercase font-sans">Zonalta</div>
                <div className="text-[10px] text-stone-500 font-sans mt-0.5">Primary Mood Dose</div>
              </div>
            </div>
            {zonalta && <Check className="w-5 h-5 text-emerald-600" />}
          </button>

          {/* Endoxifen */}
          <button
            type="button"
            onClick={() => setEndoxifen(!endoxifen)}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              endoxifen
                ? 'bg-emerald-50/50 border-emerald-300 text-emerald-800 shadow-sm'
                : 'bg-stone-50 border-stone-200 text-stone-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Pill className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xs font-bold uppercase font-sans">Endoxifen</div>
                <div className="text-[10px] text-stone-500 font-sans mt-0.5">Enantiomer Core</div>
              </div>
            </div>
            {endoxifen && <Check className="w-5 h-5 text-emerald-600" />}
          </button>

        </div>
      </div>

      {/* Side Effects Minimal chips */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest text-center">
          4. Side Effects Checked
        </label>
        <div className="flex flex-wrap gap-2 justify-center">
          {commonEffects.map((eff) => {
            const hasIt = sideEffects.includes(eff);
            return (
              <button
                key={eff}
                type="button"
                onClick={() => toggleEffect(eff)}
                className={`px-4 py-2 rounded-full border text-xs transition-all font-sans cursor-pointer ${
                  hasIt
                    ? 'bg-amber-100/60 border-amber-300 text-amber-800 font-medium'
                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-800'
                }`}
              >
                {hasIt ? '👁️ ' : ''} {eff}
              </button>
            );
          })}
        </div>
      </div>

      {/* Big Single Action Save Button */}
      <div className="pt-4 flex justify-center">
        <button
          type="submit"
          className="w-full sm:w-2/3 py-4.5 bg-gradient-to-r from-amber-400 to-teal-400 hover:from-amber-500 hover:to-teal-500 font-bold font-sans text-stone-900 rounded-2xl shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
        >
          ✅ Complete Quick Mental Log
        </button>
      </div>

    </form>
  );
}
