import { useState, useEffect } from 'react';
import {
  ArrowLeft, Settings, Eye, EyeOff, Lock, Unlock, AlertCircle,
  ChevronDown, ChevronUp, Plus, Trash2, Save, RotateCcw, Loader2,
  Shield, Zap, Toggle2, LayoutGrid, Download, Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import api from '../../services/api';

type Role = 'recruiter' | 'tl' | 'manager' | 'admin';

interface FieldConfig {
  fieldName: string;
  displayName: string;
  dataType: string;
  visibility: { hidden: boolean; readonly: boolean; mandatory: boolean };
  validation?: Record<string, any>;
  helpText?: string;
  placeholder?: string;
  category?: string;
}

interface FeatureToggle {
  excelImportEnabled: boolean;
  resumeParsingEnabled: boolean;
  bulkOperationsEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  advancedFiltersEnabled: boolean;
}

interface ImportPreset {
  _id?: string;
  name: string;
  description?: string;
  mapping: Array<{ excelColumn: string; systemField: string }>;
  isDefault?: boolean;
}

const ROLES: Role[] = ['recruiter', 'tl', 'manager', 'admin'];
const ROLE_LABELS: Record<Role, string> = {
  recruiter: 'Recruiter',
  tl: 'Team Lead',
  manager: 'Manager',
  admin: 'Admin',
};

export function FieldConfigurationPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>('recruiter');
  const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>([]);
  const [features, setFeatures] = useState<FeatureToggle>({
    excelImportEnabled: true,
    resumeParsingEnabled: true,
    bulkOperationsEnabled: true,
    duplicateDetectionEnabled: true,
    advancedFiltersEnabled: true,
  });
  const [presets, setPresets] = useState<ImportPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [expandedPreset, setExpandedPreset] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [newPreset, setNewPreset] = useState({ name: '', description: '', mapping: [] });

  // Load field config for selected role
  useEffect(() => {
    loadFieldConfig();
    loadPresets();
  }, [selectedRole]);

  const loadFieldConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await api.getFieldConfig(selectedRole);
      setFieldConfig(config.fields || []);
      setFeatures(config.features || {});
    } catch (err: any) {
      console.error('Failed to load field config:', err);
      setError(err.message || 'Failed to load field configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = async () => {
    try {
      const result = await api.getImportPresets(selectedRole);
      setPresets(result.presets || []);
    } catch (err: any) {
      console.error('Failed to load presets:', err);
      // Don't set error for presets, just log it
    }
  };

  const handleSaveConfig = async () => {
    setSaveStatus('saving');
    try {
      await api.updateFieldConfig(selectedRole, {
        fields: fieldConfig,
        features,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save config:', err);
      setSaveStatus('idle');
    }
  };

  const handleResetConfig = async () => {
    if (confirm(`Reset field configuration for ${ROLE_LABELS[selectedRole]} to defaults?`)) {
      try {
        await api.resetFieldConfigToDefaults(selectedRole);
        await loadFieldConfig();
        alert('Configuration reset to defaults');
      } catch (err) {
        console.error('Failed to reset config:', err);
        alert('Failed to reset configuration');
      }
    }
  };

  const toggleFieldVisibility = (fieldName: string, type: 'hidden' | 'readonly' | 'mandatory') => {
    setFieldConfig(prev => prev.map(f => {
      if (f.fieldName === fieldName) {
        return {
          ...f,
          visibility: {
            ...f.visibility,
            [type]: !f.visibility[type],
          },
        };
      }
      return f;
    }));
  };

  const toggleFeature = (feature: keyof FeatureToggle) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const savePreset = async () => {
    if (!newPreset.name.trim()) {
      alert('Preset name is required');
      return;
    }
    try {
      await api.saveImportPreset(selectedRole, newPreset.name, newPreset.description, newPreset.mapping);
      await loadPresets();
      setNewPreset({ name: '', description: '', mapping: [] });
      alert('Preset saved successfully');
    } catch (err) {
      console.error('Failed to save preset:', err);
      alert('Failed to save preset');
    }
  };

  const deletePreset = async (presetId: string) => {
    if (confirm('Delete this preset?')) {
      try {
        await api.deleteImportPreset(selectedRole, presetId);
        await loadPresets();
        alert('Preset deleted');
      } catch (err) {
        console.error('Failed to delete preset:', err);
        alert('Failed to delete preset');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-slate-800 font-bold" style={{ fontSize: '1.25rem' }}>Field Configuration</h1>
              <p className="text-slate-500 text-xs mt-0.5">Manage field visibility, validation, and feature toggles per role</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetConfig}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4 inline mr-1" />
              Reset
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Role Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                selectedRole === role
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5 inline mr-1.5" />
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-semibold mb-1">Error Loading Configuration</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={() => loadFieldConfig()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Feature Toggles Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-600" />
                <h2 className="text-violet-800 font-bold">Feature Toggles</h2>
              </div>
              <div className="px-6 py-5 grid sm:grid-cols-2 gap-4">
                {([
                  { key: 'excelImportEnabled', label: 'Excel Import', desc: 'Allow bulk candidate import from Excel' },
                  { key: 'resumeParsingEnabled', label: 'Resume Parsing', desc: 'Auto-extract data from resumes' },
                  { key: 'bulkOperationsEnabled', label: 'Bulk Operations', desc: 'Perform actions on multiple records' },
                  { key: 'duplicateDetectionEnabled', label: 'Duplicate Detection', desc: 'Check for duplicate candidates' },
                  { key: 'advancedFiltersEnabled', label: 'Advanced Filters', desc: 'Use complex search criteria' },
                ] as const).map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-slate-700 font-semibold">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => toggleFeature(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        features[key] ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          features[key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Visibility Matrix Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-600" />
                <h2 className="text-blue-800 font-bold">Field Visibility & Control Matrix</h2>
              </div>
              <div className="px-6 py-5 space-y-2">
                {fieldConfig.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">No fields configured</p>
                ) : (
                  fieldConfig.map(field => (
                    <div key={field.fieldName} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedField(expandedField === field.fieldName ? null : field.fieldName)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedField === field.fieldName ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                          <div className="text-left">
                            <p className="text-sm font-semibold text-slate-700">{field.displayName}</p>
                            <p className="text-xs text-slate-500">{field.fieldName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!field.visibility.hidden && <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs border border-emerald-200"><Eye className="w-3 h-3" /> Visible</span>}
                          {field.visibility.readonly && <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs border border-amber-200"><Lock className="w-3 h-3" /> Read-only</span>}
                          {field.visibility.mandatory && <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs border border-red-200">★ Mandatory</span>}
                        </div>
                      </button>

                      {expandedField === field.fieldName && (
                        <div className="px-4 py-4 bg-slate-50 border-t border-slate-200 space-y-4">
                          {/* Visibility Controls */}
                          <div>
                            <p className="text-xs text-slate-600 font-semibold mb-2">Visibility Controls</p>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!field.visibility.hidden}
                                  onChange={() => toggleFieldVisibility(field.fieldName, 'hidden')}
                                  className="w-4 h-4 rounded border-slate-300 text-green-600"
                                />
                                <span className="text-sm text-slate-700">Visible in Forms</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.visibility.readonly}
                                  onChange={() => toggleFieldVisibility(field.fieldName, 'readonly')}
                                  className="w-4 h-4 rounded border-slate-300 text-amber-600"
                                />
                                <span className="text-sm text-slate-700">Read-Only (Cannot Edit)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.visibility.mandatory}
                                  onChange={() => toggleFieldVisibility(field.fieldName, 'mandatory')}
                                  className="w-4 h-4 rounded border-slate-300 text-red-600"
                                />
                                <span className="text-sm text-slate-700">Mandatory (Must Fill)</span>
                              </label>
                            </div>
                          </div>

                          {/* Field Details */}
                          {field.helpText && (
                            <div>
                              <p className="text-xs text-slate-600 font-semibold mb-1">Help Text</p>
                              <p className="text-sm text-slate-600">{field.helpText}</p>
                            </div>
                          )}
                          {field.dataType && (
                            <div>
                              <p className="text-xs text-slate-600 font-semibold mb-1">Data Type</p>
                              <p className="text-sm text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">{field.dataType}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Import Presets Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-emerald-800 font-bold">Excel Column Mapping Presets</h2>
                </div>
                <button
                  onClick={() => setExpandedPreset(!expandedPreset)}
                  className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  {expandedPreset ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {expandedPreset && (
                <div className="px-6 py-5 space-y-4">
                  {/* Existing Presets */}
                  {presets.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-3">Saved Presets</p>
                      <div className="space-y-2">
                        {presets.map(preset => (
                          <div key={preset._id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{preset.name}</p>
                              {preset.description && <p className="text-xs text-slate-500">{preset.description}</p>}
                            </div>
                            <button
                              onClick={() => deletePreset(preset._id || '')}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Create New Preset */}
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Create New Preset</p>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Preset name (e.g., Naukri Format)"
                        value={newPreset.name}
                        onChange={e => setNewPreset({ ...newPreset, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-400"
                      />
                      <textarea
                        placeholder="Description (optional)"
                        value={newPreset.description}
                        onChange={e => setNewPreset({ ...newPreset, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewPreset({ name: '', description: '', mapping: [] })}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={savePreset}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Save Preset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
