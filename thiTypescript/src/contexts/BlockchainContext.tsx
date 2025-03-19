import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { ethers } from 'ethers';
import * as ApiService from '../services/ApiService';

// ABI của Smart Contract (giả định)
// Bạn sẽ cần thay thế bằng ABI thực của smart contract
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_taskId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_assignedTo",
				"type": "address"
			}
		],
		"name": "assignTask",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_ipfsHash",
				"type": "string"
			}
		],
		"name": "createTask",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_userAddress",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "enum TaskManagement.Role",
				"name": "_role",
				"type": "uint8"
			}
		],
		"name": "createUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "assignedTo",
				"type": "address"
			}
		],
		"name": "TaskAssigned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "createdBy",
				"type": "address"
			}
		],
		"name": "TaskCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "enum TaskManagement.TaskStatus",
				"name": "status",
				"type": "uint8"
			}
		],
		"name": "TaskStatusChanged",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_taskId",
				"type": "uint256"
			},
			{
				"internalType": "enum TaskManagement.TaskStatus",
				"name": "_status",
				"type": "uint8"
			}
		],
		"name": "updateTaskStatus",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "userAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "enum TaskManagement.Role",
				"name": "role",
				"type": "uint8"
			}
		],
		"name": "UserCreated",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "getTasksCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_userAddress",
				"type": "address"
			}
		],
		"name": "getUserRole",
		"outputs": [
			{
				"internalType": "enum TaskManagement.Role",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getUsersCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "taskCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "tasks",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "assignedTo",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "createdBy",
				"type": "address"
			},
			{
				"internalType": "enum TaskManagement.TaskStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "createdAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "updatedAt",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userAddresses",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "users",
		"outputs": [
			{
				"internalType": "address",
				"name": "userAddress",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "enum TaskManagement.Role",
				"name": "role",
				"type": "uint8"
			},
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

// Địa chỉ của Smart Contract (sẽ cần thay thế bằng địa chỉ thực)
const contractAddress = "0xd9145CCE52D386f254917e481eB44e9943F39138"; 

// Interface cho User đã được chuyển đổi
export interface User {
    _id: string;
    walletAddress: string;
    username: string;
    role: 'admin' | 'teamLead' | 'employee';
    status: 'active' | 'inactive';
    createdAt: string;
}

// Interface cho Task đã được chuyển đổi
export interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
    createdBy: string;
    assignee?: string;
    createdAt: string;
    updatedAt: string;
    ipfsHash?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
}

// Interface cho Blockchain Context
interface BlockchainContextType {
    walletAddress: string | null;
    isConnected: boolean;
    userRole: string | null;
    users: User[];
    tasks: Task[];
    loading: boolean;
    provider: ethers.providers.Web3Provider | null;
    signer: ethers.Signer | null;
    contract: ethers.Contract | null;
    connectWallet: (privateKey?: string) => Promise<void>;
    connectWithMetaMask: () => Promise<void>;
    createWallet: (username: string, role?: string) => Promise<{ address: string, privateKey: string }>;
    fetchUsers: () => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    fetchTasks: () => Promise<void>;
    createUser: (username: string, role: string) => Promise<User>;
    createTask: (title: string, description: string, priority?: string, dueDate?: string, ipfsHash?: string) => Promise<Task>;
    assignTask: (taskId: string, assigneeAddress: string) => Promise<Task>;
    updateTaskStatus: (taskId: string, status: string) => Promise<Task>;
    signMessage: (message: string) => Promise<string>;
    verifySignature: (message: string, signature: string, address: string) => Promise<boolean>;
    handleAccountsChanged: (accounts: string[]) => void;
    handleChainChanged: (chainId: string) => void;
    logout: () => void;
}

// Tạo context
export const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

// Provider Component
export const BlockchainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);

    // Đăng xuất - cần khai báo trước vì được tham chiếu trong useEffect
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('userRole');
        setWalletAddress(null);
        setUserRole(null);
        setIsConnected(false);
        setUsers([]);
        setTasks([]);
        setProvider(null);
        setSigner(null);
        setContract(null);
        message.success('Đăng xuất thành công');
    };

    // Kiểm tra trạng thái đăng nhập khi component mount
    useEffect(() => {
        checkLoginStatus();
        
        // Đăng ký lắng nghe sự kiện thay đổi tài khoản trên MetaMask
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                // Nếu người dùng đã thay đổi tài khoản, cần đăng nhập lại
                if (accounts.length > 0 && walletAddress && accounts[0].toLowerCase() !== walletAddress.toLowerCase()) {
                    message.info('Tài khoản MetaMask đã thay đổi. Vui lòng đăng nhập lại.');
                    logout();
                }
            });

            window.ethereum.on('chainChanged', () => {
                // Nếu mạng thay đổi, reload trang
                window.location.reload();
            });
        }

        // Cleanup listeners khi component unmount
        return () => {
            if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
            }
        };
    }, [walletAddress]);

    // Kiểm tra trạng thái đăng nhập từ localStorage
    const checkLoginStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await ApiService.getCurrentUser();
                    setWalletAddress(userData.data.walletAddress);
                    setUserRole(userData.data.role);
                    setIsConnected(true);
                    
                    // Khởi tạo provider và signer nếu có MetaMask
                    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                        setProvider(web3Provider);
                        const web3Signer = web3Provider.getSigner();
                        setSigner(web3Signer);
                        
                        // Khởi tạo contract
                        const taskContract = new ethers.Contract(contractAddress, contractABI, web3Signer);
                        setContract(taskContract);
                    }
                    
                    // Tải dữ liệu ban đầu
                    await fetchUsers();
                    await fetchTasks();
                } catch (error) {
                    // Token không hợp lệ hoặc hết hạn
                    localStorage.removeItem('token');
                    setIsConnected(false);
                    setWalletAddress(null);
                    setUserRole(null);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Error checking login status:', error);
            setLoading(false);
        }
    };

    // Tạo ví mới (đăng ký)
    const createWallet = async (username: string, role: string = 'employee') => {
        try {
            setLoading(true);
            
            // Tạo wallet mới bằng ethers
            const wallet = ethers.Wallet.createRandom();
            const walletAddress = wallet.address;
            const privateKey = wallet.privateKey;
            
            const result = await ApiService.register(username, role, walletAddress);
            
            if (result.success) {                
                // KHÔNG lưu token và thông tin người dùng để tránh tự động đăng nhập
                // Chỉ trả về kết quả thành công
                message.success('Đã tạo ví mới thành công!');
                
                // Nếu là admin đang thêm user, cập nhật danh sách user
                if (isConnected && userRole === 'admin') {
                    await fetchUsers();
                }
                
                return { address: walletAddress, privateKey };
            } else {
                throw new Error(result.message || 'Lỗi khi tạo ví');
            }
        } catch (error) {
            setLoading(false);
            console.error('Error creating wallet:', error);
            message.error('Lỗi tạo ví: ' + (error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Kết nối ví (đăng nhập) bằng private key
    const connectWallet = async (privateKey?: string) => {
        try {
            setLoading(true);
            
            if (privateKey) {
                // Đăng nhập bằng private key
                const wallet = new ethers.Wallet(privateKey);
                const walletAddress = wallet.address;
                
                const result = await ApiService.login(privateKey);
                
                if (result.success) {
                    const { walletAddress, role, token } = result.data;
                    
                    // Lưu token và thông tin người dùng
                    localStorage.setItem('token', token);
                    localStorage.setItem('walletAddress', walletAddress);
                    localStorage.setItem('userRole', role);
                    setWalletAddress(walletAddress);
                    setUserRole(role);
                    setIsConnected(true);
                    
                    // Khởi tạo provider nếu có MetaMask
                    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
                        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                        setProvider(web3Provider);
                        const web3Signer = web3Provider.getSigner();
                        setSigner(web3Signer);
                        
                        // Khởi tạo contract
                        const taskContract = new ethers.Contract(contractAddress, contractABI, web3Signer);
                        setContract(taskContract);
                    } else {
                        // Fallback nếu không có MetaMask, sử dụng JsonRpcProvider và privateKey
                        const fallbackProvider = new ethers.providers.JsonRpcProvider(
                            "https://eth-sepolia.g.alchemy.com/v2/your-api-key" // Thay thế bằng URL RPC thực tế
                        );
                        // Sử dụng Web3Provider | null nên cần ép kiểu
                        setProvider(fallbackProvider as unknown as ethers.providers.Web3Provider);
                        
                        const wallet = new ethers.Wallet(privateKey, fallbackProvider);
                        setSigner(wallet);
                        
                        // Khởi tạo contract
                        const taskContract = new ethers.Contract(contractAddress, contractABI, wallet);
                        setContract(taskContract);
                    }
                    
                    // Tải dữ liệu ban đầu
                    await fetchUsers();
                    await fetchTasks();
                    
                    message.success('Đăng nhập thành công!');
                } else {
                    throw new Error(result.message || 'Đăng nhập thất bại');
                }
            } else {
                throw new Error('Vui lòng cung cấp private key');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            message.error('Lỗi kết nối ví: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Kết nối với MetaMask
    const connectWithMetaMask = async () => {
        try {
            setLoading(true);
            
            // Kiểm tra xem window.ethereum có tồn tại không
            if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask chưa được cài đặt. Vui lòng cài đặt extension MetaMask.');
            }
            
            // Tạo Web3Provider từ window.ethereum
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            
            // Yêu cầu quyền truy cập tài khoản
            await web3Provider.send("eth_requestAccounts", []);
            const web3Signer = web3Provider.getSigner();
            setSigner(web3Signer);
            
            // Lấy địa chỉ tài khoản
            const address = await web3Signer.getAddress();
            
            if (!address) {
                throw new Error('Không tìm thấy tài khoản MetaMask hoặc quyền truy cập bị từ chối.');
            }
            
            // Khởi tạo contract
            const taskContract = new ethers.Contract(contractAddress, contractABI, web3Signer);
            setContract(taskContract);
            
            try {
                // Gọi API để đăng nhập bằng địa chỉ MetaMask
                const result = await ApiService.loginWithMetaMask(address);
                
                if (result.success) {
                    const { walletAddress, role, token } = result.data;
                    
                    // Lưu token và thông tin người dùng
                    localStorage.setItem('token', token);
                    localStorage.setItem('walletAddress', walletAddress);
                    localStorage.setItem('userRole', role);
                    setWalletAddress(walletAddress);
                    setUserRole(role);
                    setIsConnected(true);
                    
                    // Tải dữ liệu ban đầu
                    await fetchUsers();
                    await fetchTasks();
                    
                    message.success('Đăng nhập bằng MetaMask thành công!');
                } else {
                    throw new Error(result.message || 'Đăng nhập thất bại');
                }
            } catch (apiError) {
                console.error('API error during MetaMask authentication:', apiError);
                
                // Nếu tài khoản chưa đăng ký, thông báo cho người dùng
                message.warning('Địa chỉ ví MetaMask chưa được đăng ký trong hệ thống. Vui lòng đăng ký trước.');
                setIsConnected(false);
                setWalletAddress(null);
                setUserRole(null);
                setProvider(null);
                setSigner(null);
                setContract(null);
            }
        } catch (error) {
            console.error('Error connecting with MetaMask:', error);
            message.error('Lỗi kết nối với MetaMask: ' + (error as Error).message);
            setIsConnected(false);
            setWalletAddress(null);
            setUserRole(null);
            setProvider(null);
            setSigner(null);
            setContract(null);
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách người dùng
    const fetchUsers = async () => {
        try {
            if (!isConnected) return;
            
            const result = await ApiService.getUsers();
            if (result.success) {
                setUsers(result.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // Xử lý lỗi phụ thuộc vào quyền người dùng
            if (userRole === 'employee') {
                // Nhân viên không cần thấy lỗi này
            } else {
                message.error('Lỗi khi tải danh sách người dùng');
            }
        }
    };

    // Xóa người dùng
    const deleteUser = async (userId: string) => {
        try {
            if (!isConnected) return;
            
            const result = await ApiService.deleteUser(userId);
            if (result.success) {
                message.success('Xóa người dùng thành công!');
                await fetchUsers();
            } else {
                throw new Error(result.message || 'Lỗi khi xóa người dùng');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            message.error('Lỗi khi xóa người dùng: ' + (error as Error).message);
            throw error;
        }
    };

    // Lấy danh sách task
    const fetchTasks = async () => {
        try {
            if (!isConnected) return;
            
            const result = await ApiService.getTasks();
            if (result.success) {
                setTasks(result.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            message.error('Lỗi khi tải danh sách task');
        }
    };

    // Tạo người dùng mới - Sử dụng blockchain
    const createUser = async (username: string, role: string) => {
        try {
            setLoading(true);
            
            // Kiểm tra kết nối
            if (!isConnected || !contract || !signer) {
                throw new Error('Chưa kết nối với blockchain');
            }
            
            // Xác thực quyền (chỉ admin mới được tạo user)
            if (userRole !== 'admin') {
                throw new Error('Bạn không có quyền thực hiện hành động này');
            }
            
            // Tạo ví mới
            const wallet = ethers.Wallet.createRandom();
            const newAddress = wallet.address;
            const newPrivateKey = wallet.privateKey;
            
            // Tạo metadata cho transaction
            const metadata = {
                action: 'create_user',
                username,
                role,
                walletAddress: newAddress
            };
            
            // Gọi hàm trên smart contract để tạo người dùng (giả định)
            // const tx = await contract.createUser(newAddress, role, JSON.stringify(metadata));
            // await tx.wait();
            
            // Gọi API để tạo người dùng
            const result = await ApiService.createUser({ 
                username, 
                role, 
                walletAddress: newAddress,
                privateKey: newPrivateKey
                // txHash: tx.hash // Thêm hash của transaction 
            });
            
            if (result.success) {
                message.success('Tạo người dùng thành công!');
                await fetchUsers();
                return result.data;
            } else {
                throw new Error(result.message || 'Lỗi khi tạo người dùng');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            message.error('Lỗi tạo người dùng: ' + (error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Tạo task mới - Sử dụng blockchain
    const createTask = async (title: string, description: string, priority?: string, dueDate?: string, ipfsHash?: string) => {
        try {
            setLoading(true);
            
            // Kiểm tra kết nối MetaMask
            if (!isConnected || !contract || !signer) {
                throw new Error('Chưa kết nối với MetaMask');
            }
            
            // Tạo metadata cho transaction
            const metadata = {
                action: 'create_task',
                title,
                description,
                priority,
                dueDate,
                ipfsHash
            };
            
            // Gọi smart contract để tạo task
            let txHash = '';
            try {
                // Gọi hàm createTask trên smart contract
                const tx = await contract.createTask(title, description, ipfsHash || '');
                
                // Chờ transaction được confirm
                const receipt = await tx.wait();
                txHash = receipt.transactionHash;
                
                message.success('Transaction đã được xác nhận trên blockchain!');
            } catch (err) {
                console.error('Lỗi blockchain transaction:', err);
                message.error('Lỗi khi thực hiện giao dịch blockchain');
                throw err;
            }
            
            // Sau khi có transaction hash, gọi API để lưu task
            const taskData = { 
                title, 
                description, 
                priority, 
                dueDate,
                ipfsHash,
                txHash,
                metadata: JSON.stringify(metadata)
            };
            
            const result = await ApiService.createTask(taskData);
            
            if (result.success) {
                message.success('Tạo task thành công!');
                await fetchTasks(); // Refresh danh sách task
                return result.data;
            } else {
                throw new Error(result.message || 'Lỗi khi tạo task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            message.error('Lỗi tạo task: ' + (error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Gán task cho người dùng - Sử dụng blockchain
    const assignTask = async (taskId: string, assigneeAddress: string) => {
        try {
            setLoading(true);
            
            // Kiểm tra kết nối
            if (!isConnected || !contract || !signer) {
                throw new Error('Chưa kết nối với blockchain');
            }
            
            // Tạo metadata cho transaction
            const metadata = {
                action: 'assign_task',
                taskId,
                assigneeAddress
            };
            
            // Gọi hàm trên smart contract để gán task
            let txHash = '';
            try {
                const tx = await contract.assignTask(taskId, assigneeAddress);
                const receipt = await tx.wait();
                txHash = receipt.transactionHash;
                message.success('Transaction đã được xác nhận trên blockchain!');
            } catch (err) {
                console.error('Blockchain transaction error:', err);
                message.error('Lỗi khi thực hiện giao dịch blockchain. Kiểm tra console để biết thêm chi tiết.');
                // Vẫn tiếp tục gán task trên backend để tracking
            }
            
            // Gọi API để gán task
            const result = await ApiService.assignTask(taskId, assigneeAddress, txHash);
            
            if (result.success) {
                message.success('Gán task thành công!');
                await fetchTasks();
                return result.data;
            } else {
                throw new Error(result.message || 'Lỗi khi gán task');
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            message.error('Lỗi gán task: ' + (error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật trạng thái task - Sử dụng blockchain
    const updateTaskStatus = async (taskId: string, status: string) => {
        try {
            setLoading(true);
            
            // Kiểm tra kết nối
            if (!isConnected || !contract || !signer) {
                throw new Error('Chưa kết nối với blockchain');
            }
            
            // Tạo metadata cho transaction
            const metadata = {
                action: 'update_task_status',
                taskId,
                status
            };
            
            // Gọi hàm trên smart contract để cập nhật trạng thái task
            let txHash = '';
            try {
                // Chọn hàm contract phù hợp với trạng thái
                let tx;
                if (status === 'completed') {
                    tx = await contract.completeTask(taskId);
                } else {
                    // Giả sử có hàm updateTaskStatus
                    tx = await contract.updateTaskStatus(taskId, status);
                }
                
                const receipt = await tx.wait();
                txHash = receipt.transactionHash;
                message.success('Transaction đã được xác nhận trên blockchain!');
            } catch (err) {
                console.error('Blockchain transaction error:', err);
                message.error('Lỗi khi thực hiện giao dịch blockchain. Kiểm tra console để biết thêm chi tiết.');
                // Vẫn tiếp tục cập nhật task trên backend để tracking
            }
            
            // Gọi API để cập nhật trạng thái task
            const result = await ApiService.updateTaskStatus(taskId, status, txHash);
            
            if (result.success) {
                message.success('Cập nhật trạng thái task thành công!');
                await fetchTasks();
                return result.data;
            } else {
                throw new Error(result.message || 'Lỗi khi cập nhật trạng thái task');
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            message.error('Lỗi cập nhật trạng thái task: ' + (error as Error).message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Khởi tạo provider và contract
    useEffect(() => {
        const initProvider = async () => {
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(provider);
                
                // Lắng nghe các events từ MetaMask
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);
                
                return () => {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                };
            }
        };
        
        initProvider();
    }, []);

    // Xử lý khi user thay đổi account
    const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
            // User đã disconnect
            logout();
        } else {
            // User đã switch account
            const newAddress = accounts[0];
            setWalletAddress(newAddress);
            try {
                // Kiểm tra xem account mới có trong hệ thống không
                const response = await ApiService.checkWalletAddress(newAddress);
                if (response.success) {
                    setUserRole(response.data.role);
                    setIsConnected(true);
                } else {
                    message.warning('Địa chỉ ví mới chưa được đăng ký trong hệ thống');
                    logout();
                }
            } catch (error) {
                console.error('Error checking new wallet address:', error);
                message.error('Không thể xác thực địa chỉ ví mới');
                logout();
            }
        }
    };

    // Xử lý khi user thay đổi network
    const handleChainChanged = (chainId: string) => {
        // Reload page khi user đổi network
        window.location.reload();
    };

    // Ký message với MetaMask
    const signMessage = async (message: string): Promise<string> => {
        if (!signer) {
            throw new Error('Chưa kết nối ví');
        }
        return await signer.signMessage(message);
    };

    // Verify chữ ký
    const verifySignature = async (
        message: string,
        signature: string,
        address: string
    ): Promise<boolean> => {
        try {
            const signerAddr = ethers.utils.verifyMessage(message, signature);
            return signerAddr.toLowerCase() === address.toLowerCase();
        } catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    };

    return (
        <BlockchainContext.Provider
            value={{
                walletAddress,
                isConnected,
                userRole,
                users,
                tasks,
                loading,
                provider,
                signer,
                contract,
                connectWallet,
                connectWithMetaMask,
                createWallet,
                fetchUsers,
                fetchTasks,
                createUser,
                createTask,
                assignTask,
                updateTaskStatus,
                signMessage,
                verifySignature,
                handleAccountsChanged,
                handleChainChanged,
                logout,
                deleteUser
            }}
        >
            {children}
        </BlockchainContext.Provider>
    );
};

// Custom hook để sử dụng blockchain context
export const useBlockchain = () => {
    const context = useContext(BlockchainContext);
    if (context === undefined) {
        throw new Error('useBlockchain must be used within a BlockchainProvider');
    }
    return context;
}; 