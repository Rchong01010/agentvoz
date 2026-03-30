import { useState, useRef, useCallback, useEffect } from 'react';

const DID_AGENT_ID = import.meta.env.VITE_DID_AGENT_ID || 'PLACEHOLDER_AGENT_ID';
const DID_CLIENT_KEY = import.meta.env.VITE_DID_CLIENT_KEY || 'PLACEHOLDER_CLIENT_KEY';

/**
 * Hook that wraps the D-ID Client SDK for managing an interactive avatar agent.
 *
 * @param {Object} options
 * @param {string} [options.agentId] - D-ID agent ID (falls back to env var)
 * @param {string} [options.clientKey] - D-ID client key (falls back to env var)
 */
export function useDIDAgent({ agentId, clientKey } = {}) {
  const [connectionState, setConnectionState] = useState('idle'); // idle | connecting | connected | speaking | error
  const [messages, setMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [idleVideoSrc, setIdleVideoSrc] = useState(null);

  const agentManagerRef = useRef(null);
  const videoElRef = useRef(null);
  const sdkRef = useRef(null);

  const resolvedAgentId = agentId || DID_AGENT_ID;
  const resolvedClientKey = clientKey || DID_CLIENT_KEY;

  // Lazy-load the SDK
  const getSdk = useCallback(async () => {
    if (sdkRef.current) return sdkRef.current;
    try {
      const sdk = await import('@d-id/client-sdk');
      sdkRef.current = sdk;
      return sdk;
    } catch (err) {
      console.error('Failed to load D-ID SDK:', err);
      setConnectionState('error');
      setErrorMessage('D-ID SDK failed to load.');
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (agentManagerRef.current) return;

    setConnectionState('connecting');
    setErrorMessage(null);

    const sdk = await getSdk();
    if (!sdk) return;

    try {
      const callbacks = {
        onSrcObjectReady(value) {
          if (videoElRef.current && value) {
            videoElRef.current.srcObject = value;
            videoElRef.current.src = '';
          }
        },

        onConnectionStateChange(state) {
          // D-ID states: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'
          if (state === 'connected') {
            setConnectionState('connected');
          } else if (state === 'connecting' || state === 'new') {
            setConnectionState('connecting');
          } else if (state === 'disconnected' || state === 'closed') {
            setConnectionState('idle');
            agentManagerRef.current = null;
          } else if (state === 'failed') {
            setConnectionState('error');
            setErrorMessage('D-ID connection failed.');
            agentManagerRef.current = null;
          }
        },

        onVideoStateChange(state) {
          // 'speaking' | 'idle' | etc.
          if (state === 'speaking') {
            setConnectionState('speaking');
          } else if (state === 'idle') {
            setConnectionState((prev) => (prev === 'speaking' ? 'connected' : prev));
          }
        },

        onNewMessage(msg, role) {
          setMessages((prev) => [...prev, { role: role || 'agent', content: msg, ts: Date.now() }]);
        },

        onError(error, errorData) {
          console.error('D-ID error:', error, errorData);
          setErrorMessage(typeof error === 'string' ? error : 'D-ID encountered an error.');
        },
      };

      const manager = await sdk.createAgentManager(resolvedClientKey, {
        agentId: resolvedAgentId,
        callbacks,
      });

      agentManagerRef.current = manager;

      // Grab the idle video URL if available
      if (manager.idle_video) {
        setIdleVideoSrc(manager.idle_video);
      }

      await manager.connect();
    } catch (err) {
      console.error('D-ID connect error:', err);
      setConnectionState('error');
      setErrorMessage(err?.message || 'Failed to connect to D-ID agent.');
      agentManagerRef.current = null;
    }
  }, [getSdk, resolvedAgentId, resolvedClientKey]);

  const disconnect = useCallback(async () => {
    try {
      if (agentManagerRef.current) {
        await agentManagerRef.current.disconnect();
      }
    } catch (err) {
      console.error('D-ID disconnect error:', err);
    } finally {
      agentManagerRef.current = null;
      setConnectionState('idle');
      if (videoElRef.current) {
        videoElRef.current.srcObject = null;
      }
    }
  }, []);

  const speak = useCallback(async (text) => {
    if (!agentManagerRef.current) {
      console.warn('D-ID agent not connected');
      return;
    }
    try {
      await agentManagerRef.current.speak({ type: 'text', input: text });
    } catch (err) {
      console.error('D-ID speak error:', err);
      setErrorMessage('Failed to make avatar speak.');
    }
  }, []);

  const chat = useCallback(async (text) => {
    if (!agentManagerRef.current) {
      console.warn('D-ID agent not connected');
      return;
    }
    try {
      setMessages((prev) => [...prev, { role: 'user', content: text, ts: Date.now() }]);
      await agentManagerRef.current.chat(text);
    } catch (err) {
      console.error('D-ID chat error:', err);
      setErrorMessage('Failed to send chat message.');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (agentManagerRef.current) {
        agentManagerRef.current.disconnect().catch(() => {});
        agentManagerRef.current = null;
      }
    };
  }, []);

  return {
    connectionState,
    messages,
    errorMessage,
    idleVideoSrc,
    videoElRef,
    connect,
    disconnect,
    speak,
    chat,
  };
}
