import Web3 from 'web3';
import axios from 'axios';
import config from '../config';

// Khởi tạo Web3 với provider
export const web3 = new Web3(config.blockchainNetwork);

// Interface cho wallet
export interface Wallet {
  address: string;
  privateKey: string;
}

// Tạo ví mới
export const createWallet = (): Wallet => {
  const account = web3.eth.accounts.create();
  return {
    address: account.address,
    privateKey: account.privateKey
  };
};

// Lấy địa chỉ ví từ private key
export const getAddressFromPrivateKey = (privateKey: string): string => {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  return account.address;
};

// Hàm tạo ví bằng Shyft API
export const createWalletWithShyft = async (): Promise<Wallet> => {
  try {
    const response = await axios.post(
      'https://api.shyft.to/sol/v1/wallet/create',
      {},
      {
        headers: {
          'x-api-key': config.shyftApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      return {
        address: response.data.result.wallet_address,
        privateKey: response.data.result.private_key
      };
    }
    throw new Error('Failed to create wallet with Shyft');
  } catch (error) {
    console.error('Error creating wallet with Shyft:', error);
    // Fallback to local wallet creation
    return createWallet();
  }
};

// Đọc ABI từ file contract
export const loadContractABI = () => {
  try {
    // Đọc ABI từ file hoặc hardcode
    const abi: any[] = [];
    return abi;
  } catch (error) {
    console.error('Error loading contract ABI:', error);
    return [];
  }
};

// Mã hóa role thành số
export const roleToNumber = (role: string): number => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 0;
    case 'teamlead':
      return 1;
    case 'employee':
      return 2;
    default:
      return 2; // Mặc định là employee
  }
};

// Chuyển số thành role
export const numberToRole = (roleNumber: number): string => {
  switch (roleNumber) {
    case 0:
      return 'admin';
    case 1:
      return 'teamLead';
    case 2:
      return 'employee';
    default:
      return 'unknown';
  }
};

// Mã hóa status thành số
export const statusToNumber = (status: string): number => {
  switch (status.toLowerCase()) {
    case 'created':
      return 0;
    case 'assigned':
      return 1;
    case 'in_progress':
      return 2;
    case 'completed':
      return 3;
    case 'rejected':
      return 4;
    default:
      return 0;
  }
};

// Chuyển số thành status
export const numberToStatus = (statusNumber: number): string => {
  switch (statusNumber) {
    case 0:
      return 'created';
    case 1:
      return 'assigned';
    case 2:
      return 'in_progress';
    case 3:
      return 'completed';
    case 4:
      return 'rejected';
    default:
      return 'unknown';
  }
}; 