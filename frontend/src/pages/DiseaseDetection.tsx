import React, { useState } from 'react';
import {
  ScanLine,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  ShieldCheck,
  RefreshCw,
  Info,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { DiseaseDetectionResult } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { useLanguage } from '../i18n/LanguageContext';

interface DiseaseDetectionProps {
  language?: string;
}

export const DiseaseDetection: React.FC<DiseaseDetectionProps> = () => {
  const { language, t } = useLanguage();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { speak, isSpeaking, stopSpeaking } = useSpeech();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.detectDisease(selectedFile, 'demo_farmer');
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Crop disease inspection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleListenReport = () => {
    if (!result) return;
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(result.diagnostic_report, language);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          <ScanLine className="w-3.5 h-3.5" />
          Plant Pathology Diagnostic Module
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('diseaseTitle', 'Cotton Crop & Leaf Disease Diagnosis')}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          {t('diseaseSubtitle', 'Multimodal Vision Diagnostic System for Foliar & Canopy Pathology')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Upload Column (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-cotton-600" />
            {t('diseaseUploadBox', 'Upload Affected Cotton Leaf Photo')}
          </h2>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 hover:border-cotton-500 rounded-2xl p-6 text-center transition bg-slate-50/50">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                id="leaf-image-input"
                className="hidden"
              />
              <label
                htmlFor="leaf-image-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                {previewUrl ? (
                  <div className="relative w-full max-h-56 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                    <img
                      src={previewUrl}
                      alt="Crop Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center text-white text-xs font-bold opacity-0 hover:opacity-100 transition">
                      Click to choose another photo
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-rose-600">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">
                        {t('diseaseGalleryBtn', 'Choose leaf photo or take a picture')}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports JPEG, PNG, WEBP (under 12 MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedFile || loading}
              className="w-full bg-cotton-600 hover:bg-cotton-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-cotton-600/20 text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('diseaseAnalyzing', 'Analyzing Pathogens & Symptoms...')}
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" />
                  {t('diseaseAnalyzeBtn', 'Run AI Disease Analysis')}
                </>
              )}
            </button>
          </form>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <strong>📸 Photography Tips:</strong>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>{t('diseaseUploadHint', 'Take a clear, well-lit photograph focusing on leaf spots, discoloration, or curling.')}</li>
              <li>Avoid blurred or shadowed backgrounds.</li>
            </ul>
          </div>
        </div>

        {/* Diagnosis Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            result.is_valid_cotton_leaf === false ? (
              /* Invalid Leaf Warning Card */
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-300 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-amber-900 text-base">
                      {t('diseaseInvalidTitle', 'Invalid Image — Not a Cotton Leaf')}
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5 font-medium">
                      {result.validation_message || t('diseaseInvalidHint', 'Please upload a clear photograph of a cotton leaf, boll, or stem for disease diagnosis.')}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5 leading-relaxed">
                  <strong>Important Guidance:</strong>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                    <li>Only photographs showing cotton foliage, leaves, bolls, or stems can be evaluated.</li>
                    <li>Avoid uploading flower-only close-ups, human faces, animals, documents, or unrelated crops.</li>
                    <li>Ensure daylight illumination and sharp focus on symptomatic leaf spots.</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Valid Diagnosis Result */
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fadeIn">
                {/* Header Box */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {t('diseaseConditionDetected', 'Diagnostic Finding')}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {result.condition_detected}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                        {t('diseaseSeverity', 'Severity')}: {result.severity_level}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {t('diseaseConfidence', 'Confidence')}: {(result.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleListenReport}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isSpeaking
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-4 h-4 text-rose-600" /> Stop Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-cotton-600" /> Listen Audio
                      </>
                    )}
                  </button>
                </div>

                {/* Full Diagnostic Report Text */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    📋 {t('diseaseReportHeader', 'Detailed Pathology Report')}
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                    {result.diagnostic_report}
                  </div>
                </div>

                {/* Immediate Actions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {t('diseaseImmediateHeader', 'Immediate Management Steps')}
                  </h4>
                  <ul className="space-y-1.5">
                    {result.immediate_actions.map((act, i) => (
                      <li key={i} className="text-xs text-slate-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60 flex items-start gap-2">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Preventive Measures */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    {t('diseasePreventiveHeader', 'Preventive Field Practices')}
                  </h4>
                  <ul className="space-y-1.5">
                    {result.preventive_measures.map((prev, i) => (
                      <li key={i} className="text-xs text-slate-700 bg-sky-50/60 p-2.5 rounded-lg border border-sky-200/60 flex items-start gap-2">
                        <span className="text-sky-700 font-bold">•</span>
                        <span>{prev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Engine Badge and Disclaimer */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>{t('diseaseEngine', 'Engine')}: <strong>{result.detection_engine}</strong></span>
                  <span className="italic text-slate-400">Consult local agricultural officers before chemical applications.</span>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <ScanLine className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-slate-900 text-base">{t('diseaseTitle', 'Cotton Leaf Disease Diagnosis')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('diseaseUploadHint', 'Upload a photo on the left and click "Run AI Disease Analysis" to inspect foliar pathogens.')}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
