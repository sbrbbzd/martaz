/**
 * Utility functions for consistent error handling across the application
 */

/**
 * Transforms API errors into user-friendly error types
 * @param error Any caught error from API calls
 * @returns Standardized error object with type and message
 */
export const transformApiError = (error: any) => {
  // Check for network errors
  if (error.message === 'Network Error' || !error.response) {
    return {
      type: 'networkError',
      message: 'networkError',
      originalError: error
    };
  }
  
  // Check for server errors (500+)
  if (error.response?.status >= 500) {
    return {
      type: 'serverError',
      message: 'serverError',
      originalError: error
    };
  }
  
  // Check for auth errors (401, 403)
  if (error.response?.status === 401 || error.response?.status === 403) {
    return {
      type: 'authError',
      message: 'authError',
      originalError: error
    };
  }
  
  // Check for not found (404)
  if (error.response?.status === 404) {
    return {
      type: 'notFoundError',
      message: 'notFoundError',
      originalError: error
    };
  }
  
  // Check for validation errors (400, 422)
  if (error.response?.status === 400 || error.response?.status === 422) {
    return {
      type: 'validationError',
      message: error.response?.data?.message || 'validationError',
      originalError: error,
      validationErrors: error.response?.data?.errors
    };
  }
  
  // Default - unknown error
  return {
    type: 'unknownError',
    message: error.message || 'unknownError',
    originalError: error
  };
}; 