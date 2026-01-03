/**
 * Componente: Video Call Window
 * 
 * Ventana de videollamada WebRTC.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useVideoCall } from '@/lib/webrtc-client';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface VideoCallWindowProps {
  roomId: string;
  onEnd?: () => void;
}

export function VideoCallWindow({ roomId, onEnd }: VideoCallWindowProps) {
  const {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    leaveRoom,
  } = useVideoCall({ roomId, autoJoin: true });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Configurar local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Configurar remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    leaveRoom();
    onEnd?.();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote Video (main) */}
      <div className="flex-1 relative">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Video className="w-12 h-12" />
              </div>
              <p className="text-lg">
                {isConnected ? 'Conectado' : 'Esperando conexión...'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-white text-sm">
              {isConnected ? 'Conectado' : 'Conectando...'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-6">
        <div className="max-w-md mx-auto flex items-center justify-center space-x-4">
          {/* Mute */}
          <Button
            size="lg"
            variant={isMuted ? 'destructive' : 'secondary'}
            className="rounded-full w-14 h-14"
            onClick={toggleMute}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {/* Video Toggle */}
          <Button
            size="lg"
            variant={isVideoOff ? 'destructive' : 'secondary'}
            className="rounded-full w-14 h-14"
            onClick={toggleVideo}
          >
            {isVideoOff ? (
              <VideoOff className="w-6 h-6" />
            ) : (
              <Video className="w-6 h-6" />
            )}
          </Button>

          {/* End Call */}
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
