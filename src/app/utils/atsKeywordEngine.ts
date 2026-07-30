/**
 * ATS Keyword Engine — v2.0
 * Phrase-first tokenizer, expanded synonyms, context-aware matching
 */

/* ───────────── PHRASE SKILLS (matched BEFORE any word splitting) ─────────── */
const PHRASE_SKILLS: string[] = [
  // Mobile
  'react native','flutter development','android development','ios development',
  // AI / ML
  'machine learning','deep learning','natural language processing','computer vision',
  'data science','neural networks','reinforcement learning','generative ai',
  'large language models','prompt engineering',
  // Cloud / DevOps
  'amazon web services','google cloud platform','microsoft azure',
  'continuous integration','continuous deployment','continuous delivery',
  'infrastructure as code','site reliability engineering',
  // Databases
  'ms sql server','sql server','oracle database','nosql database','graph database',
  // Frontend
  'next.js','nuxt.js','vue.js','angular.js','react.js','express.js',
  'tailwind css','material ui','ant design','chakra ui',
  // Patterns / Architecture
  'agile methodology','scrum master','test driven development',
  'behavior driven development','domain driven design',
  'microservices architecture','event driven architecture',
  'design patterns','system design','object oriented programming',
  'functional programming',
  // BPO / HR
  'customer service','customer support','technical support','call center',
  'quality assurance','business process outsourcing','client management',
  'stakeholder management','project management','product management',
  'talent acquisition','resume screening','candidate sourcing',
  // Finance / Ops
  'financial analysis','business analysis','data analysis','root cause analysis',
  // Soft skills
  'problem solving','critical thinking','time management','team management',
  'people management','conflict resolution','public speaking','written communication',
  // Others
  'power bi','rest api','restful api','ci/cd','ci cd',
];

/* ───────────── SKILL SYNONYMS  canonical → aliases ────────────────────────── */
export const SKILL_SYNONYMS: Record<string, string[]> = {
  'javascript':           ['js','es6','es5','ecmascript','es2015','esm'],
  'typescript':           ['ts'],
  'react':                ['reactjs','react js'],
  'react native':         ['rn','reactnative'],
  'node.js':              ['node','nodejs','node js','express','express.js','expressjs'],
  'python':               ['py','python3','python 3'],
  'machine learning':     ['ml'],
  'artificial intelligence': ['ai'],
  'natural language processing': ['nlp'],
  'kubernetes':           ['k8s'],
  'docker':               ['containerisation','containerization','containers'],
  'postgresql':           ['postgres','pg'],
  'mongodb':              ['mongo'],
  'microsoft azure':      ['azure'],
  'amazon web services':  ['aws','amazon aws'],
  'google cloud platform':['gcp','google cloud'],
  'ci/cd':                ['cicd','ci cd','continuous integration','continuous deployment'],
  'git':                  ['github','gitlab','bitbucket','version control'],
  'c#':                   ['csharp','dotnet','.net','asp.net'],
  'ruby on rails':        ['rails','ror'],
  'vue.js':               ['vue','vuejs','vue js'],
  'angular':              ['angularjs','angular.js','angular js'],
  'next.js':              ['next','nextjs'],
  'tailwind css':         ['tailwind','tailwindcss'],
  'quality assurance':    ['qa','qe','quality engineer','testing'],
  'customer service':     ['customer support','client service'],
  'human resources':      ['hr','hrd'],
  'microsoft excel':      ['excel','ms excel'],
  'microsoft office':     ['ms office','office 365'],
  'power bi':             ['powerbi'],
  'salesforce':           ['sfdc','crm'],
  'agile':                ['scrum','kanban'],
  'rest api':             ['rest','restful','restful api'],
  'graphql':              ['graph ql'],
  'golang':               ['go language','go lang'],
  'kotlin':               ['kt'],
  'swift':                ['ios development'],
  'flutter':              ['dart'],
  'scikit-learn':         ['sklearn','scikit learn'],
  'tensorflow':           ['tf'],
};

/* ───────────── All known skills (phrases first) ────────────────────────────── */
const ALL_SKILLS: string[] = [
  ...PHRASE_SKILLS,
  'javascript','typescript','python','java','c++','c#','ruby','php','go','rust',
  'swift','kotlin','scala','r','matlab','perl','bash','shell','powershell','golang',
  'react','angular','vue.js','html','css','sass','scss','less','bootstrap',
  'tailwind css','webpack','vite','next.js','nuxt.js','svelte','ember',
  'jquery','redux','mobx','zustand','recoil','node.js','django','flask','fastapi',
  'spring','spring boot','rails','laravel','asp.net','graphql','rest api','soap','grpc',
  'react native','flutter','android','ios','xamarin',
  'mysql','postgresql','mongodb','redis','elasticsearch','cassandra','dynamodb',
  'sqlite','oracle','firebase','supabase','prisma','sequelize',
  'docker','kubernetes','jenkins','terraform','ansible','puppet','chef',
  'aws','azure','google cloud platform','heroku','vercel','netlify','digitalocean',
  'ci/cd','nginx','apache','linux','ubuntu',
  'machine learning','deep learning','natural language processing','computer vision',
  'tensorflow','pytorch','scikit-learn','keras','pandas','numpy','opencv',
  'spark','hadoop','kafka','airflow','dbt','tableau','power bi','excel',
  'git','jira','confluence','figma','postman','swagger','notion','slack',
  'salesforce','sap','zendesk','hubspot',
  'jest','mocha','cypress','selenium','playwright','junit','pytest',
  'unit testing','integration testing','automation testing',
  'recruitment','sourcing','screening','onboarding','training','coaching',
  'customer service','technical support','call center','crm',
  'communication','leadership','teamwork','problem solving','time management',
  'agile','scrum','project management','product management',
  'accounting','financial analysis','business analysis','data analysis',
  'operations','logistics','supply chain',
];

/* ───────────── Canonical reverse map ────────────────────────────────────────── */
const SYNONYM_REVERSE: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(SKILL_SYNONYMS)) {
  for (const alias of aliases) {
    SYNONYM_REVERSE[alias.toLowerCase()] = canonical;
  }
}

function canonicalise(skill: string): string {
  const lower = skill.toLowerCase().trim();
  return SYNONYM_REVERSE[lower] || lower;
}

/* ───────────── Types ────────────────────────────────────────────────────────── */
export interface KeywordMatch {
  original: string;
  normalized: string;
  category?: string;
  confidence: number;
  type: 'exact' | 'synonym' | 'partial' | 'phrase';
}

export interface ExtractedKeywords {
  found: KeywordMatch[];
  missing: KeywordMatch[];
  suggested: KeywordMatch[];
}

/* ───────────── Text normalisation ────────────────────────────────────────────── */
export function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s.#+/-]/g, ' ').replace(/\s+/g, ' ');
}

function escapeRe(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Pre-compile skill regexes for performance
const SKILL_REGEXES = [...ALL_SKILLS]
  .sort((a, b) => b.length - a.length)
  .map(skill => ({
    name: skill,
    canonical: canonicalise(skill),
    pattern: new RegExp(`(?<![a-z])${escapeRe(skill.toLowerCase())}(?![a-z])`, 'i')
  }));

/* ───────────── Phrase-first keyword extractor ────────────────────────────────── */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const lower = normalizeText(text);
  const found = new Set<string>();

  // 1. Match phrases (using pre-compiled regexes)
  for (const skillObj of SKILL_REGEXES) {
    if (skillObj.pattern.test(lower)) {
      found.add(skillObj.canonical);
    }
  }

  // 2. Single tokens that map to known skills
  lower.split(/[\s,;|•·]+/).forEach(token => {
    if (token.length > 2) {
      const c = canonicalise(token);
      if (ALL_SKILLS.some(s => s.toLowerCase() === c)) found.add(c);
    }
  });

  return [...found];
}

/* ───────────── Levenshtein-based fuzzy match ─────────────────────────────────── */
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 4) return 0;
  const longer = a.length >= b.length ? a : b;
  const dist   = editDistance(a, b);
  return (longer.length - dist) / longer.length;
}

/* ───────────── Main matchKeywords ─────────────────────────────────────────────── */
export function matchKeywords(resumeText: string, jobDescription: string): ExtractedKeywords {
  const resumeKws = extractKeywords(resumeText);
  const jdKws     = extractKeywords(jobDescription);

  const found:   KeywordMatch[] = [];
  const missing: KeywordMatch[] = [];

  const resumeSet = new Set(resumeKws.map(k => canonicalise(k)));
  const processed = new Set<string>();

  for (const jdKw of jdKws) {
    const normed = canonicalise(jdKw);
    if (processed.has(normed)) continue;
    processed.add(normed);

    if (resumeSet.has(normed)) {
      found.push({ original: jdKw, normalized: normed, confidence: 1.0, type: 'exact' });
      continue;
    }

    // Synonym check
    const isSynMatch = resumeKws.some(rk => canonicalise(rk) === normed);
    if (isSynMatch) {
      found.push({ original: jdKw, normalized: normed, confidence: 0.95, type: 'synonym' });
      continue;
    }

    // Fuzzy for longer terms only
    if (normed.length > 5) {
      const best = resumeKws.reduce((max, rk) => {
        const sim = similarity(normed, canonicalise(rk));
        return sim > max ? sim : max;
      }, 0);
      if (best >= 0.82) {
        found.push({ original: jdKw, normalized: normed, confidence: best, type: 'partial' });
        continue;
      }
    }

    missing.push({ original: jdKw, normalized: normed, confidence: 0, type: 'exact' });
  }

  // Suggest skills in resume not in JD
  const suggested: KeywordMatch[] = resumeKws
    .filter(k => !processed.has(canonicalise(k)))
    .slice(0, 8)
    .map(k => ({ original: k, normalized: canonicalise(k), confidence: 0.7, type: 'exact' as const }));

  return { found, missing, suggested };
}

/* ───────────── Weighted ATS Score ─────────────────────────────────────────────── */
export interface ScoreBreakdown {
  skillMatch:          number;
  experienceRelevance: number;
  roleAlignment:       number;
  educationRelevance:  number;
  resumeQuality:       number;
}

export function calculateATSScore(
  matchedKeywords: ExtractedKeywords,
  experienceScore: number,
  educationScore: number,
  qualityScore: number,
  roleAlignment: number = 50,
): number {
  const total = matchedKeywords.found.length + matchedKeywords.missing.length;
  const skillMatch = total > 0
    ? Math.round((matchedKeywords.found.length / total) * 100)
    : Math.min(50, experienceScore);

  const breakdown: ScoreBreakdown = {
    skillMatch,
    experienceRelevance: experienceScore,
    roleAlignment,
    educationRelevance:  educationScore,
    resumeQuality:       qualityScore,
  };

  return weightedScore(breakdown);
}

export function weightedScore(bd: ScoreBreakdown): number {
  const raw =
    bd.skillMatch          * 0.50 +
    bd.experienceRelevance * 0.15 +
    bd.roleAlignment       * 0.15 +
    bd.educationRelevance  * 0.10 +
    bd.resumeQuality       * 0.10;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function getFitTier(score: number): 'Top Match' | 'Good Fit' | 'Low Fit' {
  if (score >= 78) return 'Top Match';
  if (score >= 52) return 'Good Fit';
  return 'Low Fit';
}

/* ───────────── Suggestions generator ──────────────────────────────────────────── */
export function generateSuggestions(
  matchedKeywords: ExtractedKeywords,
  resumeText: string,
  jobDescription: string,
): Array<{ type: 'error' | 'warning' | 'success'; text: string }> {
  const out: Array<{ type: 'error' | 'warning' | 'success'; text: string }> = [];
  const total       = matchedKeywords.found.length + matchedKeywords.missing.length;
  const missingPct  = total > 0 ? (matchedKeywords.missing.length / total) * 100 : 0;
  const wordCount   = resumeText.trim().split(/\s+/).length;
  const exactCount  = matchedKeywords.found.filter(k => k.type === 'exact').length;

  // Strengths
  if (exactCount >= 5)
    out.push({ type: 'success', text: `Strong skill alignment: ${exactCount} skills exactly match JD requirements` });
  if (missingPct <= 25)
    out.push({ type: 'success', text: `Excellent keyword coverage: ${Math.round(100 - missingPct)}% of required skills found` });
  if (wordCount >= 300 && wordCount <= 1200)
    out.push({ type: 'success', text: `Optimal resume length (${wordCount} words) — good for ATS parsing` });

  // Weaknesses
  if (missingPct > 50)
    out.push({ type: 'error', text: `Only ${matchedKeywords.found.length}/${total} required skills found (${Math.round(100 - missingPct)}% match)` });
  else if (missingPct > 25)
    out.push({ type: 'warning', text: `${matchedKeywords.missing.length} required skill(s) not found — ${Math.round(100 - missingPct)}% match` });

  // Missing skills
  if (matchedKeywords.missing.length > 0)
    out.push({
      type: 'warning',
      text: `Missing: ${matchedKeywords.missing.slice(0, 5).map(k => k.original).join(', ')}${matchedKeywords.missing.length > 5 ? ` +${matchedKeywords.missing.length - 5} more` : ''}`,
    });

  // Resume quality
  if (wordCount < 300)
    out.push({ type: 'warning', text: 'Resume is too brief (<300 words) — add experience details and achievements' });
  else if (wordCount > 1200)
    out.push({ type: 'warning', text: 'Resume is lengthy (>1200 words) — trim to the most relevant content' });

  if (!resumeText.match(/linkedin\.com/i))
    out.push({ type: 'warning', text: 'LinkedIn profile missing — add it for recruiter verification' });
  if (!resumeText.match(/\d+%|\d+x|\d+ (users|clients|team|million|lakh)/i))
    out.push({ type: 'warning', text: 'Add quantified achievements (e.g., "improved efficiency by 40%") for stronger impact' });

  return out;
}

/* ───────────── Legacy batch helper ────────────────────────────────────────────── */
export function batchProcessKeywords(keywords: string[], chunkSize = 50): string[] {
  const processed = new Set<string>();
  for (let i = 0; i < keywords.length; i += chunkSize) {
    keywords.slice(i, i + chunkSize).forEach(kw => {
      const n = normalizeText(kw);
      if (n.length > 2) processed.add(n);
    });
  }
  return Array.from(processed);
}
