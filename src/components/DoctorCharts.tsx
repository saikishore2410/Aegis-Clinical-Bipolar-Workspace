import React, { useState } from 'react';
import { BipolarLog, SafetyPlan } from '../types';
import { AreaChart, Brain, Moon, Calendar, CheckCircle2, AlertCircle, Sparkles, TrendingUp, UserCheck, ShieldAlert } from 'lucide-react';

interface DoctorChartsProps {
  logs: BipolarLog[];
  safetyPlan: SafetyPlan;
}

export function DoctorCharts({ logs, safetyPlan }: DoctorChartsProps) {
  const [filterDays, setFilterDays] = useState<number>(14);
  const [hoveredLog, setHoveredLog] = useState<BipolarLog | null>(null);

  // Sort logs in chronological order
  const sortedLogs = [...logs]
    .sort((a, b) => new Date(a.dateString).getTime() - new Date(b.dateString).getTime())
    .slice(-filterDays);

  if (sortedLogs.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl shadow-sm">
        <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <p className="text-stone-500 font-sans text-sm">No historical log entries found for chart rendering.</p>
      </div>
    );
  }

  // Calculate stats to help the clinician
  const avgMood = (sortedLogs.reduce((acc, log) => acc + log.mood, 0) / sortedLogs.length).toFixed(1);
  const avgSleep = (sortedLogs.reduce((acc, log) => acc + log.sleepDuration, 0) / sortedLogs.length).toFixed(1);
  const avgSteps = Math.round(sortedLogs.reduce((acc, log) => acc + log.steps, 0) / sortedLogs.length);
  const medicationComplianceRate = Math.round(
    (sortedLogs.filter(log => log.medicationCompliance.zonaltaTaken && log.medicationCompliance.endoxifenTaken).length / sortedLogs.length) * 100
  );

  // SVG dimensions for custom robust charting
  const width = 640;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxDays = sortedLogs.length;

  // Coordinate math
  const getX = (index: number) => {
    if (maxDays <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (maxDays - 1)) * chartWidth;
  };

  // Mood is 1 - 10
  const getYMood = (mood: number) => {
    const clamped = Math.max(1, Math.min(10, mood));
    return paddingTop + chartHeight - ((clamped - 1) / 9) * chartHeight;
  };

  // Sleep is 0 - 12 hours
  const getYSleep = (hours: number) => {
    const clamped = Math.max(0, Math.min(12, hours));
    return paddingTop + chartHeight - (clamped / 12) * chartHeight;
  };

  // Generate paths for SVG
  const moodPoints = sortedLogs.map((log, i) => ({ x: getX(i), y: getYMood(log.mood) }));
  const sleepPoints = sortedLogs.map((log, i) => ({ x: getX(i), y: getYSleep(log.sleepDuration) }));

  const moodPath = moodPoints.reduce(
    (path, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`),
    ""
  );

  const sleepPath = sleepPoints.reduce(
    (path, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`),
    ""
  );

  // Fill paths for beautiful gradient underneath
  const moodAreaPath = maxDays > 0 
    ? `${moodPath} L ${moodPoints[moodPoints.length - 1].x} ${paddingTop + chartHeight} L ${moodPoints[0].x} ${paddingTop + chartHeight} Z`
    : "";

  const sleepAreaPath = maxDays > 0
    ? `${sleepPath} L ${sleepPoints[sleepPoints.length - 1].x} ${paddingTop + chartHeight} L ${sleepPoints[0].x} ${paddingTop + chartHeight} Z`
    : "";

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 md:p-6 space-y-6 shadow-sm">
      
      {/* Header and Filter Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-stone-850 flex items-center gap-2 font-display">
            <AreaChart className="w-5 h-5 text-teal-600" />
            Psychiatric Diagnosis & Correlation Panel
          </h3>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Double-axis chart: self-reported mood intensity (left) and sleep duration trends (right).
          </p>
        </div>
        <div className="flex bg-stone-50 border border-stone-200 p-0.5 rounded-lg text-xs self-stretch sm:self-auto justify-between shadow-inner">
          <button
            onClick={() => setFilterDays(7)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              filterDays === 7 ? 'bg-white text-teal-600 font-bold shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setFilterDays(14)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              filterDays === 14 ? 'bg-white text-teal-600 font-bold shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            14 Days
          </button>
          <button
            onClick={() => setFilterDays(30)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              filterDays === 30 ? 'bg-white text-teal-600 font-bold shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Full History
          </button>
        </div>
      </div>

      {/* Quick Clinician Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Brain className="w-3.5 h-3.5 text-amber-500" />
            <span>Mean Mood Rating</span>
          </div>
          <div className="text-lg font-bold text-amber-600 font-mono flex items-baseline gap-1">
            {avgMood} <span className="text-xs text-stone-400 font-normal">/10</span>
          </div>
        </div>

        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Moon className="w-3.5 h-3.5 text-[#5c6bc0]" />
            <span>Avg Sleep Duration</span>
          </div>
          <div className="text-lg font-bold text-indigo-700 font-mono flex items-baseline gap-1">
            {avgSleep} <span className="text-xs text-stone-400 font-normal">hrs</span>
          </div>
        </div>

        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Meds Adherence</span>
          </div>
          <div className="text-lg font-bold text-emerald-600 font-mono">
            {medicationComplianceRate}%
          </div>
        </div>

        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <TrendingUp className="w-3.5 h-3.5 text-pink-500" />
            <span>Mean Daily Steps</span>
          </div>
          <div className="text-lg font-bold text-stone-800 font-mono">
            {avgSteps.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="relative bg-white border border-stone-200 rounded-xl p-3 md:p-4 overflow-hidden shadow-sm">
        
        {/* Graph Legends */}
        <div className="flex flex-wrap justify-between items-center text-[10px] text-stone-500 mb-2 border-b border-stone-105 pb-2 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-sm"></span>
              <span className="text-stone-700 font-medium">Mood Level (Range 1 - 10)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 rounded-full bg-[#5c6bc0] inline-block shadow-sm"></span>
              <span className="text-stone-700 font-medium">Sleep Hours (Range 0 - 12h)</span>
            </div>
          </div>
          <div className="text-stone-400 text-[10px] uppercase font-mono">
            🏥 HIPAA De-Identified Physician Access
          </div>
        </div>

        <div className="relative w-full overflow-x-auto select-none scrollbar-thin">
          <div className="min-w-[580px] relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5c6bc0" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#5c6bc0" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[1, 2.5, 4, 5.5, 7, 8.5, 10].map((val, idx) => {
                const y = getYMood(val);
                return (
                  <g key={`grid-line-${idx}`}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#f1f0ee"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                    />
                    {/* Left Axis (Mood scale labels) */}
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#888880"
                      className="text-[9px] font-mono"
                    >
                      {Math.round(val)}
                    </text>
                  </g>
                );
              })}

              {/* Right Axis Labels (Sleep scale) */}
              {[0, 3, 6, 9, 12].map((hrs, idx) => {
                const y = getYSleep(hrs);
                return (
                  <text
                    key={`right-axis-${idx}`}
                    x={width - paddingRight + 8}
                    y={y + 3}
                    textAnchor="start"
                    fill="#888880"
                    className="text-[9px] font-mono"
                  >
                    {hrs}h
                  </text>
                );
              })}

              {/* Area Under Lines */}
              {maxDays > 0 && (
                <>
                  <path d={sleepAreaPath} fill="url(#sleepGrad)" />
                  <path d={moodAreaPath} fill="url(#moodGrad)" />
                </>
              )}

              {/* Line Paths */}
              {maxDays > 0 && (
                <>
                  {/* Sleep tracking path */}
                  <path
                    d={sleepPath}
                    fill="none"
                    stroke="#5c6bc0"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Mood report path */}
                  <path
                    d={moodPath}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Interactive nodes and grid indicators */}
              {sortedLogs.map((log, idx) => {
                const mx = getX(idx);
                const myMood = getYMood(log.mood);
                const mySleep = getYSleep(log.sleepDuration);

                const isHovered = hoveredLog?.id === log.id;

                return (
                  <g key={log.id} className="cursor-pointer">
                    {/* Hover vertical guidelines */}
                    {isHovered && (
                      <line
                        x1={mx}
                        y1={paddingTop}
                        x2={mx}
                        y2={paddingTop + chartHeight}
                        stroke="#0d9488"
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                      />
                    )}

                    {/* Sleep Node */}
                    <circle
                      cx={mx}
                      cy={mySleep}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#5c6bc0"
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2.5 : 1}
                      onMouseEnter={() => setHoveredLog(log)}
                    />

                    {/* Mood Node */}
                    <circle
                      cx={mx}
                      cy={myMood}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2.5 : 1}
                      onMouseEnter={() => setHoveredLog(log)}
                    />

                    {/* Prodrome Sleep Flag markers at sleep drop instances */}
                    {log.sleepDuration < 5 && (
                      <circle
                        cx={mx}
                        cy={mySleep}
                        r={8}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.2"
                        className="animate-ping"
                        style={{ transformOrigin: `${mx}px ${mySleep}px` }}
                      />
                    )}

                    {/* Date labeling on X-axis */}
                    <text
                      x={mx}
                      y={paddingTop + chartHeight + 14}
                      className="text-[8px] font-mono"
                      fill={isHovered ? '#0d9488' : '#787870'}
                      textAnchor="middle"
                      transform={`rotate(15, ${mx}, ${paddingTop + chartHeight + 14})`}
                      onMouseEnter={() => setHoveredLog(log)}
                    >
                      {log.dateString.substring(5)}
                    </text>
                  </g>
                );
              })}

              {/* Compliance Markers baseline strip */}
              <rect
                x={paddingLeft}
                y={paddingTop + chartHeight + 24}
                width={chartWidth}
                height={8}
                fill="#f1f0ee"
                rx={4}
              />
              {sortedLogs.map((log, idx) => {
                const mx = getX(idx);
                const compliance = log.medicationCompliance.zonaltaTaken && log.medicationCompliance.endoxifenTaken;
                return (
                  <circle
                    key={`compliance-${log.id}`}
                    cx={mx}
                    cy={paddingTop + chartHeight + 28}
                    r={3.5}
                    fill={compliance ? '#10b981' : '#f43f5e'}
                    title={compliance ? "Meds compliant" : "Meds skipped"}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Dynamic Axis Labels */}
        <div className="absolute top-2 left-10 text-[8px] text-stone-400 font-mono tracking-wide uppercase">
          ← Self-Reported Mood (Left Axis)
        </div>
        <div className="absolute top-2 right-10 text-[8px] text-stone-400 font-mono tracking-wide uppercase text-right">
          Smartwatch Sleep Duration (Right Axis) →
        </div>

        {/* Dynamic Tooltip Hover Display */}
        {hoveredLog ? (
          <div className="mt-4 p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2 animate-fade-in text-stone-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 border-b border-stone-200 pb-1.5">
              <span className="text-xs font-bold text-stone-805 flex items-center gap-1 font-sans">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Safety Date: {hoveredLog.dateString}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase font-bold text-xs ${
                hoveredLog.loggedAtMode === 'manic' ? 'bg-red-50 border border-red-200 text-red-750' :
                hoveredLog.loggedAtMode === 'depressive' ? 'bg-amber-50 border border-amber-250 text-amber-800' :
                'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                UI Checked In: {hoveredLog.loggedAtMode}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-stone-400 text-[10px]">Mood & Energy</span>
                <p className="text-stone-800 font-medium">Mood: <strong className="text-amber-600 font-mono">{hoveredLog.mood}</strong> | Energy: <strong className="text-sky-700 font-mono">{hoveredLog.energy}</strong></p>
              </div>
              <div className="space-y-0.5">
                <span className="text-stone-400 text-[10px]">Anxiety Scale</span>
                <p className="text-stone-800 font-medium">Score: <strong className="text-pink-600 font-mono">{hoveredLog.anxiety}</strong></p>
              </div>
              <div className="space-y-0.5">
                <span className="text-stone-400 text-[10px]">Smartwatch Sleep</span>
                <p className="text-stone-800 font-medium flex items-center gap-1">
                  <span>{hoveredLog.sleepDuration} hrs</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.25 rounded ${
                    hoveredLog.sleepDisruption === 'none' ? 'bg-emerald-50 text-emerald-800' :
                    hoveredLog.sleepDisruption === 'mild' ? 'bg-amber-50 text-amber-800' :
                    'bg-red-50 border border-red-200 text-red-750'
                  }`}>
                    {hoveredLog.sleepDisruption} disruption
                  </span>
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-stone-400 text-[10px]">Prescriptions Taken</span>
                <p className="text-stone-800 font-medium flex items-center gap-1.5">
                  <span className={hoveredLog.medicationCompliance.zonaltaTaken ? 'text-emerald-700 font-bold' : 'text-stone-450 line-through'}>Zonalta</span>
                  <span className="text-stone-300">/</span>
                  <span className={hoveredLog.medicationCompliance.endoxifenTaken ? 'text-emerald-700 font-bold' : 'text-stone-450 line-through'}>Endoxifen</span>
                </p>
              </div>
            </div>

            {hoveredLog.sideEffects.length > 0 && (
              <div className="text-xs space-y-1">
                <span className="text-stone-500 text-[10px] block">Experienced Symptoms:</span>
                <div className="flex flex-wrap gap-1">
                  {hoveredLog.sideEffects.map((se, i) => (
                    <span key={i} className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded-md text-[10px] text-teal-700">
                      👁️ {se}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {hoveredLog.notes && (
              <div className="text-xs italic bg-stone-100 p-2 border border-stone-200/60 rounded text-stone-600 leading-relaxed font-sans mt-0.5">
                "{hoveredLog.notes}"
              </div>
            )}

          </div>
        ) : (
          <div className="text-center p-3.5 text-xs text-stone-400 italic bg-[#FAF9F6] rounded-xl mt-3 border border-stone-200/60">
            💡 Hover graph nodes to inspect medical markers, prescription logs, and raw sleep telemetry.
          </div>
        )}
      </div>

      {/* Clinical Notes & Interpretation Hints */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-stone-750 uppercase tracking-widest flex items-center gap-1.5 font-display">
          <UserCheck className="w-4 h-4 text-sky-600" />
          Psychiatric Consultation Assessment Guideline
        </h4>
        <p className="text-xs text-stone-600 font-sans leading-relaxed">
          This panel displays the clinical correlation between <strong>sleep-onset drop and hypomania elevation</strong>. Notice the critical warnings. Sleep under 5 hours without subjective fatigue indicates elevated hypomanic prodromal states, automatically deploying <strong>48-Hour Decision Escrows</strong>.
        </p>

        {/* Prodrome detection feedback in settings */}
        <div className="text-[11px] text-teal-850 leading-relaxed flex items-start gap-2 bg-teal-50 border border-teal-200 p-3 rounded-lg font-sans">
          <CheckCircle2 className="w-4 h-4 text-teal-650 shrink-0 mt-0.5" />
          <div>
            <strong>Dynamic Emulation Running:</strong> Feel free to log variables. Recording consecutive nights with sleep less than 5 hours alongside elevated mood (7+) automatically initiates the Decision Escrow.
          </div>
        </div>
      </div>

    </div>
  );
}
