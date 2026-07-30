/**
 * Number to Words Converter (Indian Format)
 * Converts numbers to Indian text format (e.g., 8971 → "Rupees Eight Thousand Nine Hundred Seventy-One Only")
 * Handles amounts, large numbers, and edge cases
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const SCALES = [
  { name: '', value: 1 },
  { name: 'Thousand', value: 1000 },
  { name: 'Lac', value: 100000 },
  { name: 'Crore', value: 10000000 },
];

/**
 * Convert a number less than 1000 to words
 */
function convertHundreds(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ONES[num];
  if (num < 100) return TENS[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ONES[num % 10] : '');
  return ONES[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertHundreds(num % 100) : '');
}

/**
 * Convert number to Indian rupee words
 * @param num Number to convert
 * @returns String representation in Indian English format
 */
export function convertNumberToWords(num: number): string {
  // Handle zero
  if (num === 0) {
    return 'Rupees Zero Only';
  }

  // Handle negative
  if (num < 0) {
    return 'Minus ' + convertNumberToWords(Math.abs(num));
  }

  // Handle decimals (round to nearest rupee)
  if (num % 1 !== 0) {
    num = Math.round(num);
  }

  // Convert to string and split if needed
  let whole = Math.floor(num);
  let result = '';

  // Process crores
  const crores = Math.floor(whole / 10000000);
  if (crores > 0) {
    result += convertHundreds(crores) + ' Crore';
    whole -= crores * 10000000;
  }

  // Process lacs (hundreds of thousands)
  const lacs = Math.floor(whole / 100000);
  if (lacs > 0) {
    if (result) result += ' ';
    result += convertHundreds(lacs) + ' Lac';
    whole -= lacs * 100000;
  }

  // Process thousands
  const thousands = Math.floor(whole / 1000);
  if (thousands > 0) {
    if (result) result += ' ';
    result += convertHundreds(thousands) + ' Thousand';
    whole -= thousands * 1000;
  }

  // Process hundreds
  if (whole > 0) {
    if (result) result += ' ';
    result += convertHundreds(whole);
  }

  // Clean up extra spaces and add rupees prefix
  result = result.trim().replace(/  +/g, ' ');
  return 'Rupees ' + result + ' Only';
}

/**
 * Format currency with rupee symbol
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format currency with 2 decimal places
 * @param amount Amount to format
 * @returns Formatted currency string with decimals
 */
export function formatCurrencyPrecise(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
