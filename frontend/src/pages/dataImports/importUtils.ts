/* Reads an API error message, with a default message when none is available. */
export const errorMessage = (error: unknown): string => {
  const responseError = error as {
    response?: { data?: { detail?: string } };
  } | null;
  return (
    responseError?.response?.data?.detail ||
    "The request could not be completed. Check your connection and try again."
  );
};
