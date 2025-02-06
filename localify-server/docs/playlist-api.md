# Playlist API Documentation

## Endpoints

### 1. Get User's Playlists
- **URL**: `/playlists`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**:
```typescript
{
  id: number;
  name: string;
  description: string | null;
  userId: number;
  trackCount: number;
  createdAt: string;
}[]
```

### 2. Create Playlist
- **URL**: `/playlists`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
```typescript
{
  name: string;
  description?: string;
}
```
- **Response** (201 Created):
```typescript
{
  id: number;
}
```

### 3. Get Playlist by ID
- **URL**: `/playlists/:playlistId`
- **Method**: `GET`
- **Auth Required**: Optional (reactions only shown for authenticated users)
- **Response**:
```typescript
{
  id: number;
  name: string;
  description: string | null;
  userId: number;
  ownerName: string;
  createdAt: string;
  tracks: {
    id: number;
    title: string;
    artist: string;
    albumId: number;
    duration: number;
    position: number;
    reaction: "like" | "dislike" | null;
  }[];
}
```

### 4. Delete Playlist
- **URL**: `/playlists/:playlistId`
- **Method**: `DELETE`
- **Auth Required**: Yes (must be playlist owner)
- **Response**:
```typescript
{
  success: true;
}
```

### 5. Add Track to Playlist
- **URL**: `/playlists/:playlistId/tracks`
- **Method**: `POST`
- **Auth Required**: Yes (must be playlist owner)
- **Request Body**:
```typescript
{
  trackId: number;
}
```
- **Response**:
```typescript
{
  success: true;
}
```

### 6. Remove Track from Playlist
- **URL**: `/playlists/:playlistId/tracks/:trackId`
- **Method**: `DELETE`
- **Auth Required**: Yes (must be playlist owner)
- **Response**:
```typescript
{
  success: true;
}
```

### 7. Update Playlist Track Order
- **URL**: `/playlists/:playlistId/order`
- **Method**: `PUT`
- **Auth Required**: Yes (must be playlist owner)
- **Request Body**:
```typescript
{
  trackOrders: {
    trackId: number;
    position: number;
  }[];
}
```
- **Response**:
```typescript
{
  success: true;
}
```

## Search

### Advanced Search
- **URL**: `/search/advanced`
- **Method**: `GET`
- **Auth Required**: Optional (reactions only shown for authenticated users)
- **Query Parameters**:
  - `q`: Search query string (required)
  - `limit`: Maximum number of results per category (optional, default: 5, max: 20)
- **Response**:
```typescript
{
  artists: {
    name: string;
    trackCount: number;
  }[];
  albums: {
    id: number;
    title: string;
    artist: string | null;
    year: number | null;
    coverPath: string | null;
    trackCount: number;
    createdAt: string;
    updatedAt: string | null;
  }[];
  tracks: {
    id: number;
    title: string;
    artist: string;
    albumId: number;
    duration: number;
    reaction: "like" | "dislike" | null;
  }[];
}
```

## Error Responses
All endpoints may return the following error responses:

### 400 Bad Request
```typescript
{
  error: string; // Description of what went wrong
}
```

### 401 Unauthorized
```typescript
{
  error: "Unauthorized";
}
```

### 403 Forbidden
```typescript
{
  error: "Not authorized to modify this playlist";
}
```

### 404 Not Found
```typescript
{
  error: "Playlist not found" | "Track not found in playlist";
}
```

### 500 Internal Server Error
```typescript
{
  error: string; // Description of what went wrong
}
``` 