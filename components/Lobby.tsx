import React, { useState } from 'react';
import { RoomConfig } from '../types';
import { ArrowRight, Sparkles, Plus, Users } from 'lucide-react';

interface LobbyProps {
  onJoin: (config: RoomConfig) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    if (mode === 'create') {
      const newCode = generateCode();
      onJoin({ code: newCode, username, isHost: true });
    } else {
      if (code) {
        onJoin({ code, username, isHost: false });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1467810563316-b5476525c0f9?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 glass-panel rounded-2xl border border-purple-500/30 shadow-2xl transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-purple-600 rounded-full mb-4 shadow-[0_0_15px_rgba(147,51,234,0.5)]">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2 text-center">NeonYear</h1>
          <p className="text-purple-200 text-center">Join the Global Countdown Party</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/40 p-1 rounded-lg mb-6 border border-white/10">
          <button 
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'create' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setMode('create')}
          >
            <Plus className="w-4 h-4" /> Create Party
          </button>
          <button 
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'join' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setMode('join')}
          >
            <Users className="w-4 h-4" /> Join Party
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Display Name</label>
            <input
              type="text"
              required
              className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="e.g. PartyAnimal99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          {mode === 'join' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Invitation Code</label>
              <input
                type="text"
                required={mode === 'join'}
                className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all uppercase tracking-widest"
                placeholder="ENTER CODE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            <span>{mode === 'create' ? 'START NEW PARTY' : 'JOIN PARTY'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          Powered by Gemini Live API • No Registration Required
        </div>
      </div>
    </div>
  );
};

export default Lobby;