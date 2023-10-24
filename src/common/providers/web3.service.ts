import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Network } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import Web3, { Contract } from 'web3';
import { Web3Account } from 'web3-eth-accounts';
import axios from 'axios';
import {
  CANCEL_FUNCTION_ABI,
  ERC721A_ABI,
  FULFILLBASICORDER_ABI,
  INKUBATE_ABI,
  LAUNCHPAD_ABI,
  MINTNFT_EVENT_ABI,
  ORDERFULFILLED_EVENT_ABI,
} from '@config/abi';
import { INKUBATE_ADDRESS, LAUNCHPAD_ADDRESS } from '@config/address';
import { BuyOrderParameters, OrderParameters, TokenData } from '@common/types';

@Injectable()
export class Web3Service {
  private logger = new Logger(Web3Service.name);
  private readonly web3: Record<Network, Web3>;
  private account: Record<Network, Web3Account>;
  private launchpadContract: Record<Network, Contract<typeof LAUNCHPAD_ABI>>;
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.web3 = {
      BNB: new Web3(configService.get('BNB')),
      MAIN: new Web3(
        `${this.configService.get('urls.INFURA_URL')}${this.configService.get(
          'urls.INFURA_API_KEY',
        )}`,
      ),
    };

    this.launchpadContract = {
      MAIN: new this.web3.MAIN.eth.Contract(LAUNCHPAD_ABI, LAUNCHPAD_ADDRESS),
      BNB: new this.web3.BNB.eth.Contract(LAUNCHPAD_ABI, LAUNCHPAD_ADDRESS),
    };

    this.launchpadContract.MAIN.setProvider(this.web3.MAIN.currentProvider);
  }

  async getBalance(network: Network, address: string): Promise<bigint> {
    return this.web3[network].eth.getBalance(address);
  }

  async getTransaction(network: Network, transactionHash: string) {
    return await this.web3[network].eth.getTransaction(transactionHash);
  }

  async getTransactionReceipt(network: Network, transactionHash: string) {
    return await this.web3[network].eth.getTransactionReceipt(transactionHash);
  }

  async getERC721Contracts() {
    try {
      // Fetch the list of ERC-721 contracts
      const infura_api_key = this.configService.get('infura_api_key');
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.etherscan.io/api?module=contract&action=getcontractcount&apikey=${infura_api_key}`,
        ),
      );
      const contractCount = response.data.result;

      const contracts = [];
      const batchSize = 50;

      for (let i = 1; i <= contractCount; i += batchSize) {
        const startBlock = i;
        const endBlock = Math.min(i + batchSize - 1, contractCount);

        const contractResponse = await firstValueFrom(
          this.httpService.get(
            `https://api.etherscan.io/api?module=contract&action=getcontractlist&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${infura_api_key}`,
          ),
        );
        contracts.push(...contractResponse.data.result);
      }

      return contracts;
    } catch (error) {
      console.error('Error:', error.message || error);
    }
  }

  // async getNFTSbyAddress({ walletAddress, chainId }: NFTCollectionsDto) {
  //   // const chainId = 1;
  //   // const walletAddress = '0xb2df181E57fDe55CF35882610b84413678FD9840';
  //   const res = await firstValueFrom(
  //     this.httpService.get(
  //       `https://nft.api.infura.io/networks/${chainId}/accounts/${walletAddress}/assets/nfts`,
  //       {
  //         headers: {
  //           Authorization: `Basic ${this.infuraCred}`,
  //         },
  //       },
  //     ),
  //   );
  //   return res.data;
  // }
}
