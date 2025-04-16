import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import WatchlistView from '../components/watchlist/WatchlistView';

const WatchlistsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Watchlists
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Track and monitor financial instruments of interest by creating watchlists.
        </Typography>
        
        <WatchlistView />
      </Box>
    </Container>
  );
};

export default WatchlistsPage; 