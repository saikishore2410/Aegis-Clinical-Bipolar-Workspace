import React, { useState } from 'react';
import { ArrowRight, Brain, ShieldCheck, Heart, Info, Clock, Check, EyeOff } from 'lucide-react';
import { SafetyPlan, UserSettings } from '../types';

interface OnboardingProps {
  onComplete: (customPin: string, isDeIdentified: boolean) => void;
  defaultSettings: UserSettings;
}

export function OnboardingFlow({ onComplete, defaultSettings }: OnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const [pinCode, setPinCode] = useState<string>("1931");
  const [deId, setDeId] = useState<boolean>(true);

  const totalSteps = 3;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      onComplete(pinCode, deId);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-850 flex items-center justify-center p-4 selection:bg-teal-100 selection:text-teal-900">
      <div className="max-w-xl w-full bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col space-y-6">
        
        {/* Progress bar */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 bg-teal-50 border border-teal-100 rounded-lg text-teal-600">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-stone-800">Aegis Clinical Safety Assistant</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-teal-500' : s < step ? 'w-3 bg-teal-600' : 'w-3 bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Steps Content */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex gap-3">
              <span className="text-2xl mt-0.5">🩹</span>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-800 font-display">Designing for Two Psychiatric Realities</h4>
                <p className="text-xs text-stone-600 font-sans leading-relaxed">
                  Bipolar disorder dynamically alters energy, attention, and executive drive. Aegis reshapes its whole interface between two clinical layouts to lessen emotional fatigue:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 bg-amber-50/20 border border-amber-200/50 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider font-display">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-450 inline-block"></span>
                  Low Energy Mode (Depressive)
                </div>
                <p className="text-[11px] text-stone-600 font-sans leading-relaxed">
                  Adapts to low-energy states. Large buttons, <strong>no typing required</strong>, sand colors. Reduces cognitive blockages and sensory overload gently.
                </p>
              </div>

              <div className="p-4 bg-sky-50/20 border border-sky-200/50 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider font-display">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-450 inline-block"></span>
                  Impulse Friction Mode (Manic)
                </div>
                <p className="text-[11px] text-stone-600 font-sans leading-relaxed">
                  Adapts to high-energy states. Standard grids with <strong>mandatory mechanical validation delays</strong> (like breathing guides) to slow sudden impulses.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-500 font-sans text-center leading-normal pt-1">
              This layout automatically acts as a mental protective gate, adjusting to your subjective cycles.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-stone-800 flex items-center gap-2 font-display">
              <Clock className="w-5 h-5 text-indigo-500" />
              Dynamic Coping Ledger Overview
            </h3>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              We collect and correlate four clinical variables to feed your clinician objective, de-identified parameters:
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px] text-indigo-700 font-mono font-bold mt-0.5 shrink-0">1</div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Subjective Check-Ins</h4>
                  <p className="text-[11px] text-stone-500">Log emotional mood scales (1-10), somatic anxiety, and kinetic-physical energy scores.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px] text-indigo-700 font-mono font-bold mt-0.5 shrink-0">2</div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Passive Sensor Modeling</h4>
                  <p className="text-[11px] text-stone-500">Tracks step goals and sleep telemetry. Drop in consecutive sleep duration triggers prodromal high-risk alert tags.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px] text-indigo-700 font-mono font-bold mt-0.5 shrink-0">3</div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Treatment Ledger Adherence</h4>
                  <p className="text-[11px] text-stone-500">Log daily medications (Zonalta & Endoxifen) and track active tremors or medication side effects.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[10px] text-indigo-700 font-mono font-bold mt-0.5 shrink-0">4</div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Safety Crisis Framework</h4>
                  <p className="text-[11px] text-stone-500">Pre-program clinician hotlines alongside proactive 48-Hour Decision Escrows to freeze critical changes.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-stone-800 flex items-center gap-2 font-display">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Patient Protection & HIPAA De-Identification
            </h3>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              To comply with the strict guidelines of psychiatric applications tracking high-risk conditions like Bipolar Disorder, you must configure device security and acknowledge our therapeutic and liability boundaries.
            </p>

            {/* Split Database Sandbox Token representation */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-250 flex justify-between items-center text-xs">
              <span className="text-stone-500">HIPAA Protected Token:</span>
              <span className="font-mono text-teal-600 font-bold">{defaultSettings.anonymousId.substring(0, 18)}...</span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between bg-stone-50/50 p-3 border border-stone-200 rounded-xl">
                <div>
                  <h5 className="text-xs font-semibold text-stone-804 font-display">Simulate Gate Passcode</h5>
                  <p className="text-[10px] text-stone-500">Prompts login passcode on load for privacy protection.</p>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  className="w-16 bg-white border border-stone-300 rounded-lg p-1.5 text-center text-sm text-teal-700 font-mono font-bold focus:outline-none focus:border-teal-500"
                  placeholder="PIN"
                />
              </div>

              {/* Compliance Acknowledgment 1: Not doctor advice */}
              <div className="p-3 bg-teal-50/40 border border-teal-150/45 rounded-xl space-y-1.5">
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    id="safe-harbor-ack" 
                    defaultChecked 
                    className="mt-0.5 accent-teal-600 rounded text-teal-600 focus:ring-teal-505" 
                  />
                  <label htmlFor="safe-harbor-ack" className="text-[10px] text-stone-700 font-sans leading-relaxed cursor-pointer">
                    <strong>Medical Safe Harbor:</strong> I understand this app is a therapeutic tracking utility, not active medical diagnostics, nor a replacement for my psychiatrist (e.g., Dr. Prasad Rao).
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between bg-stone-50/50 p-3 border border-stone-200 rounded-xl">
                <div>
                  <h5 className="text-xs font-semibold text-stone-804 font-display">HIPAA & India DPDP Act Consent</h5>
                  <p className="text-[10px] text-stone-500">Consent to de-identified medical telemetry processing.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deId}
                    onChange={(e) => setDeId(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>

              {/* Patient-Doctor Consent Proxy Trigger */}
              <div className="flex items-center justify-between bg-stone-50/50 p-3 border border-stone-200 rounded-xl">
                <div>
                  <h5 className="text-xs font-semibold text-stone-808 font-display">Emergency Proxy Consent</h5>
                  <p className="text-[10px] text-stone-505">Allows automated alert of severe mania crisis to my proxy.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                    id="proxy-toggle"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>
            </div>

            <p className="text-[10px] text-stone-500 font-sans leading-normal">
              ⚖️ Clinical safety model active. Data encrypted at rest via AES-256 and in transit via TLS 1.3 protocol.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
          <span className="text-xs text-stone-500">
            Progress step {step} of {totalSteps}
          </span>
          <button
            onClick={nextStep}
            disabled={step === 3 && pinCode.length < 4}
            className="px-4.5 py-2.5 bg-teal-500 hover:bg-teal-655 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer font-display"
          >
            {step === totalSteps ? 'Enter Safety Console' : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
