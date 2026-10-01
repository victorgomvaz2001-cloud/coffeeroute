import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type AdminCafe, type PaginationQuery, type Paginated } from '@coffeeroute/shared';
import { CafeSearchCache } from '../cafes/cafe-search-cache.service';
import { toAdminCafe } from '../cafes/cafe.mapper';
import { PrismaService } from '../prisma/prisma.service';

const withProposer = { proposedBy: { select: { id: true, name: true, email: true } } } as const;

@Injectable()
export class AdminCafesService {
  private readonly logger = new Logger(AdminCafesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchCache: CafeSearchCache,
  ) {}

  async listPending({ page, limit }: PaginationQuery): Promise<Paginated<AdminCafe>> {
    const where = { status: 'PENDING' as const };
    const [cafes, total] = await Promise.all([
      this.prisma.cafe.findMany({
        where,
        include: withProposer,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cafe.count({ where }),
    ]);
    return { items: cafes.map(toAdminCafe), total, page, limit };
  }

  async findOne(id: string): Promise<AdminCafe> {
    const cafe = await this.prisma.cafe.findUnique({ where: { id }, include: withProposer });
    if (!cafe) throw new NotFoundException({ message: 'El café no existe.', code: 'NOT_FOUND' });
    return toAdminCafe(cafe);
  }

  async verify(id: string, adminId: string): Promise<AdminCafe> {
    await this.findOne(id);
    const cafe = await this.prisma.cafe.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: adminId,
        rejectionReason: null,
      },
      include: withProposer,
    });
    await this.searchCache.invalidate();
    this.notifyProposer(cafe.proposedBy?.email, `"${cafe.name}" ha sido verificado`);
    return toAdminCafe(cafe);
  }

  async reject(id: string, reason: string): Promise<AdminCafe> {
    const previous = await this.findOne(id);
    const cafe = await this.prisma.cafe.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason, verifiedAt: null, verifiedById: null },
      include: withProposer,
    });
    if (previous.status === 'VERIFIED') await this.searchCache.invalidate();
    this.notifyProposer(cafe.proposedBy?.email, `"${cafe.name}" ha sido rechazado: ${reason}`);
    return toAdminCafe(cafe);
  }

  // TODO(v2): send a transactional email / push (UC6 step 6) once the notifications module exists.
  private notifyProposer(email: string | undefined, message: string) {
    if (email) this.logger.log(`Notify proposer: ${message}`);
  }
}
