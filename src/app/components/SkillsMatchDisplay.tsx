import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Star, TrendingUp, BarChart3 } from 'lucide-react';
import { SkillMatch, SkillMatchResult } from '../utils/skillsMatchingEngine';

interface SkillsMatchDisplayProps {
  result: SkillMatchResult;
  showDetails?: boolean;
}

/**
 * Skill level badge component
 */
function SkillLevelBadge({ level }: { level?: string }) {
  if (!level) return null;

  const colors = {
    expert: 'bg-green-100 text-green-700',
    intermediate: 'bg-blue-100 text-blue-700',
    beginner: 'bg-slate-100 text-slate-600',
  };

  const dots = {
    expert: 3,
    intermediate: 2,
    beginner: 1,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors[level as keyof typeof colors] || colors.beginner}`}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map(d => (
          <span
            key={d}
            className={`w-1 h-1 rounded-full ${d <= (dots[level as keyof typeof dots] || 1) ? 'bg-current' : 'bg-current opacity-30'}`}
          />
        ))}
      </span>
      {level}
    </span>
  );
}

/**
 * Individual skill match item
 */
function SkillMatchItem({ skill }: { skill: SkillMatch }) {
  const isMatched = skill.found && skill.levelMatches;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isMatched ? 'border-green-200 bg-green-50' : skill.found ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
      {isMatched ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
      ) : skill.found ? (
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-900">{skill.name}</span>
          {skill.isRequired && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-semibold">Required</span>}
        </div>
        {skill.found && (
          <div className="mt-1 text-xs text-slate-600">
            Candidate:{' '}
            <SkillLevelBadge level={skill.candidateLevel} />
            {skill.requiredLevel && (
              <>
                {' '}
                Required: <SkillLevelBadge level={skill.requiredLevel} />
              </>
            )}
          </div>
        )}
      </div>

      {skill.matchScore > 0 && (
        <div className="text-right">
          <div className="text-lg font-bold text-slate-900">{skill.matchScore}%</div>
          <div className="text-xs text-slate-500">match</div>
        </div>
      )}
    </div>
  );
}

/**
 * Skills match score ring (similar to ATS score)
 */
function SkillsScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color }} className="leading-none">
            {score}
          </span>
          <span className="text-slate-400 text-xs mt-0.5">%</span>
        </div>
      </div>
      <span style={{ fontWeight: 600, fontSize: '0.8rem', color }}>
        {label}
      </span>
      <span className="text-slate-400 text-xs">Skills Match</span>
    </div>
  );
}

/**
 * Category breakdown chart
 */
function CategoryBreakdownChart({ categoryBreakdown }: { categoryBreakdown: Record<string, { found: number; total: number; percentage: number }> }) {
  const categories = Object.entries(categoryBreakdown).filter(([_, data]) => data.total > 0);

  if (categories.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-slate-900 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Category Breakdown
      </h4>
      <div className="space-y-2">
        {categories.map(([category, data]) => (
          <div key={category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 capitalize">{category.replace('-', ' ')}</span>
              <span className="text-sm font-semibold text-slate-900">
                {data.found}/{data.total}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${data.percentage}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{Math.round(data.percentage)}% matched</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main skills match display component
 */
export function SkillsMatchDisplay({ result, showDetails = true }: SkillsMatchDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-sm text-blue-700 font-medium mb-1">Total Required</div>
          <div className="text-3xl font-bold text-blue-900">{result.totalRequired}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="text-sm text-green-700 font-medium mb-1">Found</div>
          <div className="text-3xl font-bold text-green-900">{result.totalFound}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="text-sm text-amber-700 font-medium mb-1">Match %</div>
          <div className="text-3xl font-bold text-amber-900">{result.matchPercentage}%</div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4 border border-violet-200">
          <div className="flex items-center gap-1 text-sm text-violet-700 font-medium mb-1">
            <Star className="w-4 h-4" />
            Score
          </div>
          <div className="text-3xl font-bold text-violet-900">{result.matchScore}</div>
        </div>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center p-6 bg-slate-50 rounded-xl border border-slate-200">
        <SkillsScoreRing score={result.matchScore} />
      </div>

      {showDetails && (
        <>
          {/* Matched Skills */}
          {result.matches.filter(m => m.found).length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Matched Skills ({result.matches.filter(m => m.found).length})
              </h3>
              <div className="space-y-2">
                {result.matches
                  .filter(m => m.found)
                  .map(skill => (
                    <SkillMatchItem key={skill.name} skill={skill} />
                  ))}
              </div>
            </div>
          )}

          {/* Missing Required Skills */}
          {result.missingRequired.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Missing Required Skills ({result.missingRequired.length})
              </h3>
              <div className="space-y-2">
                {result.missingRequired.map(skill => (
                  <SkillMatchItem key={skill.name} skill={skill} />
                ))}
              </div>
            </div>
          )}

          {/* Extra Skills */}
          {result.extraSkills.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Extra Skills ({result.extraSkills.length})
              </h3>
              <div className="space-y-2">
                {result.extraSkills.map(skill => (
                  <div key={skill.name} className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                    <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{skill.name}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        <SkillLevelBadge level={skill.candidateLevel} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">{skill.matchScore}%</div>
                      <div className="text-xs text-slate-500">bonus</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <CategoryBreakdownChart categoryBreakdown={result.categoryBreakdown} />
          </div>
        </>
      )}
    </div>
  );
}
