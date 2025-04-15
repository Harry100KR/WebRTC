import React from 'react';
import { Box, Container, Typography, Paper, Grid, Avatar } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const ProfilePage: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user) {
    return (
      <Container>
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          Please log in to view your profile
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto',
                  bgcolor: 'primary.main',
                  fontSize: '3rem'
                }}
              >
                {user.full_name.charAt(0).toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>
                {user.full_name}
              </Typography>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                {user.email}
              </Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                Role: {user.role}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfilePage; 