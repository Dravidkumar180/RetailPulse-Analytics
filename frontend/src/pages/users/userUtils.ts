/* Formats user dates and converts role or status codes into readable labels. */
// Show Never when a login date has not been recorded.
export const formatDateTime = (date?: string | null): string => {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

// Convert codes such as COMPANY_ADMIN into readable words.
export const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
