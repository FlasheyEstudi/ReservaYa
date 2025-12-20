import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateToken, requireRole } from '@/lib/middleware';

// GET /api/admin/stats - Get dashboard KPIs
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult;

    // Check if user has admin or manager role
    const roleCheck = requireRole(['admin', 'manager'])(user, null as any);
    if (roleCheck) {
      return roleCheck;
    }

    // TODO: Implement Redis caching for these expensive calculations
    // For now, we'll calculate directly from the database

    let whereClause: any = {};

    // If user is manager, only show stats for their restaurant
    if (user.role === 'manager') {
      whereClause.restaurantId = user.rid;
    }

    // Calculate Total Revenue (sum of closed orders)
    const revenueResult = await db.order.aggregate({
      where: {
        ...whereClause,
        status: 'closed'
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    // Count Active Restaurants
    const activeRestaurantsCount = await db.restaurant.count({
      where: {
        status: 'active',
        ...(user.role === 'admin' ? {} : { id: user.rid })
      }
    });

    // Count Total Employees
    const employeesCount = await db.employee.count({
      where: {
        isActive: true,
        ...(user.role === 'admin' ? {} : { restaurantId: user.rid })
      }
    });

    // Count Total Tables
    const tablesCount = await db.table.count({
      where: whereClause
    });

    // Get today's stats
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayOrders = await db.order.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const todayReservations = await db.reservation.count({
      where: {
        ...whereClause,
        reservationTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Get today's revenue
    const todayRevenueResult = await db.order.aggregate({
      where: {
        ...whereClause,
        status: 'closed',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        total: true
      }
    });

    // Get orders by status
    const ordersByStatus = await db.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        status: true
      }
    });

    // Get recent orders (last 10)
    const recentOrders = await db.order.findMany({
      where: whereClause,
      include: {
        table: {
          select: {
            tableNumber: true
          }
        },
        waiter: {
          select: {
            email: true
          }
        },
        orderItems: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get restaurant details if manager
    let restaurantDetails: { id: string; name: string; businessCode: string; status: string; createdAt: Date; } | null = null;
    if (user.role === 'manager') {
      restaurantDetails = await db.restaurant.findUnique({
        where: { id: user.rid },
        select: {
          id: true,
          name: true,
          businessCode: true,
          status: true,
          createdAt: true
        }
      });
    }

    const stats = {
      overview: {
        total_revenue: Number(revenueResult._sum.total || 0),
        total_orders: revenueResult._count.id,
        active_restaurants: activeRestaurantsCount,
        total_employees: employeesCount,
        total_tables: tablesCount
      },
      today: {
        orders: todayOrders,
        reservations: todayReservations,
        revenue: Number(todayRevenueResult._sum.total || 0)
      },
      orders_by_status: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      recent_orders: recentOrders.map(order => ({
        id: order.id,
        table_number: order.table?.tableNumber,
        waiter_email: order.waiter?.email,
        status: order.status,
        total: order.total,
        created_at: order.createdAt,
        items_count: order.orderItems.length
      })),
      restaurant_details: restaurantDetails,
      subscription_metrics: undefined
    };

    if (user.role === 'admin') {
      const activeSubscriptions = await db.subscription.findMany({
        where: {
          status: 'active'
        },
        include: {
          plan: true
        }
      });

      const mrr = activeSubscriptions.reduce((sum, sub) => {
        return sum + Number(sub.plan.priceMonthly);
      }, 0);

      const activeCount = activeSubscriptions.length;

      // @ts-ignore
      stats.subscription_metrics = {
        mrr,
        active_subscriptions: activeCount
      };
    }

    return NextResponse.json({
      stats,
      generated_at: new Date().toISOString(),
      user_role: user.role
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}