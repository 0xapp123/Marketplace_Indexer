// get-collections.response.dto.ts

import { Photo } from '@prisma/client';

export class GetCollectionsResponse {
  id: string;

  name: string;

  avatar: Photo;

  banner: Photo;

  desc: string;

  address: string;

  supply: number;

  verified: boolean;

  owners: number;

  listedItems: number;

  salesItems: number;

  floorPrice: bigint;

  volume: bigint;
}
