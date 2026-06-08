import React, { useState } from 'react';
import { SafetyPlan } from '../types';
import { ShieldCheck, Phone, AlertOctagon, ListTodo, User, Edit3, Save, Info, Plus, Trash2, CheckCircle } from 'lucide-react';

interface SafetyPlanPanelProps {
  safetyPlan: SafetyPlan;
  onUpdatePlan: (updatedPlan: SafetyPlan) => void;
  escrowHoursLeft: number;
  isEscrowActive: boolean;
}

export function SafetyPlanPanel({
  safetyPlan,
  onUpdatePlan,
  escrowHoursLeft,
  isEscrowActive
}: SafetyPlanPanelProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedPlan, setEditedPlan] = useState<SafetyPlan>({ ...safetyPlan });
  const [newWarningSign, setNewWarningSign] = useState<string>('');
  const [newCrisisRule, setNewCrisisRule] = useState<string>('');
  const [showStatusSuccess, setShowStatusSuccess] = useState<boolean>(false);

  const handleSave = () => {
    onUpdatePlan(editedPlan);
    setIsEditing(false);
    setShowStatusSuccess(true);
    setTimeout(() => {
      setShowStatusSuccess(false);
    }, 3000);
  };

  const addWarningSign = () => {
    if (newWarningSign.trim()) {
      setEditedPlan(prev => ({
        ...prev,
        earlyWarningSigns: [...prev.earlyWarningSigns, newWarningSign.trim()]
      }));
      setNewWarningSign('');
    }
  };

  const removeWarningSign = (index: number) => {
    setEditedPlan(prev => ({
      ...prev,
      earlyWarningSigns: prev.earlyWarningSigns.filter((_, i) => i !== index)
    }));
  };

  const addCrisisRule = () => {
    if (newCrisisRule.trim()) {
      setEditedPlan(prev => ({
        ...prev,
        crisisRules: [...prev.crisisRules, newCrisisRule.trim()]
      }));
      setNewCrisisRule('');
    }
  };

  const removeCrisisRule = (index: number) => {
    setEditedPlan(prev => ({
      ...prev,
      crisisRules: prev.crisisRules.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-stone-800 flex items-center gap-2 font-display">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Clinical Crisis Safety Blueprint
          </h3>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Structured guidelines aligned with your psychiatrist’s emergency protocol.
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {showStatusSuccess && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 animate-bounce">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-505" />
              Safety Plan Saved
            </span>
          )}
          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all font-sans cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Blueprint
            </button>
          ) : (
            <button
              onClick={() => {
                setEditedPlan({ ...safetyPlan });
                setIsEditing(true);
              }}
              className="px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all font-sans cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-teal-600" />
              Edit Blueprint Rules
            </button>
          )}
        </div>
      </div>

      {/* Decision Escrow Warning Banner */}
      {isEscrowActive ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 border border-red-200 rounded-lg text-red-700">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-800 font-display uppercase tracking-wider">
                🚨 48-Hour Decision Escrow Mode Active
              </h4>
              <p className="text-xs text-stone-650 font-sans leading-relaxed mt-1">
                The safety algorithm detected 2+ consecutive nights of sleep under 5 hours paired with highly elevated hypomanic mood. Under psychiatric safety protocol, <strong>protective cooling friction</strong> has been placed on dynamic actions.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-red-100 text-xs">
            <span className="text-stone-550">
              Decision Escrow Lock Countdown Remaining:
            </span>
            <span className="font-mono text-red-705 font-bold text-[13px] bg-red-100 px-3 p-1 rounded-lg border border-red-200/50">
              {escrowHoursLeft} Hours Remaining
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500 flex items-center gap-2 font-sans">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <span>The <strong>Decision Escrow Protection System</strong> is currently on standby. It auto-triggers a 48h protection mode if passive telemetry verifies consecutive severe sleep loss alongside elevated moods.</span>
        </div>
      )}

      {/* Primary Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Contact 1 */}
        <div className="p-4 bg-[#FAF9F6] rounded-xl border border-stone-200 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 font-semibold text-xs text-teal-800 font-sans tracking-wide uppercase">
            <User className="w-4 h-4 text-emerald-600" />
            Primary Psychiatrist Contact
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedPlan.psychiatristName}
                onChange={(e) => setEditedPlan(prev => ({ ...prev, psychiatristName: e.target.value }))}
                className="w-full bg-white border border-stone-250 rounded p-2 text-xs text-stone-800 focus:outline-none focus:border-teal-500"
                placeholder="Doctor Name"
              />
              <input
                type="text"
                value={editedPlan.psychiatristPhone}
                onChange={(e) => setEditedPlan(prev => ({ ...prev, psychiatristPhone: e.target.value }))}
                className="w-full bg-white border border-stone-250 rounded p-2 text-xs text-stone-800 focus:outline-none focus:border-teal-500"
                placeholder="Phone"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs font-bold text-stone-800">{safetyPlan.psychiatristName}</div>
              <div className="text-[11px] text-stone-500">{safetyPlan.psychiatristPhone}</div>
            </div>
          )}
          {!isEditing && (
            <a
              href={`tel:${safetyPlan.psychiatristPhone}`}
              className="absolute top-4 right-4 p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 rounded-full text-emerald-600 transition-all cursor-pointer"
              title="Place Emergency Call"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Contact 2 */}
        <div className="p-4 bg-[#FAF9F6] rounded-xl border border-stone-200 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 font-semibold text-xs text-teal-800 font-sans tracking-wide uppercase">
            <User className="w-4 h-4 text-emerald-600" />
            Family Emergency Support
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedPlan.emergencyContactName}
                onChange={(e) => setEditedPlan(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                className="w-full bg-white border border-stone-250 rounded p-2 text-xs text-stone-800 focus:outline-none focus:border-teal-500"
                placeholder="Contact Name"
              />
              <input
                type="text"
                value={editedPlan.emergencyContactPhone}
                onChange={(e) => setEditedPlan(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                className="w-full bg-white border border-stone-250 rounded p-2 text-xs text-stone-800 focus:outline-none focus:border-teal-500"
                placeholder="Phone"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs font-bold text-stone-800">{safetyPlan.emergencyContactName}</div>
              <div className="text-[11px] text-stone-500">{safetyPlan.emergencyContactPhone}</div>
            </div>
          )}
          {!isEditing && (
            <a
              href={`tel:${safetyPlan.emergencyContactPhone}`}
              className="absolute top-4 right-4 p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 rounded-full text-emerald-600 transition-all cursor-pointer"
              title="Place Emergency Call"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>

      </div>

      {/* Early Prodromal Warnings Signs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Column 1: Warning indicators */}
        <div className="space-y-3">
          <div className="font-bold text-xs text-indigo-700 tracking-wider uppercase flex items-center gap-1.5 font-sans">
            <ListTodo className="w-4 h-4 text-indigo-505" />
            Prodromal Shift Indicators (Warning Signs)
          </div>

          <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
            <ul className="space-y-2 text-xs">
              {(isEditing ? editedPlan : safetyPlan).earlyWarningSigns.map((sign, idx) => (
                <li key={idx} className="flex justify-between items-start gap-2 text-stone-705 border-b border-stone-200 pb-1.5 leading-relaxed font-sans">
                  <span>✨ {sign}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeWarningSign(idx)}
                      className="text-red-650 hover:text-red-500 focus:outline-none p-1 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {isEditing && (
              <div className="flex gap-2 pt-2 border-t border-stone-205">
                <input
                  type="text"
                  placeholder="Insert custom early indicator..."
                  value={newWarningSign}
                  onChange={(e) => setNewWarningSign(e.target.value)}
                  className="bg-white border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 flex-1 font-sans focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={addWarningSign}
                  className="p-1 px-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 active:scale-95 cursor-pointer font-bold text-xs"
                >
                  <Plus className="w-4 h-4 inline" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Escrow cooling guidelines */}
        <div className="space-y-3">
          <div className="font-bold text-xs text-amber-700 tracking-wider uppercase flex items-center gap-1.5 font-sans">
            <ShieldCheck className="w-4 h-4 text-amber-605" />
            Decision Protection Protocols (Crisis Rules)
          </div>

          <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
            <ul className="space-y-2 text-xs">
              {(isEditing ? editedPlan : safetyPlan).crisisRules.map((rule, idx) => (
                <li key={idx} className="flex justify-between items-start gap-2 text-stone-705 border-b border-stone-200 pb-1.5 leading-relaxed font-sans">
                  <span>🛑 {rule}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeCrisisRule(idx)}
                      className="text-red-650 hover:text-red-500 focus:outline-none p-1 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {isEditing && (
              <div className="flex gap-2 pt-2 border-t border-stone-205">
                <input
                  type="text"
                  placeholder="Insert decision friction rule..."
                  value={newCrisisRule}
                  onChange={(e) => setNewCrisisRule(e.target.value)}
                  className="bg-white border border-stone-250 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 flex-1 font-sans focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={addCrisisRule}
                  className="p-1 px-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200 active:scale-95 cursor-pointer font-bold text-xs"
                >
                  <Plus className="w-4 h-4 inline" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
