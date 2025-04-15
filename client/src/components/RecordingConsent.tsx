import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Videocam,
  ScreenShare,
  Security,
  Lock,
  Timer,
  Delete
} from '@mui/icons-material';

interface RecordingConsentProps {
  onConsent: (type: 'video' | 'screen' | 'both') => void;
  onDeny: () => void;
}

const RecordingConsent: React.FC<RecordingConsentProps> = ({ onConsent, onDeny }) => {
  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogTitle>Recording Consent Required</DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Your healthcare provider would like to record this session. Please review the following information:
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText 
              primary="End-to-End Encryption" 
              secondary="All recordings are encrypted and can only be accessed by authorized personnel"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Lock />
            </ListItemIcon>
            <ListItemText 
              primary="HIPAA Compliant" 
              secondary="Recordings are stored in compliance with healthcare regulations"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Timer />
            </ListItemIcon>
            <ListItemText 
              primary="Limited Retention" 
              secondary="Recordings are automatically deleted after the retention period"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Delete />
            </ListItemIcon>
            <ListItemText 
              primary="Right to Delete" 
              secondary="You can request deletion of the recording at any time"
            />
          </ListItem>
        </List>

        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>
            What would you like to allow recording?
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onDeny} color="primary">
          Deny All Recording
        </Button>
        <Button
          onClick={() => onConsent('video')}
          color="primary"
          startIcon={<Videocam />}
        >
          Video Only
        </Button>
        <Button
          onClick={() => onConsent('screen')}
          color="primary"
          startIcon={<ScreenShare />}
        >
          Screen Only
        </Button>
        <Button
          onClick={() => onConsent('both')}
          color="primary"
          variant="contained"
        >
          Allow Both
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordingConsent; 