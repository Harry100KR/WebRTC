import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Typography,
  Paper,
  Chip,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  AccessTime,
  AttachMoney,
  CheckCircle,
  Warning,
  Article,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { fetchProducts } from '../store/slices/productsSlice';
import { useAppDispatch } from '../hooks/useAppDispatch';

const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { items: products, loading, error } = useSelector(
    (state: RootState) => state.products
  );

  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts({
        searchTerm: '',
        category: null,
        minInvestment: null,
        maxInvestment: null,
        minInterestRate: null,
        maxInterestRate: null,
        sortBy: null,
        sortOrder: 'asc'
      }));
    }
  }, [dispatch, products.length]);

  const product = products.find((p) => p.id === id);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box my={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box my={3}>
        <Alert severity="error">Product not found</Alert>
      </Box>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <MotionContainer
        maxWidth="lg"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <MotionPaper
              elevation={3}
              sx={{ p: 4, borderRadius: 2 }}
              variants={itemVariants}
            >
              <motion.div variants={itemVariants}>
                <Typography variant="h3" component="h1" gutterBottom>
                  {product.name}
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  paragraph
                  sx={{ mb: 4 }}
                >
                  {product.description}
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {product.interestRate && (
                    <Grid item>
                      <Chip
                        icon={<TrendingUp />}
                        label={`${product.interestRate}% Interest Rate`}
                        color="primary"
                        sx={{ fontSize: '1.1rem', py: 2 }}
                      />
                    </Grid>
                  )}
                  {product.term && (
                    <Grid item>
                      <Chip
                        icon={<AccessTime />}
                        label={`${product.term} Term`}
                        color="secondary"
                        sx={{ fontSize: '1.1rem', py: 2 }}
                      />
                    </Grid>
                  )}
                  <Grid item>
                    <Chip
                      icon={<AttachMoney />}
                      label={`Min. Investment $${product.minimumInvestment.toLocaleString()}`}
                      color="info"
                      sx={{ fontSize: '1.1rem', py: 2 }}
                    />
                  </Grid>
                </Grid>
              </motion.div>

              <Divider sx={{ my: 4 }} />

              <motion.div variants={itemVariants}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  Key Features
                </Typography>
                <List>
                  {product.features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </motion.div>
            </MotionPaper>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <MotionPaper
                elevation={3}
                sx={{ p: 3, borderRadius: 2, mb: 3 }}
                variants={itemVariants}
              >
                <Typography variant="h6" gutterBottom>
                  Risk Factors
                </Typography>
                <List dense>
                  {product.risks.map((risk, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={risk}
                        sx={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </MotionPaper>
            </motion.div>

            <motion.div variants={itemVariants}>
              <MotionPaper
                elevation={3}
                sx={{ p: 3, borderRadius: 2, mb: 3 }}
                variants={itemVariants}
              >
                <Typography variant="h6" gutterBottom>
                  Documents
                </Typography>
                <List dense>
                  {product.documents.map((doc, index) => (
                    <ListItem
                      key={index}
                      button
                      component="a"
                      href={doc}
                      target="_blank"
                    >
                      <ListItemIcon>
                        <Article color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Document ${index + 1}`}
                        secondary="Click to view"
                      />
                    </ListItem>
                  ))}
                </List>
              </MotionPaper>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    transition: 'transform 0.2s',
                  },
                }}
              >
                Invest Now
              </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => navigate('/products')}
                sx={{
                  mt: 2,
                  py: 2,
                  fontSize: '1.1rem',
                }}
              >
                Back to Products
              </Button>
            </motion.div>
          </Grid>
        </Grid>
      </MotionContainer>
    </AnimatePresence>
  );
};

export default ProductDetailsPage; 