import { ethers } from 'ethers';
import { getContract, getCurrentWalletAddress, taskStatusToString, stringToTaskStatus } from '../utils/blockchain';

// Interface cho Task từ blockchain
export interface BlockchainTask {
  id: number;
  title: string;
  description: string;
  ipfsHash: string;
  assignedTo: string;
  createdBy: string;
  status: number;
  createdAt: number;
  updatedAt: number;
}

// Interface cho User từ blockchain
export interface BlockchainUser {
  userAddress: string;
  name: string;
  role: number;
  isActive: boolean;
}

// Interface cho TransactionEvent
interface TransactionEvent {
  event: string;
  args: {
    id?: ethers.BigNumber;
    [key: string]: any;
  };
}

// Service quản lý người dùng
export const UserService = {
  // Lấy danh sách người dùng
  async getUsers(): Promise<BlockchainUser[]> {
    try {
      const { contract } = await getContract();
      const userCount = await contract.getUsersCount();
      
      const users: BlockchainUser[] = [];
      for (let i = 0; i < userCount; i++) {
        const userAddress = await contract.userAddresses(i);
        const user = await contract.users(userAddress);
        users.push({
          userAddress: user.userAddress,
          name: user.name,
          role: Number(user.role),
          isActive: user.isActive
        });
      }
      
      return users;
    } catch (error) {
      console.error('Lỗi lấy danh sách người dùng:', error);
      throw error;
    }
  },
  
  // Tạo người dùng mới
  async createUser(address: string, name: string, role: number): Promise<void> {
    try {
      const { contract } = await getContract();
      const tx = await contract.createUser(address, name, role);
      await tx.wait();
    } catch (error) {
      console.error('Lỗi tạo người dùng:', error);
      throw error;
    }
  }
};

// Service quản lý nhiệm vụ
export const TaskService = {
  // Lấy danh sách nhiệm vụ
  async getTasks(): Promise<BlockchainTask[]> {
    try {
      const { contract } = await getContract();
      const taskCount = await contract.getTasksCount();
      
      const tasks: BlockchainTask[] = [];
      for (let i = 0; i < taskCount; i++) {
        const task = await contract.tasks(i);
        tasks.push({
          id: Number(task.id),
          title: task.title,
          description: task.description,
          ipfsHash: task.ipfsHash,
          assignedTo: task.assignedTo,
          createdBy: task.createdBy,
          status: Number(task.status),
          createdAt: Number(task.createdAt),
          updatedAt: Number(task.updatedAt)
        });
      }
      
      return tasks;
    } catch (error) {
      console.error('Lỗi lấy danh sách nhiệm vụ:', error);
      throw error;
    }
  },
  
  // Tạo nhiệm vụ mới
  async createTask(title: string, description: string, ipfsHash: string = ''): Promise<number> {
    try {
      const { contract } = await getContract();
      const tx = await contract.createTask(title, description, ipfsHash);
      const receipt = await tx.wait();
      
      // Lấy ID của task mới tạo từ event
      const event = receipt.events?.find((event: TransactionEvent) => event.event === 'TaskCreated');
      const taskId = event?.args?.id || 0;
      
      return Number(taskId);
    } catch (error) {
      console.error('Lỗi tạo nhiệm vụ:', error);
      throw error;
    }
  },
  
  // Phân công nhiệm vụ
  async assignTask(taskId: number, assigneeAddress: string): Promise<void> {
    try {
      const { contract } = await getContract();
      const tx = await contract.assignTask(taskId, assigneeAddress);
      await tx.wait();
    } catch (error) {
      console.error('Lỗi phân công nhiệm vụ:', error);
      throw error;
    }
  },
  
  // Cập nhật trạng thái nhiệm vụ
  async updateTaskStatus(taskId: number, status: string): Promise<void> {
    try {
      const { contract } = await getContract();
      const statusEnum = stringToTaskStatus(status);
      const tx = await contract.updateTaskStatus(taskId, statusEnum);
      await tx.wait();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái nhiệm vụ:', error);
      throw error;
    }
  }
};

// Wallet Service - quản lý kết nối ví
export const WalletService = {
  // Kết nối ví
  async connectWallet(): Promise<string | null> {
    try {
      const address = await getCurrentWalletAddress();
      return address;
    } catch (error) {
      console.error('Lỗi kết nối ví:', error);
      return null;
    }
  },
  
  // Kiểm tra xem ví đã kết nối chưa
  async isConnected(): Promise<boolean> {
    try {
      const address = await getCurrentWalletAddress();
      return !!address;
    } catch (error) {
      return false;
    }
  }
}; 