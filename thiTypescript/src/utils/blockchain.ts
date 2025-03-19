import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import TaskManagementABI from '../assets/TaskManagementABI_new.json';

// Địa chỉ smart contract TaskManagement trên Ganache
const contractAddress = '0xd9145CCE52D386f254917e481eB44e9943F39138'; // Thay thế bằng địa chỉ contract sau khi triển khai trên Ganache

// Hàm lấy provider và signer
export const getProviderAndSigner = async () => {
  try {
    const web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions: {},
    });
    
    // Tự động kết nối nếu đã có phiên trước đó
    let instance;
    if (web3Modal.cachedProvider) {
      instance = await web3Modal.connect();
    } else {
      instance = await web3Modal.connect();
    }
    
    const provider = new ethers.providers.Web3Provider(instance);
    const signer = provider.getSigner();
    
    return { provider, signer };
  } catch (error) {
    console.error('Lỗi kết nối đến blockchain:', error);
    throw error;
  }
}; 

// Hàm lấy contract instance
export const getContract = async () => {
  try {
    const { provider, signer } = await getProviderAndSigner();
    const contract = new ethers.Contract(
      contractAddress,
      TaskManagementABI,
      signer
    );
    
    return { contract, provider, signer };
  } catch (error) {
    console.error('Lỗi lấy contract instance:', error);
    throw error;
  }
};

// Lấy địa chỉ ví hiện tại
export const getCurrentWalletAddress = async () => {
  try {
    const { signer } = await getProviderAndSigner();
    return await signer.getAddress();
  } catch (error) {
    console.error('Lỗi lấy địa chỉ ví:', error);
    return null;
  }
};

// Lấy vai trò người dùng
export const getUserRole = async () => {
  try {
    const { contract } = await getContract();
    const walletAddress = await getCurrentWalletAddress();
    
    if (!walletAddress) return null;
    
    const role = await contract.getUserRole(walletAddress);
    return Number(role); // 0: Employee, 1: TeamLead, 2: Admin
  } catch (error) {
    console.error('Lỗi lấy vai trò người dùng:', error);
    return null;
  }
};

// Chuyển đổi từ enum Role sang string
export const roleToString = (roleNumber: number) => {
  switch (roleNumber) {
    case 0: return 'employee';
    case 1: return 'teamLead';
    case 2: return 'admin';
    default: return 'unknown';
  }
};

// Chuyển đổi từ enum TaskStatus sang string
export const taskStatusToString = (statusNumber: number) => {
  switch (statusNumber) {
    case 0: return 'created';
    case 1: return 'assigned';
    case 2: return 'in_progress';
    case 3: return 'completed';
    case 4: return 'rejected';
    default: return 'unknown';
  }
};

// Chuyển đổi từ string sang enum TaskStatus
export const stringToTaskStatus = (status: string) => {
  switch (status) {
    case 'created': return 0;
    case 'assigned': return 1;
    case 'in_progress': return 2;
    case 'completed': return 3;
    case 'rejected': return 4;
    default: return 0;
  }
}; 