import axios from 'axios';

// Tạo instance axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // Mặc định timeout 10 giây
});

// Thêm interceptor để xử lý token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý lỗi response
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.warn('API Error:', error.message);
    if (error.response && error.response.status === 401) {
      // Xử lý lỗi authentication nếu cần
      localStorage.removeItem('token');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('userRole');
      // Có thể chuyển hướng người dùng về trang đăng nhập
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const login = async (privateKey: string) => {
  const response = await api.post('/auth/login', { privateKey });
  return response.data;
};

export const loginWithMetaMask = async (address: string) => {
  // Gọi API để xác thực và đăng nhập bằng địa chỉ MetaMask
  const response = await api.post('/auth/login-metamask', { address });
  return response.data;
};

export const register = async (username: string, role: string = 'employee', walletAddress?: string) => {
  const data: any = { username, role };
  if (walletAddress) {
    data.walletAddress = walletAddress;
  }
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// User APIs
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};
export const deleteUser = async (userId: string) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};
export const getUserById = async (id: string) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData: { 
  username: string; 
  role: string;
  walletAddress?: string;
  privateKey?: string;
  txHash?: string;
}) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id: string, userData: { username?: string; role?: string; status?: string }) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deactivateUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Task APIs
export const getTasks = async (filters = {}) => {
  const response = await api.get('/tasks', { params: filters });
  return response.data;
};

export const getTaskById = async (id: string) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (taskData: any) => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    // throw handleApiError(error);
  }
};

export const updateTask = async (id: string, taskData: {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  ipfsHash?: string;
}) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const assignTask = async (id: string, assignee: string, txHash?: string) => {
  const payload: any = { assignee };
  if (txHash) {
    payload.txHash = txHash;
  }
  const response = await api.put(`/tasks/${id}/assign`, payload);
  return response.data;
};

export const updateTaskStatus = async (id: string, status: string, txHash?: string) => {
  const payload: any = { status };
  if (txHash) {
    payload.txHash = txHash;
  }
  const response = await api.put(`/tasks/${id}/status`, payload);
  return response.data;
};

// Lấy lịch sử trạng thái của task
export const getTaskStatusHistory = async (taskId: string) => {
  try {
    const response = await api.get(`/tasks/${taskId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task status history:', error);
    return {
      success: false,
      message: 'Không thể lấy lịch sử trạng thái task',
      data: []
    };
  }
};

// Comment APIs
export const getCommentsByTaskId = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
};

export const addComment = async (taskId: string, content: string) => {
  const response = await api.post(`/tasks/${taskId}/comments`, { content });
  return response.data;
};

export const deleteComment = async (id: string) => {
  const response = await api.delete(`/comments/${id}`);
  return response.data;
};

// Wallet APIs
export const getWalletBalance = async () => {
  try {
    const response = await api.get('/wallet/balance', {
      timeout: 5000, // Timeout sau 5 giây
    });
    return response.data;
  } catch (error) {
    console.error('Error in getWalletBalance API call:', error);
    // Trả về dữ liệu mặc định với success: false
    return {
      success: false, 
      data: { balance: '0' },
      message: 'Không thể lấy số dư ví. Vui lòng thử lại sau.'
    };
  }
};

export const getBlockchainTransactionReceipt = async (txHash: string) => {
  try {
    const response = await api.get(`/blockchain/transaction/${txHash}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching blockchain transaction receipt:', error);
    return {
      success: false,
      message: 'Không thể lấy chi tiết giao dịch từ blockchain',
      data: null
    };
  }
};

export const verifyTransactionOnBlockchain = async (txHash: string) => {
  try {
    const response = await api.post('/blockchain/verify', { txHash });
    return response.data;
  } catch (error) {
    console.error('Error verifying transaction on blockchain:', error);
    return {
      success: false,
      message: 'Không thể xác minh giao dịch trên blockchain',
      verified: false
    };
  }
};

export const sendTransaction = async (toAddress: string, amount: number, privateKey: string) => {
  const response = await api.post('/wallet/send', { toAddress, amount, privateKey });
  return response.data;
};

export const getTransactionHistory = async (page = 1, limit = 10) => {
  const response = await api.get('/wallet/transactions', { params: { page, limit } });
  return response.data;
};

// Lưu transaction mới
export const saveTransaction = async (transactionData: any) => {
  try {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy transaction theo hash
export const getTransactionByHash = async (txHash: string) => {
  const response = await api.get(`/transactions/${txHash}`);
  return response.data;
};

// Lấy danh sách transaction theo địa chỉ ví
export const getTransactionsByAddress = async (
  address: string,
  page = 1,
  limit = 10,
  type?: string,
  status?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (type) params.append('type', type);
  if (status) params.append('status', status);

  const response = await api.get(`/transactions/address/${address}?${params}`);
  return response.data;
};

// Lấy danh sách transaction theo loại
export const getTransactionsByType = async (
  type: string,
  page = 1,
  limit = 10,
  status?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (status) params.append('status', status);

  const response = await api.get(`/transactions/type/${type}?${params}`);
  return response.data;
};

// Verify transaction trên blockchain
export const verifyTransaction = async (txHash: string) => {
  const response = await api.post(`/transactions/verify/${txHash}`);
  return response.data;
};

// Lấy nonce cho địa chỉ ví
export const getNonce = async (address: string) => {
  const response = await api.get(`/auth/nonce/${address}`);
  return response.data.data.nonce;
};

// Verify chữ ký MetaMask
export const verifySignature = async (
  address: string,
  message: string,
  signature: string
) => {
  const response = await api.post('/auth/verify-signature', {
    address,
    message,
    signature
  });
  return response.data;
};

// Kiểm tra địa chỉ ví
export const checkWalletAddress = async (address: string) => {
  const response = await api.get(`/users/check-wallet/${address}`);
  return response.data;
};

export const updateTaskProgress = async (taskId: string, data: {
  progress: number;
  status: string;
  comment: string;
}) => {
  try {
    const response = await api.put(
      `/tasks/${taskId}/progress`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}; 