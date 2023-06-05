/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from '@prisma/client';

declare module '@prisma/client' {
  interface PrismaClient {
    sales: Prisma.SalesDelegate<any>;
    asks: Prisma.AsksDelegate<any>;
    [key: string]: any;
  }
}
