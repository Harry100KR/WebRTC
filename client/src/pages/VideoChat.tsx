import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Paper,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  IconButton,
  InputAdornment
} from '@mui/material';
import { VideoConsultation } from '../components/VideoConsultation';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { generateRandomRoomId } from '../utils/roomUtils';

export const VideoChat: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = () => {
    if (roomId && userId) {
      setIsJoined(true);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRandomRoomId();
    setRoomId(newRoomId);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  if (isJoined) {
    return (
      <Container maxWidth="xl" sx={{ p: isMobile ? 1 : 2 }}>
        <Box sx={{ py: 2 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant={isMobile ? "h6" : "h4"}>
                Room: {roomId}
              </Typography>
              <IconButton onClick={handleCopyRoomId} color="primary" size={isMobile ? "small" : "medium"}>
                <ContentCopyIcon />
              </IconButton>
            </CardContent>
          </Card>
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
      <Box sx={{ 
        py: isMobile ? 4 : 8,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: isMobile ? 2 : 4,
            borderRadius: 2,
            background: theme.palette.background.paper
          }}
        >
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom align="center">
            Join Video Chat
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID or create new"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button 
                      onClick={handleCreateRoom}
                      variant="text" 
                      size={isMobile ? "small" : "medium"}
                    >
                      Create New
                    </Button>
                  </InputAdornment>
                ),
              }}
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
              sx={{ mt: 2 }}
            >
              Join Room
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}; 