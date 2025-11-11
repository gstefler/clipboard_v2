import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/room', {
        method: 'POST',
      });
      const data = await response.json();
      navigate(`/room/${data.roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Clipboard Share</CardTitle>
          <CardDescription>
            Create a room to share clipboard content in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={createRoom}
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? 'Creating Room...' : 'Create New Room'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
