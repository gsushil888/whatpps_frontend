import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chat, ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html'
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  chatId: string | null = null;
  currentChat: Chat | null = null;
  newMessage: string = '';
  showAttachmentModal = false;

  messages = [
    { text: 'Hey! Long time.', type: 'received' },
    { text: 'Yeah! How have you been?', type: 'sent' },
    { text: 'Doing great, thanks 😊', type: 'received' }
  ];
  private destroy$ = new Subject<void>();

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    this.chatService.selectedChatId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chatId => {
        this.chatId = chatId;
        this.loadCurrentChat();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopStream();
  }

  loadCurrentChat() {
    if (this.chatId) {
      this.chatService.chats$
        .pipe(takeUntil(this.destroy$))
        .subscribe(chats => {
          this.currentChat = chats.find(chat => chat.id === this.chatId) || null;
        });
    }
  }

  getChatName(): string {
    return this.currentChat?.name || 'Unknown';
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({
        text: this.newMessage,
        type: 'sent'
      });
      this.newMessage = '';
    }
  }

  // ---------------------- Attachments ----------------------
  openAttachmentModal() {
    this.showAttachmentModal = true;
  }

  closeAttachmentModal() {
    this.showAttachmentModal = false;
    // stop camera + mic if active
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.streamActive = false;
    }
  }


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log("Selected file:", file);
    }
  }

  // ---------------------- Camera + Mic ----------------------
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  stream: MediaStream | null = null;
  streamActive = false;
  showPermission = false;

  async openCameraAndMic() {
    try {
      // Request camera + mic permissions
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.streamActive = true;

      // ✅ Wait for Angular to render <video> before attaching stream
      setTimeout(() => {
        if (this.videoRef && this.videoRef.nativeElement) {
          this.videoRef.nativeElement.srcObject = this.stream;
        }
      }, 0);

    } catch (err) {
      console.error('Permission denied or error:', err);
      alert('Could not access camera/microphone. Please allow permissions.');
    }
  }

  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.streamActive = false;
    }
  }

  openPermissionModal(event: MouseEvent) {
    event.stopPropagation();
    this.showPermission = true;
  }

  closePermissionModal() {
    this.showPermission = false;
  }
}
