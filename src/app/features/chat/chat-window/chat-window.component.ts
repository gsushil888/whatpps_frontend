import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TokenService } from 'src/app/core/services/token.service';
import { PresenceService } from 'src/app/core/services/presence.service';
import { TypingIndicatorService } from 'src/app/core/services/typing-indicator.service';
import { Chat, ChatService } from '../services/chat.service';
import { ConversationMessage, ConversationService } from '../services/conversation.service';
import { ContactService } from '../services/contact.service';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html'
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  @Input() isMobile = false;
  @Output() backToList = new EventEmitter<void>();
  chatId: string | null = null;
  currentChat: Chat | null = null;
  conversationType: string = 'INDIVIDUAL';
  newMessage: string = '';
  showAttachmentModal = false;
  showChatInfo = false;
  showMenuModal = false;
  showSearch = false;
  showMore = false;
  searchQuery = '';
  searchResultCount = 0;
  showImageModal = false;
  selectedImage: string = '';
  activeFilter: string = 'all';
  messages: ConversationMessage[] = [];
  isUploadingFile = false;
  uploadingImagePreview: string | null = null;
  stream: MediaStream | null = null;
  streamActive = false;
  capturedPhoto: string | null = null;
  isLoadingMessages = false;
  hasMoreMessages = true;
  stickyDate = '';
  showStickyDate = false;
  private scrollTimeout: any;
  private destroy$ = new Subject<void>();
  isTyping = false;
  typingText = '';
  private isAutoScrolling = false;
  activeReactionMsgId: number | null = null;
  readonly REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private chatService: ChatService,
    private conversationService: ConversationService,
    private contactService: ContactService,
    private tokenService: TokenService,
    private webSocketService: WebSocketService,
    private presenceService: PresenceService,
    private typingIndicatorService: TypingIndicatorService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.chatService.selectedChatId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chatId => {
        this.chatId = chatId;
        console.log('🔵 Selected conversation ID:', chatId);
        this.showChatInfo = false;
        this.loadCurrentChat();
      });

    this.chatService.activeFilter$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filter => {
        this.activeFilter = filter;
      });

    // Subscribe to WebSocket messages
    this.webSocketService.message$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('📨 WebSocket message received:', message);
        if (message) {
          console.log('✅ Adding message to current conversation');
          this.addMessageToList(message);
          const currentUserId = parseInt(this.tokenService.getUserId() || '0');
          if (message.senderId !== currentUserId && this.chatId) {
            this.webSocketService.markConversationAsRead(parseInt(this.chatId));
          }
        }
      });

    // Subscribe to reaction updates on dedicated queue
    this.webSocketService.reaction$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.handleReactionUpdate(event));

    // Subscribe to message status updates (tick updates for sent messages)
    this.webSocketService.messageStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(statusUpdate => {
        const msg = this.messages.find(m => m.id === statusUpdate.messageId);
        if (msg) {
          if (statusUpdate.status === 'DELIVERED') {
            msg.deliveryStatus = { ...msg.deliveryStatus, delivered: 1 };
          } else if (statusUpdate.status === 'READ') {
            msg.deliveryStatus = { ...msg.deliveryStatus, delivered: 1, read: 1 };
          }
          this.cdr.markForCheck();
        }
      });

    this.presenceService.presence$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    // Subscribe to typing indicators
    this.typingIndicatorService.typingUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.chatId) {
          this.isTyping = this.typingIndicatorService.isAnyoneTyping(parseInt(this.chatId));
          this.typingText = this.typingIndicatorService.getTypingText(parseInt(this.chatId));
          if (this.isTyping) {
            setTimeout(() => this.scrollToBottom(), 100);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
  }

  loadCurrentChat() {
    if (this.chatId) {
      this.chatService.chats$
        .pipe(takeUntil(this.destroy$))
        .subscribe(chats => {
          console.log("Chats Loaded", chats);
          this.currentChat = chats.find(chat => chat.id === this.chatId) || null;
        });
      this.loadMessages();

      // Subscribe to conversation topic for real-time messages
      const conversationId = parseInt(this.chatId);
      console.log('🔔 Subscribing to conversation:', conversationId);
      this.webSocketService.subscribeToConversation(conversationId);
      this.typingIndicatorService.subscribeToConversation(conversationId);

      // Clear unread badge locally and persist to backend
      this.chatService.clearUnreadCount(conversationId);
      this.webSocketService.markConversationAsRead(conversationId);
    }
  }

  loadMessages() {
    if (this.chatId) {
      this.messages = [];
      this.hasMoreMessages = true;
      this.isLoadingMessages = true;
      this.conversationService.getConversationMessages(this.chatId, 50)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messages = response.data.messages.reverse();
              this.hasMoreMessages = response.data.pagination.hasNext;
              setTimeout(() => this.scrollToBottom(), 0);
              // Mark all unread messages as READ
              this.markUnreadMessagesAsRead();
            }
            this.isLoadingMessages = false;
          },
          error: (err) => {
            console.error('Error loading messages:', err);
            this.isLoadingMessages = false;
          }
        });

      this.chatService.chats$
        .pipe(takeUntil(this.destroy$))
        .subscribe(chats => {
          const chat = chats.find(c => c.id === this.chatId);
          this.conversationType = chat?.type || 'INDIVIDUAL';
        });
    }
  }

  private markUnreadMessagesAsRead() {
    if (!this.chatId) return;
    this.webSocketService.markConversationAsRead(parseInt(this.chatId));
  }

  getChatName(): string {
    return this.currentChat?.name || 'Unknown';
  }

  getChatOnlineStatus(): string {
    if (!this.currentChat || this.currentChat.type === 'GROUP') return '';
    if (this.currentChat.otherUserId) {
      const presence = this.presenceService.getUserPresence(this.currentChat.otherUserId);
      console.log('[ChatWindow] getChatOnlineStatus for userId', this.currentChat.otherUserId, ':', presence);
      const lastSeen = this.presenceService.getLastSeen(this.currentChat.otherUserId);
      if (lastSeen) return lastSeen;
    }
    return this.currentChat.isOnline ? 'online' : this.getStaticLastSeen();
  }

  isCurrentChatOnline(): boolean {
    if (this.currentChat?.otherUserId) {
      const presence = this.presenceService.getUserPresence(this.currentChat.otherUserId);
      if (presence) return presence.status === 'ONLINE';
    }
    return this.currentChat?.isOnline === true;
  }

  private getStaticLastSeen(): string {
    if (!this.currentChat?.lastActiveAt) return '';
    const lastActive = new Date(this.currentChat.lastActiveAt);
    if (isNaN(lastActive.getTime())) return '';
    const diffMins = Math.floor((Date.now() - lastActive.getTime()) / 60000);
    if (diffMins < 1) return 'last seen just now';
    if (diffMins < 60) return `last seen ${diffMins} minutes ago`;
    if (diffMins < 1440) return `last seen ${Math.floor(diffMins / 60)} hours ago`;
    return `last seen ${Math.floor(diffMins / 1440)} days ago`;
  }

  isCurrentUser(senderId: number): boolean {
    const currentUserId = this.tokenService.getUserId();
    return currentUserId ? senderId === parseInt(currentUserId) : false;
  }

  isGroupChat(): boolean {
    return this.conversationType === 'GROUP';
  }

  shouldShowSenderName(msg: ConversationMessage, index: number): boolean {
    if (!this.isGroupChat() || this.isCurrentUser(msg.senderId)) return false;
    if (index === 0) return true;
    return this.messages[index - 1].senderId !== msg.senderId;
  }

  isFirstInSenderGroup(index: number): boolean {
    const msg = this.messages[index];
    const prev = this.messages[index - 1];
    if (!prev) return true;
    return prev.senderId !== msg.senderId;
  }

  getSenderDisplayName(msg: ConversationMessage): string {
    if (this.isCurrentUser(msg.senderId)) {
      return 'You';
    }
    return msg.senderName;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  shouldShowDateSeparator(msg: ConversationMessage, index: number): boolean {
    if (index === 0) return true;
    const currentDate = new Date(msg.createdAt).toDateString();
    const previousDate = new Date(this.messages[index - 1].createdAt).toDateString();
    return currentDate !== previousDate;
  }

  getDateLabel(timestamp: string): string {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  onTyping() {
    if (this.chatId) {
      this.typingIndicatorService.startTyping(parseInt(this.chatId));
    }
  }

  sendMessage() {
    if (this.newMessage.trim() && this.chatId) {
      const conversationId = parseInt(this.chatId);
      const message = {
        messageType: 'TEXT',
        content: this.newMessage
      };

      console.log('📤 Sending message to conversation:', conversationId);
      console.log('📝 Message content:', message);

      this.typingIndicatorService.stopTyping(conversationId);
      this.webSocketService.sendMessage(conversationId, message);
      this.newMessage = '';
    } else {
      console.warn('⚠️ Cannot send message. Message empty or no conversation selected');
      console.log('Current chatId:', this.chatId, 'Message:', this.newMessage);
    }
  }

  private addMessageToList(message: any, skipIfDuplicate: boolean = true) {
    console.log('➕ Adding message to list:', message);
    console.log('Message type:', message.messageType);
    console.log('Media metadata:', message.mediaMetadata);
    console.log('Media URL:', message.mediaUrl);
    console.log('Is uploading:', message.isUploading);

    // Skip duplicate check for text messages to allow same content
    if (skipIfDuplicate && this.messages.length > 0 && message.messageType !== 'TEXT') {
      const lastMsg = this.messages[this.messages.length - 1];
      const timeDiff = Math.abs(new Date(message.createdAt).getTime() - new Date(lastMsg.createdAt).getTime());
      if (lastMsg.senderId === message.senderId &&
        lastMsg.messageType === message.messageType &&
        timeDiff < 3000) {
        console.log('⚠️ Skipping duplicate message');
        return;
      }
    }

    const newMessage: ConversationMessage = {
      id: message.id,
      senderId: message.senderId,
      senderName: message.senderName || 'Unknown',
      senderMobileNumber: message.senderMobileNumber,
      senderAvatar: message.senderAvatar || '',
      content: message.content,
      messageType: message.messageType,
      isEdited: false,
      deliveryStatus: message.deliveryStatus || { read: 0, delivered: 0, sent: 1 },
      reactions: message.reactions || [],
      mediaMetadata: message.mediaMetadata ? {
        ...message.mediaMetadata,
        thumbnail: message.mediaMetadata.thumbnail || message.mediaUrl
      } : undefined,
      mediaUrl: message.mediaUrl,
      isUploading: message.isUploading || false,
      createdAt: message.createdAt || new Date().toISOString()
    };
    this.messages.push(newMessage);
    console.log('✅ Message added. Total messages:', this.messages.length);
    console.log('Full message object:', newMessage);

    if (this.chatId && newMessage.createdAt) {
      this.chatService.updateChatLastMessage(
        this.chatId,
        newMessage.content || '',
        newMessage.messageType,
        newMessage.createdAt,
        newMessage.senderId,
        newMessage.senderName
      );
    }

    setTimeout(() => this.scrollToBottom(), 100);
  }

  // ---------------------- Attachments ----------------------
  openAttachmentModal() {
    this.showAttachmentModal = true;
  }

  closeAttachmentModal() {
    this.showAttachmentModal = false;
    this.stopCamera();
  }

  openCameraAndMic() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.stream = stream;
        this.streamActive = true;
        setTimeout(() => {
          if (this.videoElement) {
            this.videoElement.nativeElement.srcObject = stream;
          }
        }, 100);
      })
      .catch(err => console.error('Camera error:', err));
  }

  capturePhoto() {
    if (!this.videoElement || !this.stream) return;

    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    this.capturedPhoto = canvas.toDataURL('image/jpeg', 0.9);
    this.stopCamera();
  }

  acceptPhoto() {
    if (!this.capturedPhoto) return;

    fetch(this.capturedPhoto)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.capturedPhoto = null;
        this.closeAttachmentModal();
        this.processImageUpload(file);
      });
  }

  rejectPhoto() {
    this.capturedPhoto = null;
    this.openCameraAndMic();
  }

  private stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.streamActive = false;
    }
  }


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.chatId) {
      const file = input.files[0];
      this.closeAttachmentModal();
      if (file.type.startsWith('image/')) {
        this.processImageUpload(file);
      } else {
        this.startUpload(file, input);
      }
    }
  }

  private processImageUpload(file: File) {
    this.isUploadingFile = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadingImagePreview = e.target?.result as string;
      this.addMessageToList({
        senderId: parseInt(this.tokenService.getUserId()!),
        senderName: 'You',
        senderMobileNumber: '',
        senderAvatar: '',
        content: '',
        messageType: 'IMAGE',
        isEdited: false,
        deliveryStatus: { read: 0, delivered: 0, sent: 0 },
        reactions: [],
        mediaMetadata: { thumbnail: this.uploadingImagePreview, fileName: file.name, size: file.size, mimeType: file.type },
        isUploading: true,
        createdAt: new Date().toISOString()
      }, false);
      setTimeout(() => this.startUpload(file, null), 2000);
    };
    reader.readAsDataURL(file);
  }

  private startUpload(file: File, input: HTMLInputElement | null) {
    console.log('Upload started, isUploadingFile:', this.isUploadingFile);

    this.conversationService.uploadMedia(this.chatId!, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('File uploaded:', response);
          this.isUploadingFile = false;
          this.uploadingImagePreview = null;

          if (response.success) {
            const messageType = this.getMessageType(file.type);
            const message: any = {
              messageType: messageType,
              content: '',
              mediaUrl: response.data.fileUrl,
              mediaMetadata: {
                fileName: response.data.fileName,
                size: response.data.fileSize,
                mimeType: response.data.mimeType,
                thumbnail: response.data.thumbnailUrl || response.data.fileUrl
              },
              replyToMessageId: null
            };

            if (messageType === 'IMAGE' || messageType === 'VIDEO') {
              message.mediaMetadata.width = response.data.width || null;
              message.mediaMetadata.height = response.data.height || null;
            }

            if (messageType === 'VIDEO' || messageType === 'AUDIO') {
              message.mediaMetadata.duration = response.data.duration || null;
            }

            // Remove uploading message and add final message
            const uploadingIndex = this.messages.findIndex(m => m.isUploading);
            if (uploadingIndex !== -1) {
              this.messages.splice(uploadingIndex, 1);
            }

            // Add final message
            this.addMessageToList({
              senderId: parseInt(this.tokenService.getUserId()!),
              senderName: 'You',
              senderMobileNumber: '',
              senderAvatar: '',
              content: message.content,
              messageType: message.messageType,
              isEdited: false,
              deliveryStatus: { read: 0, delivered: 0, sent: 1 },
              reactions: [],
              mediaUrl: message.mediaUrl,
              mediaMetadata: message.mediaMetadata,
              createdAt: new Date().toISOString()
            }, false);

            this.webSocketService.sendMessage(parseInt(this.chatId!), message);
          }
          if (input) input.value = '';
        },
        error: (err) => {
          console.error('Error uploading file:', err);
          this.isUploadingFile = false;
          this.uploadingImagePreview = null;

          // Remove uploading message on error
          const uploadingIndex = this.messages.findIndex(m => m.isUploading);
          if (uploadingIndex !== -1) {
            this.messages.splice(uploadingIndex, 1);
          }

          alert('Failed to upload file: ' + (err.error?.message || err.message));
          if (input) input.value = '';
        }
      });
  }

  private getMessageType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  }



  private pendingReactions = new Set<string>();

  getGroupedReactions(reactions: any[]): { emoji: string; count: number; hasCurrentUser: boolean }[] {
    const currentUserId = parseInt(this.tokenService.getUserId()!);
    const map = new Map<string, { count: number; hasCurrentUser: boolean }>();
    for (const r of reactions) {
      const entry = map.get(r.emoji) || { count: 0, hasCurrentUser: false };
      entry.count++;
      if (r.userId === currentUserId) entry.hasCurrentUser = true;
      map.set(r.emoji, entry);
    }
    return Array.from(map.entries()).map(([emoji, v]) => ({ emoji, ...v }));
  }

  private handleReactionUpdate(event: any) {
    const msg = this.messages.find(m => m.id === event.messageId);
    if (!msg) return;

    const reactorId = event.reactorId ?? event.userId ?? parseInt(this.tokenService.getUserId()!);
    const reactorName = event.reactorName ?? '';

    if (event.action === 'remove') {
      msg.reactions = msg.reactions.filter(r => !(r.emoji === event.emoji && r.userId === reactorId));
    } else {
      msg.reactions = msg.reactions.filter(r => r.userId !== reactorId);
      msg.reactions.push({ emoji: event.emoji, userId: reactorId, displayName: reactorName, createdAt: new Date().toISOString() });
    }
    this.cdr.markForCheck();
  }

  @HostListener('document:click')
  onDocumentClick() { this.activeReactionMsgId = null; }

  // ---------------------- Reactions ----------------------
  toggleReactionPicker(msgId: number | undefined, event: MouseEvent) {
    event.stopPropagation();
    this.activeReactionMsgId = this.activeReactionMsgId === msgId ? null : (msgId ?? null);
  }

  closeReactionPicker() {
    this.activeReactionMsgId = null;
  }

  // kept for template compatibility (no-ops now)
  showReactionPicker(_id: number | undefined) {}
  hideReactionPicker() {}

  sendReaction(msg: ConversationMessage, emoji: string) {
    if (!this.chatId || !msg.id) return;
    const conversationId = parseInt(this.chatId);
    const currentUserId = parseInt(this.tokenService.getUserId()!);
    const existing = msg.reactions.findIndex(r => r.userId === currentUserId && r.emoji === emoji);

    if (existing !== -1) {
      // Optimistic remove
      msg.reactions.splice(existing, 1);
      this.webSocketService.sendReaction(conversationId, msg.id, emoji, 'remove');
    } else {
      // Remove previous reaction by current user if any
      const prevIdx = msg.reactions.findIndex(r => r.userId === currentUserId);
      const prevEmoji = prevIdx !== -1 ? msg.reactions[prevIdx].emoji : null;
      if (prevIdx !== -1) {
        msg.reactions.splice(prevIdx, 1);
        this.webSocketService.sendReaction(conversationId, msg.id, prevEmoji!, 'remove');
      }
      // Optimistic add
      msg.reactions.push({ emoji, userId: currentUserId, displayName: 'You', createdAt: new Date().toISOString() });
      this.webSocketService.sendReaction(conversationId, msg.id, emoji, 'add');
    }
    this.activeReactionMsgId = null;
  }

  // ---------------------- Chat Info ----------------------
  toggleChatInfo() {
    this.showChatInfo = !this.showChatInfo;
  }

  closeChatInfo() {
    this.showChatInfo = false;
  }

  get filteredMessages(): ConversationMessage[] {
    if (!this.searchQuery.trim()) return this.messages;
    const q = this.searchQuery.toLowerCase();
    const results = this.messages.filter(m => m.content?.toLowerCase().includes(q));
    this.searchResultCount = results.length;
    return results;
  }

  // ---------------------- Menu Modal ----------------------
  toggleMenuModal() {
    this.showMenuModal = !this.showMenuModal;
    this.showMore = false;
  }

  closeMenuModal() {
    this.showMenuModal = false;
    this.showMore = false;
  }

  toggleMore() {
    this.showMore = !this.showMore;
  }

  viewContact() {
    this.showMenuModal = false;
    this.showChatInfo = true;
  }

  openSearch() {
    this.showMenuModal = false;
    this.showSearch = true;
    this.searchQuery = '';
    this.searchResultCount = 0;
  }

  closeSearch() {
    this.showSearch = false;
    this.searchQuery = '';
    this.searchResultCount = 0;
  }

  deleteChat() {
    if (!this.chatId || !confirm('Delete this chat? This cannot be undone.')) return;
    const chat = this.currentChat;
    // For INDIVIDUAL chats, also delete the contact record so the conversation is fully removed
    const deleteConv = () => this.conversationService.deleteConversation(this.chatId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.chatService.removeChat(this.chatId!);
          this.chatService.clearSelection();
          this.showMenuModal = false;
        },
        error: (err) => console.error('Error deleting conversation:', err)
      });

    if (chat?.type === 'INDIVIDUAL' && chat.otherUserId) {
      // Find contact by otherUserId and delete it first
      this.contactService.getContacts().pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          const contact = res.data.contacts.find(c => c.contactUserId === chat.otherUserId);
          if (contact) {
            this.contactService.deleteContact(contact.id).pipe(takeUntil(this.destroy$)).subscribe({
              next: () => deleteConv(),
              error: () => deleteConv()
            });
          } else {
            deleteConv();
          }
        },
        error: () => deleteConv()
      });
    } else {
      deleteConv();
    }
  }

  clearMessages() {
    if (!this.chatId || !confirm('Clear all messages? Only you will see this change.')) return;
    this.conversationService.clearConversation(this.chatId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messages = [];
          this.chatService.updateChatLastMessage(this.chatId!, '', 'TEXT', new Date().toISOString());
          this.showMenuModal = false;
        },
        error: (err) => console.error('Error clearing conversation:', err)
      });
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      this.isAutoScrolling = true;
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
      setTimeout(() => {
        this.isAutoScrolling = false;
      }, 100);
    }
  }

  downloadDocument(mediaUrl: string, fileName: string): void {
    const url = mediaUrl.startsWith('http') ? mediaUrl : 'http://localhost:8080' + mediaUrl;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (element.scrollTop <= 10 && this.hasMoreMessages && !this.isLoadingMessages) {
      this.loadMoreMessages();
    }
    
    this.showStickyDate = true;
    this.updateStickyDate(element);
    
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.showStickyDate = false;
    }, 1000);
  }

  private updateStickyDate(element: HTMLElement): void {
    const dateSeparators = element.querySelectorAll('.date-separator');
    
    for (let i = dateSeparators.length - 1; i >= 0; i--) {
      const separator = dateSeparators[i] as HTMLElement;
      const rect = separator.getBoundingClientRect();
      const containerRect = element.getBoundingClientRect();
      
      if (rect.top <= containerRect.top + 50) {
        const dateText = separator.querySelector('span')?.textContent || '';
        this.stickyDate = dateText;
        break;
      }
    }
  }

  private loadMoreMessages(): void {
    if (!this.chatId || this.isLoadingMessages || !this.hasMoreMessages) return;
    
    this.isLoadingMessages = true;
    const oldestMessageId = this.messages[0]?.id;
    
    this.conversationService.getConversationMessages(this.chatId, 20, oldestMessageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data.messages.length > 0) {
            const oldScrollHeight = this.messagesContainer.nativeElement.scrollHeight;
            const newMessages = response.data.messages.reverse();
            this.messages = [...newMessages, ...this.messages];
            this.hasMoreMessages = response.data.pagination.hasNext;
            
            setTimeout(() => {
              const newScrollHeight = this.messagesContainer.nativeElement.scrollHeight;
              this.messagesContainer.nativeElement.scrollTop = newScrollHeight - oldScrollHeight;
            }, 0);
          } else {
            this.hasMoreMessages = false;
          }
          this.isLoadingMessages = false;
        },
        error: (err) => {
          console.error('Error loading more messages:', err);
          this.isLoadingMessages = false;
        }
      });
  }
}
