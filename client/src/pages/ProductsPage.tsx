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
    dispatch(fetchProducts());
  }, [dispatch]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(filters.searchTerm.toLowerCase()) ||
      product.description
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase());

    const matchesCategory = !filters.category || product.category === filters.category;

    const matchesInvestment =
      (!filters.minInvestment ||
        product.minimumInvestment >= filters.minInvestment) &&
      (!filters.maxInvestment ||
        product.minimumInvestment <= filters.maxInvestment);

    const matchesInterestRate =
      (!filters.minInterestRate ||
        (product.interestRate && product.interestRate >= filters.minInterestRate)) &&
      (!filters.maxInterestRate ||
        (product.interestRate && product.interestRate <= filters.maxInterestRate));

    return (
      matchesSearch &&
      matchesCategory &&
      matchesInvestment &&
      matchesInterestRate
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!filters.sortBy) return 0;

    switch (filters.sortBy) {
      case 'name':
        return filters.sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case 'interestRate':
        const rateA = a.interestRate || 0;
        const rateB = b.interestRate || 0;
        return filters.sortOrder === 'asc' ? rateA - rateB : rateB - rateA;
      case 'minimumInvestment':
        return filters.sortOrder === 'asc'
          ? a.minimumInvestment - b.minimumInvestment
          : b.minimumInvestment - a.minimumInvestment;
      default:
        return 0;
    }
  });

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
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {sortedProducts.map((product, index) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[4],
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {product.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {product.description}
                </Typography>
                {product.interestRate && (
                  <Chip
                    label={`${product.interestRate}% Interest Rate`}
                    color="primary"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                <Chip
                  label={`Min. $${product.minimumInvestment.toLocaleString()}`}
                  color="secondary"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    Learn More
                  </Button>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProductsPage; 