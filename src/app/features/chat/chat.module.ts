import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatLayoutComponent } from './chat-layout/chat-layout.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatRoutingModule } from './chat-routing.module';
import { ChatSearchComponent } from './chat-search/chat-search.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { NewChatComponent } from './new-chat/new-chat.component';
import { ChatInfoComponent } from './chat-info/chat-info.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

@NgModule({
    declarations: [
        ChatLayoutComponent,
        ChatListComponent,
        ChatWindowComponent,
        ChatSearchComponent,
        NewChatComponent,
        ChatInfoComponent,
        UserProfileComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ChatRoutingModule,
        RouterModule
    ],
})
export class ChatModule { }
