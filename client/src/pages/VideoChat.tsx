import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Paper } from '@mui/material';
import { VideoConsultation } from '../components/VideoConsultation';

export const VideoChat: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = () => {
    if (roomId && userId) {
      setIsJoined(true);
    }
  };

  if (isJoined) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Video Chat Room: {roomId}
          </Typography>
          <VideoConsultation
            roomId={roomId}
            userId={userId}
            isHost={true}
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Join Video Chat
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
            />
            <TextField
              fullWidth
              label="Your Name"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your name"
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleJoin}
              disabled={!roomId || !userId}
            >
              Join Room
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}; 