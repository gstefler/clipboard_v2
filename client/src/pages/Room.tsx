import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const isLocalUpdate = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;

    // Construct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${id}`;

    // Create WebSocket connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to room:', id);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'init' || data.type === 'update') {
        isLocalUpdate.current = false;
        setContent(data.content);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from room');
      setIsConnected(false);
    };

    return () => {
      ws.close();
      // Clear debounce timer on unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [id]);

  const sendUpdate = useCallback((newContent: string) => {
    // Send update to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update',
        content: newContent,
      }));
    }
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    isLocalUpdate.current = true;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer (500ms delay)
    debounceTimerRef.current = setTimeout(() => {
      sendUpdate(newContent);
    }, 500);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
      isLocalUpdate.current = true;
      
      // Send update to server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'update',
          content: text,
        }));
      }
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const shareUrl = `${window.location.origin}/room/${id}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Room: {id}</CardTitle>
            <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-600 dark:bg-green-400' : 'bg-red-600 dark:bg-red-400'}`}></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <CardDescription>
            Share this link with others to sync clipboards in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
              }}
              variant="outline"
            >
              Copy Link
            </Button>
          </div>
          
          <Textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Type or paste your content here..."
            className="min-h-[300px] font-mono text-sm"
          />
          
          <div className="flex gap-2">
            <Button onClick={copyToClipboard} className="flex-1">
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button onClick={pasteFromClipboard} variant="outline" className="flex-1">
              Paste from Clipboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
