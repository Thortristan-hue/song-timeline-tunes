/**
 * Safe variable access utilities to prevent temporal dead zone issues
 * and lexical declaration errors (particularly the 'le' variable issue)
 */

/**
 * Safely access a variable that might be in the temporal dead zone
 * @param accessor Function that accesses the variable
 * @param fallback Fallback value if access fails
 * @param errorContext Context description for debugging
 */
export function safeVariableAccess<T>(
  accessor: () => T,
  fallback: T,
  errorContext: string = 'unknown'
): T {
  try {
    return accessor();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for lexical declaration errors
    if (errorMessage.includes("can't access lexical declaration") ||
        errorMessage.includes("before initialization") ||
        errorMessage.includes("Cannot access")) {
      console.warn(`🔧 SAFE ACCESS: Temporal dead zone detected in ${errorContext}, using fallback:`, errorMessage);
    } else {
      console.warn(`🔧 SAFE ACCESS: Variable access failed in ${errorContext}, using fallback:`, errorMessage);
    }
    
    return fallback;
  }
}

/**
 * Safely initialize a module-level variable with retry logic
 * @param initializer Function that initializes the variable
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Delay between retries in milliseconds
 */
export async function safeModuleInit<T>(
  initializer: () => T | Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 10
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await initializer();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isLexicalError = errorMessage.includes("can't access lexical declaration") ||
                            errorMessage.includes("before initialization") ||
                            errorMessage.includes("Cannot access");
      
      if (isLexicalError) {
        console.warn(`🔧 MODULE INIT: Lexical declaration error on attempt ${attempt + 1}/${maxRetries}:`, errorMessage);
        
        if (attempt < maxRetries - 1) {
          console.log(`🔧 MODULE INIT: Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Exponential backoff
        }
      } else {
        // For non-lexical errors, don't retry
        console.error(`🔧 MODULE INIT: Non-lexical error, not retrying:`, errorMessage);
        throw error;
      }
    }
  }
  
  console.error(`🔧 MODULE INIT: All ${maxRetries} attempts failed`);
  return null;
}

/**
 * Create a safe getter function that handles temporal dead zone issues
 * @param variableName Name of the variable for debugging
 * @param getter Function that gets the variable value
 * @param fallback Fallback value
 */
export function createSafeGetter<T>(
  variableName: string,
  getter: () => T,
  fallback: T
): () => T {
  return () => safeVariableAccess(getter, fallback, `getter for ${variableName}`);
}

/**
 * Delay execution to ensure all module-level variables are initialized
 * @param ms Milliseconds to delay (default: 0 for next tick)
 */
export function ensureInitialization(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}