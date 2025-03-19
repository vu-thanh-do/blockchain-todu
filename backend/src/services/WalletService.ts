import { createWalletWithShyft, getAddressFromPrivateKey, Wallet } from '../utils/blockchain';
import axios from 'axios';
import config from '../config';

class WalletService {
  // Tạo ví mới
  public async createWallet(): Promise<Wallet> {
    try {
      return await createWalletWithShyft();
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  // Xác thực private key
  public validatePrivateKey(privateKey: string): boolean {
    try {
      const address = getAddressFromPrivateKey(privateKey);
      return !!address;
    } catch (error) {
      return false;
    }
  }

  // Lấy địa chỉ ví từ private key
  public getAddressFromPrivateKey(privateKey: string): string {
    try {
      return getAddressFromPrivateKey(privateKey);
    } catch (error) {
      console.error('Error getting address from private key:', error);
      throw error;
    }
  }

  // Lấy số dư ví (sử dụng Shyft API)
  public async getBalance(address: string): Promise<string> {
    try {
      const response = await axios.get(
        `https://api.shyft.to/sol/v1/wallet/balance?network=devnet&wallet=${address}`,
        {
          headers: {
            'x-api-key': config.shyftApiKey
          }
        }
      );

      if (response.data.success) {
        return response.data.result.balance;
      }
      throw new Error('Failed to get wallet balance');
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  // Gửi transaction (chuyển token) giữa các ví
  public async sendTransaction(fromPrivateKey: string, toAddress: string, amount: number): Promise<any> {
    try {
      const fromAddress = this.getAddressFromPrivateKey(fromPrivateKey);
      
      const response = await axios.post(
        'https://api.shyft.to/sol/v1/wallet/send_sol',
        {
          network: 'devnet',
          from_private_key: fromPrivateKey,
          to_address: toAddress,
          amount: amount
        },
        {
          headers: {
            'x-api-key': config.shyftApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          signature: response.data.result.signature,
          fromAddress,
          toAddress,
          amount
        };
      }
      throw new Error('Failed to send transaction');
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }
}

export default new WalletService(); 