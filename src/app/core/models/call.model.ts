export type CallType = 'VIDEO' | 'VOICE';
export type CallStatus = 'INITIATED' | 'RINGING' | 'ANSWERED' | 'DECLINED' | 'ENDED' | 'MISSED';
export type ParticipantStatus = 'CALLING' | 'ANSWERED' | 'DECLINED' | 'LEFT' | 'INVITED' | 'JOINED';
export type CallDirection = 'INCOMING' | 'OUTGOING';

export interface CallParticipant {
  userId: number;
  displayName: string;
  avatarUrl?: string;        // legacy
  profilePictureUrl?: string; // from API
  participantStatus: ParticipantStatus;
}

export interface CallSession {
  id: number;
  callType: CallType;
  callStatus: CallStatus;
  callToken: string;
  conversationId: number;
  participants: CallParticipant[];
  displayName?: string;
  groupImageUrl?: string;
  callerUserId?: number;
  callerProfilePictureUrl?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface CallHistoryParticipant {
  userId: number;
  displayName: string;
  profilePictureUrl?: string;
  participantStatus: string;
  joinedAt?: string;
  leftAt?: string;
}

export interface CallHistoryRecord {
  id: number;
  callType: CallType;
  callStatus: CallStatus;
  callDirection: CallDirection;
  displayName: string;
  profilePictureUrl?: string;
  groupImageUrl?: string;
  callerUserId?: number;
  callerProfilePictureUrl?: string;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  conversationId: number;
  participants: CallHistoryParticipant[];
}

// WebSocket events
export interface IncomingCallEvent {
  event: 'INCOMING_CALL';
  callId: number;
  callType: CallType;
  callToken: string;
  callerUserId: number;
  callerName: string;
  callerAvatar?: string;            // legacy
  callerProfilePictureUrl?: string; // new field
  conversationId: number;
}

export interface CallStatusEvent {
  event: 'CALL_ANSWERED' | 'CALL_DECLINED' | 'CALL_ENDED';
  callId: number;
  answeredByUserId?: number;
  declinedByUserId?: number;
  endedByUserId?: number;
  reason?: string;
  durationSeconds?: number;
}

export interface CallSignalEvent {
  callId: number;
  fromUserId: number;
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
}

// API payloads
export interface InitiateCallPayload {
  callType: CallType;
  conversationId: number;
  participantIds: number[];
}

export interface SendSignalPayload {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  targetParticipantId: number;
}
