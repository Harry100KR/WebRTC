import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Drawer,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ScreenShare from '../ScreenShare/ScreenShare';
import Recording from '../Recording/Recording';
import FinancialProducts from '../FinancialProducts/FinancialProducts';
import Contract from '../Contract/Contract';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface FinancialProduct {
  id: string;
  name: string;
  type: string;
  description: string;
  interestRate: number;
  term: string;
  minimumInvestment: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  historicalReturns: number[];
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const VideoChat: React.FC = () => {
  const theme = useTheme();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<FinancialProduct | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          localStream.removeTrack(track);
        });
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => {
          track.stop();
          screenStream.removeTrack(track);
        });
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, []);

  const handleScreenStream = (stream: MediaStream | null) => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
        screenStream.removeTrack(track);
      });
    }
    setScreenStream(stream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProductSelect = (product: FinancialProduct) => {
    setSelectedProduct(product);
    setTabValue(2); // Switch to Contract tab
    setDrawerOpen(false); // Close drawer on mobile after selection
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Grid container spacing={2} sx={{ flex: 1, p: 2 }}>
        {/* Video Streams */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
            {/* Local Video */}
            <Paper
              elevation={3}
              sx={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: theme.palette.grey[900],
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '2px 8px',
                  borderRadius: 1,
                }}
              >
                You
              </Typography>
            </Paper>

            {/* Remote Video / Screen Share */}
            <Paper
              elevation={3}
              sx={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: theme.palette.grey[900],
              }}
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '2px 8px',
                  borderRadius: 1,
                }}
              >
                Remote / Screen Share
              </Typography>
            </Paper>
          </Box>
        </Grid>

        {/* Controls and Features */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="video chat features"
              >
                <Tab label="Controls" />
                <Tab label="Products" />
                <Tab label="Contract" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <ScreenShare onScreenStream={handleScreenStream} />
                <Recording stream={localStream} />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <FinancialProducts onProductSelect={handleProductSelect} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {selectedProduct ? (
                <Contract
                  productName={selectedProduct.name}
                  productDetails={{
                    type: selectedProduct.type,
                    amount: selectedProduct.minimumInvestment,
                    term: selectedProduct.term,
                    interestRate: selectedProduct.interestRate
                  }}
                />
              ) : (
                <Typography>
                  Please select a product to view the contract
                </Typography>
              )}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Drawer for mobile view */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            height: '70%',
          },
        }}
      >
        <Box sx={{ position: 'relative', p: 2 }}>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ mt: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="video chat features mobile"
            >
              <Tab label="Controls" />
              <Tab label="Products" />
              <Tab label="Contract" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <ScreenShare onScreenStream={handleScreenStream} />
                <Recording stream={localStream} />
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <FinancialProducts onProductSelect={handleProductSelect} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {selectedProduct ? (
                <Contract
                  productName={selectedProduct.name}
                  productDetails={{
                    type: selectedProduct.type,
                    amount: selectedProduct.minimumInvestment,
                    term: selectedProduct.term,
                    interestRate: selectedProduct.interestRate
                  }}
                />
              ) : (
                <Typography>
                  Please select a product to view the contract
                </Typography>
              )}
            </TabPanel>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default VideoChat; 