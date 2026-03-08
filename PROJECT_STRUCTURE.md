# WhatsApp Clone - Frontend Project Structure

## Project Overview

This is a **WhatsApp Clone** frontend application built with **Angular 15.2.11** and **TailwindCSS**. The project follows Angular best practices with a modular architecture, featuring authentication, real-time chat, voice/video calls, status updates, and responsive design.

## Technology Stack

- **Framework**: Angular 15.2.11
- **Styling**: TailwindCSS 3.4.17 with dark mode support
- **Language**: TypeScript 4.9.4
- **Build Tool**: Angular CLI
- **Testing**: Jasmine & Karma
- **State Management**: RxJS 7.8.0

## Project Architecture

The application follows a **feature-based modular architecture** with clear separation of concerns:

```
whatsapps-frontend/
├── src/
│   ├── app/
│   │   ├── core/           # Singleton services, guards, interceptors
│   │   ├── features/       # Feature modules (lazy-loaded)
│   │   ├── shared/         # Reusable components, pipes, directives
│   │   └── app.*           # Root application files
│   ├── assets/             # Static assets
│   ├── environments/       # Environment configurations
│   └── styles.css          # Global styles
├── angular.json            # Angular CLI configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # TailwindCSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Detailed Folder Structure

### 📁 Core Module (`src/app/core/`)
Contains singleton services and application-wide functionality:

```
core/
├── guards/
│   └── auth.guard.ts           # Route protection
├── interceptors/
│   └── auth.interceptor.ts     # HTTP request/response handling
├── models/
│   ├── auth.model.ts           # Authentication data models
│   ├── call.model.ts           # Call-related data models
│   └── chat.model.ts           # Chat/message data models
├── services/
│   ├── api.service.ts          # HTTP API communication
│   ├── auth.service.ts         # Authentication logic
│   ├── call.service.ts         # Voice/video call handling
│   ├── chat.service.ts         # Chat functionality
│   ├── presence.service.ts     # User online/offline status
│   ├── socket.service.ts       # WebSocket connections
│   └── upload.service.ts       # File upload handling
└── core.module.ts              # Core module configuration
```

### 📁 Features Module (`src/app/features/`)
Feature-based modules with lazy loading:

#### 🔐 Authentication (`features/auth/`)
```
auth/
├── login/
│   ├── login.component.html    # Login form with mobile/email options
│   ├── login.component.ts      # Login logic and validation
│   └── login.component.css     # Login-specific styles
├── otp-verification/
│   ├── otp-verification.component.html
│   ├── otp-verification.component.ts
│   └── otp-verification.component.css
├── register/
│   ├── register.component.html
│   ├── register.component.ts
│   ├── register.component.css
│   └── register.component.spec.ts
├── auth-routing.module.ts      # Auth routes configuration
└── auth.module.ts              # Auth module setup
```

#### 💬 Chat (`features/chat/`)
```
chat/
├── chat-layout/
│   ├── chat-layout.component.html    # Main chat interface layout
│   └── chat-layout.component.ts
├── chat-list/
│   ├── chat-list.component.html      # List of conversations
│   ├── chat-list.component.ts
│   └── chat-list.component.css
├── chat-search/
│   ├── chat-search.component.html    # Search functionality
│   ├── chat-search.component.ts
│   └── chat-search.component.css
├── chat-window/
│   ├── chat-window.component.html    # Individual chat messages
│   ├── chat-window.component.ts
│   └── chat-window.component.css
├── new-chat/
│   ├── new-chat.component.html       # Start new conversation
│   ├── new-chat.component.ts
│   ├── new-chat.component.css
│   └── new-chat.component.spec.ts
├── services/
│   └── chat.service.ts               # Chat-specific services
├── chat-routing.module.ts
└── chat.module.ts
```

#### 📞 Call (`features/call/`)
```
call/
├── call-layout/
│   ├── call-layout.component.html    # Call interface layout
│   └── call-layout.component.ts
├── call-list/
│   ├── call-list.component.html      # Call history
│   ├── call-list.component.ts
│   ├── call-list.component.css
│   └── call-list.component.spec.ts
├── call-panel/
│   ├── call-panel.component.html     # Active call controls
│   ├── call-panel.component.ts
│   ├── call-panel.component.css
│   └── call-panel.component.spec.ts
├── services/
│   └── call.service.ts               # Call management
├── call-routing.module.ts
└── call.module.ts
```

#### 📱 Status (`features/status/`)
```
status/
├── status-layout/
│   ├── status-layout.component.html  # Status updates layout
│   └── status-layout.component.ts
├── status-list/
│   └── status-list.component.ts      # List of status updates
├── status-viewer/
│   └── status-viewer.component.ts    # View individual status
├── services/
│   └── status.service.ts             # Status management
├── status-routing.module.ts
└── status.module.ts
```

#### 🏠 Home (`features/home/`)
```
home/
├── home-layout/
│   ├── home-layout.component.html    # Main app layout
│   ├── home-layout.component.ts
│   └── home-layout.component.css
├── sidebar/
│   ├── sidebar.component.html        # Navigation sidebar
│   ├── sidebar.component.ts
│   └── sidebar.component.css
├── home-routing.module.ts
├── home.component.ts
└── home.module.ts
```

#### ⚙️ Settings (`features/settings/`)
```
settings/
├── settings-routing.module.ts
├── settings.component.ts
└── settings.module.ts
```

### 📁 Shared Module (`src/app/shared/`)
Reusable components and utilities:

```
shared/
├── components/
│   ├── loader/
│   │   ├── loader.component.html     # Loading spinner
│   │   ├── loader.component.ts
│   │   ├── loader.component.css
│   │   └── loader.component.spec.ts
│   ├── problem-page/
│   │   ├── problem-page.component.html   # Error page
│   │   ├── problem-page.component.ts
│   │   ├── problem-page.component.css
│   │   └── problem-page.component.spec.ts
│   ├── skeleton-loader/
│   │   ├── skeleton-loader.component.html # Loading placeholders
│   │   ├── skeleton-loader.component.ts
│   │   └── skeleton-loader.component.css
│   └── theme-toggle/
│       └── theme-toggle.component.ts     # Dark/light mode toggle
├── directives/                           # Custom directives
├── pipes/                               # Custom pipes
├── services/
│   ├── loader.service.ts                # Loading state management
│   ├── theme.service.ts                 # Theme switching
│   └── viewport.service.ts              # Responsive utilities
└── shared.module.ts                     # Shared module configuration
```

## Key Features

### 🔐 Authentication System
- **Multi-option login**: Email/username or mobile number
- **OTP verification** for mobile numbers
- **Google OAuth integration**
- **Responsive design** with mobile-first approach
- **Form validation** with Angular Reactive Forms

### 💬 Real-time Chat
- **WebSocket integration** for real-time messaging
- **Chat list** with conversation previews
- **Search functionality** across chats
- **New chat creation**
- **Message history** and pagination

### 📞 Voice & Video Calls
- **Call history** tracking
- **Active call interface** with controls
- **Call management** (answer, decline, end)

### 📱 Status Updates
- **Story-like status** sharing
- **Status viewer** with navigation
- **Status list** management

### 🎨 UI/UX Features
- **TailwindCSS** for modern styling
- **Dark mode support** with theme toggle
- **Responsive design** for all screen sizes
- **Loading states** with skeleton loaders
- **Error handling** with problem pages

## Development Setup

### Prerequisites
- Node.js (v16+)
- Angular CLI (v15.2.11)

### Installation
```bash
npm install
```

### Development Server
```bash
ng serve
# Navigate to http://localhost:4200/
```

### Build
```bash
ng build
# Build artifacts stored in dist/
```

### Testing
```bash
ng test
```

## Configuration Files

- **`angular.json`**: Angular CLI workspace configuration
- **`package.json`**: Dependencies and npm scripts
- **`tailwind.config.js`**: TailwindCSS configuration with dark mode
- **`tsconfig.json`**: TypeScript compiler options
- **`.postcssrc.json`**: PostCSS configuration for TailwindCSS

## Architecture Benefits

1. **Modular Design**: Feature-based modules enable lazy loading and maintainability
2. **Separation of Concerns**: Core, features, and shared modules have distinct responsibilities
3. **Scalability**: Easy to add new features without affecting existing code
4. **Reusability**: Shared components and services reduce code duplication
5. **Type Safety**: TypeScript models ensure data consistency
6. **Performance**: Lazy loading and OnPush change detection optimize performance

## Future Enhancements

- **PWA support** for offline functionality
- **Push notifications** for real-time alerts
- **File sharing** capabilities
- **Group chat** functionality
- **Message encryption** for security
- **Voice messages** support
- **Internationalization** (i18n) support