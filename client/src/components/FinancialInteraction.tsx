import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Grid,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  HighlightAlt as HighlightIcon,
  ScreenShare as ScreenShareIcon,
  PictureAsPdf as PdfIcon,
  Comment as CommentIcon,
  Tag as TagIcon
} from '@mui/icons-material';

interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  text: string;
  timestamp: Date;
  relatedSegment?: string;
}

interface Annotation {
  id: string;
  user: {
    id: string;
    name: string;
  };
  target: string;
  content: string;
  color: string;
  position: { x: number, y: number };
}

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
  marketCap?: number;
  timestamp: Date;
}

interface Contract {
  id: string;
  name: string;
  type: string;
  size: number;
  price: number;
  margin: number;
  expiry?: Date;
}

interface FinancialInteractionProps {
  sessionId: string;
  userId: string;
  role: 'counselor' | 'client';
  product?: {
    id: string;
    name: string;
    type: string;
    details: any;
  };
  onScreenShareRequest?: () => void;
  onSaveAnnotation?: (annotation: Annotation) => void;
}

const FinancialInteraction: React.FC<FinancialInteractionProps> = ({
  sessionId,
  userId,
  role,
  product,
  onScreenShareRequest,
  onSaveAnnotation
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Simulated market data for demonstration
  useEffect(() => {
    // This would normally come from an API
    setMarketData([
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 182.52,
        change: 0.75,
        volume: 58293400,
        marketCap: 2850000000000,
        timestamp: new Date()
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        price: 413.64,
        change: -1.12,
        volume: 22385600,
        marketCap: 3070000000000,
        timestamp: new Date()
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 176.75,
        change: 1.25,
        volume: 23586100,
        marketCap: 2200000000000,
        timestamp: new Date()
      }
    ]);
    
    setContracts([
      {
        id: 'c1',
        name: 'E-mini S&P 500',
        type: 'Futures',
        size: 50,
        price: 5315.25,
        margin: 12500
      },
      {
        id: 'c2',
        name: 'Euro FX',
        type: 'Futures',
        size: 125000,
        price: 1.0925,
        margin: 2750
      },
      {
        id: 'c3',
        name: 'Gold',
        type: 'Futures',
        size: 100,
        price: 2315.80,
        margin: 12100
      }
    ]);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      user: {
        id: userId,
        name: role === 'counselor' ? 'Financial Advisor' : 'Client'
      },
      text: newComment,
      timestamp: new Date()
    };
    
    setComments([...comments, comment]);
    setNewComment('');
  };
  
  const handleAnnotationStart = () => {
    setIsAnnotating(true);
  };
  
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating || !containerRef.current) return;
    
    // Get position relative to container
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Create annotation
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      user: {
        id: userId,
        name: role === 'counselor' ? 'Financial Advisor' : 'Client'
      },
      target: 'product-details',
      content: 'New annotation',
      color: role === 'counselor' ? '#4caf50' : '#2196f3',
      position: { x, y }
    };
    
    setAnnotations([...annotations, newAnnotation]);
    setIsAnnotating(false);
    
    if (onSaveAnnotation) {
      onSaveAnnotation(newAnnotation);
    }
  };
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  const getChangeColor = (change: number): string => {
    return change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.primary';
  };

  const handleScreenShare = () => {
    if (onScreenShareRequest) {
      onScreenShareRequest();
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="financial interaction tabs">
          <Tab label="Market Data" />
          <Tab label="Contracts" />
          <Tab label="Discussion" />
          {product && <Tab label={`Product: ${product.name}`} />}
        </Tabs>
      </Box>
      
      {/* Market Data Tab */}
      <Box sx={{ display: currentTab === 0 ? 'block' : 'none', flex: 1, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Live Market Data
        </Typography>
        <Box 
          sx={{ 
            maxHeight: 400, 
            overflow: 'auto', 
            border: '1px solid #e0e0e0', 
            borderRadius: 1,
            mb: 2
          }}
        >
          <List>
            {marketData.map((item) => (
              <ListItem key={item.symbol} divider>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={4}>
                    <ListItemText 
                      primary={item.symbol} 
                      secondary={item.name} 
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(item.price)}
                    </Typography>
                    <Typography variant="body2" color={getChangeColor(item.change)}>
                      {item.change > 0 ? '+' : ''}{item.change.toFixed(2)} ({formatPercentage(item.change / (item.price - item.change) * 100)})
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      Vol: {formatNumber(item.volume)}
                    </Typography>
                    {item.marketCap && (
                      <Typography variant="body2">
                        MCap: {formatCurrency(item.marketCap / 1000000000)}B
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<ScreenShareIcon />}
          onClick={handleScreenShare}
        >
          Share Market Data Screen
        </Button>
      </Box>
      
      {/* Contracts Tab */}
      <Box sx={{ display: currentTab === 1 ? 'block' : 'none', flex: 1, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Contract Specifications
        </Typography>
        <Box 
          sx={{ 
            maxHeight: 400, 
            overflow: 'auto', 
            border: '1px solid #e0e0e0', 
            borderRadius: 1,
            mb: 2
          }}
        >
          <List>
            {contracts.map((contract) => (
              <ListItem key={contract.id} divider>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={4}>
                    <ListItemText 
                      primary={contract.name} 
                      secondary={contract.type} 
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      Contract Size: {formatNumber(contract.size)}
                    </Typography>
                    <Typography variant="body2">
                      Price: {formatCurrency(contract.price)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      Margin: {formatCurrency(contract.margin)}
                    </Typography>
                    {contract.expiry && (
                      <Typography variant="body2">
                        Expiry: {contract.expiry.toLocaleDateString()}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      size="small"
                      onClick={() => setShowContractDetails(true)}
                    >
                      <Tooltip title="View Details">
                        <InfoIcon />
                      </Tooltip>
                    </IconButton>
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
        >
          Download Contract Specifications
        </Button>
      </Box>
      
      {/* Discussion Tab */}
      <Box sx={{ display: currentTab === 2 ? 'block' : 'none', flex: 1, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Session Discussion
        </Typography>
        <Box 
          sx={{ 
            maxHeight: 300, 
            overflow: 'auto', 
            border: '1px solid #e0e0e0', 
            borderRadius: 1,
            mb: 2,
            p: 1
          }}
        >
          {comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No comments yet. Start the discussion about financial products.
            </Typography>
          ) : (
            <List>
              {comments.map((comment) => (
                <ListItem key={comment.id} alignItems="flex-start" divider>
                  <ListItemAvatar>
                    <Avatar>
                      {comment.user.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {comment.user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {comment.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                    secondary={comment.text}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <Button variant="contained" onClick={handleAddComment}>
            <CommentIcon />
          </Button>
        </Box>
      </Box>
      
      {/* Product Details Tab */}
      {product && (
        <Box 
          ref={containerRef}
          sx={{ 
            display: currentTab === 3 ? 'block' : 'none', 
            flex: 1, 
            overflow: 'auto',
            position: 'relative',
            cursor: isAnnotating ? 'crosshair' : 'default'
          }}
          onClick={handleContainerClick}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              {product.name}
            </Typography>
            <Box>
              <Tooltip title="Add annotation">
                <IconButton
                  color={isAnnotating ? 'primary' : 'default'}
                  onClick={handleAnnotationStart}
                >
                  <HighlightIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Save discussion">
                <IconButton>
                  <SaveIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Product Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {/* Render product details here */}
            {product.details && Object.entries(product.details).map(([key, value]) => (
              <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {typeof value === 'number' && key.toLowerCase().includes('price') 
                    ? formatCurrency(value as number)
                    : typeof value === 'number' 
                      ? value.toString() 
                      : value as string}
                </Typography>
              </Box>
            ))}
          </Paper>
          
          {/* Render annotations */}
          {annotations.map((annotation) => (
            <Box
              key={annotation.id}
              sx={{
                position: 'absolute',
                left: `${annotation.position.x}%`,
                top: `${annotation.position.y}%`,
                transform: 'translate(-50%, -50%)',
                bgcolor: annotation.color,
                color: 'white',
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 5
              }}
              title={`${annotation.user.name}: ${annotation.content}`}
            >
              <TagIcon fontSize="small" />
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default FinancialInteraction;

// Helper component for the InfoIcon
const InfoIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
); 