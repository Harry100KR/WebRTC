import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import PortfolioList from '../components/portfolio/PortfolioList';

const PortfoliosPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Financial Portfolios
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Create and manage virtual portfolios to organize your financial investments.
        </Typography>
        
        <PortfolioList />
      </Box>
    </Container>
  );
};

export default PortfoliosPage; 