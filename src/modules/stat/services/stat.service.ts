// stat.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { GeneratorService } from '@common/providers';
import { Activity, ActivityType, PeriodType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PaginationParams } from '@common/dto/pagenation-params.dto';
import { FilterParams } from '@common/dto/filter-params.dto';
import { SortParams, StatsSortBy } from '@common/dto/sort-params.dto';
import { SearchParams } from '@common/dto/search-params.dto';

const ONE_HOUR = 1 * 60 * 60 * 1000;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class StatService {
  private logger = new Logger(StatService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly generatorService: GeneratorService,
  ) {}

  async updateAllStats() {
    try {
      this.logger.log('Updating stats ...');

      const collections = await this.prismaService.collection.findMany();

      await Promise.all(
        collections.map(async (collection) => {
          const ownerIdSet = new Set();
          let floorPrice = BigInt(0);
          let volume = BigInt(0);

          const nfts = await this.prismaService.nFT.findMany({
            where: { collectionId: collection.id },
          });

          const activitiesAll = await this.prismaService.activity.findMany({
            where: { nftId: { in: nfts.map((nft) => nft.id) } },
          });

          const updateStatistics = async (period: PeriodType) => {
            const activitiesPeriod = activitiesAll.filter((activity) =>
              this.isActivityInRange(activity, period),
            );

            const soldActivities = activitiesPeriod.filter(
              (activity) => activity.actionType === ActivityType.SOLD,
            );

            const listingActivities = activitiesPeriod.filter(
              (activity) => activity.actionType === ActivityType.LISTED,
            );

            soldActivities.forEach((activity) =>
              ownerIdSet.add(activity.buyerId),
            );

            floorPrice =
              listingActivities.length > 0
                ? BigInt(
                    Math.min(
                      ...listingActivities.map((item) => Number(item.price)),
                    ),
                  )
                : floorPrice;

            volume = soldActivities.reduce(
              (totalVolume, activity) => totalVolume + activity.price,
              volume,
            );

            const existingStat = await this.prismaService.stat.findFirst({
              where: {
                collectionId: collection.id,
                period: period,
              },
            });

            const statData = {
              owners: ownerIdSet.size,
              listedItems: listingActivities.length,
              salesItems: soldActivities.length,
              floorPrice,
              volume,
            };

            if (existingStat) {
              let increased = 0;
              if (existingStat.volume) {
                increased = Number(volume / existingStat.volume) * 100;
              }
              await this.prismaService.stat.update({
                where: { id: existingStat.id },
                data: {
                  ...statData,
                  increased,
                },
              });
            } else {
              await this.prismaService.stat.create({
                data: {
                  id: this.generatorService.uuid(),
                  period,
                  collection: { connect: { id: collection.id } },
                  ...statData,
                },
              });
            }

            this.logger.log(
              `Updated stat for collectionId: ${collection.id} and period: ${period}`,
            );
          };

          await updateStatistics(PeriodType.HOUR);
          await updateStatistics(PeriodType.SIX_HOURS);
          await updateStatistics(PeriodType.DAY);
          await updateStatistics(PeriodType.WEEK);
          await updateStatistics(PeriodType.ALL);
        }),
      );

      this.logger.log('Stats update complete');
    } catch (e) {
      this.logger.error(e);
    }
  }

  isActivityInRange(activity: Activity, period: PeriodType) {
    const activityCreatedAt = new Date(activity.createdAt);

    switch (period) {
      case PeriodType.HOUR:
        return activityCreatedAt > new Date(Date.now() - ONE_HOUR);
      case PeriodType.SIX_HOURS:
        return activityCreatedAt > new Date(Date.now() - SIX_HOURS);
      case PeriodType.DAY:
        return activityCreatedAt > new Date(Date.now() - ONE_DAY);
      case PeriodType.WEEK:
        return activityCreatedAt > new Date(Date.now() - ONE_WEEK);
      case PeriodType.ALL:
        return true;
      default:
        return false;
    }
  }

  async getStatByCollectionId(collectionId: string, { period }: FilterParams) {
    return await this.prismaService.stat.findFirst({
      where: {
        collectionId,
        period,
      },
      include: {
        collection: {
          include: {
            avatar: true,
            banner: true,
          },
        },
      },
    });
  }

  async getCollections(
    { sortBy, sortAscending }: SortParams,
    { contains }: SearchParams,
    { period }: FilterParams,
    { offset = 1, startId = 0, limit }: PaginationParams,
  ) {
    const order = sortAscending === 'asc' ? 'asc' : 'desc';

    let orderBy = {};

    switch (sortBy) {
      case StatsSortBy.FLOOR:
        orderBy = { floorPrice: order };
        break;
      case StatsSortBy.ITEMS:
        orderBy = { collection: { supply: order } };
        break;
      case StatsSortBy.LIQUIDITY:
        orderBy = { increased: order };
        break;
      case StatsSortBy.LISTED:
        orderBy = { listedItems: order };
        break;
      case StatsSortBy.OWNERS:
        orderBy = { owners: order };
        break;
      case StatsSortBy.SALES:
        orderBy = { salesItems: order };
        break;
      case StatsSortBy.VOLUME:
        orderBy = { volume: order };
        break;
      default:
        break;
    }

    return await this.prismaService.stat.findMany({
      where: {
        period,
        collection: {
          name: {
            contains: contains ? contains.slice(0, 2) : undefined,
          },
        },
      },
      include: {
        collection: {
          include: {
            avatar: true,
            banner: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset * startId,
    });
  }
}
