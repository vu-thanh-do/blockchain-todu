import React, { useState } from 'react';
import { Button, Typography, Space, Tooltip, Dropdown, message as antMessage, Modal, Input, Tag } from 'antd';
import { WalletOutlined, LinkOutlined, LoadingOutlined, DownOutlined, KeyOutlined, LogoutOutlined } from '@ant-design/icons';
import { useBlockchain } from '../contexts/BlockchainContext';
import type { MenuProps } from 'antd';
import { ethers } from 'ethers';
import * as ApiService from '../services/ApiService';

const { Text } = Typography;

// Khai báo kiểu ethereum trong cục bộ component thay vì sử dụng declare global
interface EthereumProvider {
  request: (args: {method: string, params?: any[]}) => Promise<any>;
  on: (eventName: string, callback: (...args: any[]) => void) => void;
  removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
}

interface Window {
  ethereum?: EthereumProvider;
}

const WalletConnect: React.FC = () => {
    const { 
        isConnected, 
        walletAddress, 
        connectWallet, 
        connectWithMetaMask, 
        loading, 
        userRole, 
        logout,
        provider,
        signer 
    } = useBlockchain();
    
    const [privateKeyModalVisible, setPrivateKeyModalVisible] = useState(false);
    const [privateKey, setPrivateKey] = useState('');
    const [connectingMetaMask, setConnectingMetaMask] = useState(false);
    const [networkInfo, setNetworkInfo] = useState<{name: string, chainId: number} | null>(null);

    // Kiểm tra mạng blockchain khi component mount
    React.useEffect(() => {
        const checkNetwork = async () => {
            if (provider) {
                try {
                    const network = await provider.getNetwork();
                    setNetworkInfo({
                        name: network.name,
                        chainId: network.chainId
                    });
                } catch (error) {
                    console.error("Lỗi khi lấy thông tin mạng:", error);
                }
            }
        };
        
        checkNetwork();
    }, [provider]);

    // Hàm rút gọn địa chỉ ví
    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Hiển thị vai trò
    const getRoleDisplay = (role: string | null) => {
        if (!role) return null;

        switch (role) {
            case 'admin':
                return <Text type="danger">(Admin)</Text>;
            case 'teamLead':
                return <Text type="warning">(Team Lead)</Text>;
            case 'employee':
                return <Text type="success">(Nhân viên)</Text>;
            default:
                return null;
        }
    };

    // Hiển thị dialog nhập private key
    const showPrivateKeyModal = () => {
        setPrivateKeyModalVisible(true);
    };

    // Xử lý đăng nhập bằng private key
    const handleLoginWithPrivateKey = async () => {
        if (!privateKey.trim()) {
            antMessage.error('Vui lòng nhập private key');
            return;
        }

        try {
            await connectWallet(privateKey);
            setPrivateKeyModalVisible(false);
            setPrivateKey('');
        } catch (error) {
            console.error('Lỗi khi đăng nhập với private key:', error);
        }
    };

    // Kết nối với MetaMask và đăng nhập
    const handleConnectWithMetaMask = async () => {
        try {
            setConnectingMetaMask(true);

            // Kiểm tra xem MetaMask có được cài đặt không
            if (typeof window.ethereum === 'undefined') {
                antMessage.error('Vui lòng cài đặt MetaMask để tiếp tục!');
                return;
            }

            // Yêu cầu kết nối với MetaMask
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            try {
                // Lấy nonce từ server để ký
                const nonceResponse = await ApiService.getNonce(address);
                const signMessage = `Đăng nhập vào ứng dụng với mã: ${nonceResponse}`;

                // Yêu cầu người dùng ký tin nhắn
                const signature = await signer.signMessage(signMessage);

                // Gửi chữ ký lên server để xác thực
                const verifyResult = await ApiService.verifySignature(address, signMessage, signature);

                if (verifyResult.success) {
                    // Nếu xác thực thành công, tiến hành đăng nhập
                    await connectWithMetaMask();
                    antMessage.success('Đăng nhập thành công!');
                } else {
                    antMessage.error('Xác thực chữ ký thất bại!');
                }
            } catch (apiError) {
                console.error('API error:', apiError);
                antMessage.error('Lỗi khi xác thực với server');
            }
        } catch (error: any) {
            console.error('Lỗi kết nối MetaMask:', error);
            if (error.code === 4001) {
                antMessage.error('Bạn đã từ chối kết nối với MetaMask');
            } else {
                antMessage.error('Không thể kết nối với MetaMask: ' + error.message);
            }
        } finally {
            setConnectingMetaMask(false);
        }
    };

    // Menu cho người dùng đã đăng nhập
    const items: MenuProps['items'] = [
        {
            key: '1',
            label: 'Xem lịch sử giao dịch',
            onClick: () => window.location.href = '/transaction-history'
        },
        {
            key: '2',
            label: 'Kiểm tra số dư',
            onClick: async () => {
                if (signer) {
                    try {
                        const balance = await signer.getBalance();
                        antMessage.info(`Số dư hiện tại: ${ethers.utils.formatEther(balance)} ETH`);
                    } catch (error) {
                        console.error('Lỗi khi kiểm tra số dư:', error);
                        antMessage.error('Không thể kiểm tra số dư');
                    }
                } else {
                    antMessage.error('Chưa kết nối với ví');
                }
            }
        },
        {
            key: '3',
            label: 'Đăng xuất',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: logout
        },
    ];

    // Kiểm tra xem có hỗ trợ MetaMask không
    const isMetaMaskSupported = typeof window !== 'undefined' && !!window.ethereum;

    return (
        <div style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {isConnected && walletAddress ? (
                <Space>
                    {networkInfo && (
                        <Tag color="blue">
                            {networkInfo.name === 'unknown' ? `Chain ID: ${networkInfo.chainId}` : networkInfo.name}
                        </Tag>
                    )}
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <Button type="text">
                            <Space>
                                <WalletOutlined />
                                {truncateAddress(walletAddress)} {getRoleDisplay(userRole)}
                                <DownOutlined />
                            </Space>
                        </Button>
                    </Dropdown>
                </Space>
            ) : (
                <Space>
                    {isMetaMaskSupported && (
                        <Button
                            icon={<WalletOutlined />}
                            onClick={handleConnectWithMetaMask}
                            loading={connectingMetaMask}
                        >
                            Kết nối MetaMask
                        </Button>
                    )}
                    <Button
                        type="primary"
                        icon={<KeyOutlined />}
                        onClick={showPrivateKeyModal}
                    >
                        Đăng nhập bằng Private Key
                    </Button>
                </Space>
            )}

            {/* Modal nhập private key */}
            <Modal
                title="Đăng nhập bằng Private Key"
                open={privateKeyModalVisible}
                onOk={handleLoginWithPrivateKey}
                onCancel={() => setPrivateKeyModalVisible(false)}
                confirmLoading={loading}
            >
                <p>Nhập private key của ví blockchain để đăng nhập:</p>
                <Input.Password
                    value={privateKey}
                    onChange={e => setPrivateKey(e.target.value)}
                    placeholder="Nhập private key"
                />
                <p style={{ marginTop: 8 }}>
                    <Text type="danger">Cảnh báo:</Text> Chỉ nhập private key trên thiết bị bạn tin tưởng!
                </p>
            </Modal>
        </div>
    );
};

export default WalletConnect; 