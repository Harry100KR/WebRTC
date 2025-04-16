import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/slices/productsSlice';
import ProductFilters from '../components/products/ProductFilters';

const MotionCard = motion(Card);

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items: products, loading, error } = useSelector(
    (state: RootState) => state.products
  );
  const filters = useSelector((state: RootState) => state.filters);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

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

  return (
    <Box>
      <ProductFilters />
      <Grid container spacing={3} mt={2}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {product.name}
                </Typography>
                <Typography color="text.secondary" paragraph>
                  {product.description}
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    label={`${product.minimumInvestment} USD min`}
                    size="small"
                  />
                  <Chip label={product.riskLevel} size="small" />
                  {product.interestRate && (
                    <Chip
                      label={`${product.interestRate}% interest`}
                      size="small"
                    />
                  )}
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  Learn More
                </Button>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProductsPage; 