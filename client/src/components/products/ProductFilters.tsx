import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  SelectChangeEvent,
  TextFieldProps,
} from '@mui/material';
import {
  Sort as SortIcon,
  FilterList as FilterIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { RootState } from '../../store';
import {
  setCategory,
  setInvestmentRange,
  setInterestRateRange,
  setSortBy,
  setSortOrder,
  resetFilters,
} from '../../store/slices/filtersSlice';

const categories = [
  'Savings',
  'Investment',
  'Retirement',
  'Fixed Income',
  'Mutual Funds',
];

const ProductFilters: React.FC = () => {
  const dispatch = useDispatch();
  const filters = useSelector((state: RootState) => state.filters);

  const handleCategoryChange = (event: SelectChangeEvent<string | null>) => {
    dispatch(setCategory(event.target.value as string | null));
  };

  const handleInvestmentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'min' | 'max'
  ) => {
    const value = event.target.value ? Number(event.target.value) : null;
    dispatch(
      setInvestmentRange({
        min: type === 'min' ? value : filters.minInvestment,
        max: type === 'max' ? value : filters.maxInvestment,
      })
    );
  };

  const handleInterestRateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'min' | 'max'
  ) => {
    const value = event.target.value ? Number(event.target.value) : null;
    dispatch(
      setInterestRateRange({
        min: type === 'min' ? value : filters.minInterestRate,
        max: type === 'max' ? value : filters.maxInterestRate,
      })
    );
  };

  const handleSortChange = (event: SelectChangeEvent<string | null>) => {
    dispatch(setSortBy(event.target.value as 'name' | 'interestRate' | 'minimumInvestment' | null));
  };

  const toggleSortOrder = () => {
    dispatch(setSortOrder(filters.sortOrder === 'asc' ? 'desc' : 'asc'));
  };

  const handleReset = () => {
    dispatch(resetFilters());
  };

  const renderTextField = (
    label: string,
    value: number | null,
    type: 'min' | 'max'
  ) => (
    <TextField
      fullWidth
      label={label}
      type="number"
      value={value || ''}
      onChange={(e) => handleInvestmentChange(e as React.ChangeEvent<HTMLInputElement>, type)}
      InputProps={{ inputProps: { min: 0 } }}
    />
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={filters.category || ''}
              label="Category"
              onChange={handleCategoryChange}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          {renderTextField('Min Investment', filters.minInvestment, 'min')}
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          {renderTextField('Max Investment', filters.maxInvestment, 'max')}
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              value={filters.sortBy || ''}
              label="Sort By"
              onChange={handleSortChange}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="interestRate">Interest Rate</MenuItem>
              <MenuItem value="minimumInvestment">Minimum Investment</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box display="flex" gap={1}>
            <Tooltip title="Toggle Sort Order">
              <IconButton
                onClick={toggleSortOrder}
                color={filters.sortBy ? 'primary' : 'default'}
              >
                <SortIcon
                  sx={{
                    transform: filters.sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                  }}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reset Filters">
              <IconButton onClick={handleReset} color="primary">
                <ResetIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="More Filters">
              <IconButton color="primary">
                <FilterIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProductFilters; 