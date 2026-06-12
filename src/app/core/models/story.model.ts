export type StoryType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK';
export type PrivacySetting = 'PUBLIC' | 'CONTACTS' | 'CLOSE_FRIENDS' | 'CUSTOM';
export type TextStyle = 'NORMAL' | 'BOLD' | 'ITALIC' | 'HANDWRITING';

export interface Story {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  content?: string;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  storyType: StoryType;
  backgroundColor?: string | null;
  textStyle?: TextStyle | null;
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkDescription?: string | null;
  linkPreviewImage?: string | null;
  createdAt: string;
  viewCount: number;
  isViewed: boolean;
  hasUnviewedStories?: boolean;
  privacySetting: PrivacySetting;
  expiresAt: string;
}

export interface StoryViewer {
  viewerId: number;
  viewerName: string;
  viewerAvatar: string;
  viewedAt: string;
}

export interface UserStories {
  userId: number;
  userName: string;
  userAvatar: string;
  stories: Story[];
  unviewedCount: number;
  lastStoryAt: string;
}

export interface PostStoryRequest {
  storyType: StoryType;
  content?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  backgroundColor?: string;
  textStyle?: TextStyle;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkPreviewImage?: string;
  privacySetting: PrivacySetting;
}

export interface MediaUploadResponse {
  success: boolean;
  message: string;
  data: {
    fileId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  };
}

export interface StoryFeedResponse {
  success: boolean;
  data: {
    stories: Story[];
    pagination: { page: number; limit: number; hasNext: boolean };
  };
}

export interface PostStoryResponse {
  success: boolean;
  message: string;
  data: Story;
}

export interface StoryViewersResponse {
  success: boolean;
  data: {
    viewers: StoryViewer[];
    totalViewers: number;
  };
}

export interface MyStoriesResponse {
  success: boolean;
  data: {
    stories: Story[];
    pagination: { page: number; limit: number; hasNext: boolean };
  };
}

export interface UserStoriesResponse {
  success: boolean;
  data: UserStories;
}

export interface BasicResponse {
  success: boolean;
  message: string;
}

export interface StoryViewEvent {
  storyId: number;
  viewCount: number;
  viewerId: number;
  viewerName: string;
  viewerAvatar: string;
  viewedAt: string;
}

