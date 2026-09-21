/* Turns a notification date into a short label such as minutes ago. */
export const formatNotificationTime = (date: string) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(date)) / 60000),
  );
  return minutes < 1
    ? "Just now"
    : minutes < 60
      ? `${minutes} minutes ago`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)} hours ago`
        : new Date(date).toLocaleDateString();
};
