import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RoomConfig, ConnectionStatus } from '../types';
import Countdown from './Countdown';
import Fireworks from './Fireworks';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Share2, MessageSquare, Sparkles, Lock, Volume2, VolumeX, Music, Play, X } from 'lucide-react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { AudioPlayer } from './AudioPlayer';
import { generateBannerMessage } from '../services/genAi';

interface RoomProps {
  config: RoomConfig;
  onLeave: () => void;
}

const Room: React.FC<RoomProps> = ({ config, onLeave }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isAiMuted, setIsAiMuted] = useState(false);
  const [isCelebration, setIsCelebration] = useState(false);
  const [bannerText, setBannerText] = useState("Welcome to the NeonYear Party!");
  const [targetDate, setTargetDate] = useState<Date>(() => {
    // Default to upcoming New Year
    const now = new Date();
    const nextYear = now.getFullYear() + 1;
    return new Date(`January 1, ${nextYear} 00:00:00`);
  });

  // YouTube State
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const { connect, disconnect, status, isSpeaking, sendMessage, setAiMuted } = useGeminiLive({
    onAudioData: (buffer) => {}, // Unused
    videoRef: localVideoRef
  });

  // Handle Local Stream setup
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Media Error:", err));

    return () => {
      // Cleanup tracks
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Handle Local Mute (User)
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Handle AI Mute (Host)
  useEffect(() => {
    setAiMuted(isAiMuted);
  }, [isAiMuted, setAiMuted]);


  // Banner Rotation
  useEffect(() => {
    const fetchBanner = async () => {
      const msg = await generateBannerMessage(isCelebration ? "It is New Years! Party time!" : "Waiting for countdown");
      setBannerText(msg);
    };
    const interval = setInterval(fetchBanner, 10000); // Every 10s
    fetchBanner();
    return () => clearInterval(interval);
  }, [isCelebration]);

  const handleCountdownComplete = () => {
    setIsCelebration(true);
    // Notify Gemini
    if (status === ConnectionStatus.CONNECTED) {
       sendMessage("It is midnight! Happy New Year! Congratulate us!");
    } else {
       // If not connected, connect in celebration mode
       connect(true);
    }
  };

  const handleSimulateMidnight = () => {
    // Set target date to 5 seconds from now
    const now = new Date();
    now.setSeconds(now.getSeconds() + 5);
    setTargetDate(now);
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Extract ID from URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;

    if (id) {
        setYoutubeId(id);
        setShowYoutubeInput(false);
        setYoutubeUrl('');
    } else {
        alert("Invalid YouTube URL");
    }
  };

  const closeYoutube = () => {
      setYoutubeId(null);
  };

  // Component for marquee content block to ensure consistency
  const MarqueeContent = () => (
    <div className="flex items-center shrink-0 gap-8 px-4">
      <span className="text-cyan-300 font-display text-lg tracking-wide">✨ {bannerText} ✨</span>
      <span className="text-purple-300 font-mono text-lg font-bold">{config.isHost ? `#${config.code}` : '#NYE2025'}</span>
      <span className="text-cyan-300 font-display text-lg tracking-wide">✨ {bannerText} ✨</span>
      <span className="text-pink-400 font-mono text-lg font-bold uppercase">PARTY TIME</span>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden relative">
      <Fireworks active={isCelebration} />

      {/* Marquee Banner - Seamless Loop */}
      <div className="h-12 bg-gradient-to-r from-blue-900 to-purple-900 flex items-center overflow-hidden border-b border-white/10 relative z-20">
        <div className="flex animate-[marquee_20s_linear_infinite] w-fit">
           {/* Duplicate content enough times to fill screen + scroll */}
           <MarqueeContent />
           <MarqueeContent />
           <MarqueeContent />
           <MarqueeContent />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 relative z-10 overflow-hidden">
        
        {/* Main Stage */}
        <div className="flex-1 flex flex-col gap-4 relative h-full">
          
          {/* YouTube Player Stage */}
          {youtubeId && (
              <div className="flex-[3] bg-black rounded-2xl overflow-hidden border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)] relative animate-in fade-in zoom-in duration-300">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  ></iframe>
                  {config.isHost && (
                      <button 
                        onClick={closeYoutube}
                        className="absolute top-4 right-4 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-md z-10 border border-white/10"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  )}
              </div>
          )}

          {/* Video Grid */}
          <div className={`grid gap-4 transition-all duration-500 ease-in-out ${youtubeId ? 'flex-1 grid-cols-2 h-48 min-h-[12rem]' : 'flex-1 grid-cols-1 md:grid-cols-2'}`}>
            
            {/* Local User */}
            <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-lg group w-full h-full">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
              />
              <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-white text-sm font-semibold backdrop-blur-md z-10">
                {config.username} {config.isHost ? '(Host)' : '(Guest)'}
              </div>
              <div className="absolute top-4 right-4 z-10">
                 {isMuted && <div className="bg-red-500/80 p-2 rounded-full"><MicOff className="w-4 h-4 text-white" /></div>}
              </div>
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{config.username[0]}</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Host / Remote */}
            <div 
              className={`relative bg-black rounded-2xl overflow-hidden border shadow-lg flex items-center justify-center transition-all duration-300 w-full h-full
                ${isSpeaking ? 'speaking-active border-purple-500' : 'border-purple-500/30'}
                bg-[url('https://images.unsplash.com/photo-1514525253440-b39345208668?q=80&w=2070&auto=format&fit=crop')] bg-cover`}
            >
               <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isSpeaking ? 'bg-black/40' : 'bg-black/60'}`}></div>
               
               {/* Ambient background effects when speaking */}
               {isSpeaking && (
                 <>
                   <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent animate-pulse"></div>
                   <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent opacity-50 animate-pulse"></div>
                 </>
               )}

               {status === ConnectionStatus.CONNECTED ? (
                 <div className="z-10 text-center p-4 relative w-full flex flex-col items-center justify-center h-full">
                    {/* Host Mute Toggle Overlay */}
                    <div className="absolute top-0 right-0 p-4">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setIsAiMuted(!isAiMuted); }}
                         className={`p-2 rounded-full transition-colors ${isAiMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}
                         title={isAiMuted ? "Unmute Host" : "Mute Host"}
                       >
                         {isAiMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-white" />}
                       </button>
                    </div>

                    <div className={`rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-1 transition-transform duration-200 ${youtubeId ? 'w-20 h-20 mb-2' : 'w-32 h-32 mb-4'} ${isSpeaking ? 'scale-110 shadow-[0_0_30px_rgba(236,72,153,0.6)]' : 'shadow-lg'}`}>
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=GeminiHost" alt="AI Host" className="w-full h-full" />
                      </div>
                    </div>
                    <h3 className={`font-bold transition-colors duration-300 ${youtubeId ? 'text-lg mb-1' : 'text-xl mb-2'} ${isSpeaking ? 'text-cyan-300 neon-text' : 'text-white'}`}>Gemini Host</h3>
                    <div className="flex gap-1 justify-center h-6 items-end">
                       {/* Enhanced Audio visualizer */}
                       {[1,2,3,4,5].map(i => (
                         <div 
                           key={i} 
                           className={`w-1 bg-gradient-to-t from-cyan-400 to-purple-500 rounded-t-sm transition-all duration-100 
                           ${isSpeaking && !isAiMuted ? `h-${Math.floor(Math.random()*5)+3} opacity-100` : 'h-1 opacity-50'}`}
                           style={{ transitionDelay: `${i * 0.05}s` }}
                         ></div>
                       ))}
                    </div>
                 </div>
               ) : (
                 <div className="z-10 text-center p-4">
                   <button 
                    onClick={() => connect(isCelebration)}
                    className={`bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 ${youtubeId ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
                   >
                     <Sparkles className={`${youtubeId ? 'w-4 h-4' : 'w-5 h-5'} text-purple-600`} />
                     Connect AI
                   </button>
                   {!youtubeId && <p className="text-gray-400 mt-2 text-sm">Tap to start the party</p>}
                 </div>
               )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="h-20 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between px-4 md:px-8 shrink-0">
            <div className="flex gap-2 md:gap-4">
              <button onClick={() => setIsMuted(!isMuted)} className={`p-3 md:p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 hover:bg-gray-700 text-white'}`} title="Mute Mic">
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-3 md:p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 hover:bg-gray-700 text-white'}`} title="Stop Video">
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              
              {/* YouTube Control (Host Only) */}
              {config.isHost && (
                  <button 
                    onClick={() => setShowYoutubeInput(true)} 
                    className={`p-3 md:p-4 rounded-full transition-colors ${youtubeId ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-gray-800 hover:bg-gray-700 text-white'}`} 
                    title="Play Music/Video"
                  >
                    <Music size={20} />
                  </button>
              )}
            </div>

            <div className="flex gap-2 md:gap-4">
               <button 
                onClick={handleSimulateMidnight}
                className="hidden md:flex bg-gray-800/50 hover:bg-gray-700 text-xs px-4 py-2 rounded-lg items-center border border-white/5 text-gray-400"
               >
                 Simulate Midnight
               </button>
               <button className="bg-red-600 hover:bg-red-700 text-white px-6 md:px-8 py-3 rounded-full font-bold transition-all" onClick={onLeave} title="Leave">
                 <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
               </button>
            </div>
          </div>
        </div>

        {/* Sidebar / Countdown */}
        <div className="w-full md:w-80 flex flex-col gap-4">
           <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center min-h-[200px]">
             <h3 className="text-purple-300 text-sm font-bold tracking-widest mb-4">COUNTDOWN TO 2026</h3>
             <Countdown targetDate={targetDate} onComplete={handleCountdownComplete} />
           </div>

           <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col">
              <h3 className="text-gray-400 text-xs font-bold uppercase mb-4 px-2">
                {config.isHost ? "Invite Friends" : "Party Info"}
              </h3>
              
              <div className="bg-white/5 p-4 rounded-lg flex items-center justify-between mb-4 relative overflow-hidden">
                 {config.isHost ? (
                    <>
                      <span className="font-mono text-xl text-cyan-400 tracking-wider font-bold">{config.code}</span>
                      <button className="text-gray-400 hover:text-white transition-colors" onClick={() => navigator.clipboard.writeText(config.code)}>
                        <Share2 className="w-5 h-5" />
                      </button>
                    </>
                 ) : (
                    <div className="flex items-center gap-2 text-gray-400 w-full justify-center">
                       <Lock className="w-4 h-4" />
                       <span className="text-sm font-mono tracking-wide">INVITE ONLY</span>
                    </div>
                 )}
                 <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl -mr-8 -mt-8"></div>
              </div>
              
              <div className="flex-1 bg-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center text-gray-500 text-sm">
                 <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                 <p>{config.isHost ? "Share the code above to invite guests!" : "You are in the guest lounge."}</p>
                 <p className="mt-2 text-xs opacity-50">Chat is disabled.</p>
              </div>
           </div>
        </div>

      </div>
      
      {/* YouTube URL Input Modal */}
      {showYoutubeInput && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-gray-900 border border-purple-500/30 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
              <button onClick={() => setShowYoutubeInput(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                 <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 bg-red-600 rounded-full text-white">
                    <Play className="w-6 h-6 fill-current" />
                 </div>
                 <h2 className="text-xl font-bold text-white">Play YouTube Video</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">Paste a YouTube link to watch music or videos with the party.</p>
              
              <form onSubmit={handleYoutubeSubmit}>
                  <input 
                    type="text" 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-purple-500 transition-colors"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowYoutubeInput(false)}
                        className="flex-1 py-3 rounded-lg font-semibold text-gray-400 hover:bg-white/5 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 rounded-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg transition-transform active:scale-95"
                      >
                          Play Now
                      </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {/* Styles for marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); } 
        }
      `}</style>
    </div>
  );
};

export default Room;