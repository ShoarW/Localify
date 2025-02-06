# Localify API Documentation

## Authentication

### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
```typescript
{
  username: string;
  password: string;
}
```
- **Response**:
```typescript
{
  token: string;
}
```

### Signup
- **URL**: `/auth/signup`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
```typescript
{
  username: string;
  email: string;
  password: string;
}
```
- **Response**:
```typescript
{
  token: string;
}
```

## Tracks

### Get All Tracks
- **URL**: `/tracks`
- **Method**: `GET`
- **Auth Required**: Optional (reactions only shown for authenticated users)
- **Response**:
```typescript
{
  id: number;
  title: string | null;
  genre: string | null;
  duration: number | null;
  albumId: number | null;
  artistName: string | null;
  reaction: "like" | "dislike" | null;
}[]
```

### Get Track by ID
- **URL**: `/tracks/:id`
- **Method**: `GET`
- **Auth Required**: Optional (reactions only shown for authenticated users)
- **Response**:
```typescript
{
  id: number;
  title: string | null;
  genre: string | null;
  duration: number | null;
  albumId: number | null;
  artistName: string | null;
  reaction: "like" | "dislike" | null;
}
```

### Stream Track
- **URL**: `/tracks/:id/stream`
- **Method**: `GET`
- **Auth Required**: No
- **Headers**:
  - `Range`: Bytes range for partial content (optional)
- **Response**: Audio stream with appropriate content type

### Delete Track
- **URL**: `/tracks/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (admin only)
- **Response**:
```typescript
{
  message: "Track deleted successfully";
}
```

## Albums

### Get All Albums
- **URL**: `/albums`
- **Method**: `GET`
- **Auth Required**: Optional (reactions only shown for authenticated users)
- **Response**:
```typescript
{
  id: number;
  title: string;
  artist: string | null;
  type: "single" | "ep" | "album";
  hasImage: boolean;
  tracks: {
    id: number;
    title: string;
    artistName: string | null;
    duration: number | null;
    genre: string | null;
    reaction: "like" | "dislike" | null;
  }[];
}[]
```

### Get Album with Tracks
- **URL**: `/albums/:id`
- **Method**: `GET`
- **Auth Required**: Optional (reactions only shown for authenticated users)
- **Response**:
```typescript
{
  album: {
    id: number;
    title: string;
    artist: string | null;
    type: "single" | "ep" | "album";
    hasImage: boolean;
  };
  tracks: {
    id: number;
    title: string;
    artistName: string | null;
    duration: number | null;
    genre: string | null;
    reaction: "like" | "dislike" | null;
  }[];
}
```

### Stream Album Cover
- **URL**: `/albums/:id/cover`
- **Method**: `GET`
- **Auth Required**: No
- **Response**: Image stream with appropriate content type

## Search

### Basic Search
- **URL**: `/search`
- **Method**: `GET`
- **Auth Required**: Optional (reactions only shown for authenticated users)
- **Query Parameters**:
  - `q`: Search query string (required)
- **Response**:
```typescript
{
  id: number;
  title: string;
  artist: string;
  reaction: "like" | "dislike" | null;
}[]
```

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
    id: number;
    name: string;
    trackCount: number;
    hasImage: boolean;
  }[];
  albums: {
    id: number;
    title: string;
    artistId: number;
    artist: string | null;
    trackCount: number;
    hasImage: boolean;
  }[];
  tracks: {
    id: number;
    title: string;
    genre: string | null;
    duration: number | null;
    albumId: number | null;
    reaction: "like" | "dislike" | null;
    artistName: string | null;
  }[];
}
```

## Reactions

### Set Reaction
- **URL**: `/tracks/:id/reaction`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
```typescript
{
  type: "like" | "dislike" | null;
}
```
- **Response**:
```typescript
{
  reaction: "like" | "dislike" | null;
}
```

### Get Reaction
- **URL**: `/tracks/:id/reaction`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**:
```typescript
{
  reaction: "like" | "dislike" | null;
}
```

### Get Reacted Tracks
- **URL**: `/reactions`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `type`: "like" | "dislike" (required)
  - `page`: Page number (optional, default: 1)
  - `pageSize`: Results per page (optional, default: 100, max: 100)
- **Response**:
```typescript
{
  tracks: {
    id: number;
    title: string;
    artist: string;
    reaction: "like" | "dislike" | null;
    reactionDate: number;
  }[];
  total: number;
  currentPage: number;
  totalPages: number;
}
```

## Playlists

### Get User's Playlists
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

### Create Playlist
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

### Get Playlist by ID
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

### Delete Playlist
- **URL**: `/playlists/:playlistId`
- **Method**: `DELETE`
- **Auth Required**: Yes (must be playlist owner)
- **Response**:
```typescript
{
  success: true;
}
```

### Add Track to Playlist
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

### Remove Track from Playlist
- **URL**: `/playlists/:playlistId/tracks/:trackId`
- **Method**: `DELETE`
- **Auth Required**: Yes (must be playlist owner)
- **Response**:
```typescript
{
  success: true;
}
```

### Update Playlist Track Order
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