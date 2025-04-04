// src/types/chat.ts
export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  detectedMood?: MoodType;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  image: string;
  url: string;
  tracks: number;
  owner: string;
}
export interface CurrentTrack {
  id: string;
  name: string;
  artist: string;
  image: string;
  isPlaying: boolean;
}

export type MoodType = 'happy' | 'sad' | 'energetic' | 'calm' | 'focus';