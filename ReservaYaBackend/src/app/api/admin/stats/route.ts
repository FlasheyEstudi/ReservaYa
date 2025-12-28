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

    // === CHART DATA CALCULATIONS ===

    // Revenue trend last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ordersLast30Days = await db.order.findMany({
      where: {
        ...whereClause,
        status: 'closed',
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true,
        total: true
      }
    });

    // Group by date for revenue trend
    const revenueByDate = new Map<string, number>();
    const ordersByDate = new Map<string, number>();
    const reservationsByDate = new Map<string, number>();

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
      revenueByDate.set(key, 0);
      ordersByDate.set(key, 0);
      reservationsByDate.set(key, 0);
    }

    ordersLast30Days.forEach(order => {
      const key = order.createdAt.toLocaleDateString('es', { day: '2-digit', month: 'short' });
      if (revenueByDate.has(key)) {
        revenueByDate.set(key, (revenueByDate.get(key) || 0) + Number(order.total));
        ordersByDate.set(key, (ordersByDate.get(key) || 0) + 1);
      }
    });

    // Get reservations for activity trend
    const reservationsLast30Days = await db.reservation.findMany({
      where: {
        ...whereClause,
        reservationTime: { gte: thirtyDaysAgo }
      },
      select: { reservationTime: true }
    });

    reservationsLast30Days.forEach(res => {
      const key = res.reservationTime.toLocaleDateString('es', { day: '2-digit', month: 'short' });
      if (reservationsByDate.has(key)) {
        reservationsByDate.set(key, (reservationsByDate.get(key) || 0) + 1);
      }
    });

    const revenue_trend = Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
      date, revenue
    }));

    const activity_trend = Array.from(ordersByDate.entries()).map(([date, orders]) => ({
      date,
      orders,
      reservations: reservationsByDate.get(date) || 0
    }));

    // Orders by day of week
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const ordersByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];

    ordersLast30Days.forEach(order => {
      const dayOfWeek = order.createdAt.getDay();
      ordersByDayOfWeek[dayOfWeek]++;
    });

    const orders_by_day = dayNames.map((day, idx) => ({
      day,
      orders: ordersByDayOfWeek[idx]
    }));

    // Top restaurants (admin only)
    let top_restaurants: { name: string; revenue: number }[] = [];
    if (user.role === 'admin') {
      const revenueByRestaurant = await db.order.groupBy({
        by: ['restaurantId'],
        where: { status: 'closed' },
        _sum: { total: true }
      });

      const restaurantIds = revenueByRestaurant.map(r => r.restaurantId);
      const restaurants = await db.restaurant.findMany({
        where: { id: { in: restaurantIds } },
        select: { id: true, name: true }
      });

      const restaurantMap = new Map(restaurants.map(r => [r.id, r.name]));

      top_restaurants = revenueByRestaurant
        .map(r => ({
          name: restaurantMap.get(r.restaurantId) || 'Unknown',
          revenue: Number(r._sum.total || 0)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }

    // Subscription distribution (admin only)
    let subscriptions_pie: { name: string; value: number }[] = [];
    if (user.role === 'admin') {
      const subsByPlan = await db.subscription.groupBy({
        by: ['planId'],
        where: { status: 'active' },
        _count: { id: true }
      });

      const planIds = subsByPlan.map(s => s.planId);
      const plans = await db.plan.findMany({
        where: { id: { in: planIds } },
        select: { id: true, name: true }
      });

      const planMap = new Map(plans.map(p => [p.id, p.name]));

      subscriptions_pie = subsByPlan.map(s => ({
        name: planMap.get(s.planId) || 'Unknown',
        value: s._count.id
      }));
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
      // Chart data
      revenue_trend,
      orders_by_day,
      activity_trend,
      top_restaurants,
      subscriptions_pie,
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