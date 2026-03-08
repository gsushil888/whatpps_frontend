# Quick Fix Guide - Image Display Issue

## Problem
User B sees empty image until refresh when User A sends an image.

## Root Cause
Backend WebSocket messages contain relative URLs (`/uploads/image.jpg`) instead of absolute URLs (`http://localhost:8080/uploads/image.jpg`).

## Backend Fix Required

### 1. WebSocket Message Handler
**Location:** `MessageController.java` or `WebSocketController.java`

```java
@MessageMapping("/chat.message")
public void handleMessage(@Header("conversationId") Long conversationId, ChatMessage message) {
    Message savedMessage = messageService.saveMessage(conversationId, message);
    MessageDTO messageDTO = convertToDTO(savedMessage);
    
    // FIX: Convert relative URLs to absolute URLs
    if (messageDTO.getMediaUrl() != null && !messageDTO.getMediaUrl().startsWith("http")) {
        messageDTO.setMediaUrl(serverBaseUrl + messageDTO.getMediaUrl());
    }
    if (messageDTO.getMediaMetadata() != null) {
        String thumbnail = messageDTO.getMediaMetadata().getThumbnail();
        if (thumbnail != null && !thumbnail.startsWith("http")) {
            messageDTO.getMediaMetadata().setThumbnail(serverBaseUrl + thumbnail);
        }
    }
    
    messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, messageDTO);
}
```

### 2. Media Upload Endpoint
**Location:** `MediaController.java`

```java
@PostMapping("/media/upload")
public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file) {
    String relativePath = fileStorageService.save(file);
    
    // FIX: Return absolute URL
    String fullUrl = serverBaseUrl + relativePath;
    
    return ResponseEntity.ok(ApiResponse.success(
        MediaUploadResponse.builder()
            .fileUrl(fullUrl)
            .thumbnailUrl(fullUrl)
            .fileName(file.getOriginalFilename())
            .build()
    ));
}
```

### 3. Configuration
**Location:** `application.properties`

```properties
app.server.base-url=http://localhost:8080
```

**Inject in controllers:**
```java
@Value("${app.server.base-url}")
private String serverBaseUrl;
```

## Expected WebSocket Message Format

**Before (broken):**
```json
{
  "messageType": "IMAGE",
  "mediaUrl": "/uploads/abc123.jpg",
  "mediaMetadata": {
    "thumbnail": "/uploads/abc123.jpg"
  }
}
```

**After (fixed):**
```json
{
  "messageType": "IMAGE",
  "mediaUrl": "http://localhost:8080/uploads/abc123.jpg",
  "mediaMetadata": {
    "thumbnail": "http://localhost:8080/uploads/abc123.jpg"
  }
}
```

## Files to Check
1. `MessageController.java` or `WebSocketController.java`
2. `MediaController.java`
3. `MessageService.java`
4. `application.properties`

## Testing
1. User A sends image
2. Check browser console on User B's side
3. Verify WebSocket message contains full URLs
4. Confirm image displays without refresh
