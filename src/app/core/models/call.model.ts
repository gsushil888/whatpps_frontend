export type CallKind = 'audio' | 'video';
export type CallState = 'idle' | 'ringing' | 'connecting' | 'in-call' | 'ended';

export interface CallOffer {
    toUserId: string;
    kind: CallKind;
}
