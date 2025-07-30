
"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { CheckCircle } from 'lucide-react';
import { getAppSettings } from '@/ai/flows/get-app-settings';

export type Plan = 'monthly' | 'yearly' | 'freemium' | 'none';
export type SubscriptionStatus = 'active' | 'freemium' | 'trial' | 'inactive' | 'cancelled';

export interface Subscription {
    plan: Plan;
    status: SubscriptionStatus;
    isTrial: boolean; // Explicitly track if it's a developer trial
    expiryDate: number | null; // Store as timestamp
}

interface SubscriptionContextType {
    subscription: Subscription;
    subscribe: (plan: Plan, isTrial: boolean) => void;
    cancelSubscription: () => void;
    loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const defaultSubscription: Subscription = {
    plan: 'none',
    status: 'inactive',
    isTrial: false,
    expiryDate: null,
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
    const [subscription, setSubscription] = useState<Subscription>(defaultSubscription);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();

    // Load subscription from storage on initial load and validate it
    useEffect(() => {
        setLoading(true);
        const now = Date.now();
        
        const validateSubscription = async () => {
            let activeSub: Subscription | null = null;
            try {
                // Use sessionStorage for guests, localStorage for logged-in users
                const storage = user ? localStorage : sessionStorage;
                const storageKey = user ? `subscription_${user.uid}` : 'temp_subscription';

                const storedSubscription = storage.getItem(storageKey);
                if (storedSubscription) {
                    let parsedSub = JSON.parse(storedSubscription) as Subscription;
                    
                    // Check if the plan is expired based on expiry date
                    if (parsedSub.status !== 'inactive' && parsedSub.status !== 'cancelled' && parsedSub.expiryDate && parsedSub.expiryDate <= now) {
                        parsedSub = { ...defaultSubscription }; // Reset if expired
                    }

                    // For freemium plans, check if the global code has expired
                    if (parsedSub.status === 'freemium') {
                        const appSettings = await getAppSettings();
                        const isCodeExpired = appSettings.freemiumCodeExpiry ? now > appSettings.freemiumCodeExpiry : true;
                        if (isCodeExpired) {
                            parsedSub = { ...defaultSubscription }; // Reset if freemium code is expired
                        }
                    }

                    storage.setItem(storageKey, JSON.stringify(parsedSub));
                    activeSub = parsedSub;
                }
            } catch(e) { console.error("Failed to parse or validate subscription from storage", e); }
            
            setSubscription(activeSub || defaultSubscription);
            setLoading(false);
        };

        if (user) {
            validateSubscription();
        } else {
            setSubscription(defaultSubscription);
            setLoading(false);
        }

    }, [user]);

    const saveSubscription = (sub: Subscription) => {
        setSubscription(sub);
        if (!user) {
            console.warn("Attempting to save subscription for a guest user. This will be temporary.");
            return;
        }
        const storageKey = `subscription_${user.uid}`;
        localStorage.setItem(storageKey, JSON.stringify(sub));
    };
    
    const subscribe = useCallback((plan: Plan, isTrial: boolean) => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Login Required',
                description: 'You must be signed in to start a subscription.'
            });
            return;
        }
        if (plan === 'none') return;
    
        const now = new Date();
        let expiryDate: Date | null = null;
        let title = "Subscription Activated!";
        let description = `You are now on the ${plan} plan.`;
        let status: SubscriptionStatus = 'inactive';

        if (isTrial) {
            expiryDate = new Date();
            expiryDate.setDate(now.getDate() + 7); // 7 day trial
            title = "Developer Trial Activated!";
            description = ('You now have premium access for 7 days.');
            status = 'trial';
        } else if (plan === 'monthly') {
            expiryDate = new Date(now.setMonth(now.getMonth() + 1));
            status = 'active';
        } else if (plan === 'yearly') {
            expiryDate = new Date(now.setFullYear(now.getFullYear() + 1));
            status = 'active';
        } else if (plan === 'freemium') {
            expiryDate = null; // Freemium doesn't expire based on user, but on global code
            title = "Freemium Plan Activated!";
            description = "You now have access to our standard features.";
            status = 'freemium';
        }

        const newSubscription: Subscription = {
            plan,
            status,
            isTrial,
            expiryDate: expiryDate ? expiryDate.getTime() : null,
        };
    
        saveSubscription(newSubscription);
        
        toast({
            description: (
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div className="flex flex-col">
                        <span className="font-bold">{title}</span>
                        <span className="text-xs">{description}</span>
                    </div>
                </div>
            )
        });

    }, [user, toast]);

    const cancelSubscription = useCallback(() => {
        if (subscription.status === 'inactive') return;

        let cancelledSub: Subscription = { ...subscription };

        if (subscription.status === 'active') { // Paid plans become 'cancelled' but run until expiry
            cancelledSub.status = 'cancelled';
            toast({
                title: "Subscription Cancelled",
                description: `Your plan will remain active until ${subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'the end of the period'}.`,
            });
        } else { // Freemium or Trial plans are cancelled immediately
            cancelledSub = defaultSubscription;
            toast({
                title: "Plan Deactivated",
                description: `Your ${subscription.plan} access has ended.`,
            });
        }
        
        saveSubscription(cancelledSub);

    }, [subscription, toast]);

    const value = { subscription, subscribe, cancelSubscription, loading };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
