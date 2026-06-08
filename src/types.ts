export interface BipolarLog {
  id: string;
  timestamp: string; // ISO date string
  dateString: string; // YYYY-MM-DD
  mood: number; // 1-10
  anxiety: number; // 1-10
  energy: number; // 1-10
  sleepDuration: number; // Hours
  sleepDisruption: 'none' | 'mild' | 'severe';
  steps: number; // Daily steps
  medicationCompliance: {
    zonaltaTaken: boolean;
    endoxifenTaken: boolean;
    notes: string;
  };
  sideEffects: string[]; // List of logged side effects
  notes: string;
  loggedAtMode: 'balanced' | 'depressive' | 'manic';
}

export interface SafetyPlan {
  emergencyContactName: string;
  emergencyContactPhone: string;
  psychiatristName: string;
  psychiatristPhone: string;
  earlyWarningSigns: string[];
  crisisRules: string[];
  lastEscrowTriggeredAt?: string; // ISO Date of prodrome flag
}

export interface UserSettings {
  isDeIdentified: boolean;
  anonymousId: string;
  pinLockEnabled: boolean;
  pinCode: string; // 4-digit code
  isUnlocked: boolean;
}

export interface ProdromalAlert {
  stage: 'none' | 'Stage 0' | 'Stage 1';
  triggeredAt: string;
  reason: string;
  sleepHistory: number[];
  moodHistory: number[];
}
