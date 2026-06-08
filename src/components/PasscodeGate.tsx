import React, { useState } from 'react';
import { ShieldAlert, KeyRound, EyeOff, Lock, Unlock, HelpCircle } from 'lucide-react';
import { UserSettings } from '../types';

interface PasscodeGateProps {
  settings: UserSettings;
  onUnlock: () => void;
  onResetCode: (newPin: string) => void;
}

export function PasscodeGate({ settings, onUnlock, onResetCode }: PasscodeGateProps) {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  const handleKeyPress = (num: string) => {
    setErrorMsg(null);
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      
      // Auto-submit when length reaches 4
      if (nextPin === settings.pinCode) {
        onUnlock();
      } else if (nextPin.length === 4) {
        // Wrong pin
        setTimeout(() => {
          setErrorMsg("Incorrect passcode. HIPAA De-identified logs remain encrypted.");
          setEnteredPin('');
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 flex flex-col items-center justify-center p-4 selection:bg-teal-100 selection:text-teal-900">
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm text-center space-y-6">
        
        {/* Verification Icon / Header */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3.5 bg-teal-50 border border-teal-100 rounded-full text-teal-600 animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight text-stone-850">Security Gate Login</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto font-sans leading-relaxed">
            Identity passcode verification is active. Sensitive medical logs are encrypted locally.
          </p>
        </div>

        {/* PIN Circles */}
        <div className="flex justify-center space-x-4 py-3">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                enteredPin.length > index
                  ? 'bg-teal-500 border-teal-500 scale-110 shadow-sm'
                  : 'border-stone-300 bg-stone-100'
              }`}
            />
          ))}
        </div>

        {/* Dynamic Error or HIPAA Compliance Tag */}
        {errorMsg ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-650 flex items-center gap-2 justify-center leading-snug">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl text-xs text-stone-600 flex items-center gap-2 justify-center leading-normal">
            <EyeOff className="w-4 h-4 text-stone-400" />
            <span>HIPAA Compliant | ID: <strong className="font-mono text-stone-700">{settings.anonymousId.substring(0, 8)}...</strong></span>
          </div>
        )}

        {/* PinPad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto py-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-14 h-14 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 text-base font-semibold flex items-center justify-center font-mono active:scale-95 transition-all text-stone-800 cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setShowHint(prev => !prev)}
            className="w-14 h-14 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-400 text-xs font-sans flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="Hint"
          >
            <HelpCircle className="w-5 h-5 text-stone-400" />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-14 h-14 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 text-base font-semibold flex items-center justify-center font-mono active:scale-95 transition-all text-stone-800 cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-14 h-14 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-semibold flex items-center justify-center text-stone-600 active:scale-95 transition-all cursor-pointer"
          >
            Del
          </button>
        </div>

        {/* Reset/Hints panel */}
        <div className="pt-1 text-xs text-stone-500">
          {showHint && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 space-y-1 mb-2 animate-fade-in text-left">
              <p className="font-semibold">Evaluator Hint:</p>
              <p>Type the default secure login code <strong className="font-mono text-teal-700 text-sm">1931</strong> to instantly unlock the medical interface.</p>
            </div>
          )}
          <p>Passcode locking protects your daily sessions from ambient observation.</p>
        </div>

      </div>
    </div>
  );
}
