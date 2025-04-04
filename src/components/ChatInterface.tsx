import React, { useState , useEffect } from 'react';
import { Message, Playlist,MoodType , CurrentTrack} from '../types/chat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { MoodSelector } from './MoodSelector';
import { MusicRecommendations } from './MusicRecommendations';
import { processUserMessage, fetchPlaylists} from '../services/musicService';
import { Header } from './Header';
import axios from 'axios';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your music mood assistant. How are you feeling today?",
      isUser: false
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null);
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);

  const moods: MoodType[] = ['happy', 'sad', 'energetic', 'calm', 'focus'];

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('spotify_access_token');
      if (!accessToken) window.location.href = '/';
    };
    checkAuth();
    const pollCurrentTrack = async () => {
      try {
        const accessToken = localStorage.getItem('spotify_access_token');
        if (!accessToken) return;

        const response = await axios.get(
          'https://api.spotify.com/v1/me/player/currently-playing',
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );

        if (response.data?.item) {
          setCurrentTrack({
            id: response.data.item.id,
            name: response.data.item.name,
            artist: response.data.item.artists[0]?.name || 'Unknown Artist',
            image: response.data.item.album?.images?.[0]?.url || '/default-track.png',
            isPlaying: response.data.is_playing
          });
        }
      } catch (error) {
        console.error('Error fetching current track:', error);
      }
    };

    pollCurrentTrack();
    // interval for polling every 10 seconds
    const interval = setInterval(pollCurrentTrack, 10000);
    return () => clearInterval(interval);

  }, []);

// Update the handleSendMessage function
const handleSendMessage = async (inputValue: string) => {
  const userMessage: Message = {
    id: Date.now().toString(),
    text: inputValue,
    isUser: true
  };
  
  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);

  try {
    const { detectedMood, playlists, botResponse } = await processUserMessage(inputValue);
    setCurrentMood(detectedMood);
    setRecommendedPlaylists(playlists);

    const botReply: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse, // Use generated response
      isUser: false,
      detectedMood,
    };
    
    setMessages(prev => [...prev, botReply]);
  } catch (error) {
    console.error('Error:', error);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: "Let's try that again - how are you feeling right now?",
      isUser: false
    }]);
  } finally {
    setIsLoading(false);
  }
};

  const handleMoodSelection = async (mood: MoodType) => {
    setCurrentMood(mood);
    setIsLoading(true);

    const moodMessage: Message = {
      id: Date.now().toString(),
      text: `I'm feeling ${mood} today.`,
      isUser: true,
    };
    
    setMessages(prev => [...prev, moodMessage]);

    try {
      const playlists = await fetchPlaylists(mood);
      if (playlists.length === 0) {
        throw new Error('No playlists found');
      }
      setRecommendedPlaylists(playlists);

      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        text: `Great! Here are some ${mood} playlists I think you'll enjoy.`,
        isUser: false,
        detectedMood: mood,
      };
      
      setMessages(prev => [...prev, botReply]);
    } catch (error) {
      console.error('Error:', error);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: "Sorry, we couldn't find any playlists for this mood. Try another one!",
      isUser: false
    }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
   
  <div className="min-h-screen flex flex-col bg-gradient-to-r bg-black">
    <Header/>
    <div className='flex justify-center items-center '>
        <div className='flex justify-center items-center h-12 w-auto px-4 bg-gradient-to-r from-background/90 to-background/80 rounded-3xl gap-2'>
          {currentTrack ? (
            <>
              <img 
                className='w-8 h-8 rounded-md' 
                src={currentTrack.image} 
                alt="Now playing" 
              />
              <div className="flex flex-col ml-2">
                <span className="text-sm font-medium text-primary">
                  {currentTrack.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentTrack.artist}
                </span>
              </div>
              {currentTrack.isPlaying && (
                <div className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-muted" />
              <span className="text-sm text-muted-foreground">
                Not playing
              </span>
            </div>
          )}
        </div>
      </div>
    <div className="mt-2 app-container min-h-screen rounded-3xl bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="flex flex-col md:flex-row gap-6 lg:gap-10 h-[calc(100vh-160px)] relative">
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gradient">
              PersonalAi's
              <span className="ml-2 inline-flex items-center text-sm font-normal text-muted-foreground">
                Your AI Music Companion
              </span>
            </h2>
            <button 
              className="px-4 py-2 rounded-full text-sm font-medium text-primary/80 hover:text-primary 
                         hover:bg-primary/10 transition-all duration-300"
              onClick={() => setMessages([{
                id: '1',
                text: "Hello! I'm your music mood assistant. How are you feeling today?",
                isUser: false,
              }])}
            >
              Clear Chat
            </button>
          </div>
          
          <div className="flex-1 inset-card mb-6 overflow-hidden">
            <MessageList messages={messages} isLoading={isLoading} />
          </div>
          
          <div className="">
            <MoodSelector 
              moods={moods} 
              currentMood={currentMood} 
              onMoodSelect={handleMoodSelection} 
            />
          </div>
          
          <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
        
        <div className="md:w-[380px] lg:w-[420px] h-full overflow-y-auto pb-4  custom-scrollbar">
        <MusicRecommendations 
              playlists={recommendedPlaylists} 
              currentMood={currentMood} 
            />
        </div>
      </div>
    </div>
    
  </div>
  </>
  );
};
