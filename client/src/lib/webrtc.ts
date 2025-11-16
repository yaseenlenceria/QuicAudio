const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export function createPeerConnection(
  onTrack: (stream: MediaStream) => void,
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onConnectionStateChange: (state: RTCPeerConnectionState) => void
): RTCPeerConnection {
  const peerConnection = new RTCPeerConnection({
    iceServers: STUN_SERVERS,
  });

  peerConnection.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      onTrack(event.streams[0]);
    }
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  peerConnection.onconnectionstatechange = () => {
    onConnectionStateChange(peerConnection.connectionState);
  };

  return peerConnection;
}

export async function getLocalAudioStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    return stream;
  } catch (error) {
    console.error('Error getting local audio stream:', error);
    throw new Error('Failed to access microphone. Please grant microphone permissions.');
  }
}

export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}
