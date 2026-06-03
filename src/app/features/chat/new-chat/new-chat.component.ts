import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatService } from '../services/chat.service';
import { ContactService, Contact } from '../services/contact.service';
import { ConversationService } from '../services/conversation.service';

@Component({
  selector: 'app-new-chat',
  templateUrl: './new-chat.component.html'
})
export class NewChatComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  contacts: Contact[] = [];
  showAddContactForm: boolean = false;
  newContactPhone: string = '';
  newContactName: string = '';
  isAddingContact: boolean = false;
  showCreateGroup: boolean = false;
  createGroupStep: 'select' | 'details' = 'select';
  selectedContacts: Contact[] = [];
  groupName: string = '';
  groupDescription: string = '';
  isCreatingGroup: boolean = false;
  groupImageFile: File | null = null;
  groupImagePreview: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private contactService: ContactService,
    private conversationService: ConversationService
  ) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContacts(): void {
    this.contactService.getContacts().subscribe({
      next: (response) => {
        if (response.success) {
          this.contacts = response.data.contacts.sort((a, b) => 
            a.displayName.localeCompare(b.displayName)
          );
        }
      },
      error: (err) => console.error('Error loading contacts:', err)
    });
  }

  get filteredContacts() {
    if (!this.searchTerm) return this.contacts;
    return this.contacts.filter(contact =>
      contact.displayName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      contact.phoneNumber.includes(this.searchTerm)
    );
  }

  get groupedContacts() {
    const grouped: { [key: string]: Contact[] } = {};
    this.filteredContacts.forEach(contact => {
      const firstLetter = contact.displayName[0].toUpperCase();
      if (!grouped[firstLetter]) grouped[firstLetter] = [];
      grouped[firstLetter].push(contact);
    });
    return Object.keys(grouped).sort().map(letter => ({ letter, contacts: grouped[letter] }));
  }

  closeNewChatView() {
    this.chatService.toggleNewChatView(false);
    this.searchTerm = '';
  }

  openNewGroup() {
    this.showCreateGroup = true;
    this.createGroupStep = 'select';
    this.selectedContacts = [];
    this.searchTerm = '';
    this.groupName = '';
    this.groupDescription = '';
  }

  openNewContact() {
    this.showAddContactForm = true;
  }

  closeAddContactForm() {
    this.showAddContactForm = false;
    this.newContactPhone = '';
    this.newContactName = '';
  }

  addContact() {
    if (!this.newContactPhone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    this.isAddingContact = true;
    const request = {
      phoneNumber: this.newContactPhone,
      displayName: this.newContactName || undefined
    };

    this.contactService.addContact(request).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Contact added successfully!');
          this.loadContacts();
          this.closeAddContactForm();
        }
        this.isAddingContact = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add contact');
        this.isAddingContact = false;
      }
    });
  }

  cancelCreateGroup() {
    this.showCreateGroup = false;
    this.selectedContacts = [];
    this.searchTerm = '';
    this.groupName = '';
    this.groupDescription = '';
    this.createGroupStep = 'select';
    this.groupImageFile = null;
    this.groupImagePreview = null;
  }

  get filteredGroupContacts() {
    if (!this.searchTerm) return this.contacts;
    return this.contacts.filter(c =>
      c.displayName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.phoneNumber.includes(this.searchTerm)
    );
  }

  toggleContactSelection(contact: Contact) {
    const index = this.selectedContacts.findIndex(c => c.contactUserId === contact.contactUserId);
    if (index > -1) {
      this.selectedContacts.splice(index, 1);
    } else {
      this.selectedContacts.push(contact);
    }
  }

  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.contactUserId === contact.contactUserId);
  }

  removeSelectedContact(contact: Contact) {
    this.selectedContacts = this.selectedContacts.filter(c => c.contactUserId !== contact.contactUserId);
  }

  nextToGroupDetails() {
    if (this.selectedContacts.length > 0) {
      this.createGroupStep = 'details';
    }
  }

  backToSelectParticipants() {
    this.createGroupStep = 'select';
  }

  onGroupImageSelect(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.groupImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.groupImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  createGroup() {
    if (!this.groupName.trim() || this.selectedContacts.length === 0) return;

    this.isCreatingGroup = true;

    // If image selected, upload it first
    if (this.groupImageFile) {
      this.conversationService.uploadMedia(null, this.groupImageFile)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.createGroupWithImage(response.data.fileUrl);
            } else {
              this.isCreatingGroup = false;
              alert('Failed to upload group image');
            }
          },
          error: (err) => {
            console.error('Error uploading group image:', err);
            this.isCreatingGroup = false;
            alert('Failed to upload group image');
          }
        });
    } else {
      this.createGroupWithImage(undefined);
    }
  }

  private createGroupWithImage(imageUrl?: string) {
    const request = {
      type: 'GROUP' as const,
      participantIds: this.selectedContacts.map(c => c.contactUserId),
      title: this.groupName,
      description: this.groupDescription || undefined,
      groupPictureUrl: imageUrl
    };

    this.conversationService.createConversation(request).subscribe({
      next: (response) => {
        if (response.success) {
          const newChat = {
            id: response.data.id.toString(),
            name: response.data.title,
            avatar: response.data.profileImageUrl || 'assets/google.svg',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
            time: 'now',
            lastMessage: '',
            unreadCount: 0,
            type: 'GROUP'
          };
          this.chatService.addNewChat(newChat);
          this.chatService.selectChat(newChat.id);
          this.closeNewChatView();
        }
        this.isCreatingGroup = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to create group');
        this.isCreatingGroup = false;
      }
    });
  }

  startChatWithContact(contact: Contact) {
    this.conversationService.createConversation({
      type: 'INDIVIDUAL',
      participantId: contact.contactUserId
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.chatService.upsertChat(response.data);
          this.chatService.selectChat(response.data.id.toString());
          this.closeNewChatView();
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to open conversation')
    });
  }
}
