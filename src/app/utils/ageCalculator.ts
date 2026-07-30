/**
 * Calculate age from date of birth
 * @param dobString - Date of birth as string (YYYY-MM-DD or ISO format)
 * @returns Age in years, or null if invalid
 */
export function calculateAge(dobString?: string | Date): number | null {
  if (!dobString) return null;

  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

/**
 * Format DOB to YYYY-MM-DD for input[type="date"]
 */
export function formatDobForInput(dobString?: string | Date): string {
  if (!dobString) return '';
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return '';
    return dob.toISOString().split('T')[0];
  } catch {
    return '';
  }
}
