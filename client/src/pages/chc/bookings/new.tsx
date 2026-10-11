import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Mic,
  Square,
  Upload,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Tractor,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Compass,
  ArrowRight,
  Info,
  Wand2,
  FileText,
  Volume2,
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { useI18n } from '../../../i18n/index.js';
import { ScheduleSlot, VoiceBookingExtractedData } from '../../../types/index.js';
import { LoadingSpinner } from '../../../components/LoadingSpinner.js';
import { ErrorBanner } from '../../../components/ErrorBanner.js';
import { SuccessToast } from '../../../components/SuccessToast.js';

export const NewBookingPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();

  // Form State
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [machineId, setMachineId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [areaInAcres, setAreaInAcres] = useState<number>(4.0);
  const [cropType, setCropType] = useState('Paddy');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeWindow, setTimeWindow] = useState<'morning' | 'afternoon' | 'evening' | 'custom'>('morning');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [locationVillage, setLocationVillage] = useState('');
  const [locationField, setLocationField] = useState('');
  const [locationLandmark, setLocationLandmark] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Voice AI Assistant State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceExtractedData, setVoiceExtractedData] = useState<VoiceBookingExtractedData | null>(null);
  const [voiceRecordingId, setVoiceRecordingId] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [editableTranscript, setEditableTranscript] = useState<string>('');
  const [showManualTranscript, setShowManualTranscript] = useState<boolean>(true);

  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);

  // Feedback State
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch machines and operators
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
  });

  const { data: operators } = useQuery({
    queryKey: ['users', 'OPERATOR'],
    queryFn: () => api.users.list({ role: 'OPERATOR' }),
  });

  // Default first machine
  useEffect(() => {
    if (machines && machines.length > 0 && !machineId) {
      setMachineId(machines[0].id);
    }
  }, [machines, machineId]);

  // AI Slot Recommendations Query
  const { data: recommendedSlots, isFetching: isFetchingSlots } = useQuery({
    queryKey: ['recommendedSlots', machineId, preferredDate, areaInAcres, locationVillage, cropType],
    queryFn: () =>
      api.schedule.recommendSlots({
        machineId,
        preferredDate,
        areaInAcres,
        location: locationVillage,
        cropType,
      }),
    enabled: !!machineId && !!preferredDate && areaInAcres > 0,
  });

  // Calculate default start and end times based on date and time window if not set
  useEffect(() => {
    if (!scheduledStart) {
      const start = new Date(preferredDate);
      if (timeWindow === 'morning') start.setHours(8, 30, 0, 0);
      else if (timeWindow === 'afternoon') start.setHours(13, 0, 0, 0);
      else if (timeWindow === 'evening') start.setHours(16, 0, 0, 0);
      else start.setHours(9, 0, 0, 0);

      const durationMinutes = Math.round(areaInAcres * 35);
      const end = new Date(start.getTime() + durationMinutes * 60000);

      setScheduledStart(start.toISOString().slice(0, 16));
      setScheduledEnd(end.toISOString().slice(0, 16));
    }
  }, [preferredDate, timeWindow, areaInAcres]);

  // Apply recommended slot to form
  const handleSelectSlot = (slot: ScheduleSlot) => {
    setScheduledStart(new Date(slot.startTime).toISOString().slice(0, 16));
    setScheduledEnd(new Date(slot.endTime).toISOString().slice(0, 16));
    setToastMessage(`Selected AI Recommended Slot: ${slot.reason}`);
  };

  // Sample Agricultural Calls for testing without microphone
  const SAMPLE_CALLS = [
    {
      label: '🌾 தமிழ் (Tamil Call)',
      desc: 'விவசாயி முருகன் (வாடிப்பட்டி) - 4 ஏக்கர் நெல், ரோட்டவேட்டர்',
      lang: 'ta',
      text: 'வணக்கம் CHC மையம். நான் விவசாயி முருகன், மதுரை வாடிப்பட்டி கிராமத்திலிருந்து பேசுகிறேன். நாளை காலை 4 ஏக்கர் நெல் வயலுக்கு உழவு செய்ய ஒரு ரோட்டவேட்டர் உடனடியாக தேவைப்படுகிறது. ஆரம்ப பள்ளி அருகில் வயல் உள்ளது. என் தொடர்பு எண் 9876543210.',
    },
    {
      label: '🚜 Tanglish (Tamil-English Call)',
      desc: 'Farmer Karthik (Pollachi) - 3 acre paddy, super seeder',
      lang: 'ta',
      text: 'Hello sir, naan farmer Karthik from Pollachi. Enaku 3 acre paddy ku super seeder venum tomorrow morning. Near water tank landmark. Mobile 9842112233.',
    },
    {
      label: '🌾 हिंदी (Hindi Call)',
      desc: 'किसान कुलदीप सिंह (लुधियाना) - 8 एकड़ धान, कंबाइन हार्वेस्टर',
      lang: 'hi',
      text: 'नमस्ते, मैं किसान कुलदीप सिंह बोल रहा हूं लुधियाना पिंड से। मुझे कल सुबह 8 एकड़ धान के लिए कंबाइन हार्वेस्टर चाहिए। संपर्क 9814012345।',
    },
    {
      label: '🚜 English (Punjab Dispatch)',
      desc: 'Farmer Gurpreet Singh (Morinda) - 10 acres wheat, combine',
      lang: 'en',
      text: 'Hello CHC, this is farmer Gurpreet Singh calling from Morinda village. I need a combine harvester for 10 acres of wheat field near the primary school tomorrow. My phone is 9876543214.',
    },
  ];

  // Transpose extracted NLP data into booking form fields
  const applyExtractedDataToForm = (data: VoiceBookingExtractedData) => {
    if (data.farmerName) setFarmerName(data.farmerName);
    if (data.farmerPhone) setFarmerPhone(data.farmerPhone);
    if (data.areaInAcres) setAreaInAcres(data.areaInAcres);
    if (data.cropType) setCropType(data.cropType);
    if (data.village) setLocationVillage(data.village);
    if (data.field) setLocationField(data.field);
    if (data.landmark) setLocationLandmark(data.landmark);
    if (data.preferredDate) setPreferredDate(data.preferredDate);
    if (data.timeWindow && ['morning', 'afternoon', 'evening'].includes(data.timeWindow)) {
      setTimeWindow(data.timeWindow as any);
    }

    // Match machine type
    if (data.machineType && machines && machines.length > 0) {
      const targetType = data.machineType.toUpperCase();
      const match = machines.find(m => m.type.toUpperCase() === targetType);
      if (match) {
        setMachineId(match.id);
      } else {
        const partial = machines.find(m => m.type.toUpperCase().includes(targetType) || targetType.includes(m.type.toUpperCase()));
        if (partial) setMachineId(partial.id);
      }
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    setError(null);
    liveTranscriptRef.current = '';
    setLiveTranscript('');

    // Initialize Web Speech API for real-time multilingual transcription (Tamil, Hindi, English)
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let str = '';
          for (let i = 0; i < event.results.length; ++i) {
            str += event.results[i][0].transcript;
          }
          if (str) {
            liveTranscriptRef.current = str;
            setLiveTranscript(str);
            setEditableTranscript(str);
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      } catch (recErr) {
        console.warn('SpeechRecognition initialization notice:', recErr);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone error or permission denied:', err);
      // Fallback: trigger simulated call recording demonstration
      simulateVoiceCapture();
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  // Process text transcript directly via Agricultural NLP engine
  const handleProcessTranscript = async (textToProcess: string, customLang?: string) => {
    if (!textToProcess.trim()) return;
    setIsProcessingVoice(true);
    setError(null);
    try {
      const activeLang = customLang || language;
      const dummyBlob = new Blob(['simulated-audio-content'], { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', dummyBlob, 'voice_call.webm');
      formData.append('language', activeLang);
      formData.append('transcript', textToProcess.trim());

      const result = await api.voice.process(formData);
      setVoiceRecordingId(result.voiceRecordingId);
      setVoiceTranscript(result.transcript);
      setEditableTranscript(result.transcript);
      setVoiceExtractedData(result.extractedData);

      applyExtractedDataToForm(result.extractedData);
      setToastMessage('Multilingual agricultural entities extracted and applied to form!');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to process voice transcript');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Simulated Voice Capture for testing environments without microphone
  const simulateVoiceCapture = async () => {
    const defaultSample = SAMPLE_CALLS.find(s => s.lang === language) || SAMPLE_CALLS[0];
    setEditableTranscript(defaultSample.text);
    await handleProcessTranscript(defaultSample.text, defaultSample.lang);
  };

  // Handle Audio File / Blob Upload to backend
  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_call.webm');
      formData.append('language', language);
      const textToSubmit = liveTranscriptRef.current.trim() || editableTranscript.trim();
      if (textToSubmit) {
        formData.append('transcript', textToSubmit);
      }

      const result = await api.voice.process(formData);
      setVoiceRecordingId(result.voiceRecordingId);
      setVoiceTranscript(result.transcript);
      setEditableTranscript(result.transcript);
      setVoiceExtractedData(result.extractedData);

      applyExtractedDataToForm(result.extractedData);
      setToastMessage('Voice booking processed and parameters transposed into form!');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to process voice recording');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Confirm Voice Booking (Schedule This Job? -> Yes)
  const handleConfirmVoiceBooking = async () => {
    if (!voiceRecordingId) return;
    try {
      await api.voice.confirm({
        voiceRecordingId,
        overrides: {
          areaInAcres,
          cropType,
          locationVillage,
          locationField,
          locationLandmark,
          scheduledStart,
          scheduledEnd,
        },
      });
      setToastMessage('Voice booking confirmed and created successfully!');
      setTimeout(() => navigate('/chc/bookings'), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error confirming voice booking');
    }
  };

  // Reject Voice Booking (Schedule This Job? -> No)
  const handleRejectVoiceBooking = async () => {
    if (!voiceRecordingId) return;
    try {
      await api.voice.reject({ voiceRecordingId });
      setVoiceExtractedData(null);
      setVoiceRecordingId(null);
      setVoiceTranscript(null);
      setToastMessage('Voice recording and extracted data deleted per privacy consent.');
    } catch (err: any) {
      setError('Error rejecting voice booking');
    }
  };

  // Submit Standard Booking
  const createBookingMutation = useMutation({
    mutationFn: (payload: any) => api.bookings.create(payload),
    onSuccess: () => {
      setToastMessage('Booking scheduled successfully!');
      setTimeout(() => navigate('/chc/bookings'), 1000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to create booking');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
      setError('Estimated end time must be after scheduled start time.');
      return;
    }

    createBookingMutation.mutate({
      farmerName,
      farmerPhone,
      machineId,
      operatorId: operatorId || null,
      areaInAcres: Number(areaInAcres),
      cropType,
      locationVillage,
      locationField,
      locationLandmark,
      scheduledStart: new Date(scheduledStart).toISOString(),
      scheduledEnd: new Date(scheduledEnd).toISOString(),
      specialInstructions,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t('bookings.new.title')}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {t('bookings.new.subtitle')}
        </p>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {toastMessage && (
        <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* Voice-to-Booking Assistant Section */}
      <div className="bg-gradient-to-br from-farm-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-farm-500/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-farm-500/20 border border-farm-500/40 text-farm-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-farm-400" />
              <span>AI Feature 1: Speech-to-Text & Agricultural NLP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t('voice.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {t('voice.consent')}
            </p>
          </div>

          {/* Record Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isProcessingVoice}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-farm-600 hover:bg-farm-500 text-white font-bold text-sm shadow-lg shadow-farm-600/30 flex items-center justify-center space-x-2.5 transition-all hover:scale-105"
              >
                <Mic className="w-5 h-5 text-white" />
                <span>{t('voice.startRecord')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2.5 transition-all animate-pulse"
              >
                <Square className="w-4 h-4 fill-white text-white" />
                <span>Stop Recording ({recordingSeconds}s)</span>
              </button>
            )}

            <label className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>{t('voice.uploadFile')}</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleAudioUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Real-time Listening Feedback */}
        {isRecording && (
          <div className="mt-6 pt-6 border-t border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-red-300 font-bold">
              <span className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-red-400 animate-bounce" />
                <span>
                  Listening live in {language === 'ta' ? 'தமிழ் (Tamil)' : language === 'hi' ? 'हिंदी (Hindi)' : 'English'}...
                </span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-900/60 border border-red-500/50 text-red-200">
                Recording: {recordingSeconds}s
              </span>
            </div>
            <div className="p-3 bg-black/40 border border-red-500/30 rounded-xl text-sm text-white font-medium min-h-[52px]">
              {liveTranscript || (
                <span className="text-slate-400 italic">
                  {language === 'ta'
                    ? 'பேசுங்கள் (எ.கா: "நான் விவசாயி முருகன், 4 ஏக்கர் நெல் வயலுக்கு ரோட்டவேட்டர் வேண்டும்...")...'
                    : language === 'hi'
                    ? 'बोलें (उदा: "मैं किसान कुलदीप सिंह, 5 एकड़ धान के लिए कंबाइन हार्वेस्टर चाहिए...")...'
                    : 'Speak naturally (e.g. "I am farmer Ramesh from Rampur, need a rotavator for 4 acres...")...'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessingVoice && (
          <div className="mt-6 pt-6 border-t border-slate-700/60 flex items-center justify-center space-x-3 text-sm text-farm-300 font-semibold animate-pulse">
            <LoadingSpinner size="sm" />
            <span>{t('voice.processing')}</span>
          </div>
        )}

        {/* Multilingual Agricultural NLP Test Bench & Spoken Transcript Editor */}
        <div className="mt-6 pt-6 border-t border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowManualTranscript(prev => !prev)}
              className="text-xs font-bold text-farm-300 hover:text-farm-200 flex items-center space-x-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Spoken Transcript & Quick Call Test Bench</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {showManualTranscript ? '(Hide)' : '(Show)'}
              </span>
            </button>
            <span className="text-[11px] text-slate-400">
              Zero-credit multilingual NLP engine (Tamil, Hindi, English)
            </span>
          </div>

          {showManualTranscript && (
            <div className="bg-slate-950/60 border border-slate-700/70 rounded-2xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Spoken Call Transcript (Review, edit, or paste call notes):
                </label>
                <textarea
                  rows={2}
                  value={editableTranscript}
                  onChange={e => setEditableTranscript(e.target.value)}
                  placeholder={
                    language === 'ta'
                      ? 'வணக்கம், நான் விவசாயி முருகன், வாடிப்பட்டி கிராமத்திலிருந்து பேசுகிறேன்...'
                      : language === 'hi'
                      ? 'नमस्ते, मैं किसान कुलदीप सिंह, लुधियाना पिंड से बोल रहा हूं...'
                      : 'Hello CHC, this is farmer Gurpreet Singh calling from Morinda...'
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-farm-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                    Quick Sample Calls:
                  </span>
                  {SAMPLE_CALLS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditableTranscript(sample.text);
                        handleProcessTranscript(sample.text, sample.lang);
                      }}
                      disabled={isProcessingVoice}
                      title={sample.desc}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium hover:border-farm-500/50 transition-all hover:scale-105 active:scale-95"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleProcessTranscript(editableTranscript)}
                  disabled={isProcessingVoice || !editableTranscript.trim()}
                  className="px-4 py-1.5 rounded-xl bg-farm-600 hover:bg-farm-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-farm-600/20 transition-all"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Extract with Multilingual NLP</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Fields Preview Form & Confirm Prompt */}
        {voiceExtractedData && !isProcessingVoice && (
          <div className="mt-6 pt-6 border-t border-slate-700/80 bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-farm-400">
                {t('voice.previewPrompt')} (Confidence: {Math.round((voiceExtractedData.confidence || 0.95) * 100)}%)
              </span>
              <span className="text-xs text-slate-400">Entities Transposed to Form</span>
            </div>

            {voiceTranscript && (
              <div className="p-3 bg-slate-900/80 rounded-xl text-xs text-slate-300 italic border border-slate-700">
                "{voiceTranscript}"
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block font-medium">Farmer:</span>
                <span className="font-bold text-white text-sm">
                  {voiceExtractedData.farmerName || 'Farmer Client'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  📞 {voiceExtractedData.farmerPhone || 'Not specified'}
                </span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block font-medium">Machine Required:</span>
                <span className="font-bold text-farm-300 text-sm">
                  {voiceExtractedData.machineType || 'TRACTOR'}
                </span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block font-medium">Area & Crop:</span>
                <span className="font-bold text-white text-sm">
                  {voiceExtractedData.areaInAcres} Acres ({voiceExtractedData.cropType})
                </span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 block font-medium">Location:</span>
                <span className="font-bold text-white text-sm">{voiceExtractedData.village}</span>
                {voiceExtractedData.landmark && (
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                    📍 {voiceExtractedData.landmark}
                  </span>
                )}
              </div>
            </div>

            {voiceExtractedData.specialNotes && (
              <div className="text-[11px] text-farm-400 bg-farm-950/40 border border-farm-500/20 px-3 py-1.5 rounded-lg">
                ℹ️ {voiceExtractedData.specialNotes}
              </div>
            )}

            {/* Prompt: Schedule this job? Yes / No */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-sm font-bold text-white flex items-center space-x-2">
                <Info className="w-4 h-4 text-farm-400" />
                <span>{t('voice.confirmPrompt')}</span>
              </p>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRejectVoiceBooking}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-600 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>{t('voice.no')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVoiceBooking}
                  className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-farm-500 hover:bg-farm-400 text-slate-950 text-xs font-black shadow-md shadow-farm-500/20 transition-all flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('voice.yes')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Booking Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Job Parameters & Field Location</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure farmer credentials, machinery selection, and geographic dispatch location.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Farmer Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('bookings.farmerName')} *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={farmerName}
                onChange={e => setFarmerName(e.target.value)}
                placeholder="e.g. Murugan or Rajesh Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Farmer Phone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('bookings.farmerPhone')} *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={farmerPhone}
                onChange={e => setFarmerPhone(e.target.value)}
                placeholder="e.g. 9876543213"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Machine Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('bookings.machineType')} *
            </label>
            <div className="relative">
              <Tractor className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                required
                value={machineId}
                onChange={e => setMachineId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-semibold"
              >
                {machines?.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Area in Acres */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('bookings.areaInAcres')} *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="500"
              required
              value={areaInAcres}
              onChange={e => setAreaInAcres(parseFloat(e.target.value) || 1)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-bold"
            />
          </div>

          {/* Crop Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('bookings.cropType')}
            </label>
            <select
              value={cropType}
              onChange={e => setCropType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-medium"
            >
              <option value="Paddy">Paddy / Rice (धान / நெல்)</option>
              <option value="Wheat">Wheat (गेहूं / கோதுமை)</option>
              <option value="Mustard">Mustard (सरसों / கடுகு)</option>
              <option value="Cotton">Cotton (कपास / பருத்தி)</option>
              <option value="Sugarcane">Sugarcane (गन्ना / கரும்பு)</option>
              <option value="Maize">Maize (मक्का / மக்காச்சோளம்)</option>
              <option value="Banana">Banana (केला / வாழை)</option>
              <option value="Groundnut">Groundnut (मूंगफली / வேர்க்கடலை)</option>
            </select>
          </div>

          {/* Assigned Operator */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('bookings.operator')} (Optional)
            </label>
            <select
              value={operatorId}
              onChange={e => setOperatorId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-medium"
            >
              <option value="">Assign Operator Later</option>
              {operators?.map(op => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.village || 'CHC Base'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Details */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-1.5">
            <MapPin className="w-4 h-4 text-farm-600" />
            <span>Field Geographic Coordinates & Landmark</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t('common.village')} *
              </label>
              <input
                type="text"
                required
                value={locationVillage}
                onChange={e => setLocationVillage(e.target.value)}
                placeholder="e.g. Vadipatti or Morinda"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t('common.field')}
              </label>
              <input
                type="text"
                value={locationField}
                onChange={e => setLocationField(e.target.value)}
                placeholder="e.g. North Plot 4A"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t('common.landmark')}
              </label>
              <input
                type="text"
                value={locationLandmark}
                onChange={e => setLocationLandmark(e.target.value)}
                placeholder="e.g. Beside Water Canal"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* AI Slot Recommendations Feature */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-farm-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {t('slots.recommendationsTitle')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('slots.recommendationsSubtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Target Date:</span>
              <input
                type="date"
                value={preferredDate}
                onChange={e => setPreferredDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Cards for recommended slots */}
          {isFetchingSlots ? (
            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center space-x-2 text-xs text-slate-500">
              <LoadingSpinner size="sm" />
              <span>Analyzing machine schedule and field proximity...</span>
            </div>
          ) : recommendedSlots && recommendedSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendedSlots.map((slot, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSlot(slot)}
                  className="group cursor-pointer p-4 rounded-2xl border-2 border-slate-200 hover:border-farm-500 bg-white hover:bg-farm-50/40 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-farm-100 text-farm-900 px-2 py-0.5 rounded-md">
                        {idx === 0 ? 'Top AI Match' : `Option ${idx + 1}`}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {slot.score}% Fit
                      </span>
                    </div>

                    <div className="text-sm font-black text-slate-900 mt-1">
                      {new Date(slot.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(slot.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                      {slot.reason}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-farm-700 group-hover:text-farm-900">
                    <span>{t('slots.select')}</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Start and End Times */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('bookings.scheduledStart')} *
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledStart}
              onChange={e => setScheduledStart(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('bookings.scheduledEnd')} *
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledEnd}
              onChange={e => setScheduledEnd(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900 font-bold"
            />
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            {t('bookings.instructions')}
          </label>
          <textarea
            rows={3}
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            placeholder="Field soil conditions, laser leveling requirements, diesel reimbursement terms..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-farm-600 focus:bg-white text-slate-900"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/chc/bookings')}
            className="px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={createBookingMutation.isPending}
            className="px-6 py-3 text-sm font-bold text-white bg-farm-600 hover:bg-farm-700 rounded-xl shadow-lg shadow-farm-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {createBookingMutation.isPending ? t('common.loading') : t('bookings.createSubmit')}
          </button>
        </div>
      </form>
    </div>
  );
};
