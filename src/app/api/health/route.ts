/**
 * GET /api/health
 * ADD-07: Health check endpoint untuk monitoring, load balancer, dan Coolify health probe
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  checks: {
    database: 'ok' | 'error';
    latencyMs?: number;
  };
}

export async function GET() {
  const start = Date.now();
  let dbStatus: 'ok' | 'error' = 'error';
  let latencyMs: number | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
    latencyMs = Date.now() - start;
    dbStatus = 'ok';
  } catch {
    latencyMs = Date.now() - start;
    dbStatus = 'error';
  }

  const overallStatus: HealthStatus['status'] =
    dbStatus === 'ok' ? 'ok' : 'degraded';

  const body: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      database: dbStatus,
      latencyMs,
    },
  };

  const httpStatus = overallStatus === 'ok' ? 200 : 503;

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store',
      'X-Health-Status': overallStatus,
    },
  });
}
