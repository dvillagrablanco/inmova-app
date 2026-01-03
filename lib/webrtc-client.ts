/**
 * WebRTC Client
 * 
 * Hook de React para videollamadas P2P.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from './websocket-client';

interface UseVideoCallOptions {
  roomId?: string;
  autoJoin?: boolean;
}

interface VideoCallState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  participants: string[];
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useVideoCall(options: UseVideoCallOptions = {}) {
  const { socket, emit, on, connected } = useWebSocket();
  const [state, setState] = useState<VideoCallState>({
    localStream: null,
    remoteStream: null,
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
    participants: [],
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  /**
   * Inicializar local stream (cámara + micrófono)
   */
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      setState((prev) => ({ ...prev, localStream: stream }));

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  /**
   * Crear peer connection
   */
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Añadir tracks locales
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Manejar remote stream
    pc.ontrack = (event) => {
      setState((prev) => ({
        ...prev,
        remoteStream: event.streams[0],
        isConnected: true,
      }));
    };

    // Manejar ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && options.roomId) {
        emit('webrtc:ice-candidate', {
          roomId: options.roomId,
          candidate: event.candidate,
          to: state.participants[0], // Simplified for 1-on-1
        });
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setState((prev) => ({ ...prev, isConnected: false }));
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [options.roomId, state.participants, emit]);

  /**
   * Crear sala de video
   */
  const createRoom = useCallback(
    async (propertyId?: string) => {
      if (!connected) {
        throw new Error('WebSocket not connected');
      }

      const stream = await startLocalStream();

      return new Promise<string>((resolve, reject) => {
        emit('webrtc:create-room', { propertyId }, (response: any) => {
          if (response.success) {
            resolve(response.room.id);
          } else {
            reject(new Error(response.error));
          }
        });
      });
    },
    [connected, emit, startLocalStream]
  );

  /**
   * Unirse a sala
   */
  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!connected) {
        throw new Error('WebSocket not connected');
      }

      const stream = await startLocalStream();

      return new Promise<void>((resolve, reject) => {
        emit('webrtc:join-room', { roomId }, async (response: any) => {
          if (response.success) {
            setState((prev) => ({
              ...prev,
              participants: response.room.participants,
            }));

            // Crear peer connection
            const pc = createPeerConnection();

            // Crear offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Enviar offer al otro participante
            const otherParticipant = response.room.participants.find(
              (id: string) => id !== response.room.hostId
            );

            emit('webrtc:offer', {
              roomId,
              offer,
              to: otherParticipant,
            });

            resolve();
          } else {
            reject(new Error(response.error));
          }
        });
      });
    },
    [connected, emit, startLocalStream, createPeerConnection]
  );

  /**
   * Salir de sala
   */
  const leaveRoom = useCallback(() => {
    if (options.roomId) {
      emit('webrtc:leave-room', { roomId: options.roomId });
    }

    // Cerrar peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Detener local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setState({
      localStream: null,
      remoteStream: null,
      isConnected: false,
      isMuted: false,
      isVideoOff: false,
      participants: [],
    });
  }, [options.roomId, emit]);

  /**
   * Toggle audio
   */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState((prev) => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  /**
   * Toggle video
   */
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState((prev) => ({ ...prev, isVideoOff: !videoTrack.enabled }));
      }
    }
  }, []);

  /**
   * Manejar signaling
   */
  useEffect(() => {
    if (!connected) return;

    // Manejar offer
    const unsubscribeOffer = on('webrtc:offer', async (data: any) => {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emit('webrtc:answer', {
        roomId: data.roomId,
        answer,
        to: data.from,
      });
    });

    // Manejar answer
    const unsubscribeAnswer = on('webrtc:answer', async (data: any) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });

    // Manejar ICE candidate
    const unsubscribeIce = on('webrtc:ice-candidate', async (data: any) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    });

    // User joined
    const unsubscribeJoined = on('webrtc:user-joined', (data: any) => {
      setState((prev) => ({ ...prev, participants: data.participants }));
    });

    // User left
    const unsubscribeLeft = on('webrtc:user-left', () => {
      setState((prev) => ({ ...prev, isConnected: false, remoteStream: null }));
    });

    return () => {
      unsubscribeOffer();
      unsubscribeAnswer();
      unsubscribeIce();
      unsubscribeJoined();
      unsubscribeLeft();
    };
  }, [connected, on, emit, createPeerConnection]);

  /**
   * Auto-join si roomId proporcionado
   */
  useEffect(() => {
    if (options.autoJoin && options.roomId && connected) {
      joinRoom(options.roomId).catch(console.error);
    }

    return () => {
      leaveRoom();
    };
  }, [options.autoJoin, options.roomId, connected]);

  return {
    ...state,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
  };
}
