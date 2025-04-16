import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '../../store';
import { Watchlist, FinancialInstrument } from '../../types/financialTypes';
import { 
  fetchWatchlists, 
  addWatchlist, 
  editWatchlist, 
  removeWatchlist,
  addInstrumentToWatchlist,
  removeInstrumentFromWatchlist
} from '../../store/slices/watchlistsSlice';

const MotionCard = motion(Card);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Add type for instrument ID
type InstrumentId = string;

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const WatchlistView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items: watchlists, currentWatchlist, loading, error } = useSelector(
    (state: RootState) => state.watchlists
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: products } = useSelector((state: RootState) => state.products);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
  const [watchlistName, setWatchlistName] = useState('');
  const [watchlistDescription, setWatchlistDescription] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch(fetchWatchlists());
  }, [dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (watchlist?: Watchlist) => {
    if (watchlist) {
      setEditingWatchlist(watchlist);
      setWatchlistName(watchlist.name);
      setWatchlistDescription(watchlist.description);
    } else {
      setEditingWatchlist(null);
      setWatchlistName('');
      setWatchlistDescription('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingWatchlist(null);
  };

  const handleSubmit = () => {
    if (!watchlistName.trim()) return;

    if (editingWatchlist) {
      dispatch(editWatchlist({
        id: editingWatchlist.id,
        watchlist: {
          name: watchlistName,
          description: watchlistDescription,
        }
      }));
    } else {
      dispatch(addWatchlist({
        name: watchlistName,
        description: watchlistDescription,
        user_id: user?.id ? Number(user.id) : 0,
        instruments: []
      }));
    }

    handleCloseDialog();
  };

  const handleDeleteWatchlist = (id: number) => {
    if (window.confirm('Are you sure you want to delete this watchlist?')) {
      dispatch(removeWatchlist(id));
    }
  };

  const toggleInstrumentInWatchlist = (watchlistId: number, instrumentId: InstrumentId, isInWatchlist: boolean) => {
    if (isInWatchlist) {
      dispatch(removeInstrumentFromWatchlist({ watchlistId, instrumentId }));
    } else {
      dispatch(addInstrumentToWatchlist({ watchlistId, instrumentId }));
    }
  };

  const isInWatchlist = (watchlistId: number, instrumentId: string): boolean => {
    const watchlist = watchlists.find(w => w.id === watchlistId);
    return watchlist ? watchlist.instruments.includes(instrumentId) : false;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">My Watchlists</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Watchlist
        </Button>
      </Box>

      {watchlists.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            You don't have any watchlists yet.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Your First Watchlist
          </Button>
        </Box>
      ) : (
        <>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="watchlist tabs" sx={{ borderBottom: 1, borderColor: 'divider' }}>
            {watchlists.map((watchlist, index) => (
              <Tab 
                key={watchlist.id} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>{watchlist.name}</Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(watchlist);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWatchlist(watchlist.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                } 
                id={`watchlist-tab-${index}`}
                aria-controls={`watchlist-tabpanel-${index}`}
              />
            ))}
          </Tabs>

          {watchlists.map((watchlist, index) => (
            <TabPanel key={watchlist.id} value={tabValue} index={index}>
              <Typography variant="body2" color="text.secondary" paragraph>
                {watchlist.description}
              </Typography>
              
              {watchlist.instruments.length === 0 ? (
                <Alert severity="info">
                  This watchlist is empty. Add financial instruments by clicking the star icon next to products.
                </Alert>
              ) : (
                <List>
                  {watchlist.instruments.map((instrumentId: InstrumentId) => {
                    const instrument = products.find(p => p.id === instrumentId);
                    return instrument ? (
                      <ListItem key={instrumentId}>
                        <ListItemText
                          primary={instrument.name}
                          secondary={`${instrument.interestRate ? instrument.interestRate + '% Interest' : ''} | Min. Investment: $${instrument.minimumInvestment.toLocaleString()}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => toggleInstrumentInWatchlist(watchlist.id, instrumentId, true)}>
                            <StarIcon color="primary" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ) : null;
                  })}
                </List>
              )}
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>All Financial Instruments</Typography>
                <List>
                  {products
                    .filter(product => !watchlist.instruments.includes(product.id))
                    .map(product => (
                      <ListItem key={product.id}>
                        <ListItemText
                          primary={product.name}
                          secondary={`${product.interestRate ? product.interestRate + '% Interest' : ''} | Min. Investment: $${product.minimumInvestment.toLocaleString()}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => toggleInstrumentInWatchlist(watchlist.id, product.id, false)}>
                            <StarBorderIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))
                  }
                </List>
              </Box>
            </TabPanel>
          ))}
        </>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingWatchlist ? 'Edit Watchlist' : 'Create Watchlist'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Watchlist Name"
            type="text"
            fullWidth
            value={watchlistName}
            onChange={(e) => setWatchlistName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={watchlistDescription}
            onChange={(e) => setWatchlistDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editingWatchlist ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WatchlistView; 