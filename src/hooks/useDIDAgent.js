import { useState, useRef, useCallback, useEffect } from 'react';

const DID_AGENT_ID = 'v2_agt_lH4vls9r';
const DID_CLIENT_KEY = 'ck_eXNPU1wfyQhIkCdyqTfd_';

export function useDIDAgent() {
  const [connectionState, setConnectionState] = useState('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const agentManagerRef = useRef(null);
  const srcObjectRef = useRef(null);
  const videoElRef = useRef(null);
  const sdkRef = useRef(null);

  const getSdk = useCallback(async () => {
    if (sdkRef.current) return sdkRef.current;
    const sdk = await import('@d-id/client-sdk');
    sdkRef.current = sdk;
    return sdk;
  }, []);

  const connect = useCallback(async (videoElement) => {
    if (agentManagerRef.current) return;

    setConnectionState('connecting');
    setError(null);
    if (videoElement) videoElRef.current = videoElement;

    try {
      const sdk = await getSdk();

      const callbacks = {
        onSrcObjectReady(value) {
          srcObjectRef.current = value;
          if (videoElRef.current) {
            videoElRef.current.srcObject = value;
          }
          return value;
        },

        onVideoStateChange(state) {
          if (state === 'STOP') {
            setIsSpeaking(false);
            if (videoElRef.current) {
              videoElRef.current.srcObject = undefined;
              const idleVideo = agentManagerRef.current?.agent?.presenter?.idle_video;
              if (idleVideo) videoElRef.current.src = idleVideo;
            }
          } else {
            setIsSpeaking(true);
            if (videoElRef.current && srcObjectRef.current) {
              videoElRef.current.srcObject = srcObjectRef.current;
            }
          }
        },

        onConnectionStateChange(state) {
          if (state === 'connected') setConnectionState('connected');
          else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            setConnectionState('idle');
            agentManagerRef.current = null;
          }
        },

        onNewMessage(msgs, type) {
          if (msgs && msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            if (last.role === 'assistant' && last.content) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: last.content,
                spanish: last.content,
                english: null,
              }]);

              translateText(last.content).then(english => {
                setMessages(prev => prev.map(m =>
                  m.content === last.content && !m.english ? { ...m, english } : m
                ));
              });
            }
          }
        },

        onError(err, data) {
          console.error('D-ID error:', err, data);
          setError(typeof err === 'string' ? err : 'D-ID error');
        },
      };

      // D-ID SDK: createAgentManager(agentId, { auth, callbacks, streamOptions })
      const manager = await sdk.createAgentManager(DID_AGENT_ID, {
        auth: { type: 'key', clientKey: DID_CLIENT_KEY },
        callbacks,
        streamOptions: { compatibilityMode: 'auto', streamWarmup: true },
      });

      agentManagerRef.current = manager;
      await manager.connect();
    } catch (err) {
      console.error('D-ID connect error:', err);
      setError(err?.message || 'Failed to connect');
      setConnectionState('error');
    }
  }, [getSdk]);

  const disconnect = useCallback(() => {
    if (agentManagerRef.current) {
      agentManagerRef.current.disconnect();
      agentManagerRef.current = null;
    }
    setConnectionState('idle');
    setIsSpeaking(false);
    setMessages([]);
    setError(null);
  }, []);

  const chat = useCallback((text) => {
    if (!agentManagerRef.current || connectionState !== 'connected') return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    agentManagerRef.current.chat(text);
  }, [connectionState]);

  const speak = useCallback((text) => {
    if (!agentManagerRef.current || connectionState !== 'connected') return;
    agentManagerRef.current.speak({ type: 'text', input: text });
  }, [connectionState]);

  useEffect(() => {
    return () => {
      if (agentManagerRef.current) {
        agentManagerRef.current.disconnect();
      }
    };
  }, []);

  return {
    connectionState,
    isSpeaking,
    messages,
    error,
    videoElRef,
    connect,
    disconnect,
    chat,
    speak,
  };
}

async function translateText(spanishText) {
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: spanishText }),
    });
    if (!res.ok) return spanishText;
    const data = await res.json();
    return data.english || spanishText;
  } catch {
    return spanishText;
  }
}
