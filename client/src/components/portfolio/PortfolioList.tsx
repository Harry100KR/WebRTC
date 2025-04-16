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
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Divider,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '../../store';
import { Portfolio } from '../../types/financialTypes';
import { 
  fetchPortfolios, 
  addPortfolio, 
  editPortfolio, 
  removePortfolio 
} from '../../store/slices/portfoliosSlice';

const MotionCard = motion(Card);

const PortfolioList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items: portfolios, loading, error } = useSelector((state: RootState) => state.portfolios);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    dispatch(fetchPortfolios());
  }, [dispatch]);

  const handleOpenDialog = (portfolio?: Portfolio) => {
    if (portfolio) {
      setEditingPortfolio(portfolio);
      setPortfolioName(portfolio.name);
      setPortfolioDescription(portfolio.description);
      setIsPublic(portfolio.is_public);
    } else {
      setEditingPortfolio(null);
      setPortfolioName('');
      setPortfolioDescription('');
      setIsPublic(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPortfolio(null);
  };

  const handleSubmit = () => {
    if (!portfolioName.trim()) return;

    if (editingPortfolio) {
      dispatch(editPortfolio({
        id: editingPortfolio.id,
        portfolio: {
          name: portfolioName,
          description: portfolioDescription,
          is_public: isPublic
        }
      }));
    } else {
      dispatch(addPortfolio({
        name: portfolioName,
        description: portfolioDescription,
        user_id: user?.id ? Number(user.id) : 0,
        is_public: isPublic,
        instruments: []
      }));
    }

    handleCloseDialog();
  };

  const handleDeletePortfolio = (id: number) => {
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      dispatch(removePortfolio(id));
    }
  };

  const handleViewPortfolio = (id: number) => {
    navigate(`/portfolios/${id}`);
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
        <Typography variant="h5">My Portfolios</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Portfolio
        </Button>
      </Box>

      {portfolios.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            You don't have any portfolios yet.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Your First Portfolio
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {portfolios.map((portfolio, index) => (
            <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: (theme) => theme.shadows[4],
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease-in-out',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" gutterBottom>
                      {portfolio.name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(portfolio)}
                        aria-label="edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeletePortfolio(portfolio.id)}
                        aria-label="delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {portfolio.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {portfolio.instruments.length} instruments
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => handleViewPortfolio(portfolio.id)}
                  >
                    View Portfolio
                  </Button>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPortfolio ? 'Edit Portfolio' : 'Create Portfolio'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Portfolio Name"
            type="text"
            fullWidth
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={portfolioDescription}
            onChange={(e) => setPortfolioDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editingPortfolio ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioList; 