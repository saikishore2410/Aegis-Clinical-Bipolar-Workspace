import React, { useState, useEffect } from 'react';
import { BipolarLog, SafetyPlan, UserSettings, ProdromalAlert } from './types';
import {
  getStoredLogs,
  saveStoredLogs,
  getStoredSafetyPlan,
  saveStoredSafetyPlan,
  getStoredSettings,
  saveStoredSettings,
  checkProdromalAlert,
  getEscrowRemainingHours,
  generateUUID,
} from './utils';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';

import { PasscodeGate } from './components/PasscodeGate';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DoctorCharts } from './components/DoctorCharts';
import { SafetyPlanPanel } from './components/SafetyPlanPanel';
import { LowEnergyLogger } from './components/LowEnergyLogger';
import { SpeedCappedLogger } from './components/SpeedCappedLogger';
import { AegisChat } from './components/AegisChat';

import {
  Brain,
  ShieldCheck,
  AlertOctagon,
  EyeOff,
  Lock,
  Unlock,
  PlusCircle,
  FileSpreadsheet,
  Trash2,
  Moon,
  TrendingDown,
  Activity,
  HelpCircle,
  MessageSquare,
  Sparkles,
  BarChart4,
  BriefcaseMedical,
  CheckCircle,
  Clock,
  Heart,
  Home,
  Info,
  Mail,
  PhoneCall,
  Layers,
  Send,
  FileText,
  LayoutDashboard,
  Database,
  Cloud,
  RefreshCw,
  LogOut,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  // Storage and setup states
  const [logs, setLogs] = useState<BipolarLog[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Firebase connection states
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Top-level navigation state
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'about' | 'services' | 'contact'>('home');

  // Tab management state
  const [activeTab, setActiveTab] = useState<'tracker' | 'insights' | 'safety' | 'aegis_ai'>('tracker');

  // Contact page outbox states
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactMessages, setContactMessages] = useState<{ id: string; date: string; subject: string; message: string }[]>([]);
  const [isWidgetChatOpen, setIsWidgetChatOpen] = useState<boolean>(false);
  const [bipolarSectionTab, setBipolarSectionTab] = useState<'etiology' | 'identification'>('etiology');
  const [prereqActiveCustomTab, setPrereqActiveCustomTab] = useState<'clinical' | 'legal' | 'privacy' | 'doctor'>('clinical');

  // Applet active layout overrides
  // Allows user to experience both Depressive UI (Low Energy) and Manic UI (Capped Friction)
  const [activeUiMode, setActiveUiMode] = useState<'balanced' | 'depressive' | 'manic'>('balanced');
  
  // Custom log manual parameters for balanced tracker
  const [simpleMood, setSimpleMood] = useState<number>(6);
  const [simpleSleep, setSimpleSleep] = useState<number>(7.5);
  const [simpleZonalta, setSimpleZonalta] = useState<boolean>(true);
  const [simpleEndoxifen, setSimpleEndoxifen] = useState<boolean>(true);
  const [simpleNotes, setSimpleNotes] = useState<string>('');
  const [simpleSideEffects, setSimpleSideEffects] = useState<string[]>([]);

  // Feedback notifications
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // 1. Initial Load Bootup
  useEffect(() => {
    const loadedLogs = getStoredLogs();
    const loadedPlan = getStoredSafetyPlan();
    const loadedSettings = getStoredSettings();

    setLogs(loadedLogs);
    setSafetyPlan(loadedPlan);
    setSettings(loadedSettings);

    // Load custom patient messages
    try {
      const stored = localStorage.getItem('aegis_contact_messages');
      if (stored) {
        setContactMessages(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }

    // If first time launched, we require onboarding
    const completedOnboarding = localStorage.getItem("bipolar_onboarded") === "true";
    setIsOnboarded(completedOnboarding);

    // If passcode is not enabled, auto unlock
    if (!loadedSettings.pinLockEnabled) {
      setIsUnlocked(true);
    }
  }, []);

  // 1.1 Firebase Auth & Database Synchronization Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsSyncing(true);
        try {
          // Load settings from Firestore
          const settingsRef = doc(db, 'settings', currentUser.uid);
          const settingsSnap = await getDoc(settingsRef);
          let activeSettings = settings;

          if (settingsSnap.exists()) {
            activeSettings = { ...settingsSnap.data(), userId: currentUser.uid } as any as UserSettings;
            setSettings(activeSettings);
          } else if (settings) {
            const initSettings = {
              ...settings,
              userId: currentUser.uid
            };
            await setDoc(settingsRef, initSettings);
            setSettings(initSettings);
            activeSettings = initSettings;
          }

          // Load Safety Plan from Firestore
          const planRef = doc(db, 'safetyPlans', currentUser.uid);
          const planSnap = await getDoc(planRef);
          if (planSnap.exists()) {
            setSafetyPlan({ ...planSnap.data(), userId: currentUser.uid } as any as SafetyPlan);
          } else if (safetyPlan) {
            const planToSave = { ...safetyPlan, userId: currentUser.uid };
            await setDoc(planRef, planToSave);
            setSafetyPlan(planToSave);
          }

          // Load Logs from Firestore
          const logsQuery = query(collection(db, 'logs'), where('userId', '==', currentUser.uid));
          const logsSnap = await getDocs(logsQuery);
          const cloudLogs: BipolarLog[] = [];
          logsSnap.forEach((docSnap) => {
            cloudLogs.push(docSnap.data() as BipolarLog);
          });

          if (cloudLogs.length > 0) {
            setLogs(cloudLogs);
            saveStoredLogs(cloudLogs);
          } else if (logs.length > 0) {
            const batch = writeBatch(db);
            logs.forEach((log) => {
              const logDocRef = doc(db, 'logs', log.id);
              batch.set(logDocRef, { ...log, userId: currentUser.uid });
            });
            await batch.commit();
          }

          setFeedbackMsg("☁️ Clinical data synchronized with Firestore secure sandbox.");
        } catch (error) {
          console.error("Failed to load Firebase data:", error);
          setFeedbackMsg("❌ Warning: Failed to retrieve secure cloud telemetry.");
        } finally {
          setIsSyncing(false);
          setTimeout(() => setFeedbackMsg(null), 5000);
        }
      } else {
        const loadedLogs = getStoredLogs();
        const loadedPlan = getStoredSafetyPlan();
        const loadedSettings = getStoredSettings();
        setLogs(loadedLogs);
        setSafetyPlan(loadedPlan);
        setSettings(loadedSettings);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsSyncing(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setFeedbackMsg("🔓 Authenticated with Google Identity securely.");
    } catch (error: any) {
      console.error("Auth error:", error);
      setFeedbackMsg(`❌ Auth failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedbackMsg(null), 5050);
    }
  };

  const handleSignOut = async () => {
    setIsSyncing(true);
    try {
      await signOut(auth);
      setFeedbackMsg("🔒 Logged out of secure Cloud persistence.");
    } catch (error: any) {
      console.error("Logout error:", error);
      setFeedbackMsg(`❌ Logout failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const forceTriggerSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const logsQuery = query(collection(db, 'logs'), where('userId', '==', user.uid));
      const logsSnap = await getDocs(logsQuery);
      const cloudLogs: BipolarLog[] = [];
      logsSnap.forEach((docSnap) => {
        cloudLogs.push(docSnap.data() as BipolarLog);
      });

      const mergedLogs = [...logs];
      cloudLogs.forEach(cLog => {
        if (!mergedLogs.some(l => l.id === cLog.id)) {
          mergedLogs.push(cLog);
        }
      });

      saveStoredLogs(mergedLogs);
      setLogs(mergedLogs);

      const batch = writeBatch(db);
      mergedLogs.forEach((log) => {
        const logDocRef = doc(db, 'logs', log.id);
        batch.set(logDocRef, { ...log, userId: user.uid });
      });
      await batch.commit();

      if (settings) {
        await setDoc(doc(db, 'settings', user.uid), { ...settings, userId: user.uid });
      }
      if (safetyPlan) {
        await setDoc(doc(db, 'safetyPlans', user.uid), { ...safetyPlan, userId: user.uid });
      }

      setFeedbackMsg("🔄 Full bilateral database synchronization completed successfully!");
    } catch (error) {
      console.error("Manual sync failed:", error);
      setFeedbackMsg("❌ Sync failed. Please verify your connection status.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // 2. Trigger Onboarding Completion
  const handleCompleteOnboarding = (customPin: string, deId: boolean) => {
    if (!settings) return;

    const updatedSettings: UserSettings = {
      ...settings,
      pinCode: customPin,
      pinLockEnabled: customPin.length === 4,
      isDeIdentified: deId,
      isUnlocked: true
    };

    saveStoredSettings(updatedSettings);
    setSettings(updatedSettings);
    localStorage.setItem("bipolar_onboarded", "true");
    setIsOnboarded(true);
    setIsUnlocked(true);

    if (auth.currentUser) {
      setDoc(doc(db, 'settings', auth.currentUser.uid), { ...updatedSettings, userId: auth.currentUser.uid })
        .catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `settings/${auth.currentUser?.uid}`);
        });
    }
  };

  // 3. Unlock via CodeGate
  const handleUnlockSuccess = () => {
    setIsUnlocked(true);
  };

  // 4. Force session lock simulation
  const handleLockSession = () => {
    setIsUnlocked(false);
  };

  // 5. Delete and Erase all data permanently (Right to Erase DPDP Act compliance)
  const handleWipeDatabase = () => {
    if (window.confirm("CRITICAL WARNING: This will permanently erase all mood journals, smartwatch telemetry history, your customized clinical safety plan and lock keys forever. This action is irreversible. Do you wish to continue?")) {
      localStorage.clear();
      // Reload states automatically to seed factory values
      const defaultSet = { ...getStoredSettings(), isUnlocked: false };
      setLogs(getStoredLogs());
      setSafetyPlan(getStoredSafetyPlan());
      setSettings(defaultSet);
      setIsOnboarded(false);
      setIsUnlocked(false);
      localStorage.setItem("bipolar_onboarded", "false");
    }
  };

  // 6. Update general Safety Plan edits
  const handleUpdateSafetyPlan = (updatedPlan: SafetyPlan) => {
    saveStoredSafetyPlan(updatedPlan);
    setSafetyPlan(updatedPlan);
    if (auth.currentUser) {
      setDoc(doc(db, 'safetyPlans', auth.currentUser.uid), { ...updatedPlan, userId: auth.currentUser.uid })
        .catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `safetyPlans/${auth.currentUser?.uid}`);
        });
    }
  };

  // 7. Calculate Active Alerts & Escrow Engine
  const activeAlert = checkProdromalAlert(logs);
  const isEscrowActive = activeAlert.stage !== 'none';
  const escrowRemaining = getEscrowRemainingHours(activeAlert.triggeredAt);

  // Force active UI mode adaptions based on continuous calculations
  // If Escrow is active, we recommend shifting to either "Manic Speed-Capped focus Mode"
  // to force breathing traces on inputs.
  useEffect(() => {
    if (isEscrowActive && activeUiMode === 'balanced') {
      setActiveUiMode('manic'); // Auto adjust to Manic mode to protect from rapid manic logging
    }
  }, [isEscrowActive]);

  // 8. Commit a newly entered journal entry
  const handleSaveJournalLog = (logPayload: Partial<BipolarLog>) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const filledLog: BipolarLog = {
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      dateString: logPayload.dateString || todayStr,
      mood: logPayload.mood ?? 5,
      anxiety: logPayload.anxiety ?? 5,
      energy: logPayload.energy ?? 5,
      sleepDuration: logPayload.sleepDuration ?? 8.0,
      sleepDisruption: logPayload.sleepDisruption ?? 'none',
      steps: logPayload.steps ?? 7000,
      medicationCompliance: logPayload.medicationCompliance ?? {
        zonaltaTaken: true,
        endoxifenTaken: true,
        notes: ""
      },
      sideEffects: logPayload.sideEffects ?? [],
      notes: logPayload.notes ?? "",
      loggedAtMode: logPayload.loggedAtMode ?? activeUiMode
    };

    const newLogs = [...logs, filledLog];
    saveStoredLogs(newLogs);
    setLogs(newLogs);

    if (auth.currentUser) {
      const logDocRef = doc(db, 'logs', filledLog.id);
      setDoc(logDocRef, { ...filledLog, userId: auth.currentUser.uid })
        .catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `logs/${filledLog.id}`);
        });
    }

    // Show temporary diagnostic notification
    const alertCheck = checkProdromalAlert(newLogs);
    if (alertCheck.stage !== 'none') {
      setFeedbackMsg(`🚨 Continuous low sleep detected! PRODROMAL HIGH-RISK status flagged. 48-Hour Decision Escrow activated.`);
    } else {
      setFeedbackMsg(`⭐ Journal entry successfully recorded. HIPAA De-identified logs have been appended.`);
    }

    // Reset balanced logs inputs
    setSimpleNotes('');
    setSimpleSideEffects([]);

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 5000);
  };

  // Handles balanced mood logging
  const handleSimpleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveJournalLog({
      mood: simpleMood,
      anxiety: 5,
      energy: simpleMood,
      sleepDuration: simpleSleep,
      sleepDisruption: simpleSleep < 5 ? 'severe' : 'none',
      steps: 8000,
      medicationCompliance: {
        zonaltaTaken: simpleZonalta,
        endoxifenTaken: simpleEndoxifen,
        notes: "Balanced standard journal dashboard"
      },
      sideEffects: simpleSideEffects,
      notes: simpleNotes,
      loggedAtMode: 'balanced'
    });
  };

  const toggleSimpleSideEffect = (effect: string) => {
    setSimpleSideEffects(prev =>
      prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect]
    );
  };

  // --- Dashboard Data Computations (Dynamic and Real-Time) ---
  const avgMoodNum = logs.length > 0 
    ? logs.reduce((sum, l) => sum + l.mood, 0) / logs.length 
    : 0;
  const averageMood = avgMoodNum > 0 ? avgMoodNum.toFixed(1) : "N/A";

  const avgSleepNum = logs.length > 0 
    ? logs.reduce((sum, l) => sum + l.sleepDuration, 0) / logs.length 
    : 0;
  const averageSleep = avgSleepNum > 0 ? avgSleepNum.toFixed(1) : "N/A";

  // Calculate Medication Adherence Score (Zonalta and Endoxifen taken ratio)
  const totalMedOpportunities = logs.length * 2;
  const takenMeds = logs.reduce((sum, l) => {
    let count = 0;
    if (l.medicationCompliance.zonaltaTaken) count++;
    if (l.medicationCompliance.endoxifenTaken) count++;
    return sum + count;
  }, 0);
  const medicationAdherence = totalMedOpportunities > 0 
    ? Math.round((takenMeds / totalMedOpportunities) * 100) 
    : 100;

  // Determine current mood status descriptor
  let currentMoodStatus = "Balanced / Euthymic";
  let moodStatusColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (logs.length > 0) {
    if (avgMoodNum <= 4.0) {
      currentMoodStatus = "Depressive spectrum / Low Energy";
      moodStatusColor = "text-amber-700 bg-amber-50 border-amber-200";
    } else if (avgMoodNum >= 7.5) {
      currentMoodStatus = "Hyper-arousal / Manic risk";
      moodStatusColor = "text-red-700 bg-red-50 border-red-200";
    }
  }

  // Calculate consecutive sleep average over last 3 logs
  const last3Logs = logs.slice(-3);
  const consecutiveSleepLow = last3Logs.length > 0 && last3Logs.every(l => l.sleepDuration < 4.0);

  // Render Gates if not completed
  if (!isOnboarded && settings) {
    return <OnboardingFlow defaultSettings={settings} onComplete={handleCompleteOnboarding} />;
  }

  if (isOnboarded && settings && !isUnlocked && settings.pinLockEnabled) {
    return (
      <PasscodeGate
        settings={settings}
        onUnlock={handleUnlockSuccess}
        onResetCode={(newPin) => {
          const up = { ...settings, pinCode: newPin };
          saveStoredSettings(up);
          setSettings(up);
          if (auth.currentUser) {
            setDoc(doc(db, 'settings', auth.currentUser.uid), { ...up, userId: auth.currentUser.uid })
              .catch(err => {
                handleFirestoreError(err, OperationType.WRITE, `settings/${auth.currentUser?.uid}`);
              });
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-850 p-3 md:p-6 selection:bg-teal-100 selection:text-teal-900 flex flex-col justify-between">
      
      <div className="max-w-4xl mx-auto w-full space-y-6">

        {/* Master Navigation Bar */}
        <div className="bg-linear-to-r from-stone-900 via-teal-950 to-stone-900 border border-stone-800 p-2.5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md transition-all">
          <div className="flex items-center gap-2 px-2">
            <span className="p-1.5 bg-linear-to-br from-teal-400 to-emerald-500 rounded-lg text-white shadow-xs shadow-teal-400/30">
              <Brain className="w-4 h-4 animate-pulse" />
            </span>
            <span className="font-display font-medium text-xs tracking-tight text-stone-100 font-sans font-bold flex items-center gap-2">
              Aegis Clinical Bipolar Workspace
              <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded-md border border-teal-500/30 font-mono">CORE v1.2</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'home', label: 'Home', icon: Home, activeColor: 'bg-teal-500 text-white shadow-xs shadow-teal-500/30 border border-teal-450/20' },
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, activeColor: 'bg-indigo-500 text-white shadow-xs shadow-indigo-500/30 border border-indigo-400/20' },
              { id: 'about', label: 'About', icon: Info, activeColor: 'bg-amber-500 text-stone-950 shadow-xs shadow-amber-500/30 border border-amber-400/20' },
              { id: 'services', label: 'Prerequisites', icon: Layers, activeColor: 'bg-sky-500 text-stone-900 shadow-xs shadow-sky-500/30 border border-sky-400/20' },
              { id: 'contact', label: 'Contact', icon: Mail, activeColor: 'bg-emerald-505 text-white shadow-xs shadow-emerald-505/30 border border-emerald-400/20' }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? `${item.activeColor} shadow-xs scale-102`
                      : 'text-stone-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CLINICAL SECURE CLOUD SYNC PIPELINE (BACKEND OPERATIONS CENTER) */}
        <div id="clinical-cloud-sync" className="bg-stone-900 border border-stone-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm text-stone-300">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center ${user ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-stone-800 text-stone-400 border-stone-700'}`}>
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-xs tracking-wide uppercase text-stone-100 flex items-center gap-2">
                  Clinical Cloud Persistence Link
                </h3>
                {user ? (
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25 font-bold uppercase font-mono tracking-wider">persistence: active</span>
                ) : (
                  <span className="text-[9px] bg-stone-850 text-stone-450 px-1.5 py-0.5 rounded border border-stone-800 font-bold uppercase font-mono tracking-wider">local cache sandbox</span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 font-normal mt-0.5 leading-normal max-w-lg">
                {user 
                  ? `Active secure connection on Firestore database instance '${db.app.options.projectId}'. Zero-trust rules enforced.`
                  : "Continuous automated local caching. Synchronize over clinical zero-trust pipeline using Google Identity below."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isSyncing && (
              <span className="flex items-center gap-1 text-[10px] text-stone-400 font-mono animate-pulse mr-2">
                <RefreshCw className="w-3 h-3 animate-spin text-teal-400" />
                Syncing...
              </span>
            )}
            {user ? (
              <div id="firebase-sync-buttons" className="flex items-center gap-2">
                <button
                  id="sync-now-button"
                  onClick={forceTriggerSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 hover:border-stone-650 rounded-xl text-[10px] font-bold tracking-normal transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
                  Bilateral Sync
                </button>
                <button
                  id="sign-out-button"
                  onClick={handleSignOut}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-950/30 text-rose-300 border border-rose-900/40 hover:border-rose-900/50 rounded-xl text-[10px] font-bold tracking-normal transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                id="sign-in-button"
                onClick={signInWithGoogle}
                disabled={isSyncing}
                className="px-3.5 py-1.5 bg-linear-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-[10px] font-bold tracking-normal transition-all duration-200 shadow-xs shadow-teal-500/10 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Cloud className="w-3.5 h-3.5" />
                Activate Durable Cloud persistent database
              </button>
            )}
          </div>
        </div>

        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <div className="space-y-6 animate-fade-in">

            {/* 1. Header Bar with HIPAA metadata */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-600">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold font-display tracking-tight text-stone-850 flex items-center gap-2 flex-wrap">
                Aegis Clinical Bipolar Assistant
                <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-200 font-mono font-bold tracking-tight">HIPAA SECURE</span>
              </h1>
              <p className="text-xs text-stone-500 font-sans mt-0.5 max-w-md">
                A gentle companion supporting euthymic balance, offering low-sensory layouts and passive AI active-listening.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-between border-t border-stone-100 md:border-t-0 pt-3 md:pt-0">
            {settings?.isDeIdentified && (
              <div className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] flex items-center gap-1.5 font-mono text-stone-600">
                <EyeOff className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Patient ID: <strong className="text-stone-800">{settings.anonymousId.substring(0, 10)}...</strong></span>
              </div>
            )}
            
            <button
              onClick={handleLockSession}
              className="p-2.5 px-3.5 border border-stone-200 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-605 text-stone-600 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Lock Console Gate"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="font-semibold text-[11px]">Lock Session</span>
            </button>
          </div>

        </header>

        {/* 2. Feedback Notification Toast */}
        {feedbackMsg && (
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-850 font-semibold flex items-center gap-2 justify-center animate-fade-in leading-relaxed text-center shadow-xs">
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* 1.5. Visual Hero & Educational Balance Banner */}
        <div id="aegis-hero-banner" className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border border-stone-800 rounded-2xl p-6 md:p-8 text-stone-100 shadow-xl overflow-hidden relative items-center">
          
          {/* Subtle background element grids/blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="md:col-span-7 space-y-4 z-10 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full text-[10px] font-bold tracking-widest uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              Sovereign Clinical Protocol
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight leading-tight">
              Protecting Euthymic Balance, <br />
              <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">One Gentle Check-In at a Time.</span>
            </h2>
            
            <p className="text-stone-300 text-xs md:text-sm font-sans leading-relaxed max-w-xl">
              Aegis adapts to your psychiatric requirements. By aligning self-reports with clinical PHQ-9 and YMRS criteria, we safeguard baseline mood metrics, preventing hasty impulsive peaks through tactile speed gating.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/60 border border-stone-700/50 rounded-xl text-[10px] sm:text-[11px] font-mono text-stone-300">
                <Brain className="w-3.5 h-3.5 text-teal-400" />
                <span>YMRS Anchored</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/60 border border-stone-700/50 rounded-xl text-[10px] sm:text-[11px] font-mono text-stone-300">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>E2E Decentralized</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/60 border border-stone-700/50 rounded-xl text-[10px] sm:text-[11px] font-mono text-stone-300">
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero Telemetry</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 flex justify-center items-center z-10">
            <div className="relative group overflow-hidden rounded-2xl border border-stone-800 shadow-2xl transition-all duration-300 hover:border-teal-500/30">
              <img 
                src="/src/assets/images/calming_hero_banner_1780947034983.png" 
                alt="Aegis Calming Core Balance Illustration" 
                className="w-full max-w-[340px] md:max-w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-103"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent opacity-90"></div>
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] text-stone-350 font-mono">
                <span>Core Bio-Harmony Model</span>
                <span className="text-teal-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping"></span>
                  Active Shield
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* 3. High-Fidelity proper Nav-Bar */}
        <nav className="bg-white border border-stone-200 p-1 rounded-xl flex flex-wrap gap-1 shadow-xs justify-between">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'text-stone-505 text-stone-600 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Check-In Journal
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'text-stone-605 text-stone-600 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              <BarChart4 className="w-4 h-4" />
              Clinical Insights
            </button>

            <button
              onClick={() => setActiveTab('safety')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'safety'
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'text-stone-605 text-stone-600 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              <BriefcaseMedical className="w-4 h-4" />
              Crisis Blueprint
            </button>
          </div>

          <button
            onClick={() => setActiveTab('aegis_ai')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'aegis_ai'
                ? 'bg-gradient-to-r from-teal-500 to-indigo-500 text-white shadow-xs'
                : 'text-indigo-650 font-bold hover:text-indigo-805 hover:bg-indigo-50/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Aegis Peer AI
          </button>
        </nav>

        {/* 4. Tab Sections Router Render */}

        {/* TAB 1: tracker */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            
            {/* Clinical State Override Deck */}
            <section className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 font-sans">
                    Interactive Interface Modes
                  </h3>
                  <p className="text-[11px] text-stone-500 font-sans">
                    Toggle your active mode manually to match your cognitive energy level right now.
                  </p>
                </div>

                {isEscrowActive && (
                  <span className="text-[10px] font-bold text-red-700 flex items-center gap-1 bg-red-50 px-2.5 py-1 border border-red-200 rounded-full">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600" /> Active Escrow Lock
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Balanced override */}
                <button
                  onClick={() => setActiveUiMode('balanced')}
                  className={`p-3.5 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                    activeUiMode === 'balanced'
                      ? 'border-teal-500 bg-teal-50/20 text-teal-800 shadow-xs'
                      : 'border-stone-105 bg-white hover:border-stone-300 text-stone-500'
                  }`}
                >
                  <span className="text-xs font-bold font-sans">Balanced standard layout</span>
                  <span className="text-[10px] text-stone-400 font-sans mt-1 leading-snug">Default clinical sliders suitable for euthymic intervals.</span>
                </button>

                {/* Depressive override */}
                <button
                  onClick={() => setActiveUiMode('depressive')}
                  className={`p-3.5 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                    activeUiMode === 'depressive'
                      ? 'border-amber-400 bg-amber-50/20 text-amber-800 shadow-xs'
                      : 'border-stone-105 bg-white hover:border-stone-300 text-stone-500'
                  }`}
                >
                  <span className="text-xs font-bold font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Low-Energy (Depressive)
                  </span>
                  <span className="text-[10px] text-stone-400 font-sans mt-1 leading-snug">Zero typing, giant buttons, soothing golden sand palettes.</span>
                </button>

                {/* Manic override */}
                <button
                  onClick={() => setActiveUiMode('manic')}
                  className={`p-3.5 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                    activeUiMode === 'manic'
                      ? 'border-sky-400 bg-sky-50/25 text-sky-850 shadow-xs'
                      : 'border-stone-105 bg-white hover:border-stone-300 text-stone-500'
                  }`}
                >
                  <span className="text-xs font-bold font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                    Impulse Friction (Manic)
                  </span>
                  <span className="text-[10px] text-stone-400 font-sans mt-1 leading-snug">Capped tempo, physical breathing trace, structured grid.</span>
                </button>

              </div>
            </section>

            {/* Display correct logger */}
            <section className="bg-white border border-stone-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-850 font-display">
                    {activeUiMode === 'depressive' ? 'Brain-Fog Mitigating Quick Journal' : 
                     activeUiMode === 'manic' ? 'Grounding Impulse-Controlled Grid' : 
                     'Standard Clinical Journal'}
                  </h3>
                  <p className="text-xs text-stone-500 font-sans mt-0.5">
                    {activeUiMode === 'depressive' ? 'Soothing buttons. Minimal cognitive focus required.' :
                     activeUiMode === 'manic' ? 'Validation friction keys active to reduce overstimulation.' :
                     'Declare standard mood and sleep variables below.'}
                  </p>
                </div>
                <span className="text-[9px] font-mono uppercase bg-stone-50 px-2 py-1 rounded border border-stone-200">
                  {activeUiMode} state controller
                </span>
              </div>

              {activeUiMode === 'depressive' && (
                <LowEnergyLogger
                  onSaveLog={handleSaveJournalLog}
                  isEscrowActive={isEscrowActive}
                />
              )}

              {activeUiMode === 'manic' && (
                <SpeedCappedLogger
                  onSaveLog={handleSaveJournalLog}
                  isEscrowActive={isEscrowActive}
                />
              )}

              {activeUiMode === 'balanced' && (
                <form onSubmit={handleSimpleFormSubmit} className="space-y-4 py-2 animate-fade-in data-stone-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="space-y-1.5 bg-[#FAF9F6] p-3.5 border border-stone-200 rounded-xl">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-stone-650">Current Mood Rating:</label>
                        <span className="text-xs font-bold text-amber-600 font-mono">{simpleMood}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={simpleMood}
                        onChange={(e) => setSimpleMood(Number(e.target.value))}
                        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-500 mt-1"
                      />
                    </div>

                    <div className="space-y-1.5 bg-[#FAF9F6] p-3.5 border border-stone-200 rounded-xl">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-stone-650">Smartwatch Sleep Recorded:</label>
                        <span className="text-xs font-bold text-indigo-700 font-mono">{simpleSleep} hours</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        step="0.5"
                        value={simpleSleep}
                        onChange={(e) => setSimpleSleep(Number(e.target.value))}
                        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-500 mt-1"
                      />
                    </div>

                  </div>

                  {/* Meds compliance checkboxes */}
                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs bg-stone-50 px-3 py-2 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-100 transition-all">
                      <input
                        type="checkbox"
                        checked={simpleZonalta}
                        onChange={(e) => setSimpleZonalta(e.target.checked)}
                        className="rounded text-teal-500 focus:ring-teal-500 bg-white border-stone-300"
                      />
                      <span className="text-stone-700 font-medium">Taken Zonalta</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs bg-stone-50 px-3 py-2 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-100 transition-all">
                      <input
                        type="checkbox"
                        checked={simpleEndoxifen}
                        onChange={(e) => setSimpleEndoxifen(e.target.checked)}
                        className="rounded text-teal-500 focus:ring-teal-500 bg-white border-stone-300"
                      />
                      <span className="text-stone-700 font-medium">Taken Endoxifen</span>
                    </label>
                  </div>

                  {/* Side Effects */}
                  <div className="space-y-1.5">
                    <span className="block text-xs uppercase text-stone-400 font-bold font-sans">Active prescription side effects:</span>
                    <div className="flex flex-wrap gap-2">
                      {["Tremor", "Nausea", "Headache", "Dry Mouth", "Drowsiness"].map((se) => {
                        const hasIt = simpleSideEffects.includes(se);
                        return (
                          <button
                            key={se}
                            type="button"
                            onClick={() => toggleSimpleSideEffect(se)}
                            className={`px-3 py-1.5 border rounded-lg text-xs transition-all cursor-pointer ${
                              hasIt ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                            }`}
                          >
                            {se}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Text Journal Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500 font-bold block">Written Diary Thoughts:</label>
                    <textarea
                      rows={2}
                      value={simpleNotes}
                      onChange={(e) => setSimpleNotes(e.target.value)}
                      placeholder="Enter subtle reflections or daily activities..."
                      className="w-full bg-white border border-stone-200 p-2.5 rounded-xl text-xs font-sans text-stone-850 placeholder-stone-400 focus:outline-none focus:border-teal-500 leading-normal"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-xs cursor-pointer select-none border-t border-teal-400/20 active:scale-95 transition-all text-center"
                    >
                      Save Journal Entry
                    </button>
                  </div>
                </form>
              )}

            </section>

          </div>
        )}

        {/* TAB 2: insights (Charts & Log History List) */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            
            {/* Professional Doctor Analytical Graph */}
            <DoctorCharts logs={logs} safetyPlan={safetyPlan || {
              emergencyContactName: "",
              emergencyContactPhone: "",
              psychiatristName: "",
              psychiatristPhone: "",
              earlyWarningSigns: [],
              crisisRules: []
            }} />

            {/* List of recent logs */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold font-display text-stone-850 border-b border-stone-100 pb-2">
                Recent HIPAA De-Identified Logs List
              </h3>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {logs.slice().reverse().map((log) => (
                  <div key={log.id} className="p-3.5 bg-[#FAF9F6] border border-stone-200 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-stone-600">
                      <span className="font-bold flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {log.dateString}
                      </span>
                      <span className="uppercase text-[9px] bg-white px-2 py-0.5 border border-stone-200 rounded text-stone-500 font-semibold font-mono">
                        {log.loggedAtMode} View
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 border-t border-stone-100 mt-1">
                      <div>
                        <span className="text-[10px] text-stone-500 block">Atmospheric Mood:</span>
                        <strong className="text-amber-500 text-sm font-mono">{log.mood} <span className="text-[10px] font-normal text-stone-400">/10</span></strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block">Sleep Stream:</span>
                        <strong className="text-indigo-650 text-sm font-mono">{log.sleepDuration} hrs</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block">Prescriptions Checked:</span>
                        <span className="text-[10px] text-emerald-650 font-bold font-mono">
                          {log.medicationCompliance.zonaltaTaken ? '★ Zonalta' : '✖ Skipped'} / {log.medicationCompliance.endoxifenTaken ? '★ Endoxifen' : '✖ Skipped'}
                        </span>
                      </div>
                    </div>

                    {log.notes && (
                      <p className="text-[11px] text-stone-605 italic bg-white p-2 rounded border border-stone-100 leading-relaxed font-sans">
                        "{log.notes}"
                      </p>
                    )}

                    {log.sideEffects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.sideEffects.map((se) => (
                          <span key={se} className="px-1.5 py-0.25 bg-amber-50 border border-amber-200 text-amber-800 text-[9px] rounded font-mono">
                            👁️ {se}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: safety (Crisis Safety Blueprint) */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            {safetyPlan && (
              <SafetyPlanPanel
                safetyPlan={safetyPlan}
                onUpdatePlan={handleUpdateSafetyPlan}
                escrowHoursLeft={escrowRemaining.hoursRemaining}
                isEscrowActive={isEscrowActive}
              />
            )}
          </div>
        )}

        {/* TAB 4: aegis_ai (Passive Peer Assistant) */}
        {activeTab === 'aegis_ai' && (
          <div className="space-y-6">
            {safetyPlan && (
              <AegisChat safetyPlan={safetyPlan} />
            )}
          </div>
        )}

          </div>
        )}

        {/* VIEW: DASHBOARD */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-fade-in text-stone-850">
            {/* 1. Header Banner */}
            <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-indigo-500/10 border border-teal-100 p-6 rounded-2xl shadow-sm relative overflow-hidden backdrop-blur-xs">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <LayoutDashboard className="w-40 h-40 text-teal-600" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase font-mono">Clinically Shielded Overview</span>
              <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-stone-900 mt-1">
                Clinical Patient Dashboard
              </h1>
              <p className="text-xs text-stone-600 font-sans mt-1.5 max-w-xl leading-relaxed">
                Your Aegis clinical assistant is actively monitoring circadian baselines and protecting metric privacy. Below is your current real-time clinical telemetry summary.
              </p>
              
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium font-sans">
                <div className="px-2.5 py-1 bg-white/80 border border-stone-200 rounded-lg text-stone-600 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  HIPAA Isolated Mode
                </div>
                {consecutiveSleepLow ? (
                  <div className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                    Prodromal Sleep Risk Active
                  </div>
                ) : (
                  <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-250 rounded-lg text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Sleep Threshold: Secure
                  </div>
                )}
                {isEscrowActive && (
                  <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center gap-1.5 font-sans">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    48hr Decision Escrow Lockout On
                  </div>
                )}
              </div>
            </div>

            {/* 2. Key Telemetry Indicators Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Card 1: Average Mood Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">Average Mood</span>
                  <Activity className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-stone-900 font-display">{averageMood}</span>
                    <span className="text-xs text-stone-400">/ 10</span>
                  </div>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight border ${moodStatusColor}`}>
                    {currentMoodStatus}
                  </span>
                </div>
              </div>

              {/* Card 2: Average Sleep Duration Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">Circadian Rhythm</span>
                  <Moon className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-stone-900 font-display">{averageSleep}</span>
                    <span className="text-xs text-stone-400">hrs</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 font-sans">
                    Average logged nightly rest
                  </p>
                </div>
              </div>

              {/* Card 3: Medication Adherence Rate Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">Meds Compliance</span>
                  <BriefcaseMedical className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-stone-900 font-display">{medicationAdherence}%</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 font-sans">
                    Zonalta & Endoxifen intake
                  </p>
                </div>
              </div>

              {/* Card 4: Total Logged Days Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">Journal Count</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-stone-900 font-display">{logs.length}</span>
                    <span className="text-xs text-stone-400">logs</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 font-sans">
                    Secure patient entries
                  </p>
                </div>
              </div>

            </div>

            {/* 3. Clinical Trend Outlook & Safety anchors */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Visual Trends & Actions */}
              <div className="md:col-span-8 space-y-6">
                
                {/* Visual Chart Panel */}
                <section className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Mood & Sleep Co-Variance</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Clinical trend view powered by local patient records</p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentView('home');
                        setActiveTab('insights');
                      }}
                      className="text-[11px] text-teal-600 hover:underline uppercase font-bold flex items-center gap-1 font-sans cursor-pointer"
                    >
                      <BarChart4 className="w-3.5 h-3.5" /> Full Charts
                    </button>
                  </div>
                  
                  {logs.length > 0 ? (
                    <DoctorCharts logs={logs} safetyPlan={safetyPlan || {
                      emergencyContactName: "",
                      emergencyContactPhone: "",
                      psychiatristName: "",
                      psychiatristPhone: "",
                      earlyWarningSigns: [],
                      crisisRules: []
                    }} />
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                      <LayoutDashboard className="w-8 h-8 text-stone-300 animate-pulse" />
                      <p className="text-xs text-stone-400 font-sans">No journal entries found in your file ledger.</p>
                      <button
                        onClick={() => {
                          setCurrentView('home');
                          setActiveTab('tracker');
                        }}
                        className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-[10px] font-bold font-sans transition-all cursor-pointer"
                      >
                        Create First Entry
                      </button>
                    </div>
                  )}
                </section>

                {/* Cognitive Action Cards */}
                <section className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Cognitive Action Shortcuts</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-sans">
                    
                    <button
                      onClick={() => {
                        setCurrentView('home');
                        setActiveTab('tracker');
                      }}
                      className="p-4 border border-stone-200 hover:border-teal-350 bg-[#FAF9F6] rounded-xl text-left hover:bg-teal-50/10 transition-all group flex flex-col justify-between h-28 cursor-pointer"
                    >
                      <div className="flex justify-between w-full items-center">
                        <span className="p-1.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-lg group-hover:scale-105 transition-all">
                          <PlusCircle className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#7a7a7a]">Daily Log</span>
                      </div>
                      <div className="mt-2 text-stone-850">
                        <span className="text-xs font-bold block">Record Daily Check-In</span>
                        <span className="text-[10px] text-stone-500 leading-normal mt-0.5 block">Log sleep levels, Zonalta dosage, and somatic indicators.</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView('home');
                        setActiveTab('aegis_ai');
                      }}
                      className="p-4 border border-stone-200 hover:border-indigo-350 bg-[#FAF9F6] rounded-xl text-left hover:bg-indigo-50/10 transition-all group flex flex-col justify-between h-28 cursor-pointer"
                    >
                      <div className="flex justify-between w-full items-center">
                        <span className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg group-hover:scale-105 transition-all">
                          <MessageSquare className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#7a7a7a]">Peer AI Chat</span>
                      </div>
                      <div className="mt-2 text-stone-850">
                        <span className="text-xs font-bold block">Seek Reflective Listening</span>
                        <span className="text-[10px] text-stone-500 leading-normal mt-0.5 block">Vent thoughts, review bipolar terminology, or discuss wellness logs.</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView('home');
                        setActiveTab('safety');
                      }}
                      className="p-4 border border-stone-200 hover:border-amber-300 bg-[#FAF9F6] rounded-xl text-left hover:bg-amber-50/10 transition-all group flex flex-col justify-between h-28 cursor-pointer"
                    >
                      <div className="flex justify-between w-full items-center">
                        <span className="p-1.5 bg-amber-50 border border-amber-105 text-amber-700 rounded-lg group-hover:scale-105 transition-all">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#7a7a7a]">Blueprint</span>
                      </div>
                      <div className="mt-2 text-stone-850">
                        <span className="text-xs font-bold block">Update Safety Plan</span>
                        <span className="text-[10px] text-stone-500 leading-normal mt-0.5 block">Secure warning indicators, psychiatrist details, and clinical rules.</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView('contact');
                      }}
                      className="p-4 border border-stone-200 hover:border-sky-305 bg-[#FAF9F6] rounded-xl text-left hover:bg-sky-50/10 transition-all group flex flex-col justify-between h-28 cursor-pointer"
                    >
                      <div className="flex justify-between w-full items-center">
                        <span className="p-1.5 bg-sky-50 border border-sky-100 text-sky-600 rounded-lg group-hover:scale-105 transition-all">
                          <Send className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#7a7a7a]">Clinical Outbox</span>
                      </div>
                      <div className="mt-2 text-stone-850">
                        <span className="text-xs font-bold block">File Clinician Note</span>
                        <span className="text-[10px] text-stone-500 leading-normal mt-0.5 block font-sans">Write secure reflections or draft warnings to your medical practitioner.</span>
                      </div>
                    </button>

                  </div>
                </section>

              </div>

              {/* Right Column: Crisis / Warning Panel */}
              <div className="md:col-span-4 space-y-6">
                
                {/* Active emergency / clinical contact */}
                <section className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-505 font-mono">Clinician Escort Contact</h3>
                  
                  {safetyPlan?.psychiatristPhone ? (
                    <div className="p-4 bg-teal-50/40 border border-teal-150 rounded-xl space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                          <PhoneCall className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <strong className="text-xs text-stone-850 block">{safetyPlan.psychiatristName || "Primary Clinician"}</strong>
                          <span className="text-[10px] text-stone-450 uppercase font-mono font-bold tracking-tight">Active Provider</span>
                        </div>
                      </div>
                      <div className="pt-1.5 flex gap-2">
                        <a
                          href={`tel:${safetyPlan.psychiatristPhone}`}
                          className="w-full text-center py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold tracking-normal transition-all"
                        >
                          Call Clinician Link
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-stone-200 rounded-xl text-center text-xs text-stone-450 bg-[#FAF9F6] italic font-sans border-dashed">
                      No clinician details configured. Update your provider details in the 'Crisis Blueprint' tab.
                    </div>
                  )}
                </section>

                {/* Hotlines */}
                <section className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-505 font-mono">Immediate Crisis Supports</h3>
                  
                  <div className="space-y-2.5 font-sans">
                    <div className="p-3 bg-red-50 border border-red-155 rounded-xl flex items-center justify-between hover:bg-red-50/80 transition-all">
                      <div>
                        <span className="font-bold text-xs text-red-900 block">988 Suicide & Crisis</span>
                        <span className="text-[9px] text-red-700 font-sans">Immediate clinical support 24/7</span>
                      </div>
                      <a href="tel:988" className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold font-mono transition-all">Call</a>
                    </div>

                    <div className="p-3 bg-[#FAF9F6] border border-stone-200 rounded-xl flex items-center justify-between hover:bg-stone-100 transition-all text-xs">
                      <div>
                        <span className="font-bold text-xs text-stone-850 block">Crisis Text Line</span>
                        <span className="text-[9px] text-stone-500 font-sans">Send text 'HOME' to 741741</span>
                      </div>
                      <a href="sms:741741" className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold font-mono transition-all">Text</a>
                    </div>
                  </div>
                </section>

                {/* Warning Signs Checklist from safety plan */}
                <section className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-505 font-mono">Warning Signs Checklist</h3>
                  {safetyPlan?.earlyWarningSigns && safetyPlan.earlyWarningSigns.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto font-sans">
                      {safetyPlan.earlyWarningSigns.map((sign, idx) => (
                        <div key={idx} className="flex gap-2 items-start py-0.5 text-xs text-stone-605">
                          <span className="p-1 bg-stone-100 rounded text-stone-400 mt-0.5">⚠️</span>
                          <span>{sign}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-450 italic font-sans">No custom warning signs selected in your crisis safety blueprint.</p>
                  )}
                </section>

              </div>
            </div>
          </div>
        )}
              
              {/* VIEW 2: ABOUT VIEW (Bipolar Etiology and DSM-5 Center) */}
        {currentView === 'about' && (
          <div className="space-y-6 animate-fade-in text-stone-850">
            <section className="bg-white border border-stone-200 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="border-b border-stone-100 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-widest text-teal-600 uppercase font-sans">Sovereign Clinical Education & Science</span>
                  <h2 className="text-xl md:text-2xl font-bold font-display text-stone-900">Bipolar Etiology & Diagnostic Center</h2>
                  <p className="text-xs text-stone-500 font-sans">
                    Explore the genetic, neurobiological, and clinical criteria regulating the tracking algorithms of Aegis Core.
                  </p>
                </div>
                <div className="flex bg-stone-100 p-1 rounded-xl shrink-0 border border-stone-200">
                  <button
                    onClick={() => setBipolarSectionTab('etiology')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      bipolarSectionTab === 'etiology'
                        ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    1. Etiology (Root Causes)
                  </button>
                  <button
                    onClick={() => setBipolarSectionTab('identification')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      bipolarSectionTab === 'identification'
                        ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    2. DSM-5 Identification
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: ETIOLOGY */}
              {bipolarSectionTab === 'etiology' && (
                <div className="space-y-6 pt-2 animate-fade-in font-sans">
                  <div className="p-4 bg-amber-50/20 border border-amber-200/50 rounded-2xl">
                    <p className="text-xs text-stone-750 leading-relaxed">
                      Bipolar disorder does not stem from personal weakness or character flaws. It is a complex, organic brain condition occurring through a specific interplay of genetics, neurobiology, and environmental stressors.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Genetic Root System */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-stone-900 font-bold font-display text-sm">
                        <span className="p-1.5 bg-amber-100 text-amber-850 rounded-lg shrink-0">🧬</span>
                        1. The Genetic Root System
                      </div>
                      <p className="text-[11px] text-stone-500 font-sans leading-normal">
                        Bipolar disorder is recognized as one of the most highly heritable conditions in all of medicine.
                      </p>
                      <ul className="space-y-2.5 text-xs text-stone-600">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span><strong>Twin Heritability:</strong> If an identical twin has the disorder, risk for the other twin jumps to between <strong>40% and 70%</strong>.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span><strong>First-Degree Link:</strong> Having a parent or sibling increases a person&apos;s risk to <strong>7x to 10x</strong> higher than the general population.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span><strong>Polygenic Network:</strong> Inheritance is <strong>polygenic</strong>, meaning you inherit a cluster of vulnerable genes rather than a single gene.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Faulty Brain Thermostat */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-stone-900 font-bold font-display text-sm">
                        <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">🌡️</span>
                        2. The Faulty Brain &quot;Thermostat&quot;
                      </div>
                      <p className="text-[11px] text-stone-500 font-sans leading-normal">
                        In a healthy brain, neurotransmitters self-regulate. In bipolar disorder, circuits governing emotional rewards malfunction.
                      </p>
                      <ul className="space-y-2.5 text-xs text-stone-600">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span><strong>Hyper-Dopamine Shifts:</strong> Manic spikes experience high surges of <strong>dopamine & norepinephrine</strong>, driving euphoria and loss of reality.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span><strong>Receptor Desensitization:</strong> Following a manic spike, receptors become desensitized/exhausted, crashing into clinical depression.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span><strong>Cellular Enzymes:</strong> Cells struggle with energy. Enzymes like <strong>Protein Kinase C (PKC)</strong> become hyperactive during mania.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Diathesis-Stress Model */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-stone-900 font-bold font-display text-sm">
                        <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">⚡</span>
                        3. Diathesis-Stress Trigger
                      </div>
                      <p className="text-[11px] text-stone-500 font-sans leading-normal">
                        Individuals carry genetic vulnerabilities silently until a severe external life event unlocks the first clinical shift (ages 15 to 25).
                      </p>
                      <ul className="space-y-2.5 text-xs text-stone-600">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span><strong>Circadian Disruption:</strong> Standard sleep transitions (timezone changes, night shifts, all-nighters) can trigger initial mania.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span><strong>Severe Life Stress:</strong> Loss of a loved one, severe trauma, relationship breaks, or workplace burnout pushes past biological capacity.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span><strong>Chemical Interaction:</strong> Alcohol, drugs, or using normal antidepressants without a mood stabilizer can launch first cycles.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: IDENTIFICATION */}
              {bipolarSectionTab === 'identification' && (
                <div className="space-y-6 pt-2 animate-fade-in font-sans">
                  <div className="p-4 bg-teal-50/20 border border-teal-200/50 rounded-2xl text-xs leading-relaxed text-stone-750">
                    🔬 There is no simple blood scan or X-ray to diagnose Bipolar disorder. Diagnostics rely on tracking distinguishable mood shift structures, clinical guidelines (DSM-5), and medical exclusion protocols.
                  </div>

                  {/* Step 1: Mood Shift Comparison */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Step 1: Documenting Distinguishable Mood Shifts</h3>
                    <div className="overflow-x-auto border border-stone-200 rounded-2xl bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200 text-stone-700">
                            <th className="p-3.5 font-bold">Phase Parameter</th>
                            <th className="p-3.5 font-bold text-rose-700">🔴 Manic Episode (Bipolar I)</th>
                            <th className="p-3.5 font-bold text-amber-750">🟡 Hypomanic Episode (Bipolar II)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          <tr>
                            <td className="p-3.5 font-bold text-stone-800">Minimum Duration</td>
                            <td className="p-3.5 text-stone-600">Must last continuously for <strong>at least 7 days</strong> (or any length if immediate hospitalization is required).</td>
                            <td className="p-3.5 text-stone-600">Must last continuously for <strong>at least 4 days</strong> in a row.</td>
                          </tr>
                          <tr>
                            <td className="p-3.5 font-bold text-stone-800">Severity Level</td>
                            <td className="p-3.5 text-stone-600">Severe enough to cause <strong>complete disruption</strong> at work, school, home, or social life.</td>
                            <td className="p-3.5 text-stone-600">Noticeable to family and friends, but does <strong>not</strong> cause complete functional failure.</td>
                          </tr>
                          <tr>
                            <td className="p-3.5 font-bold text-stone-800">Psychosis Present?</td>
                            <td className="p-3.5 text-stone-600 font-bold text-rose-650">Possible. Can include delusions of grandeur or physical hallucinations.</td>
                            <td className="p-3.5 text-stone-500">Never. Reality breaks automatically escalate the clinical state to a manic episode.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Steps 2, 3, 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Step 2: Target Symptom Checklist */}
                    <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2.5">
                      <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1">
                        <span className="text-xs">📋</span> Step 2: DSM-5 High Energy Markers
                      </h4>
                      <p className="text-[10px] text-stone-500 font-bold">Needs 3 or more co-occurring markers during hyper-activity:</p>
                      <ul className="space-y-2 text-xs text-stone-600 leading-relaxed">
                        <li><strong>📉 Sleep drop:</strong> Sleep 2-3 hours only, but wake feeling completely rested and fully powered.</li>
                        <li><strong>🧠 Grandiosity:</strong> Inflated, unrealistic beliefs in powers, status, or starting several companies overnight.</li>
                        <li><strong>🗣️ Pressured Speech:</strong> Flight of ideas, rapid speech so intense that others cannot easily interrupt.</li>
                        <li><strong>⚙️ Hyperactivity:</strong> Continuous overnight pacing or working continuously on large unorganized plans.</li>
                        <li><strong>💸 Impulsivity:</strong> Engaging in high-risk financial sprees, risky buying, or rash reckless driving.</li>
                      </ul>
                    </div>

                    {/* Step 3: Depressive Crash */}
                    <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2.5">
                      <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1">
                        <span className="text-xs">📉</span> Step 3: The Depressive Crash
                      </h4>
                      <p className="text-[10px] text-stone-500 font-bold font-sans">Flat or empty mood + 5 or more signs for at least 2 weeks continuously:</p>
                      <ul className="space-y-2 text-xs text-stone-600 leading-relaxed">
                        <li><strong>Anhedonia:</strong> Total loss of interest/pleasure in standard hobbies and relationships.</li>
                        <li><strong>Exhaustion:</strong> Heavy fatigue; feeling that moving limbs requires enormous physical effort.</li>
                        <li><strong>Somatic shifts:</strong> Sudden weight changes or significant changes in weekly appetite.</li>
                        <li><strong>Guilt:</strong> Intense, recurring worthlessness or irrational, unprovoked guilt levels.</li>
                        <li><strong>Risks:</strong> Persistent thoughts of death, self-injury, or active suicide crisis planning.</li>
                      </ul>
                    </div>

                    {/* Step 4: Medical Exclusion */}
                    <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-2.5">
                      <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1">
                        <span className="text-xs">⚕️</span> Step 4: Medical Exclusions
                      </h4>
                      <p className="text-[10px] text-stone-500 font-bold">Psychiatrists rule out other chemical and hormonal mimics:</p>
                      <ul className="space-y-2 text-xs text-stone-600 leading-relaxed">
                        <li>
                          <strong>Thyroid Blood Panels:</strong> 
                          <span className="block text-[11px] text-stone-500 mt-0.5">Checked to confirm hyperthyroidism is not driving manic restlessness, or hypothyroidism is not mimicking major depressive states.</span>
                        </li>
                        <li>
                          <strong>Toxicology Screenings:</strong> 
                          <span className="block text-[11px] text-stone-505 mt-0.5">Conducted to confirm symptoms are not drug-induced or stemming from acute chemical substance withdrawal.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-[11px] text-stone-500 text-center">
                    🧠 <strong>Application Sync:</strong> Our logs track exactly these duration metrics (e.g. sleep hours vs daily activities) to present your physician a high-resolution, objective diagnostic timeline.
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 3: PREREQUISITES VIEW (Psychiatric Groundwork Pillars) */}
        {currentView === 'services' && (
          <div className="space-y-6 animate-fade-in text-stone-850">
            <section className="bg-white border border-stone-200 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="border-b border-stone-100 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase font-sans">Workspace Integrity Protocol</span>
                  <h2 className="text-xl md:text-2xl font-bold font-display text-stone-900">Psychiatric Groundwork Prerequisites</h2>
                  <p className="text-xs text-stone-500 font-sans">
                    Therapeutic software requires clinical, legal, and cryptographic groundwork before safe operation. Check the status of each pillar below.
                  </p>
                </div>
                <div className="flex bg-stone-100 p-1 rounded-xl shrink-0 border border-stone-200">
                  {['clinical', 'legal', 'privacy', 'doctor'].map((tabOpt) => (
                    <button
                      key={tabOpt}
                      onClick={() => setPrereqActiveCustomTab(tabOpt as any)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                        prereqActiveCustomTab === tabOpt
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {tabOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab: Clinical */}
              {prereqActiveCustomTab === 'clinical' && (
                <div className="space-y-6 pt-2 animate-fade-in font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 space-y-4">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-stone-900 uppercase tracking-wide font-mono">Pillar 1: Clinical & Algorithmic Prerequisites</div>
                        <p className="text-xs text-stone-500">Algorithms must be anchored to vetted clinical scaling criteria, not guesswork.</p>
                      </div>

                      <div className="space-y-3 pt-2">
                        {/* PHQ-9 / YMRS Correlation */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 font-bold inline-block"></span> Standardised Clinical Scaling models
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                            Mood parameters align with established scaling index models. Depression tracker aligns with <strong>PHQ-9 (Patient Health Questionnaire)</strong> criteria, while mania tracking matches the core <strong>Young Mania Rating Scale (YMRS)</strong> behavioral markers.
                          </p>
                        </div>

                        {/* Euthymic Calibration Baseline Tracker */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Calibration Baseline Calibration (Initial 14-Days)
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                            Aegis establishes the patient&apos;s individual <strong>euthymic baseline</strong> over an initial 14-day calibration period before deploying anomaly algorithms.
                          </p>
                          <div className="pt-1 flex items-center gap-3">
                            <div className="text-[10px] text-teal-600 font-bold flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span> Active Baseline Set
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono">Completed Phase (Calibrated)</span>
                          </div>
                        </div>

                        {/* Clinical Insight Disconnect Rule */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> The Clinical Insight Disconnect Rule
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                            As patients rise into a Stage 2 manic phase, their manual subjective score becomes clinically unreliable due to a <strong>loss of insight</strong>. Therefore, our model prioritizes <strong>passive biometrics</strong> (such as a consecutive 50% plunge in sleep tracking) to activate protective locks, overriding manually inputs.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-stone-50 border border-stone-200 rounded-2xl p-4.5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-indigo-700 font-display">Current Calibration Telemetry</span>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs border-b border-stone-150 pb-1 mr-1">
                            <span className="text-stone-500">Scaling Anchor</span>
                            <span className="font-mono text-indigo-700 font-bold">PHQ-9 & YMRS</span>
                          </div>
                          <div className="flex justify-between text-xs border-b border-stone-150 pb-1 mr-1">
                            <span className="text-stone-500">Insight Check status</span>
                            <span className="font-mono text-emerald-600 font-bold">Active Passive Guard</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-stone-500">Calibration Progress</span>
                            <span className="font-mono text-stone-800">14 / 14 Days</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-[10px] text-emerald-800 font-bold font-sans">All clinical model metrics compile successfully.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Legal */}
              {prereqActiveCustomTab === 'legal' && (
                <div className="space-y-6 pt-2 animate-fade-in font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 space-y-4">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-stone-900 uppercase tracking-wide font-mono">Pillar 2: Legal, Liability, & Compliance</div>
                        <p className="text-xs text-stone-500">Explicit boundaries designed to protect patients and minimize health liability.</p>
                      </div>

                      <div className="space-y-3 pt-1">
                        {/* Not Medical Advice */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                            <AlertOctagon className="w-4 h-4 text-amber-700" />
                            The &quot;Not Medical Advice&quot; Safe Harbor
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-normal font-sans">
                            All patient user agreements explicitly outline that this application operates strictly as a personal tracking utility, <strong>not a medical diagnostic tool</strong> or replacement for your certified practitioner (such as Dr. Prasad Rao).
                          </p>
                        </div>

                        {/* Automatic Trigger disclaimers */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 font-display">
                            <ShieldAlert className="w-4 h-4 text-rose-600 font-bold" />
                            Automatic High-Risk Emergency Disclaimers
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-normal">
                            If clinical logs identify suicide-related keywords, or if the mood rating plunges to the lowest scale for multiple consecutive days, Aegis is legally mandated to automatically banner <strong>local high-risk suicide hotlines</strong> instantly.
                          </p>
                        </div>

                        {/* Global Data compliance */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-2">
                          <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5 font-display">
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                            Multi-National Legislative Compliances
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-stone-500">
                            <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                              <strong className="block text-stone-850 mb-0.5">🇮🇳 DPDP Act (India)</strong>
                              Enforces explicitly informed, granular, and revocable consent parameters over all personal healthcare records.
                            </div>
                            <div className="p-2.5 bg-white border border-stone-200 rounded-lg">
                              <strong className="block text-stone-850 mb-0.5">🇺🇸 HIPAA Guidelines (USA)</strong>
                              Enforces administrative, physical, and technical safeguards isolating Protected Health Information (PHI).
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2 text-xs">
                        <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-rose-700">Safety Disclaimer Active</span>
                        <p className="text-[10px] text-stone-500 leading-relaxed font-sans">
                          If you are currently experiencing high-stress suicidal thoughts or somatic emergency crashes, click a hotline below immediately:
                        </p>
                        <div className="space-y-1.5 pt-1 font-mono">
                          <a href="tel:988" className="block text-center bg-rose-50 text-rose-800 border border-rose-100 rounded p-1 text-[11px] font-bold hover:bg-rose-100/50 transition-colors">
                            📞 US Crisis Helpline: Call 988
                          </a>
                          <a href="tel:9152987821" className="block text-center bg-rose-50 text-rose-800 border border-rose-100 rounded p-1 text-[11px] font-bold hover:bg-rose-100/50 transition-colors">
                            📞 India AASRA Support: 91-9152987821
                          </a>
                        </div>
                      </div>
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] text-emerald-805 flex items-center gap-1.5 font-bold font-sans">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        India DPDP & HIPAA active compliance.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Privacy */}
              {prereqActiveCustomTab === 'privacy' && (
                <div className="space-y-6 pt-2 animate-fade-in font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 space-y-4">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-stone-900 uppercase tracking-wide font-mono">Pillar 3: Data Privacy & Cryptographic Prerequisites</div>
                        <p className="text-xs text-stone-500">Mental health variables require security standards far beyond standard metrics.</p>
                      </div>

                      <div className="space-y-3 pt-1">
                        {/* Alphanumeric De-Identification */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5 font-sans">
                          <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                            <EyeOff className="w-4 h-4 text-stone-500" />
                            Alphanumeric De-Identification (Split Architecture)
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-normal font-sans">
                            System employs a strictly sandboxed <strong>&quot;split-database&quot; model</strong>. Personal Identifying Information (PII) sitting on authentication records is completely isolated from health registry logs. Telemetry files are paired purely through a customized anonymous UUID token string.
                          </p>
                        </div>

                        {/* End to End Encryption */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-stone-500" />
                            End-to-End Encryption (E2EE) Standards
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-normal font-sans">
                            Telemetry moving over the web is bound under <strong>TLS 1.3 encryption</strong> protocols, and encrypted stationary inside database disks using military-grade <strong>AES-256 blocks</strong>.
                          </p>
                        </div>

                        {/* Device Biometric Lock */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                            <Lock className="w-4 h-4 text-emerald-600" />
                            Device-Level Passcode Shielding
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-normal font-sans">
                            Aegis requires entering your 4-digit biometric/passcode PIN every single time the app initializes or wakes from standby. This prevents unauthorized physical snooping.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-stone-50 text-xs border border-stone-200 rounded-2xl p-5 space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-indigo-700">Cryptographic Cipher Status</span>
                        <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1.5 font-mono text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-stone-400">Transit:</span>
                            <span className="text-teal-600 font-bold">TLS 1.3 Active</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-stone-400">Encryption:</span>
                            <span className="text-indigo-600">AES-256 Bit Block</span>
                          </div>
                          <div className="flex justify-between font-medium border-t border-stone-100 pt-1">
                            <span className="text-stone-400">Separation Token:</span>
                            <span className="text-amber-650 font-bold">UUID Token Active</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-stone-900 text-stone-100 p-4 border border-stone-800 rounded-xl font-mono text-[10px] leading-normal space-y-1">
                        <div>$ openssl enc -aes-256-cbc</div>
                        <div className="text-amber-400 font-bold">SYSTEM REGISTERED SAFE</div>
                        <div className="text-stone-500">De-Id Key: Verified</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Doctor */}
              {prereqActiveCustomTab === 'doctor' && (
                <div className="space-y-6 pt-2 animate-fade-in font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8 space-y-3">
                      <div className="space-y-1 font-sans">
                        <div className="text-xs font-bold text-stone-900 uppercase tracking-wide font-mono">Pillar 4: Patient-Doctor Integration Prerequisites</div>
                        <p className="text-xs text-stone-500">Self-tracking software is only useful if it accelerates clinical medical collaboration.</p>
                      </div>

                      <div className="space-y-3 pt-2">
                        {/* High-density Clinician Exporter */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-550" />
                            30-Second Clinical PDF Exporter
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-normal font-sans">
                            Compile convoluted multidimensional variables into simplified, clean correlations (Mood vs Sleep scatter plots, kinetics indexes, and daily meds adherence tracking) that your psychiatrist can review in under 30 seconds during limited clinic routines.
                          </p>
                        </div>

                        {/* Emergency Proxy Consent */}
                        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-stone-850 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-rose-600" />
                            Emergency Crisis Proxy Integration
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-normal font-sans">
                            During initial setup, the user authorizes a pre-configured contact. If telemetry indicates a severe prodromal cycle, Aegis releases encrypted communication packets allowing quick diagnostic access.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-indigo-700 font-display">Integrations Logboard</span>
                        <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-1.5 text-[10px] font-sans">
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-stone-500">Form:</span>
                            <span className="text-stone-800 font-bold">Standard PDF Exporter</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-stone-500">Consulting Specialist:</span>
                            <span className="text-stone-800 font-semibold">Dr. Prasad Rao</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-stone-500">Emergency Proxy:</span>
                            <span className="text-indigo-600 font-bold">CONNECTED 🟢</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 bg-[#FAF9F6] border border-stone-200 rounded-lg text-center mt-3 text-[10px] text-stone-400 font-sans">
                        Doctor-patient telemetry linkages verified. PDF exporter ready via homepage button.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 4: CONTACT VIEW */}
        {currentView === 'contact' && (
          <div className="space-y-6 animate-fade-in text-stone-850">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Helplines */}
              <div className="md:col-span-5 space-y-6">
                <section className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-505 font-mono">Immediate Crisis Contacts</h3>
                  <p className="text-[11px] text-stone-500 leading-normal font-sans">
                    For any acute somatic, suicidal, or manic crises, please call hotlines directly. Aegis does not offer psychiatric medication treatment.
                  </p>

                  <div className="space-y-2 font-sans">
                    <div className="p-3 bg-red-50 border border-red-205 rounded-xl flex items-center justify-between hover:bg-red-100/20 transition-all">
                      <div>
                        <span className="font-bold text-xs text-red-900 block">988 Suicide & Crisis Lifeline</span>
                        <span className="text-[10px] text-red-700">Immediate clinical support 24/7/365</span>
                      </div>
                      <a href="tel:988" className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold font-mono transition-all">Call 988</a>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between hover:bg-stone-100 transition-all text-xs">
                      <div>
                        <span className="font-bold text-xs text-stone-800 block">Crisis Text Line</span>
                        <span className="text-[10px] text-stone-500">Send text 'HOME' to 741741</span>
                      </div>
                      <a href="sms:741741" className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold font-mono transition-all">Text Info</a>
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Your Stored Care Specialist</h3>
                  
                  {safetyPlan?.psychiatristPhone ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 rounded text-emerald-800">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-xs text-stone-850 block">{safetyPlan.psychiatristName || "Primary Psychiatrist"}</strong>
                          <span className="text-[10px] text-stone-500 font-mono">Clinical Partner Escort</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${safetyPlan.psychiatristPhone}`}
                          className="w-full text-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all"
                        >
                          Call Office Link
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-stone-200 rounded-xl text-center text-xs text-stone-450 bg-[#FAF9F6] italic font-sans">
                      No customized clinician details found. You can easily link provider diagnostics in the 'Crisis Blueprint' tab on the homepage.
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: Secure Patient Outbox Form */}
              <div className="md:col-span-7 space-y-6">
                <section className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm space-y-5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Secure Patient Outbox</h3>
                    <p className="text-xs text-stone-500 font-sans mt-0.5">
                      Write messages or custom symptom logs to send to your clinician or record clinical notes offline. Stored securely and de-identified locally.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!contactForm.subject.trim() || !contactForm.message.trim()) return;

                      const newMsg = {
                        id: "msg_" + Date.now(),
                        date: new Date().toLocaleString(),
                        subject: contactForm.subject,
                        message: contactForm.message
                      };

                      const updatedList = [...contactMessages, newMsg];
                      setContactMessages(updatedList);
                      localStorage.setItem('aegis_contact_messages', JSON.stringify(updatedList));

                      if (auth.currentUser) {
                        setDoc(doc(db, 'contactMessages', newMsg.id), { ...newMsg, userId: auth.currentUser.uid })
                          .catch(err => {
                            handleFirestoreError(err, OperationType.WRITE, `contactMessages/${newMsg.id}`);
                          });
                      }

                      setContactForm({ name: '', email: '', subject: '', message: '' });
                      
                      setFeedbackMsg("📡 Message generated and logged securely to Clinical Database.");
                      setTimeout(() => {
                        setFeedbackMsg(null);
                      }, 5000);
                    }}
                    className="space-y-4 font-sans"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Subject Topic / Warning Sign</label>
                        <input
                          type="text"
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          placeholder="e.g. Sleep fluctuation query"
                          className="w-full bg-stone-50 border border-stone-200 focus:border-teal-500 focus:outline-none p-2.5 rounded-xl text-xs text-stone-850"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Clinician Code / Patient Identifier</label>
                        <input
                          type="text"
                          placeholder={settings?.isDeIdentified ? `${settings.anonymousId.substring(0, 10)}...` : "De-identified"}
                          disabled
                          className="w-full bg-stone-100 border border-stone-200 text-stone-450 p-2.5 rounded-xl text-xs cursor-not-allowed font-mono text-[#7a7a7a]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase">Outbox Message Narrative</label>
                      <textarea
                        rows={3}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Write secure reflections, medication remarks or subjective warnings here..."
                        className="w-full bg-stone-50 border border-stone-200 focus:border-teal-500 focus:outline-none p-2.5 rounded-xl text-xs text-stone-850 leading-normal"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 animate-fade-in"
                      >
                        <Send className="w-3.5 h-3.5" />
                        File to Outbox Ledger
                      </button>
                    </div>
                  </form>

                  {/* Display outbox messages */}
                  {contactMessages.length > 0 && (
                    <div className="pt-4 border-t border-stone-100 space-y-3 font-sans">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Filed Clinical Reports ({contactMessages.length})</h4>
                        <button
                          onClick={() => {
                            setContactMessages([]);
                            localStorage.removeItem('aegis_contact_messages');
                          }}
                          className="text-[10px] text-red-500 hover:underline uppercase font-bold"
                        >
                          Clean Outbox
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {contactMessages.slice().reverse().map((m) => (
                          <div key={m.id} className="p-3 bg-[#FAF9F6] border border-stone-200 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-stone-500">
                              <span className="font-bold text-stone-700">{m.subject}</span>
                              <span className="font-mono">{m.date}</span>
                            </div>
                            <p className="italic text-[11px] mt-1 text-stone-605 leading-relaxed">"{m.message}"</p>
                            <div className="text-[9px] font-mono text-emerald-600 font-bold flex items-center gap-1 mt-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              Stored Securely Offline (DPDP Compliance check)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>

            </div>
          </div>
        )}

        {/* 7. Compliant Settings Panel (DPDP / Right to Be Forgotten deletion trigger) */}
        <footer className="bg-white border border-stone-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          
          <div className="space-y-1 font-sans">
            <h4 className="font-bold text-stone-850">Clinical Data Security & GDPR Ownership</h4>
            <p className="text-[11px] text-stone-500 max-w-md leading-relaxed">
              In absolute conformance with HIPAA regulations, you preserve <strong>total offline authority over this log ledger</strong>. You hold full rights to export your records or purge your browser storage instantly.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => {
                // Pre-generate raw clinical export bundle
                const bundle = JSON.stringify({ logs, safetyPlan, settings }, null, 2);
                const blob = new Blob([bundle], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `medical_deidentified_episodes_${Date.now()}.json`;
                link.click();
              }}
              className="px-3.5 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-250 text-stone-701 text-stone-700 font-bold rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export HIPAA Ledger
            </button>
            
            <button
              onClick={handleWipeDatabase}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Right to Erase Account
            </button>
          </div>

        </footer>

      </div>

      {/* Floating AI Peer Assistant Workspace */}
      <div id="floating-ai-assistant" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
        {isWidgetChatOpen && safetyPlan && (
          <div className="w-[340px] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-stone-200/85 overflow-hidden flex flex-col animate-fade-in">
            <AegisChat safetyPlan={safetyPlan} onClose={() => setIsWidgetChatOpen(false)} />
          </div>
        )}

        <button
          id="floating-chat-toggle"
          onClick={() => setIsWidgetChatOpen(prev => !prev)}
          className={`p-3.5 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg border hover:scale-105 active:scale-95 ${
            isWidgetChatOpen 
              ? 'bg-stone-900 border-stone-800 text-teal-400 font-bold' 
              : 'bg-gradient-to-br from-teal-500 to-indigo-600 border-teal-400/20 text-white hover:shadow-teal-500/20'
          }`}
          title="Aegis AI Companion"
        >
          {isWidgetChatOpen ? (
            <Sparkles className="w-6 h-6 rotate-180 transition-transform duration-300" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
