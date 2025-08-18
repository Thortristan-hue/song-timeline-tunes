
// Utility to suppress unused variable warnings for development/stub files
export const suppressUnused = (..._args: any[]): void => {
  // This function does nothing but helps suppress TS6133 warnings
  // for variables that are declared but not yet used in development
};

// Helper to mark variables as intentionally unused during development
export const TODO_IMPLEMENT = <T>(_value: T, _reason?: string): void => {
  // Placeholder for future implementation
};
