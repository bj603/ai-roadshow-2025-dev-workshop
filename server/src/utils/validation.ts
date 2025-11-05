/**
 * Validation utilities for the reservation system
 */

/**
 * Validate ISO 8601 date string format
 */
export function isValidISODateTime(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
}

/**
 * Check if start date is before end date
 */
export function isValidDateRange(startDateTime: string, endDateTime: string): boolean {
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);
  return startDate < endDate;
}

/**
 * Calculate duration between two dates in hours
 */
export function calculateDurationHours(startDateTime: string, endDateTime: string): number {
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Check if duration is within allowed limits
 */
export function isValidDuration(startDateTime: string, endDateTime: string, minHours: number = 0.5, maxHours: number = 24): boolean {
  const duration = calculateDurationHours(startDateTime, endDateTime);
  return duration >= minHours && duration <= maxHours;
}

/**
 * Validate object ID format (simple alphanumeric with hyphens)
 */
export function isValidObjectId(objectId: string): boolean {
  if (!objectId || typeof objectId !== 'string') {
    return false;
  }
  return /^[a-zA-Z0-9-_]+$/.test(objectId) && objectId.length >= 3 && objectId.length <= 50;
}

/**
 * Validate user ID format
 */
export function isValidUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  return userId.length >= 1 && userId.length <= 100;
}

/**
 * Business rule validation for reservations
 */
export interface BusinessRuleValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate business rules for reservation creation
 */
export function validateReservationBusinessRules(
  startDateTime: string,
  endDateTime: string,
  objectType: 'desk' | 'parking'
): BusinessRuleValidation {
  const errors: string[] = [];

  // Check duration limits
  const duration = calculateDurationHours(startDateTime, endDateTime);
  
  if (duration < 0.5) {
    errors.push('Reservations must be at least 30 minutes');
  }
  
  if (duration > 24) {
    errors.push('Reservations cannot exceed 24 hours');
  }

  // Business hours validation (9 AM to 6 PM weekdays for desks)
  if (objectType === 'desk') {
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    
    // Check if it's a weekend
    const startDay = startDate.getDay();
    const endDay = endDate.getDay();
    
    if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
      errors.push('Desk reservations are only allowed on weekdays');
    }
    
    // Check business hours (9 AM to 6 PM)
    const startHour = startDate.getHours();
    const endHour = endDate.getHours();
    
    if (startHour < 9 || endHour > 18) {
      errors.push('Desk reservations must be within business hours (9 AM to 6 PM)');
    }
  }

  // Parking can be 24/7, so no additional restrictions for parking

  // Check for advance booking limits (max 30 days in advance)
  const now = new Date();
  const maxAdvanceDays = 30;
  const maxAdvanceDate = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);
  
  if (new Date(startDateTime) > maxAdvanceDate) {
    errors.push(`Reservations cannot be made more than ${maxAdvanceDays} days in advance`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize and normalize date string
 */
export function normalizeDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString();
}

/**
 * Check if two time periods overlap
 */
export function timePeriodsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const startTime1 = new Date(start1).getTime();
  const endTime1 = new Date(end1).getTime();
  const startTime2 = new Date(start2).getTime();
  const endTime2 = new Date(end2).getTime();

  return startTime1 < endTime2 && startTime2 < endTime1;
}

/**
 * Format duration in a human-readable format
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours === 1) {
    return '1 hour';
  } else if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` and ${remainingHours.toFixed(1)} hours` : ''}`;
  }
}

/**
 * Get next business day (Monday-Friday)
 */
export function getNextBusinessDay(date: Date = new Date()): Date {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  
  // If it's Saturday (6) or Sunday (0), move to Monday
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Comprehensive validation for reservation request
 */
export function validateReservationRequest(
  objectId: string,
  userId: string,
  startDateTime: string,
  endDateTime: string,
  objectType: 'desk' | 'parking'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic field validation
  if (!isValidObjectId(objectId)) {
    errors.push('Invalid object ID format');
  }

  if (!isValidUserId(userId)) {
    errors.push('Invalid user ID format');
  }

  if (!isValidISODateTime(startDateTime)) {
    errors.push('Invalid start date format. Use ISO 8601 format');
  }

  if (!isValidISODateTime(endDateTime)) {
    errors.push('Invalid end date format. Use ISO 8601 format');
  }

  // Date range validation
  if (isValidISODateTime(startDateTime) && isValidISODateTime(endDateTime)) {
    if (!isValidDateRange(startDateTime, endDateTime)) {
      errors.push('Start date must be before end date');
    }

    if (!isFutureDate(startDateTime)) {
      errors.push('Start date must be in the future');
    }

    // Business rules validation
    const businessRules = validateReservationBusinessRules(startDateTime, endDateTime, objectType);
    errors.push(...businessRules.errors);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}