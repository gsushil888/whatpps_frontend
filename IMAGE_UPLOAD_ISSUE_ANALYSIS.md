# Image Upload Issue Analysis & Backend Context

## Problem Description
When User A sends an image in chat:
- ✅ User A sees the message sending and image uploaded correctly
- ✅ Image displays properly for User A
- ❌ User B sees an empty/broken image initially
- ✅ After refresh, User B can see the image

## Current Frontend Implementation Flow

### 1. Image Upload Process (chat-window.component.ts)

```typescript
// Step 1: User selects image
onFileSelected(event) → processImageUpload(file)

// Step 2: Show uploading preview to sender
processImageUpload(file) {
  - Creates FileReader to generate preview
  - Adds temporary "uploading" message to UI with isUploading: true
  - Calls startUpload(file) after 2 seconds
}

// Step 3: Upload to backend
startUpload(file) {
  - Calls conversationService.uploadMedia(chatId, file)
  - Receives response with fileUrl, fileName, thumbnailUrl, etc.
  - Removes uploading message from UI
  - Adds final message to UI with actual mediaUrl
  - Sends message via WebSocket: webSocketService.sendMessage(conversationId, message)
}
```

### 2. WebSocket Message Flow

**Sender Side (User A):**
```typescript
// After upload completes
const message = {
  messageType: 'IMAGE',
  content: '',
  mediaUrl: response.data.fileUrl,  // e.g., "/uploads/abc123.jpg"
  mediaMetadata: {
    fileName: response.data.fileName,
    size: response.data.fileSize,
    mimeType: response.data.mimeType,
    thumbnail: response.data.thumbnailUrl || response.data.fileUrl
  }
};

// Send via WebSocket
webSocketService.sendMessage(conversationId, message);
```

**Receiver Side (User B):**
```typescript
// WebSocket subscription receives message
webSocketService.message$.subscribe(message => {
  this.addMessageToList(message);
});
```

### 3. Image Display in HTML

```html
<!-- Current implementation -->
<img [src]="msg.mediaMetadata.thumbnail || 'http://localhost:8080' + msg.mediaMetadata.thumbnail" />
```

**Issue:** The image src binding logic is flawed:
- If `msg.mediaMetadata.thumbnail` exists, it uses it directly
- Otherwise, it prepends `http://localhost:8080`
- But the backend likely returns relative paths like `/uploads/image.jpg`

## Root Cause Analysis

### Issue 1: Image URL Handling
The WebSocket message received by User B contains:
```json
{
  "messageType": "IMAGE",
  "mediaUrl": "/uploads/abc123.jpg",
  "mediaMetadata": {
    "thumbnail": "/uploads/abc123.jpg"
  }
}
```

The HTML template tries to display:
```html
<img [src]="msg.mediaMetadata.thumbnail" />
<!-- Results in: <img src="/uploads/abc123.jpg" /> -->
```

This works for User A because the image is already cached in browser after upload, but User B's browser doesn't have the image cached and the relative URL might not resolve correctly.

### Issue 2: WebSocket Message Structure
The backend WebSocket message might not include the full URL or the frontend isn't properly constructing the full URL for received messages.

## Backend Requirements for Fix

### 1. WebSocket Message Handler
**File:** Likely `MessageController.java` or `WebSocketController.java`

**Current behavior (suspected):**
```java
@MessageMapping("/chat.message")
public void handleMessage(@Header("conversationId") Long conversationId, ChatMessage message) {
    // Save message to database
    Message savedMessage = messageService.saveMessage(conversationId, message);
    
    // Broadcast to conversation participants
    messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, savedMessage);
}
```

**Required changes:**
```java
@MessageMapping("/chat.message")
public void handleMessage(@Header("conversationId") Long conversationId, ChatMessage message) {
    // Save message to database
    Message savedMessage = messageService.saveMessage(conversationId, message);
    
    // Convert to DTO with full URLs
    MessageDTO messageDTO = convertToDTO(savedMessage);
    
    // Ensure mediaUrl and thumbnail are absolute URLs
    if (messageDTO.getMediaUrl() != null && !messageDTO.getMediaUrl().startsWith("http")) {
        messageDTO.setMediaUrl(buildFullUrl(messageDTO.getMediaUrl()));
    }
    if (messageDTO.getMediaMetadata() != null && messageDTO.getMediaMetadata().getThumbnail() != null) {
        String thumbnail = messageDTO.getMediaMetadata().getThumbnail();
        if (!thumbnail.startsWith("http")) {
            messageDTO.getMediaMetadata().setThumbnail(buildFullUrl(thumbnail));
        }
    }
    
    // Broadcast to conversation participants
    messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, messageDTO);
}

private String buildFullUrl(String relativePath) {
    // Option 1: Use configured base URL
    return serverBaseUrl + relativePath;
    
    // Option 2: Use request context (if available)
    // return ServletUriComponentsBuilder.fromCurrentContextPath()
    //     .path(relativePath)
    //     .toUriString();
}
```

### 2. Media Upload Response
**File:** Likely `MediaController.java`

**Ensure upload response includes full URLs:**
```java
@PostMapping("/media/upload")
public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file,
                                     @RequestParam("conversationId") Long conversationId) {
    // Save file
    String relativePath = fileStorageService.save(file);
    
    // Build full URL
    String fullUrl = buildFullUrl(relativePath);
    
    MediaUploadResponse response = MediaUploadResponse.builder()
        .fileUrl(fullUrl)  // Full URL instead of relative path
        .thumbnailUrl(fullUrl)  // Full URL
        .fileName(file.getOriginalFilename())
        .fileSize(file.getSize())
        .mimeType(file.getContentType())
        .build();
    
    return ResponseEntity.ok(ApiResponse.success(response));
}
```

### 3. Configuration
**File:** `application.properties` or `application.yml`

```properties
# Add server base URL configuration
app.server.base-url=http://localhost:8080
# Or for production
# app.server.base-url=https://yourdomain.com
```

### 4. Message Entity/DTO
**Ensure the Message entity and DTO properly store and return full URLs:**

```java
@Entity
public class Message {
    // ... other fields
    
    @Column(length = 500)
    private String mediaUrl;  // Store relative path in DB
    
    @Transient
    private String fullMediaUrl;  // Computed full URL for API responses
    
    // Getter that returns full URL
    public String getFullMediaUrl() {
        if (mediaUrl != null && !mediaUrl.startsWith("http")) {
            return serverBaseUrl + mediaUrl;
        }
        return mediaUrl;
    }
}
```

## Alternative Frontend Fix (Quick Fix)

If backend changes are not immediately possible, update the frontend:

**File:** `chat-window.component.ts`

```typescript
private addMessageToList(message: any, skipIfDuplicate: boolean = true) {
  // ... existing code ...
  
  // Ensure full URLs for media
  let mediaUrl = message.mediaUrl;
  let thumbnail = message.mediaMetadata?.thumbnail;
  
  if (mediaUrl && !mediaUrl.startsWith('http')) {
    mediaUrl = environment.apiBaseUrl.replace('/api/', '') + mediaUrl;
  }
  if (thumbnail && !thumbnail.startsWith('http')) {
    thumbnail = environment.apiBaseUrl.replace('/api/', '') + thumbnail;
  }
  
  const newMessage: ConversationMessage = {
    // ... existing fields ...
    mediaUrl: mediaUrl,
    mediaMetadata: message.mediaMetadata ? {
      ...message.mediaMetadata,
      thumbnail: thumbnail
    } : undefined,
  };
  
  this.messages.push(newMessage);
}
```

**Update HTML template:**
```html
<!-- Simplified image src -->
<img [src]="msg.mediaMetadata.thumbnail" 
     class="max-w-xs rounded mb-2 cursor-pointer" 
     alt="Image" />
```

## Recommended Solution

**Best approach:** Fix on backend to return absolute URLs
- More reliable
- Consistent across all clients
- Easier to maintain
- Works with CDN/external storage in future

**Backend files to check/modify:**
1. `MessageController.java` or `WebSocketController.java` - WebSocket message handler
2. `MediaController.java` - Upload endpoint
3. `MessageService.java` - Message processing logic
4. `application.properties` - Server configuration
5. `MessageDTO.java` - Data transfer object

## Testing Checklist

After implementing the fix:
- [ ] User A sends image → User A sees image immediately
- [ ] User B receives WebSocket message → User B sees image immediately (no refresh)
- [ ] Check browser console for 404 errors on image URLs
- [ ] Verify image URLs in WebSocket messages are absolute
- [ ] Test with different file types (PNG, JPG, GIF)
- [ ] Test with large images
- [ ] Test in different network conditions
