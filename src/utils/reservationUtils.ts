import { ReservationFormData, CreateReservationRequest } from '../types/reservations';

/**
 * Convert form data (separate date/time inputs) to ISO 8601 datetime strings
 */
export function formDataToReservationRequest(formData: ReservationFormData): CreateReservationRequest {
  const startDateTime = combineDateTime(formData.startDate, formData.startTime);
  const endDateTime = combineDateTime(formData.endDate, formData.endTime);

  return {
    objectId: formData.objectId,
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
    notes: formData.notes?.trim() || undefined
  };
}

/**
 * Convert ISO 8601 datetime string to form data (separate date/time)
 */
export function reservationToFormData(
  objectId: string, 
  objectName: string, 
  objectType: any,
  startDateTime: string, 
  endDateTime: string,
  notes?: string
): ReservationFormData {
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);

  return {
    objectId,
    objectName,
    objectType,
    startDate: formatDateForInput(startDate),
    startTime: formatTimeForInput(startDate),
    endDate: formatDateForInput(endDate),
    endTime: formatTimeForInput(endDate),
    notes: notes || ''
  };
}

/**
 * Combine date (YYYY-MM-DD) and time (HH:MM) strings into Date object
 */
export function combineDateTime(dateStr: string, timeStr: string): Date {
  const combinedStr = `${dateStr}T${timeStr}:00`;
  return new Date(combinedStr);
}

/**
 * Format Date object to YYYY-MM-DD for HTML date input
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format Date object to HH:MM for HTML time input
 */
export function formatTimeForInput(date: Date): string {
  return date.toTimeString().substring(0, 5);
}

/**
 * Format ISO 8601 datetime for display
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format ISO 8601 date for display
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format ISO 8601 time for display
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculate duration between two ISO 8601 datetime strings
 */
export function calculateDuration(startDateTime: string, endDateTime: string): string {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const durationMs = end.getTime() - start.getTime();
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Check if a reservation is happening today
 */
export function isToday(isoString: string): boolean {
  const reservationDate = new Date(isoString);
  const today = new Date();
  
  return reservationDate.toDateString() === today.toDateString();
}

/**
 * Check if a reservation is in the future
 */
export function isFuture(isoString: string): boolean {
  const reservationDate = new Date(isoString);
  const now = new Date();
  
  return reservationDate > now;
}

/**
 * Check if a reservation is currently active
 */
export function isCurrentlyActive(startDateTime: string, endDateTime: string): boolean {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  return now >= start && now <= end;
}

/**
 * Get default form values for creating a new reservation
 */
export function getDefaultReservationForm(objectId?: string, objectName?: string, objectType?: any): ReservationFormData {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  
  // Round to next hour
  now.setMinutes(0, 0, 0);
  oneHourLater.setMinutes(0, 0, 0);
  
  return {
    objectId: objectId || '',
    objectName: objectName || '',
    objectType: objectType || '',
    startDate: formatDateForInput(now),
    startTime: formatTimeForInput(now),
    endDate: formatDateForInput(oneHourLater),
    endTime: formatTimeForInput(oneHourLater),
    notes: ''
  };
}

/**
 * Validate reservation form data
 */
export function validateReservationForm(formData: ReservationFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!formData.objectId) {
    errors.push('Please select a reservable object');
  }
  
  if (!formData.startDate || !formData.startTime) {
    errors.push('Start date and time are required');
  }
  
  if (!formData.endDate || !formData.endTime) {
    errors.push('End date and time are required');
  }
  
  if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
    const startDateTime = combineDateTime(formData.startDate, formData.startTime);
    const endDateTime = combineDateTime(formData.endDate, formData.endTime);
    const now = new Date();
    
    if (startDateTime <= now) {
      errors.push('Start time must be in the future');
    }
    
    if (endDateTime <= startDateTime) {
      errors.push('End time must be after start time');
    }
    
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const maxDurationMs = 24 * 60 * 60 * 1000; // 24 hours
    
    if (durationMs > maxDurationMs) {
      errors.push('Reservation duration cannot exceed 24 hours');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}