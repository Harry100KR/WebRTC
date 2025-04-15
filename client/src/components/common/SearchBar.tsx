import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Paper,
  InputBase,
  IconButton,
  Popper,
  Box,
  ClickAwayListener,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { setSearchTerm } from '../../store/slices/filtersSlice';
import { useDebounce } from '../../hooks/useDebounce';

const SearchBar: React.FC = () => {
  const dispatch = useDispatch();
  const [searchValue, setSearchValue] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const debouncedSearchTerm = useDebounce(searchValue, 300);

  useEffect(() => {
    dispatch(setSearchTerm(debouncedSearchTerm));
  }, [debouncedSearchTerm, dispatch]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    if (!anchorEl) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    dispatch(setSearchTerm(''));
  };

  const handleClickAway = () => {
    setAnchorEl(null);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative' }}>
        <Paper
          component="form"
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: { xs: '100%', sm: 400 },
            bgcolor: 'background.paper',
          }}
          elevation={0}
          onSubmit={(e) => e.preventDefault()}
        >
          <IconButton sx={{ p: '10px' }} aria-label="search">
            <SearchIcon />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search financial products..."
            value={searchValue}
            onChange={handleSearchChange}
            inputProps={{ 'aria-label': 'search financial products' }}
          />
          {searchValue && (
            <IconButton
              sx={{ p: '10px' }}
              aria-label="clear"
              onClick={handleClear}
            >
              <ClearIcon />
            </IconButton>
          )}
        </Paper>

        <Popper
          open={Boolean(anchorEl) && searchValue.length > 0}
          anchorEl={anchorEl}
          placement="bottom-start"
          sx={{
            width: { xs: '100%', sm: 400 },
            zIndex: 1000,
          }}
        >
          <Paper
            sx={{
              p: 2,
              mt: 1,
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            {/* Add search suggestions or filters here */}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar; 