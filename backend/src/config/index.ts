import dotenv from 'dotenv';

// Tải biến môi trường từ file .env
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/todolist-blockchain',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_key',
  blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || 'http://localhost:8545',
  blockchainNetworkId: process.env.BLOCKCHAIN_NETWORK_ID || '1337',
  shyftApiKey: process.env.SHYFT_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default config; 