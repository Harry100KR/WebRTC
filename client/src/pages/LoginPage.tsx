import React from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { login } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';

const MotionContainer = styled(motion(Container))({});
const MotionPaper = motion(Paper);

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const from = location.state?.from?.pathname || '/';

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <MotionContainer
      maxWidth="sm"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <MotionPaper
        elevation={3}
        sx={{
          p: 4,
          mt: 8,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <motion.div variants={itemVariants}>
          <Typography
            component="h1"
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Welcome Back
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Please sign in to access your account
          </Typography>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            const resultAction = await dispatch(login(values));
            if (login.fulfilled.match(resultAction)) {
              navigate(from, { replace: true });
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur }) => (
            <Form>
              <motion.div variants={itemVariants}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  sx={{ mb: 2 }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  sx={{ mb: 3 }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </motion.div>

              <motion.div
                variants={itemVariants}
                style={{ textAlign: 'center', marginTop: '16px' }}
              >
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
                    sx={{
                      textDecoration: 'none',
                      fontWeight: 'medium',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign up here
                  </Link>
                </Typography>
              </motion.div>
            </Form>
          )}
        </Formik>
      </MotionPaper>
    </MotionContainer>
  );
};

export default LoginPage; 