import { PrismaClient } from '@prisma/client';
import { validateEnv, isLocalFallbackAllowed } from './env';

// P0-C & P2-14: Fail-fast validasi konfigurasi environment saat modul database diinisialisasi
validateEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbUnavailableUntil?: number;
};

/**
 * Tandai database offline sementara (circuit breaker) selama 60 detik
 * pada mode development/test agar kueri tidak terhambat socket timeout.
 */
export function markDbUnavailable(durationMs = 60000) {
  globalForPrisma.dbUnavailableUntil = Date.now() + durationMs;
}

export function shouldBypassPrisma(): boolean {
  // P0-D: Di produksi (NODE_ENV=production), bypass Prisma MUSTAHIL tanpa kecuali
  if (!isLocalFallbackAllowed()) {
    return false;
  }
  if (process.env.FORCE_LOCAL_STORE === 'true') {
    return true;
  }
  return Boolean(
    globalForPrisma.dbUnavailableUntil && Date.now() < globalForPrisma.dbUnavailableUntil
  );
}

const rawPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = rawPrisma;

/**
 * Proxy Prisma Client dengan circuit-breaker otomatis untuk mode development & pengujian lokal.
 * Mencegah blocking koneksi TCP timeout ketika PostgreSQL lokal tidak dijalankan.
 */
export const prisma = new Proxy(rawPrisma, {
  get(target, prop, receiver) {
    if (prop === '$transaction') {
      return async (...args: any[]) => {
        if (shouldBypassPrisma()) {
          throw new Error("Can't reach database server at localhost:5432 (circuit-breaker active)");
        }
        return (target as any).$transaction(...args);
      };
    }
    const orig = Reflect.get(target, prop, receiver);
    if (orig && typeof prop === 'string' && !prop.startsWith('$')) {
      return new Proxy(orig, {
        get(modelTarget, modelProp) {
          const modelMethod = Reflect.get(modelTarget, modelProp);
          if (typeof modelMethod === 'function') {
            return async (...args: any[]) => {
              if (shouldBypassPrisma()) {
                throw new Error("Can't reach database server at localhost:5432 (circuit-breaker active)");
              }
              return modelMethod.apply(modelTarget, args);
            };
          }
          return modelMethod;
        },
      });
    }
    return orig;
  },
});
