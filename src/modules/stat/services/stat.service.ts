// stat.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { GeneratorService } from '@common/providers';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class StatService {
  private logger = new Logger(StatService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly generatorService: GeneratorService,
  ) {}

  async updateAllStats() {
    this.logger.log(`updating stats ...`);
    const collections = await this.prismaService.collection.findMany();
    try {
      for (let i = 0; i < collections.length; i++) {
        const owners = new Set();
        const listedItems = [];
        let salesItems = 0;
        let floorPrice = 0;
        let volume = BigInt(0);

        const nfts = await this.prismaService.nFT.findMany({
          where: { collectionId: collections[i].id },
        });
        // Iterate over each NFT and add its OWNERID to the Set
        for (const nft of nfts) {
          owners.add(nft.ownerId);

          const listing = await this.prismaService.listing.findFirst({
            where: { nftId: nft.id, status: ListingStatus.ACTIVE },
          });
          if (listing) listedItems.push(listing);

          const sales = await this.prismaService.listing.findMany({
            where: { nftId: nft.id, status: ListingStatus.SOLD },
          });
          salesItems += sales.length;

          sales.forEach((item) => {
            volume += BigInt(item.price);
          });
        }

        floorPrice = Math.min(...listedItems.map((item) => item.price));

        await this.prismaService.stat.create({
          data: {
            id: this.generatorService.uuid(),
            owners: owners.size,
            collectionId: collections[i].id,
            listedItems: listedItems.length,
            salesItems,
            floorPrice,
            volume,
          },
        });
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  async getTopCollections(period: string) {
    let timeFilter = {};

    if (period === '1h') {
      timeFilter = {
        updatedAt: {
          gte: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      };
    } else if (period === '6h') {
      timeFilter = {
        updatedAt: {
          gte: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      };
    } else if (period === '24h') {
      timeFilter = {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      };
    } else {
      timeFilter = {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      };
    }

    return await this.prismaService.stat.findMany({
      where: {
        ...timeFilter,
      },
      orderBy: {
        volume: 'desc',
      },
      distinct: ['collectionId'],
      take: 10,
      include: {
        collection: true,
      },
    });
  }

  async getNotableCollections() {
    return await this.prismaService.stat.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
      orderBy: {
        floorPrice: 'desc',
      },
      distinct: ['collectionId'],
      take: 3,
      include: {
        collection: true,
      },
    });
  }

  async getFeaturedProjects() {
    const collections = await this.prismaService.collection.findMany({
      where: {
        feature: true,
      },
    });

    return await Promise.all(
      collections.map(async (collection) => {
        return await this.prismaService.stat.findFirst({
          where: {
            collectionId: collection.id,
            updatedAt: {
              gte: new Date(Date.now() - 60 * 1000),
            },
          },
        });
      }),
    );
  }

  async getStatByCollectionId(collectionId: string) {
    return await this.prismaService.stat.findFirst({
      where: {
        collectionId,
        updatedAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
      include: {
        collection: true,
      },
    });
  }
}
