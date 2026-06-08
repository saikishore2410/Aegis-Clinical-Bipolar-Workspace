import { BipolarLog, SafetyPlan, UserSettings, ProdromalAlert } from './types';

// Simple UUID generator for clinical anonymity
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const DEFAULT_SAFETY_PLAN: SafetyPlan = {
  emergencyContactName: "Sarah Jenkins (Spouse)",
  emergencyContactPhone: "+1 (555) 329-8801",
  psychiatristName: "Dr. Elizabeth Vance, MD",
  psychiatristPhone: "+1 (555) 741-2090",
  earlyWarningSigns: [
    "Sleeping less than 5 hours without feeling tired in the morning",
    "Speaking very fast or jumping topic-to-topic quickly",
    "Strong urges to start multiple high-budget projects simultaneously",
    "Feeling sudden high irritation over small delays"
  ],
  crisisRules: [
    "No bank transfers or purchases exceeding $150 without a support person's approval",
    "Do not commit to any new job contracts or long-term partnerships",
    "Agree to surrender vehicle keys if sleep drops under 4 hours for 3 straight nights",
    "Call Dr. Vance immediately if the prodromal escrow remains active post-stabilization"
  ]
};

export const DEFAULT_SETTINGS: UserSettings = {
  isDeIdentified: true,
  anonymousId: generateUUID(),
  pinLockEnabled: true,
  pinCode: "1931", // Classic clinical code
  isUnlocked: false
};

// Seed 14 days of historical logs reflecting a transitioning state
export const SEED_LOGS: BipolarLog[] = [
  {
    id: "log_1",
    timestamp: "2026-05-26T21:00:00Z",
    dateString: "2026-05-26",
    mood: 6,
    anxiety: 4,
    energy: 5,
    sleepDuration: 8.2,
    sleepDisruption: "none",
    steps: 6400,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Feeling stable" },
    sideEffects: [],
    notes: "Productive therapy session. Sleep is solid.",
    loggedAtMode: "balanced"
  },
  {
    id: "log_2",
    timestamp: "2026-05-27T21:00:00Z",
    dateString: "2026-05-27",
    mood: 5,
    anxiety: 5,
    energy: 5,
    sleepDuration: 7.8,
    sleepDisruption: "none",
    steps: 7100,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "All good" },
    sideEffects: [],
    notes: "Average day, slight rain outside, stayed indoors.",
    loggedAtMode: "balanced"
  },
  {
    id: "log_3",
    timestamp: "2026-05-28T21:00:00Z",
    dateString: "2026-05-28",
    mood: 5,
    anxiety: 6,
    energy: 4,
    sleepDuration: 7.5,
    sleepDisruption: "mild",
    steps: 5300,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Minor dry mouth" },
    sideEffects: ["Dry Mouth"],
    notes: "Felt slightly dry and slow in the afternoon.",
    loggedAtMode: "balanced"
  },
  {
    id: "log_4",
    timestamp: "2026-05-29T21:00:00Z",
    dateString: "2026-05-29",
    mood: 4,
    anxiety: 7,
    energy: 3,
    sleepDuration: 6.0,
    sleepDisruption: "severe",
    steps: 4200,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Took meds with food" },
    sideEffects: ["Nausea"],
    notes: "Very low energy, minor depressive lag. Had difficulty focusing.",
    loggedAtMode: "depressive"
  },
  {
    id: "log_5",
    timestamp: "2026-05-30T21:00:00Z",
    dateString: "2026-05-30",
    mood: 3,
    anxiety: 8,
    energy: 2,
    sleepDuration: 5.5,
    sleepDisruption: "mild",
    steps: 2800,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Skipped dinner dosage due to sleepiness" },
    sideEffects: ["Drowsiness"],
    notes: "Spent most of the day in bed. Soft amber lights helped prevent overwhelming doom.",
    loggedAtMode: "depressive"
  },
  {
    id: "log_6",
    timestamp: "2026-05-31T21:00:00Z",
    dateString: "2026-05-31",
    mood: 4,
    anxiety: 5,
    energy: 4,
    sleepDuration: 7.0,
    sleepDisruption: "none",
    steps: 4800,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Dosages normalized" },
    sideEffects: [],
    notes: "Gradual release of depressive fog. Cooking a small meal.",
    loggedAtMode: "balanced"
  },
  {
    id: "log_7",
    timestamp: "2026-06-01T21:00:00Z",
    dateString: "2026-06-01",
    mood: 6,
    anxiety: 3,
    energy: 6,
    sleepDuration: 8.0,
    sleepDisruption: "none",
    steps: 8200,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "" },
    sideEffects: [],
    notes: "Felt vibrant today, caught up with standard email tasks.",
    loggedAtMode: "balanced"
  },
  {
    id: "log_8",
    timestamp: "2026-06-02T21:00:00Z",
    dateString: "2026-06-02",
    mood: 7,
    anxiety: 2,
    energy: 8,
    sleepDuration: 7.2,
    sleepDisruption: "none",
    steps: 11000,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Felt hyper" },
    sideEffects: ["Tremor"],
    notes: "Exceptional speed in finishing housework. Wrote a 10-page business proposal.",
    loggedAtMode: "balanced"
  },
  {
    id: "log_9",
    timestamp: "2026-06-03T21:00:00Z",
    dateString: "2026-06-03",
    mood: 8,
    anxiety: 1,
    energy: 9,
    sleepDuration: 6.1,
    sleepDisruption: "mild",
    steps: 14500,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "" },
    sideEffects: [],
    notes: "Highly talkative. Felt amazing, stayed up designing three websites simultaneously.",
    loggedAtMode: "manic"
  },
  {
    id: "log_10",
    timestamp: "2026-06-04T21:00:00Z",
    dateString: "2026-06-04",
    mood: 8,
    anxiety: 2,
    energy: 9,
    sleepDuration: 6.3,
    sleepDisruption: "none",
    steps: 13000,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Forgot to log side effects" },
    sideEffects: [],
    notes: "Tons of creative ideas flow. Bought a domain name. High confidence.",
    loggedAtMode: "manic"
  },
  {
    id: "log_11",
    timestamp: "2026-06-05T21:00:00Z",
    dateString: "2026-06-05",
    mood: 9,
    anxiety: 1,
    energy: 10,
    sleepDuration: 4.2, // SLEEP DROP < 5 hours Night 1
    sleepDisruption: "severe",
    steps: 18500,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Slight jitteriness" },
    sideEffects: ["Headache"],
    notes: "Extremely elevated. Sleep was brief but felt completely rested! Cleaned the whole kitchen at 3 AM.",
    loggedAtMode: "manic"
  },
  {
    id: "log_12",
    timestamp: "2026-06-06T21:00:00Z",
    dateString: "2026-06-06",
    mood: 9,
    anxiety: 1,
    energy: 10,
    sleepDuration: 3.8, // SLEEP DROP < 5 hours Night 2 -> TRIGGERS STAGE 1 MANIC PRODROME ALERT!
    sleepDisruption: "severe",
    steps: 19200,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Forgot evening tablet" },
    sideEffects: [],
    notes: "Mind is running at supersonic speed. Don't feel tired at all despite sleeping under 4 hours. Initiating multiple tasks.",
    loggedAtMode: "manic"
  },
  {
    id: "log_13",
    timestamp: "2026-06-07T21:00:00Z",
    dateString: "2026-06-07",
    mood: 8,
    anxiety: 3,
    energy: 9,
    sleepDuration: 4.0, // Continuous sleep drop under 5 hours
    sleepDisruption: "severe",
    steps: 17200,
    medicationCompliance: { zonaltaTaken: true, endoxifenTaken: true, notes: "Resumed full dose" },
    sideEffects: ["Dry Mouth"],
    notes: "Escrow rules remind me to slow down. Safety contact warned me I'm talking too fast.",
    loggedAtMode: "manic"
  }
];

export function getStoredLogs(): BipolarLog[] {
  const data = localStorage.getItem("bipolar_logs");
  if (!data) {
    localStorage.setItem("bipolar_logs", JSON.stringify(SEED_LOGS));
    return SEED_LOGS;
  }
  return JSON.parse(data);
}

export function saveStoredLogs(logs: BipolarLog[]): void {
  localStorage.setItem("bipolar_logs", JSON.stringify(logs));
}

export function getStoredSafetyPlan(): SafetyPlan {
  const data = localStorage.getItem("bipolar_safety_plan");
  if (!data) {
    localStorage.setItem("bipolar_safety_plan", JSON.stringify(DEFAULT_SAFETY_PLAN));
    return DEFAULT_SAFETY_PLAN;
  }
  return JSON.parse(data);
}

export function saveStoredSafetyPlan(plan: SafetyPlan): void {
  localStorage.setItem("bipolar_safety_plan", JSON.stringify(plan));
}

export function getStoredSettings(): UserSettings {
  const data = localStorage.getItem("bipolar_settings");
  if (!data) {
    localStorage.setItem("bipolar_settings", JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  return JSON.parse(data);
}

export function saveStoredSettings(settings: UserSettings): void {
  localStorage.setItem("bipolar_settings", JSON.stringify(settings));
}

/**
 * Checks logs chronologically to check for Prodromal Manic state.
 * Criteria from instructions:
 * Sleep duration drops below 5 hours for two consecutive nights (or logs),
 * but self-reported mood remains highly elevated (mood >= 8).
 * Trigger Stage 0/1 Manic Prodrome & 48-Hour Decision Escrow.
 */
export function checkProdromalAlert(logs: BipolarLog[]): ProdromalAlert {
  // Sort logs by ISO timestamp
  const sorted = [...logs].sort((a, b) => new Date(a.dateString).getTime() - new Date(b.dateString).getTime());

  if (sorted.length < 2) {
    return { stage: 'none', triggeredAt: "", reason: "", sleepHistory: [], moodHistory: [] };
  }

  // Iterate backwards to find the latest consecutive pair
  for (let i = sorted.length - 1; i >= 1; i--) {
    const logCurrent = sorted[i];
    const logPrevious = sorted[i - 1];

    if (
      logCurrent.sleepDuration < 5 &&
      logPrevious.sleepDuration < 5 &&
      (logCurrent.mood >= 8 || logPrevious.mood >= 8)
    ) {
      // It matches the criteria!
      // Let's determine if it's Stage 0 (mild elevated, sleep drops but mood around 8) or Stage 1 (severe elevated, sleep extremely low < 4 hrs or mood >= 9)
      const isStage1 = logCurrent.sleepDuration < 4 || logCurrent.mood >= 9;
      return {
        stage: isStage1 ? 'Stage 1' : 'Stage 0',
        triggeredAt: logCurrent.timestamp,
        reason: `Consecutive sleep durations of ${logPrevious.sleepDuration} hrs (${logPrevious.dateString}) and ${logCurrent.sleepDuration} hrs (${logCurrent.dateString}) with an elevated clinical mood of ${logCurrent.mood}/10.`,
        sleepHistory: [logPrevious.sleepDuration, logCurrent.sleepDuration],
        moodHistory: [logPrevious.mood, logCurrent.mood]
      };
    }
  }

  return { stage: 'none', triggeredAt: "", reason: "", sleepHistory: [], moodHistory: [] };
}

/**
 * Calculates remaining hours in the 48-Hour Decision Escrow.
 * The countdown begins from the datetime of the last matching prodromal alert log.
 */
export function getEscrowRemainingHours(alertTriggeredAtIso: string): { hoursRemaining: number; isExpired: boolean } {
  if (!alertTriggeredAtIso) return { hoursRemaining: 0, isExpired: true };

  const triggerTime = new Date(alertTriggeredAtIso).getTime();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  const expirationTime = triggerTime + fortyEightHoursMs;
  const currentTime = new Date().getTime();

  const diffMs = expirationTime - currentTime;

  if (diffMs <= 0) {
    return { hoursRemaining: 0, isExpired: true };
  }

  return {
    hoursRemaining: Math.ceil(diffMs / (1000 * 60 * 60)),
    isExpired: false
  };
}
