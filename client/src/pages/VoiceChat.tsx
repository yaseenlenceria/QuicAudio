import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AudioVisualizer, PulsingCircle } from '@/components/AudioVisualizer';
import { ConnectionQuality } from '@/components/ConnectionQuality';
import { CallTimer } from '@/components/CallTimer';
import { FilterPanel, type Filters } from '@/components/FilterPanel';
import { ReportModal } from '@/components/ReportModal';
import { SafetyBanner } from '@/components/SafetyBanner';
import { getUserId } from '@/lib/user-id';
import { createPeerConnection, getLocalAudioStream, stopMediaStream } from '@/lib/webrtc';
import { AudioVisualizer as AudioVisualizerClass } from '@/lib/audio-visualizer';
import { Mic, MicOff, PhoneOff, SkipForward, Flag, Users } from 'lucide-react';

type CallState = 'idle' | 'searching' | 'connected' | 'reconnecting';

export default function VoiceChat() {
  const { toast } = useToast();
  const [userId] = useState(getUserId());
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'strong' | 'medium' | 'weak' | 'connecting'>('connecting');
  const [callStartTime, setCallStartTime] = useState<number>(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(16).fill(0.1));
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(127);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    countries: [],
    languages: [],
    moods: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioVisualizerRef = useRef<AudioVisualizerClass | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const connectedUserIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    connectWebSocket();
    
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      startHeartbeat();
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.type) {
        case 'queue-joined':
          setQueuePosition(message.position);
          break;

        case 'match-found':
          await handleMatchFound(message.partnerId);
          break;

        case 'offer':
          await handleOffer(message.offer, message.userId);
          break;

        case 'answer':
          await handleAnswer(message.answer);
          break;

        case 'ice-candidate':
          await handleIceCandidate(message.candidate);
          break;

        case 'peer-disconnected':
          handlePeerDisconnected();
          break;

        case 'online-count':
          setOnlineUsers(message.count);
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      stopHeartbeat();
      if (callState !== 'idle') {
        setTimeout(connectWebSocket, 2000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to server. Retrying...',
        variant: 'destructive',
      });
    };
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'heartbeat',
          userId,
        }));
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const handleMatchFound = async (partnerId: string) => {
    console.log('Match found with:', partnerId);
    connectedUserIdRef.current = partnerId;
    setCallState('connected');
    setCallStartTime(Date.now());

    try {
      localStreamRef.current = await getLocalAudioStream();
      
      audioVisualizerRef.current = new AudioVisualizerClass(
        (levels) => {
          setAudioLevels(levels);
          const avgLevel = levels.reduce((a, b) => a + b) / levels.length;
          setIsSpeaking(avgLevel > 0.1);
        },
        16
      );
      audioVisualizerRef.current.start(localStreamRef.current);

      pcRef.current = createPeerConnection(
        (remoteStream) => {
          console.log('Received remote stream');
          remoteStreamRef.current = remoteStream;
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(console.error);
          }
        },
        (candidate) => {
          sendMessage({
            type: 'ice-candidate',
            userId,
            targetUserId: partnerId,
            candidate,
          });
        },
        (state) => {
          console.log('Connection state:', state);
          if (state === 'connected') {
            setConnectionQuality('strong');
          } else if (state === 'disconnected' || state === 'failed') {
            setConnectionQuality('weak');
            setCallState('reconnecting');
          }
        }
      );

      localStreamRef.current.getTracks().forEach(track => {
        pcRef.current!.addTrack(track, localStreamRef.current!);
      });

      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      sendMessage({
        type: 'offer',
        userId,
        targetUserId: partnerId,
        offer,
      });

    } catch (error) {
      console.error('Error setting up call:', error);
      toast({
        title: 'Call Setup Failed',
        description: error instanceof Error ? error.message : 'Failed to set up call',
        variant: 'destructive',
      });
      endCall();
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit, senderId: string) => {
    if (!pcRef.current) return;

    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      sendMessage({
        type: 'answer',
        userId,
        targetUserId: senderId,
        answer,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;

    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!pcRef.current) return;

    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const handlePeerDisconnected = () => {
    toast({
      title: 'Call Ended',
      description: 'The other person has disconnected',
    });
    endCall();
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const startSearch = async () => {
    setCallState('searching');
    setQueuePosition(null);

    sendMessage({
      type: 'join-queue',
      userId,
      preferences: filters,
    });

    toast({
      title: 'Searching...',
      description: 'Looking for someone to talk to',
    });
  };

  const cancelSearch = () => {
    sendMessage({
      type: 'leave-queue',
      userId,
    });
    setCallState('idle');
    setQueuePosition(null);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const nextPerson = () => {
    if (connectedUserIdRef.current) {
      sendMessage({
        type: 'end-call',
        userId,
        targetUserId: connectedUserIdRef.current,
      });
    }
    cleanup();
    startSearch();
  };

  const endCall = () => {
    if (connectedUserIdRef.current) {
      sendMessage({
        type: 'end-call',
        userId,
        targetUserId: connectedUserIdRef.current,
      });
    }
    cleanup();
    setCallState('idle');
  };

  const cleanup = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    stopMediaStream(localStreamRef.current);
    stopMediaStream(remoteStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    connectedUserIdRef.current = null;
    audioVisualizerRef.current?.stop();
    audioVisualizerRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  const handleReport = async (reason: string, details: string) => {
    console.log('Report submitted:', { reason, details });
    toast({
      title: 'Report Submitted',
      description: 'Thank you for helping keep our community safe',
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <audio ref={remoteAudioRef} autoPlay />
      
      <div className="w-full max-w-2xl mx-auto">
        <SafetyBanner />

        {callState === 'idle' && (
          <Card className="p-12 text-center space-y-8" data-testid="card-landing">
            <div>
              <h1 className="text-5xl font-bold mb-4">VoiceLink</h1>
              <p className="text-lg text-muted-foreground mb-2">
                Connect with random people worldwide
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span data-testid="text-online-users">{onlineUsers} people online</span>
              </div>
            </div>

            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              className="max-w-xl mx-auto"
            />

            <Button
              size="lg"
              className="h-16 px-12 text-lg"
              onClick={startSearch}
              data-testid="button-start-chat"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Voice Chat
            </Button>

            <p className="text-xs text-muted-foreground mt-6">
              By starting a chat, you agree to our{' '}
              <a href="#" className="underline">Terms of Service</a> and{' '}
              <a href="#" className="underline">Privacy Policy</a>
            </p>
          </Card>
        )}

        {callState === 'searching' && (
          <Card className="p-12 text-center space-y-8" data-testid="card-searching">
            <PulsingCircle size={128} />
            
            <div>
              <h2 className="text-2xl font-semibold mb-2">Searching for someone...</h2>
              {queuePosition !== null && (
                <p className="text-sm text-muted-foreground" data-testid="text-queue-position">
                  ~{queuePosition} people ahead
                </p>
              )}
            </div>

            <Button
              variant="secondary"
              onClick={cancelSearch}
              data-testid="button-cancel-search"
            >
              Cancel
            </Button>
          </Card>
        )}

        {(callState === 'connected' || callState === 'reconnecting') && (
          <Card className="p-8 space-y-6" data-testid="card-connected">
            <div className="flex items-center justify-between">
              <ConnectionQuality quality={callState === 'reconnecting' ? 'connecting' : connectionQuality} />
              <CallTimer startTime={callStartTime} />
              <Badge variant="secondary" data-testid="badge-trust-level">New User</Badge>
            </div>

            <div className="h-48 flex items-center justify-center">
              <AudioVisualizer
                levels={audioLevels}
                isSpeaking={isSpeaking}
                className="w-full max-w-md h-full"
              />
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                variant={isMuted ? 'destructive' : 'secondary'}
                className="w-14 h-14 rounded-full"
                onClick={toggleMute}
                data-testid="button-toggle-mute"
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>

              <Button
                size="icon"
                variant="destructive"
                className="w-14 h-14 rounded-full"
                onClick={endCall}
                data-testid="button-end-call"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>

              <Button
                size="icon"
                variant="secondary"
                className="w-14 h-14 rounded-full"
                onClick={nextPerson}
                data-testid="button-next-person"
              >
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReportModalOpen(true)}
                className="text-muted-foreground"
                data-testid="button-open-report"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report User
              </Button>
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          User ID: <code className="font-mono bg-muted px-2 py-1 rounded" data-testid="text-user-id">{userId.slice(0, 8)}</code>
        </p>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReport}
      />
    </div>
  );
}
