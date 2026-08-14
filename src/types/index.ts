export * from './database';

export type AppViewMode = 'ATTENDEE_WEB' | 'ATTENDEE_MOBILE' | 'ORGANIZER_DASHBOARD' | 'STAFF_CHECKIN';

export interface AuthUser {
  id: string;
  email: string;
  accountType?: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN';
  role: 'ATTENDEE' | 'ORGANIZER' | 'STAFF' | 'ADMIN';
  fullName: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  organizationId?: string;
}

export interface OrganizerSignupStage1 {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface OrganizerSignupStage2 {
  organizationName: string;
  typeOfOrganizer: 'INDIVIDUAL' | 'BUSINESS' | 'NON_PROFIT' | 'AGENCY';
  country: string;
  phoneNumber: string;
}

export interface OrganizerSignupStage3 {
  accountType: 'INDIVIDUAL' | 'BUSINESS';
  accountHolderName: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  businessRegistrationNumber?: string;
}

export interface StaffInvitationPayload {
  email: string;
  fullName: string;
  eventId: string;
  organizationId: string;
}

export interface QRScanVerificationResult {
  success: boolean;
  status: 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'INVALID_TICKET' | 'WRONG_EVENT' | 'CANCELLED_TICKET';
  message: string;
  ticketCode?: string;
  ticketId?: string;
  scannedAt?: string;
}
