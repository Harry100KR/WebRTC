import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { motion } from 'framer-motion';
import { register } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

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
            Create Account
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Join us to explore financial opportunities
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
          initialValues={{
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            const { confirmPassword, ...registerData } = values;
            const resultAction = await dispatch(register(registerData));
            if (register.fulfilled.match(resultAction)) {
              navigate('/');
            }
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur }) => (
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label="Full Name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
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
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
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
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      id="confirmPassword"
                      name="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.confirmPassword && Boolean(errors.confirmPassword)
                      }
                      helperText={
                        touched.confirmPassword && errors.confirmPassword
                      }
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        mt: 2,
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
                        'Create Account'
                      )}
                    </Button>
                  </motion.div>
                </Grid>
              </Grid>

              <motion.div
                variants={itemVariants}
                style={{ textAlign: 'center', marginTop: '16px' }}
              >
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/login"
                    sx={{
                      textDecoration: 'none',
                      fontWeight: 'medium',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign in here
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

export default RegisterPage; 