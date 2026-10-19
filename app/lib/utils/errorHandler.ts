/**
 * Safely extract error message from various error formats
 * Ensures we always return a string for display
 */
export function getErrorMessage(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If error has a message property
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  // If it's an axios error with response data
  if (error.response?.data) {
    const data = error.response.data;

    // Validation details array (Joi): join first message
    if (Array.isArray((data as any).details) && (data as any).details.length > 0) {
      const first = (data as any).details[0];
      if (typeof first === 'string') return first;
      if (first?.message && typeof first.message === 'string') return first.message;
    }
    
    // If data.error is a string
    if (typeof data.error === 'string') {
      return data.error;
    }
    
    // If data.error is an object with message
    if (data.error && typeof data.error === 'object' && (data.error as any).message) {
      const m = (data.error as any).message;
      return typeof m === 'string' ? m : String(m);
    }
    
    // If data has a message property
    if (typeof data.message === 'string') {
      return data.message;
    }
  }

  // Fallback: convert to string
  try {
    return String(error);
  } catch {
    return 'An unknown error occurred';
  }
}

