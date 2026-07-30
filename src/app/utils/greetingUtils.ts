/**
 * Generates a greeting based on the current time of the day.
 * 
 * 5:00 AM – 11:59 AM → “Good morning”
 * 12:00 PM – 4:59 PM → “Good afternoon”
 * 5:00 PM – 8:59 PM → “Good evening”
 * 9:00 PM – 4:59 AM → “Good night”
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
};
