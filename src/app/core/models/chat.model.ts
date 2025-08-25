export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface UserSummary {
    id: string;
    name: string;
    avatarUrl?: string;
    lastSeen?: string;
    online?: boolean;
}

export interface Chat {
    id: string;
    isGroup: boolean;
    title: string;
    participants: UserSummary[];
    lastMessage?: Message;
    unreadCount?: number;
}

export interface Attachment {
    id: string;
    url: string;
    mimeType: string;
    fileName: string;
    size: number;
    thumbUrl?: string;
}

export interface Message {
    id?: string;
    chatId: string;
    from: string;
    body?: string;
    attachments?: Attachment[];
    sentAt: string;
    status?: MessageStatus;
    editedAt?: string;
    replyToId?: string;
    meta?: Record<string, any>;
}
