import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { LineChart } from '@mui/x-charts';

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

interface FinancialProductsProps {
  onProductSelect?: (product: FinancialProduct) => void;
}

const sampleProducts: FinancialProduct[] = [
  {
    id: '1',
    name: 'Conservative Savings Plan',
    type: 'Savings',
    description: 'A low-risk savings product with guaranteed returns',
    interestRate: 2.5,
    term: '12 months',
    minimumInvestment: 1000,
    riskLevel: 'Low',
    historicalReturns: [2.3, 2.4, 2.5, 2.4, 2.6, 2.5]
  },
  {
    id: '2',
    name: 'Growth Investment Fund',
    type: 'Investment',
    description: 'A balanced investment fund focusing on long-term growth',
    interestRate: 7.5,
    term: '36 months',
    minimumInvestment: 5000,
    riskLevel: 'Medium',
    historicalReturns: [6.8, 7.2, 7.5, 7.8, 7.4, 7.6]
  }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const FinancialProducts: React.FC<FinancialProductsProps> = ({ onProductSelect }) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<FinancialProduct | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProductClick = (product: FinancialProduct) => {
    setSelectedProduct(product);
    setDialogOpen(true);
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        aria-label="financial products tabs"
      >
        <Tab label="All Products" />
        <Tab label="Savings" />
        <Tab label="Investments" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {sampleProducts.map((product) => (
            <Grid item xs={12} md={6} key={product.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6 }
                }}
                onClick={() => handleProductClick(product)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {product.type}
                  </Typography>
                  <Typography variant="body2">
                    Interest Rate: {product.interestRate}%
                  </Typography>
                  <Typography variant="body2">
                    Risk Level: {product.riskLevel}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {sampleProducts
            .filter((product) => product.type === 'Savings')
            .map((product) => (
              <Grid item xs={12} md={6} key={product.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography variant="body2">
                      Interest Rate: {product.interestRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {sampleProducts
            .filter((product) => product.type === 'Investment')
            .map((product) => (
              <Grid item xs={12} md={6} key={product.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 6 }
                  }}
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography variant="body2">
                      Expected Return: {product.interestRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </TabPanel>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle>{selectedProduct.name}</DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedProduct.description}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Type: {selectedProduct.type}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Interest Rate: {selectedProduct.interestRate}%
              </Typography>
              <Typography variant="body2" gutterBottom>
                Minimum Investment: ${selectedProduct.minimumInvestment}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Term: {selectedProduct.term}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Risk Level: {selectedProduct.riskLevel}
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Historical Performance
                </Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <LineChart
                    xAxis={[{ data: [1, 2, 3, 4, 5, 6] }]}
                    series={[
                      {
                        data: selectedProduct.historicalReturns,
                        area: true,
                      },
                    ]}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="contained" color="primary">
                Request More Information
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FinancialProducts; 