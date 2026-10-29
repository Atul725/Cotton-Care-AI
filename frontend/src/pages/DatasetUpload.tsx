import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Table,
  Layers,
  Database,
  RefreshCw,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetUploadResult, DatasetSummary } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const DatasetUpload: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<DatasetUploadResult | null>(null);
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = async () => {
    try {
      const list = await api.listDatasets();
      setDatasets(list);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadDataset(selectedFile);
      setUploadResult(result);
      fetchDatasets();
    } catch (err: any) {
      setError(err.message || 'Dataset upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
          <Database className="w-3.5 h-3.5" />
          {t('datasetTitle')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('datasetTitle')}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          {t('datasetSubtitle')}
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-cotton-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              id="csv-file-input"
              className="hidden"
            />
            <label
              htmlFor="csv-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-cotton-600">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : t('datasetDropzone')}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready`
                    : t('datasetSchemaInfo')}
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="bg-cotton-600 hover:bg-cotton-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-cotton-600/20 text-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  {t('datasetUploadBtn')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Upload Results & Quality Report */}
      {uploadResult && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-slate-900 text-base">
                Dataset Health & Validation Summary
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Verified Ingestion
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xl font-extrabold text-slate-900">
                {uploadResult.dataset.row_count.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Total Observations</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xl font-extrabold text-slate-900">
                {uploadResult.dataset.column_count}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Agricultural Features</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xl font-extrabold text-emerald-600">
                {uploadResult.dataset.null_count}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Null / Missing Values</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xl font-extrabold text-slate-900">
                {uploadResult.dataset.duplicate_count}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Duplicate Records</div>
            </div>
          </div>

          {/* Preview Table */}
          {uploadResult.preview.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-cotton-600" />
                  Dataset Preview (First 10 Observations)
                </h3>
                <span className="text-[11px] text-slate-500">Horizontal scroll enabled</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      {Object.keys(uploadResult.preview[0]).map((key) => (
                        <th key={key} className="px-3 py-2.5 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {uploadResult.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-slate-700 whitespace-nowrap font-mono text-[11px]">
                            {val !== null ? String(val) : <span className="text-rose-500">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previously Uploaded Datasets */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cotton-600" />
          Ingested Repository Records ({datasets.length})
        </h2>

        {datasets.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No datasets uploaded yet. Upload a CSV above to inspect its metrics.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {datasets.map((d) => (
              <div key={d.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-cotton-600" />
                  <div>
                    <div className="font-bold text-xs text-slate-900">{d.filename}</div>
                    <div className="text-[11px] text-slate-500">
                      {d.row_count.toLocaleString()} rows • {d.column_count} features • {(d.file_size_bytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {new Date(d.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
