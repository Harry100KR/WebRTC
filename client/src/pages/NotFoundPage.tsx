import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { SentimentVeryDissatisfied } from '@mui/icons-material';

const MotionBox = motion(Box);

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        when: 'beforeChildren',
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <Container maxWidth="sm">
      <MotionBox
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <SentimentVeryDissatisfied
            sx={{ fontSize: 120, color: 'text.secondary', mb: 2 }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography variant="h2" component="h1" gutterBottom>
            404
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography variant="h5" color="text.secondary" paragraph>
            Oops! Page not found
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            The page you're looking for doesn't exist or has been moved.
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/')}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'transform 0.2s',
              },
            }}
          >
            Go Home
          </Button>
        </motion.div>
      </MotionBox>
    </Container>
  );
};

export default NotFoundPage; 