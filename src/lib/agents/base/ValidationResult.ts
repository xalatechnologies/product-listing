/**
 * Validation Result Types
 * 
 * Standardized validation results for agent inputs.
 */

export interface ValidationError {
  /** Field or property that failed validation */
  readonly field?: string;
  
  /** Error message */
  readonly message: string;
  
  /** Error code */
  readonly code?: string;
}

export interface ValidationResult {
  /** Whether validation passed */
  readonly valid: boolean;
  
  /** List of validation errors (if any) */
  readonly errors: ValidationError[];
}

/**
 * Create successful validation result
 */
export function createValidResult(): ValidationResult {
  return { valid: true, errors: [] };
}

/**
 * Create failed validation result
 */
export function createInvalidResult(errors: ValidationError[]): ValidationResult {
  return { valid: false, errors };
}

/**
 * Create validation error
 */
export function createValidationError(
  message: string,
  field?: string,
  code?: string,
): ValidationError {
  return { field, message, code };
}

