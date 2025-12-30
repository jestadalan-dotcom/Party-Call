import React, { useState } from 'react';
import Lobby from './components/Lobby';
import Room from './components/Room';
import { RoomConfig } from './types';

function App() {
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      {!roomConfig ? (
        <Lobby onJoin={setRoomConfig} />
      ) : (
        <Room config={roomConfig} onLeave={() => setRoomConfig(null)} />
      )}
    </div>
  );
}

export default App;