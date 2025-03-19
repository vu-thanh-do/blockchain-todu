import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import config from '../config';
import { loadContractABI, numberToRole, numberToStatus } from '../utils/blockchain';

class ContractService {
  private web3: Web3;
  private contractAddress: string;
  private contractABI: AbiItem[];
  private contract: any;

  constructor() {
    this.web3 = new Web3(config.blockchainNetwork);
    this.contractAddress = '0xd9145CCE52D386f254917e481eB44e9943F39138'; // Điền địa chỉ contract sau khi deploy
    this.contractABI = loadContractABI() as AbiItem[];
    this.initContract();
  }

  private initContract() {
    try {
      if (this.contractAddress && this.contractABI.length > 0) {
        this.contract = new this.web3.eth.Contract(
          this.contractABI,
          this.contractAddress
        );
      } else {
        console.warn('Contract address or ABI not provided');
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  }

  // Set địa chỉ contract sau khi deploy
  public setContractAddress(address: string) {
    this.contractAddress = address;
    this.initContract();
  }

  // Tạo người dùng mới
  public async createUser(
    fromAddress: string,
    privateKey: string,
    userAddress: string,
    name: string,
    role: number
  ) {
    try {
      const data = this.contract.methods.createUser(userAddress, name, role).encodeABI();
      const tx = {
        from: fromAddress,
        to: this.contractAddress,
        gas: 2000000,
        data
      };
      
      const signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
      
      if (signedTx.rawTransaction) {
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;
      }
      throw new Error('Failed to sign transaction');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Tạo task mới
  public async createTask(
    fromAddress: string,
    privateKey: string,
    title: string,
    description: string,
    ipfsHash: string = ''
  ) {
    try {
      const data = this.contract.methods.createTask(title, description, ipfsHash).encodeABI();
      const tx = {
        from: fromAddress,
        to: this.contractAddress,
        gas: 2000000,
        data
      };
      
      const signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
      
      if (signedTx.rawTransaction) {
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;
      }
      throw new Error('Failed to sign transaction');
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Gán task
  public async assignTask(
    fromAddress: string,
    privateKey: string,
    taskId: number,
    assigneeAddress: string
  ) {
    try {
      const data = this.contract.methods.assignTask(taskId, assigneeAddress).encodeABI();
      const tx = {
        from: fromAddress,
        to: this.contractAddress,
        gas: 2000000,
        data
      };
      
      const signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
      
      if (signedTx.rawTransaction) {
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;
      }
      throw new Error('Failed to sign transaction');
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }

  // Cập nhật trạng thái task
  public async updateTaskStatus(
    fromAddress: string,
    privateKey: string,
    taskId: number,
    status: number
  ) {
    try {
      const data = this.contract.methods.updateTaskStatus(taskId, status).encodeABI();
      const tx = {
        from: fromAddress,
        to: this.contractAddress,
        gas: 2000000,
        data
      };
      
      const signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
      
      if (signedTx.rawTransaction) {
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        return receipt;
      }
      throw new Error('Failed to sign transaction');
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Lấy thông tin người dùng
  public async getUserByAddress(address: string) {
    try {
      const user = await this.contract.methods.getUser(address).call();
      return {
        address: user.userAddress,
        name: user.name,
        role: numberToRole(parseInt(user.role)),
        active: user.active
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Lấy vai trò người dùng
  public async getUserRole(address: string) {
    try {
      const role = await this.contract.methods.getUserRole(address).call();
      return numberToRole(parseInt(role));
    } catch (error) {
      console.error('Error getting user role:', error);
      throw error;
    }
  }

  // Lấy thông tin task
  public async getTask(taskId: number) {
    try {
      const task = await this.contract.methods.getTask(taskId).call();
      return {
        id: taskId,
        title: task.title,
        description: task.description,
        status: numberToStatus(parseInt(task.status)),
        createdBy: task.createdBy,
        assignee: task.assignee,
        createdAt: new Date(parseInt(task.createdAt) * 1000).toISOString(),
        updatedAt: new Date(parseInt(task.updatedAt) * 1000).toISOString(),
        ipfsHash: task.ipfsHash
      };
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  }

  // Lấy tất cả task
  public async getAllTasks() {
    try {
      const tasks = await this.contract.methods.getAllTasks().call();
      return tasks.map((task: any, index: number) => ({
        id: index,
        title: task.title,
        description: task.description,
        status: numberToStatus(parseInt(task.status)),
        createdBy: task.createdBy,
        assignee: task.assignee,
        createdAt: new Date(parseInt(task.createdAt) * 1000).toISOString(),
        updatedAt: new Date(parseInt(task.updatedAt) * 1000).toISOString(),
        ipfsHash: task.ipfsHash
      }));
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw error;
    }
  }

  // Lấy tất cả users
  public async getAllUsers() {
    try {
      const users = await this.contract.methods.getAllUsers().call();
      return users.map((user: any) => ({
        address: user.userAddress,
        name: user.name,
        role: numberToRole(parseInt(user.role)),
        active: user.active
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Lấy thông tin transaction từ blockchain
  public async getTransactionReceipt(txHash: string) {
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      return null;
    }
  }
}

export default new ContractService(); 