import { db as prisma } from './db';

// Plan feature names
export type FeatureName = 'inventory' | 'marketing' | 'reports' | 'customers' | 'invoices' | 'advancedReports';

// Limit names
export type LimitName = 'tables' | 'employees' | 'reservationsMonth';

interface PlanFeatures {
    inventory?: boolean;
    marketing?: boolean;
    reports?: boolean;
    customers?: boolean;
    invoices?: boolean;
    advancedReports?: boolean;
}

interface LimitCheckResult {
    allowed: boolean;
    current: number;
    max: number;
    planName: string;
}

interface FeatureCheckResult {
    allowed: boolean;
    planName: string;
    requiredPlan?: string;
}

/**
 * Get the subscription and plan for a restaurant
 */
export async function getRestaurantSubscription(restaurantId: string) {
    const subscription = await prisma.subscription.findUnique({
        where: { restaurantId },
        include: { plan: true }
    });

    // If no subscription, return free plan defaults
    if (!subscription) {
        const freePlan = await prisma.plan.findUnique({ where: { name: 'free' } });
        return {
            subscription: null,
            plan: freePlan || {
                name: 'free',
                displayName: 'Gratis',
                maxTables: 3,
                maxEmployees: 1,
                maxReservationsMonth: 50,
                features: '{}',
                trialDays: 0
            },
            isActive: true,
            isTrial: false
        };
    }

    // Check if trial has expired
    const now = new Date();
    const isTrialExpired = subscription.status === 'trialing' &&
        subscription.trialEndsAt &&
        subscription.trialEndsAt < now;

    // Check if subscription is active
    const isActive = ['active', 'trialing'].includes(subscription.status) && !isTrialExpired;

    return {
        subscription,
        plan: subscription.plan,
        isActive,
        isTrial: subscription.status === 'trialing' && !isTrialExpired
    };
}

/**
 * Check if a feature is enabled for a restaurant
 */
export async function checkFeature(restaurantId: string, feature: FeatureName): Promise<FeatureCheckResult> {
    const { plan, isActive } = await getRestaurantSubscription(restaurantId);

    // Parse features JSON
    let features: PlanFeatures = {};
    try {
        features = JSON.parse(plan.features || '{}');
    } catch (e) {
        features = {};
    }

    // If subscription is not active (expired trial), only allow free features
    if (!isActive) {
        return {
            allowed: false,
            planName: plan.displayName || plan.name,
            requiredPlan: 'Starter'
        };
    }

    const allowed = features[feature] === true;

    return {
        allowed,
        planName: plan.displayName || plan.name,
        requiredPlan: allowed ? undefined : 'Professional'
    };
}

/**
 * Check if a limit is within bounds for a restaurant
 */
export async function checkLimit(restaurantId: string, limit: LimitName): Promise<LimitCheckResult> {
    const { plan, isActive } = await getRestaurantSubscription(restaurantId);

    let current = 0;
    let max = 0;

    switch (limit) {
        case 'tables':
            current = await prisma.table.count({ where: { restaurantId } });
            max = isActive ? plan.maxTables : 3; // Free plan: 3 tables
            break;

        case 'employees':
            current = await prisma.employee.count({ where: { restaurantId } });
            max = isActive ? plan.maxEmployees : 1; // Free plan: 1 employee
            break;

        case 'reservationsMonth':
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            current = await prisma.reservation.count({
                where: {
                    restaurantId,
                    createdAt: { gte: startOfMonth }
                }
            });
            max = isActive ? plan.maxReservationsMonth : 50; // Free plan: 50/month
            break;
    }

    return {
        allowed: current < max,
        current,
        max,
        planName: plan.displayName || plan.name
    };
}

/**
 * Helper to format error response for blocked features
 */
export function featureBlockedResponse(feature: string, requiredPlan: string) {
    return {
        error: 'feature_blocked',
        message: `La función "${feature}" requiere el plan ${requiredPlan}`,
        requiredPlan,
        upgradeUrl: '/manage/billing'
    };
}

/**
 * Helper to format error response for exceeded limits
 */
export function limitExceededResponse(limit: string, current: number, max: number, planName: string) {
    return {
        error: 'limit_exceeded',
        message: `Has alcanzado el límite de ${max} ${limit} en tu plan ${planName}`,
        current,
        max,
        planName,
        upgradeUrl: '/manage/billing'
    };
}

/**
 * Get all limits and features status for a restaurant (for dashboard)
 */
export async function getUsageStats(restaurantId: string) {
    const { plan, subscription, isActive, isTrial } = await getRestaurantSubscription(restaurantId);

    // Parse features
    let features: PlanFeatures = {};
    try {
        features = JSON.parse(plan.features || '{}');
    } catch (e) {
        features = {};
    }

    // Get current counts
    const tablesCount = await prisma.table.count({ where: { restaurantId } });
    const employeesCount = await prisma.employee.count({ where: { restaurantId } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const reservationsCount = await prisma.reservation.count({
        where: { restaurantId, createdAt: { gte: startOfMonth } }
    });

    return {
        plan: {
            name: plan.name,
            displayName: plan.displayName,
            priceMonthly: plan.priceMonthly,
            priceYearly: plan.priceYearly
        },
        subscription: subscription ? {
            status: subscription.status,
            trialEndsAt: subscription.trialEndsAt,
            currentPeriodEnd: subscription.currentPeriodEnd
        } : null,
        isActive,
        isTrial,
        limits: {
            tables: { current: tablesCount, max: plan.maxTables },
            employees: { current: employeesCount, max: plan.maxEmployees },
            reservationsMonth: { current: reservationsCount, max: plan.maxReservationsMonth }
        },
        features: {
            inventory: features.inventory || false,
            marketing: features.marketing || false,
            reports: features.reports || false,
            customers: features.customers || false,
            invoices: features.invoices || false,
            advancedReports: features.advancedReports || false
        }
    };
}
