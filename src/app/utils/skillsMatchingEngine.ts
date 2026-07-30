/**
 * Skills Matching Engine
 * Compares candidate skills against required skills with proficiency levels
 */

export interface SkillRequirement {
  name: string;
  minLevel?: 'beginner' | 'intermediate' | 'expert'; // Minimum proficiency level required
  required: boolean; // Is this skill mandatory?
  category?: string;
}

export interface SkillMatch {
  name: string;
  found: boolean;
  requiredLevel?: 'beginner' | 'intermediate' | 'expert';
  candidateLevel?: 'beginner' | 'intermediate' | 'expert';
  levelMatches: boolean; // Does candidate's level meet requirement?
  isRequired: boolean;
  matchScore: number; // 0-100: how well the skill matches
}

export interface SkillMatchResult {
  totalRequired: number;
  totalFound: number;
  matchPercentage: number;
  matchScore: number; // Weighted score considering proficiency levels
  matches: SkillMatch[];
  missingRequired: SkillMatch[];
  extraSkills: SkillMatch[];
  categoryBreakdown: Record<string, { found: number; total: number; percentage: number }>;
}

const SKILL_CATEGORIES = {
  'frontend': ['react', 'angular', 'vue', 'html', 'css', 'javascript', 'typescript', 'bootstrap', 'tailwind'],
  'backend': ['node', 'python', 'java', 'c#', 'php', 'ruby', 'go', 'express', 'django', 'spring'],
  'database': ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'],
  'devops': ['docker', 'kubernetes', 'jenkins', 'ci-cd', 'terraform', 'ansible'],
  'cloud': ['aws', 'azure', 'gcp', 'heroku'],
  'soft-skills': ['communication', 'leadership', 'teamwork', 'problem solving'],
};

/**
 * Normalize skill name for comparison
 */
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim().replace(/[.\s-]/g, '');
}

/**
 * Find matching candidate skill with fuzzy matching
 */
function findMatchingCandidateSkill(
  requiredSkill: string,
  candidateSkills: Array<{ name: string; level: string }>
): { name: string; level: string } | null {
  const normalized = normalizeSkill(requiredSkill);

  // Exact match first
  const exact = candidateSkills.find(s => normalizeSkill(s.name) === normalized);
  if (exact) return exact;

  // Partial match (contains the skill name)
  const partial = candidateSkills.find(s =>
    normalizeSkill(s.name).includes(normalized) ||
    normalized.includes(normalizeSkill(s.name))
  );
  if (partial) return partial;

  return null;
}

/**
 * Get category for a skill
 */
function getSkillCategory(skill: string): string {
  const normalized = normalizeSkill(skill);
  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.some(s => normalizeSkill(s) === normalized)) {
      return category;
    }
  }
  return 'other';
}

/**
 * Calculate proficiency level match score (0-100)
 */
function calculateLevelMatchScore(
  requiredLevel: 'beginner' | 'intermediate' | 'expert' | undefined,
  candidateLevel: string | undefined
): { matches: boolean; score: number } {
  if (!requiredLevel) {
    // No specific level required, any level works
    return { matches: true, score: candidateLevel ? 100 : 0 };
  }

  if (!candidateLevel) {
    // Skill not found
    return { matches: false, score: 0 };
  }

  const levelValues = { beginner: 1, intermediate: 2, expert: 3 };
  const requiredValue = levelValues[requiredLevel];
  const candidateValue = levelValues[candidateLevel as keyof typeof levelValues] || 0;

  // Full match if candidate has equal or higher level
  if (candidateValue >= requiredValue) {
    return { matches: true, score: 100 - (candidateValue - requiredValue) * 5 };
  }

  // Partial match if one level below
  if (candidateValue === requiredValue - 1) {
    return { matches: false, score: 60 };
  }

  // Not a match
  return { matches: false, score: 30 };
}

/**
 * Match candidate skills against required skills
 */
export function matchSkills(
  requiredSkills: SkillRequirement[],
  candidateSkills: Array<{ name: string; level: string }>
): SkillMatchResult {
  const matches: SkillMatch[] = [];
  const missingRequired: SkillMatch[] = [];
  const extraSkills: SkillMatch[] = [];
  const categoryBreakdown: Record<string, { found: number; total: number; percentage: number }> = {};

  // Initialize categories
  for (const [category] of Object.entries(SKILL_CATEGORIES)) {
    categoryBreakdown[category] = { found: 0, total: 0, percentage: 0 };
  }

  const processedSkills = new Set<string>();

  // Process required skills
  for (const requiredSkill of requiredSkills) {
    const skillKey = normalizeSkill(requiredSkill.name);
    processedSkills.add(skillKey);

    const matchedCandidate = findMatchingCandidateSkill(requiredSkill.name, candidateSkills);
    const category = getSkillCategory(requiredSkill.name);

    if (!categoryBreakdown[category]) {
      categoryBreakdown[category] = { found: 0, total: 0, percentage: 0 };
    }
    categoryBreakdown[category].total++;

    if (matchedCandidate) {
      const levelMatch = calculateLevelMatchScore(requiredSkill.minLevel, matchedCandidate.level);

      const skillMatch: SkillMatch = {
        name: requiredSkill.name,
        found: true,
        requiredLevel: requiredSkill.minLevel,
        candidateLevel: matchedCandidate.level as 'beginner' | 'intermediate' | 'expert',
        levelMatches: levelMatch.matches,
        isRequired: requiredSkill.required,
        matchScore: levelMatch.score,
      };

      matches.push(skillMatch);
      if (levelMatch.matches) {
        categoryBreakdown[category].found++;
      }
    } else {
      const skillMatch: SkillMatch = {
        name: requiredSkill.name,
        found: false,
        requiredLevel: requiredSkill.minLevel,
        candidateLevel: undefined,
        levelMatches: false,
        isRequired: requiredSkill.required,
        matchScore: 0,
      };

      if (requiredSkill.required) {
        missingRequired.push(skillMatch);
      } else {
        matches.push(skillMatch);
      }
    }
  }

  // Find extra skills in candidate that weren't required
  for (const candidateSkill of candidateSkills) {
    const skillKey = normalizeSkill(candidateSkill.name);
    if (!processedSkills.has(skillKey)) {
      const category = getSkillCategory(candidateSkill.name);

      extraSkills.push({
        name: candidateSkill.name,
        found: true,
        requiredLevel: undefined,
        candidateLevel: candidateSkill.level as 'beginner' | 'intermediate' | 'expert',
        levelMatches: true,
        isRequired: false,
        matchScore: 75, // Bonus points for extra skills
      });

      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { found: 0, total: 0, percentage: 0 };
      }
    }
  }

  // Calculate overall match percentage and score
  const totalRequired = requiredSkills.length;
  const foundRequired = matches.filter(m => m.found).length;
  const matchCount = foundRequired + extraSkills.length;

  // Calculate weighted score
  let totalScore = 0;
  let scoreCount = 0;

  matches.forEach(m => {
    if (m.isRequired && m.found) {
      totalScore += m.matchScore;
      scoreCount++;
    } else if (!m.isRequired) {
      totalScore += m.matchScore * 0.5; // Lower weight for optional skills
      scoreCount++;
    }
  });

  // Add bonus for extra skills (up to 20 points)
  const extraSkillBonus = Math.min(extraSkills.length * 2, 20);

  // Calculate category breakdown percentages
  for (const category of Object.keys(categoryBreakdown)) {
    const cat = categoryBreakdown[category];
    if (cat.total > 0) {
      cat.percentage = (cat.found / cat.total) * 100;
    }
  }

  const matchScore = Math.round((scoreCount > 0 ? totalScore / scoreCount : 0) + extraSkillBonus);
  const matchPercentage = totalRequired > 0 ? (foundRequired / totalRequired) * 100 : 0;

  return {
    totalRequired,
    totalFound: foundRequired,
    matchPercentage: Math.round(matchPercentage),
    matchScore: Math.min(matchScore, 100),
    matches,
    missingRequired,
    extraSkills,
    categoryBreakdown,
  };
}

/**
 * Parse skill requirements from text input
 */
export function parseSkillRequirements(text: string): SkillRequirement[] {
  const lines = text.split('\n').filter(line => line.trim());
  const skills: SkillRequirement[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Parse formats like "React (expert)", "Node.js - intermediate", "Python*" (asterisk = required)
    const required = trimmed.includes('*');
    const cleanedLine = trimmed.replace('*', '').trim();

    // Extract skill name and level
    const levelMatch = cleanedLine.match(/\(?(beginner|intermediate|expert)\)?/i);
    const skillPart = levelMatch
      ? cleanedLine.replace(levelMatch[0], '').trim()
      : cleanedLine.replace(/[-–]\s*(beginner|intermediate|expert)/i, '').trim();

    const minLevel = levelMatch
      ? (levelMatch[1].toLowerCase() as 'beginner' | 'intermediate' | 'expert')
      : undefined;

    if (skillPart.length > 0) {
      skills.push({
        name: skillPart,
        minLevel,
        required: required || false,
        category: getSkillCategory(skillPart),
      });
    }
  }

  return skills;
}
