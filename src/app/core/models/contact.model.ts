export interface Contact {
  id: number;
  contactUserId: number;
  customName: string | null;
  displayName: string;
  phoneNumber: string;
  profilePictureUrl: string;
  isOnline: boolean;
  isFavorite: boolean;
  isBlocked: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface ContactResponse {
  success: boolean;
  data: {
    contacts: Contact[];
    totalCount: number;
    pagination: {
      page: number;
      limit: number;
      hasNext: boolean;
    };
  };
}

export interface AddContactRequest {
  phoneNumber: string;
  displayName?: string;
}

export interface AddContactResponse {
  success: boolean;
  message: string;
  data: Contact;
}
