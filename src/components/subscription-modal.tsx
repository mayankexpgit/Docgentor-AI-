
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { CheckCircle, Crown, Loader2, Code, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { प्लांस as defaultPlans, RAZORPAY_KEY_ID } from "@/config/subscriptions";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { getAppSettings, AppSettings } from "@/ai/flows/get-app-settings";

interface SubscriptionModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SubscriptionModal({ isOpen, onOpenChange }: SubscriptionModalProps) {
    const { user } = useAuth();
    const { subscription, subscribe } = useSubscription();
    const { toast } = useToast();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [isLoading, setIsLoading] = useState<null | 'monthly' | 'yearly'>(null);
    const [devCode, setDevCode] = useState('');
    const [freemiumCode, setFreemiumCode] = useState('');
    const [liveSettings, setLiveSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        if (isOpen) {
            getAppSettings()
                .then(setLiveSettings)
                .catch(err => {
                    console.error("Failed to fetch latest prices:", err);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Could not fetch the latest pricing. Please try again.',
                    });
                });
        }
    }, [isOpen, toast]);

    const handlePayment = async (plan: 'monthly' | 'yearly') => {
        if (!user) {
            toast({
                title: "Please sign in",
                description: "You need to be logged in to subscribe.",
                variant: "destructive",
            });
            return;
        }

        if (!RAZORPAY_KEY_ID) {
            toast({
                title: "Configuration Error",
                description: "Razorpay Key ID is not configured. Payment cannot be processed.",
                variant: "destructive",
            });
            return;
        }
        
        setIsLoading(plan);

        const planDetails = defaultPlans[plan];

        try {
            // Step 1: Create an order on the server by sending the plan type
            const orderResponse = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }) // Send the plan type, not the amount
            });
            
            if (!orderResponse.ok) {
                 const errorData = await orderResponse.json();
                throw new Error(errorData.error || 'Failed to create order.');
            }
            const order = await orderResponse.json();

            // Step 2: Open Razorpay checkout
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: "INR",
                name: "DOCGENTOR AI Premium",
                description: `DOCGENTOR AI - ${planDetails.name} Subscription`,
                image: "/logo.svg",
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        // Step 3: Verify the payment on the server
                        const verificationResponse = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                            })
                        });

                        if (!verificationResponse.ok) {
                            throw new Error('Payment verification failed.');
                        }

                        const result = await verificationResponse.json();
                        if (result.isVerified) {
                            subscribe(plan, false);
                            onOpenChange(false);
                        } else {
                            throw new Error('Signature mismatch.');
                        }
                    } catch (error) {
                        toast({ title: "Verification Failed", description: "Payment verification failed. Please contact support.", variant: "destructive" });
                    } finally {
                        setIsLoading(null);
                    }
                },
                prefill: {
                    name: user.displayName || "Valued User",
                    email: user.email || "",
                    contact: "",
                },
                notes: {
                    userId: user.uid,
                    plan: plan,
                },
                theme: {
                    color: "#90E0EF",
                },
                modal: {
                    ondismiss: function() {
                        setIsLoading(null);
                    }
                }
            };
            
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any){
                toast({
                    title: "Payment Failed",
                    description: `Something went wrong: ${response.error.description}`,
                    variant: "destructive",
                });
                setIsLoading(null);
            });
            rzp.open();

        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message || "Could not initiate payment. Please try again.", variant: "destructive" });
            setIsLoading(null);
        }
    };

    const handleActivateFreemium = async () => {
        const settings = await getAppSettings();
        if (!settings) {
            toast({ title: "Error", description: "Could not verify code. Please try again.", variant: "destructive" });
            return;
        }

        const isCodeExpired = settings.freemiumCodeExpiry ? new Date().getTime() > settings.freemiumCodeExpiry : true;

        if (freemiumCode === settings.freemiumCode && !isCodeExpired) {
            subscribe('freemium', false);
            onOpenChange(false);
        } else {
            toast({
                title: 'Invalid or Expired Code',
                description: 'The Freemium activation code is incorrect or has expired.',
                variant: 'destructive',
            });
        }
    };
    
    const handleActivateDeveloperTrial = () => {
        if (devCode === 'dev2784docgentorai') {
            subscribe('yearly', true);
            onOpenChange(false);
        } else {
            toast({
                title: 'Invalid Code',
                description: 'The developer trial code is incorrect.',
                variant: 'destructive',
            });
        }
    };

    const monthlyPrice = liveSettings ? liveSettings.monthlyPrice : defaultPlans.monthly.discountedPrice;
    const yearlyPrice = liveSettings ? liveSettings.yearlyPrice : defaultPlans.yearly.discountedPrice;


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-0">
                <Tabs defaultValue="premium" className="w-full">
                    <DialogHeader className="p-6 pb-4">
                        <DialogTitle className="text-center text-3xl font-bold flex items-center justify-center gap-2">
                            <Crown className="text-yellow-500 animate-crown-glow" fill="currentColor" /> Upgrade Your Plan
                        </DialogTitle>
                         <TabsList className="grid w-full grid-cols-3 mx-auto max-w-md">
                            <TabsTrigger value="premium">Premium Plans</TabsTrigger>
                            <TabsTrigger value="freemium">Freemium Code</TabsTrigger>
                            <TabsTrigger value="developer">Developer</TabsTrigger>
                        </TabsList>
                    </DialogHeader>

                    <TabsContent value="premium" className="px-6 pb-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card 
                                className={cn("cursor-pointer border-2", selectedPlan === 'monthly' ? "border-primary shadow-lg" : "border-border")}
                                onClick={() => setSelectedPlan('monthly')}
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        Monthly
                                        <Crown className="w-5 h-5 text-yellow-500" />
                                    </CardTitle>
                                    <CardDescription>Perfect for short-term projects.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-4xl font-bold">
                                        ₹{monthlyPrice} <span className="text-lg text-muted-foreground line-through">₹{defaultPlans.monthly.price}</span>
                                        <span className="text-sm text-muted-foreground"> / month</span>
                                    </div>
                                    <ul className="space-y-2 text-sm">
                                        {defaultPlans.monthly.features.map(feat => (
                                            <li key={feat} className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" variant={selectedPlan === 'monthly' ? 'default' : 'outline'} onClick={() => handlePayment('monthly')} disabled={isLoading !== null}>
                                        {isLoading === 'monthly' ? <Loader2 className="animate-spin" /> : "Choose Monthly"}
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card 
                                className={cn("cursor-pointer border-2 relative", selectedPlan === 'yearly' ? "border-primary shadow-lg" : "border-border")}
                                onClick={() => setSelectedPlan('yearly')}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-bold rounded-full">
                                    BEST VALUE
                                </div>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        Yearly
                                        <Crown className="w-5 h-5 text-yellow-500" />
                                    </CardTitle>
                                    <CardDescription>Get the best value and save big.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-4xl font-bold">
                                        ₹{yearlyPrice} <span className="text-lg text-muted-foreground line-through">₹{defaultPlans.yearly.price}</span>
                                        <span className="text-sm text-muted-foreground"> / year</span>
                                    </div>
                                    <ul className="space-y-2 text-sm">
                                        {defaultPlans.yearly.features.map(feat => (
                                            <li key={feat} className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" variant={selectedPlan === 'yearly' ? 'default' : 'outline'} onClick={() => handlePayment('yearly')} disabled={isLoading !== null}>
                                        {isLoading === 'yearly' ? <Loader2 className="animate-spin" /> : "Choose Yearly"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="freemium" className="px-6 pb-6">
                        <Card className="bg-muted/50 border-dashed">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Star className="text-blue-500"/> Freemium Activation</CardTitle>
                                <CardDescription>Have a code? Activate the free plan to get started with core tools.</CardDescription>
                             </CardHeader>
                             <CardContent>
                                {subscription.status === 'freemium' || subscription.status === 'active' || subscription.status === 'trial' ? (
                                    <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <AlertTitle className="text-green-800 dark:text-green-300">Freemium Plan Already Active</AlertTitle>
                                        <AlertDescription className="text-green-600 dark:text-green-400">
                                            You already have access to all freemium features.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="flex-1 w-full">
                                            <label htmlFor="freemium-code" className="sr-only">Freemium Code</label>
                                            <Input 
                                                id="freemium-code"
                                                placeholder="Enter 6-digit freemium code..."
                                                value={freemiumCode}
                                                onChange={(e) => setFreemiumCode(e.target.value)}
                                                type="text"
                                                pattern="[0-9]*"
                                                maxLength={6}
                                            />
                                        </div>
                                        <Button className="w-full sm:w-auto" variant="secondary" onClick={handleActivateFreemium}>
                                            Activate
                                        </Button>
                                    </div>
                                )}
                             </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="developer" className="px-6 pb-6">
                        <Card className="bg-muted/50 border-dashed">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Code className="text-green-500"/> Developer Trial</CardTitle>
                                <CardDescription>For testing and development purposes. This will grant temporary premium access.</CardDescription>
                             </CardHeader>
                             <CardContent>
                                {subscription.status === 'trial' || subscription.status === 'active' ? (
                                    <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <AlertTitle className="text-green-800 dark:text-green-300">Trial or Premium is Active</AlertTitle>
                                        <AlertDescription className="text-green-600 dark:text-green-400">
                                            You already have full premium access.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="flex-1 w-full">
                                            <label htmlFor="dev-code" className="sr-only">Developer Code</label>
                                            <Input 
                                                id="dev-code"
                                                placeholder="Enter trial code..."
                                                value={devCode}
                                                onChange={(e) => setDevCode(e.target.value)}
                                            />
                                        </div>
                                        <Button className="w-full sm:w-auto" variant="secondary" onClick={handleActivateDeveloperTrial}>
                                            Activate Trial
                                        </Button>
                                    </div>
                                )}
                             </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
