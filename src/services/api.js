import axios from 'axios';

const API_URL = 'https://personal-budget-tracker-backend-19af.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
};

// Transaction services
export const transactionService = {
  getAll: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
  create: async (transaction) => {
    const response = await api.post('/transactions', transaction);
    return response.data;
  },
  update: async (id, transaction) => {
    const response = await api.put(`/transactions/${id}`, transaction);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
  // Update the getSummary function in transactionService
  getSummary: async (params = {}) => {
    // If month and year are provided, convert them to startDate and endDate
    if (params.month && params.year) {
      const year = params.year;
      const month = params.month;
      
      // Create start date (first day of month)
      const startDate = new Date(year, month - 1, 1);
      
      // Create end date (last day of month)
      const endDate = new Date(year, month, 0);
      
      // Format dates as YYYY-MM-DD
      params.startDate = startDate.toISOString().split('T')[0];
      params.endDate = endDate.toISOString().split('T')[0];
      
      // Remove month and year from params
      delete params.month;
      delete params.year;
    }
    
    const response = await api.get('/transactions/summary', { params });
    return response.data.summary || { totalIncome: 0, totalExpenses: 0, balance: 0 };
  },
};

// Category services
export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
  create: async (category) => {
    const response = await api.post('/categories', category);
    return response.data;
  },
  update: async (id, category) => {
    const response = await api.put(`/categories/${id}`, category);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Budget services
export const budgetService = {
  getAll: async (params = {}) => {
    const response = await api.get('/budgets', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
  },
  create: async (budget) => {
    const response = await api.post('/budgets', budget);
    return response.data;
  },
  update: async (id, budget) => {
    const response = await api.put(`/budgets/${id}`, budget);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
  compareWithActual: async (params = {}) => {
    const response = await api.get('/budgets/compare', { params });
    return response.data;
  },
};

// Export the API instance for other services to use
export default api;