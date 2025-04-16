import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import SignatureCanvas from 'react-signature-canvas';

interface ContractProps {
  productName: string;
  productDetails: {
    type: string;
    amount: number;
    term: string;
    interestRate: number;
  };
}

const Contract: React.FC<ContractProps> = ({ productName, productDetails }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const steps = ['Review Terms', 'Personal Information', 'Sign Contract'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignature(null);
    }
  };

  const handleSaveSignature = () => {
    if (signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL();
      setSignature(signatureData);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contract Terms for {productName}
            </Typography>
            <Typography paragraph>
              This agreement is made between [Financial Institution] and the Client for the following product:
            </Typography>
            <Typography variant="body2" paragraph>
              Product Type: {productDetails.type}
            </Typography>
            <Typography variant="body2" paragraph>
              Investment Amount: ${productDetails.amount}
            </Typography>
            <Typography variant="body2" paragraph>
              Term: {productDetails.term}
            </Typography>
            <Typography variant="body2" paragraph>
              Interest Rate: {productDetails.interestRate}%
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
              }
              label="I have read and agree to the terms and conditions"
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Full Name"
                variant="outlined"
                fullWidth
              />
              <TextField
                label="Date of Birth"
                type="date"
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Address"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                label="Phone Number"
                variant="outlined"
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                fullWidth
              />
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Digital Signature
            </Typography>
            <Typography paragraph>
              Please sign below to complete the contract:
            </Typography>
            <Paper
              sx={{
                border: '1px solid #ccc',
                my: 2,
                width: '100%',
                height: 200,
              }}
            >
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: '100%',
                  height: 200,
                  className: 'signature-canvas',
                }}
              />
            </Paper>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button variant="outlined" onClick={handleClearSignature}>
                Clear Signature
              </Button>
              <Button variant="contained" onClick={handleSaveSignature}>
                Save Signature
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={activeStep === 0 && !agreed}
        >
          {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default Contract; 