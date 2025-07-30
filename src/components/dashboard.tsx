
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, User, ScanText, ArrowRight, FolderArchive, BarChartHorizontal, ClipboardPen, FileSignature, BookOpenCheck, DraftingCompass, PenSquare, LucideIcon, FileEdit, Eye, Crown, CheckCircle, Layers, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RadialMenu } from "./radial-menu";
import { cn } from "@/lib/utils";
import { useRecentGenerations, AnyRecentGeneration } from "@/hooks/use-recent-generations";
import { RecentGenerationItem } from "./recent-generation-item";
import { useToolState } from "@/hooks/use-tool-state";
import { useTranslation } from "@/hooks/use-translation";
import { NativeAdBanner } from "./native-ad-banner";
import { premiumTools, freemiumTools } from "@/config/subscriptions";
import { Badge } from "./ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { Skeleton } from "./ui/skeleton";
import { Loader2 } from "lucide-react";

type Tool = 'dashboard' | 'docs' | 'resume' | 'analyzer' | 'illustrations' | 'storage' | 'exam' | 'notes' | 'solver' | 'blueprint' | 'handwriting' | 'editor' | 'watermark-adder';

interface DashboardProps {
    setActiveTool: (tool: Tool) => void;
    setSubscriptionModalOpen: (isOpen: boolean) => void;
}

export const tools: {
    nameKey: string;
    descriptionKey: string;
    icon: LucideIcon;
    tool: Tool;
    color: string;
    bgColor: string;
    gradient: string;
}[] = [
    {
        nameKey: "docsToolName",
        descriptionKey: "docsToolDescription",
        icon: FileText,
        tool: "docs" as Tool,
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        gradient: "from-purple-500 to-indigo-600",
    },
    {
        nameKey: "watermarkAdderToolName",
        descriptionKey: "watermarkAdderToolDescription",
        icon: Layers,
        tool: "watermark-adder" as Tool,
        color: "text-cyan-600",
        bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
        gradient: "from-cyan-500 to-teal-600",
    },
    {
        nameKey: "examToolName",
        descriptionKey: "examToolDescription",
        icon: ClipboardPen,
        tool: "exam" as Tool,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        gradient: "from-blue-500 to-sky-600",
    },
     {
        nameKey: "notesToolName",
        descriptionKey: "notesToolDescription",
        icon: FileSignature,
        tool: "notes" as Tool,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        gradient: "from-green-500 to-emerald-600",
    },
     {
        nameKey: "handwritingToolName",
        descriptionKey: "handwritingToolDescription",
        icon: PenSquare,
        tool: "handwriting" as Tool,
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        gradient: "from-red-500 to-orange-600",
    },
    {
        nameKey: "editorToolName",
        descriptionKey: "editorToolDescription",
        icon: FileEdit,
        tool: "editor" as Tool,
        color: "text-indigo-600",
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
        gradient: "from-indigo-500 to-violet-600",
    },
    {
        nameKey: "solverToolName",
        descriptionKey: "solverToolDescription",
        icon: BookOpenCheck,
        tool: "solver" as Tool,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        gradient: "from-yellow-500 to-amber-600",
    },
    {
        nameKey: "blueprintToolName",
        descriptionKey: "blueprintToolDescription",
        icon: DraftingCompass,
        tool: "blueprint" as Tool,
        color: "text-sky-600",
        bgColor: "bg-sky-100 dark:bg-sky-900/30",
        gradient: "from-sky-400 to-blue-500",
    },
    {
        nameKey: "resumeToolName",
        descriptionKey: "resumeToolDescription",
        icon: User,
        tool: "resume" as Tool,
        color: "text-orange-600",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        gradient: "from-orange-400 to-red-500",
    },
    {
        nameKey: "analyzerToolName",
        descriptionKey: "analyzerToolDescription",
        icon: ScanText,
        tool: "analyzer" as Tool,
        color: "text-pink-600",
        bgColor: "bg-pink-100 dark:bg-pink-900/30",
        gradient: "from-pink-500 to-rose-500",
    },
    {
        nameKey: "illustrationToolName",
        descriptionKey: "illustrationToolDescription",
        icon: BarChartHorizontal,
        tool: "illustrations" as Tool,
        color: "text-teal-600",
        bgColor: "bg-teal-100 dark:bg-teal-900/30",
        gradient: "from-teal-400 to-cyan-500",
    }
];

export function Dashboard({ setActiveTool, setSubscriptionModalOpen }: DashboardProps) {
    const { user, loading: authLoading } = useAuth();
    const { recentGenerations } = useRecentGenerations();
    const { setToolState } = useToolState(null); // Get the generic setter
    const { t } = useTranslation();
    const { subscription, loading: subscriptionLoading } = useSubscription();
    const [showAllGenerations, setShowAllGenerations] = React.useState(false);

    const displayedGenerations = showAllGenerations ? recentGenerations : recentGenerations.slice(0, 3);

    const isPremiumUser = subscription.status === 'active' || subscription.status === 'trial';
    const isFreemiumUser = subscription.status === 'freemium';

    const handleViewGeneration = (item: AnyRecentGeneration) => {
        // This is the correct way to update a specific tool's state from a handler.
        setToolState(item.type, item.data);
        setActiveTool(item.type);
    };

    if (authLoading) {
         return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            
            <div className="text-left">
                <div className="flex items-center gap-2">
                    <h1 className="text-4xl font-bold font-headline text-foreground">
                        {t('dashboardHello', { name: user?.displayName || user?.email?.split('@')[0] || t('guest') })}
                    </h1>
                     {subscriptionLoading ? (
                        <Skeleton className="w-8 h-8 rounded-full" />
                     ) : isPremiumUser ? (
                        <Crown className="w-8 h-8 text-yellow-500 animate-crown-glow animate-shine" fill="currentColor" />
                    ) : isFreemiumUser ? (
                        <Crown className="w-8 h-8 text-blue-500 animate-blue-crown-glow animate-shine" fill="currentColor" />
                    ) : null}
                </div>
                <p className="mt-2 text-lg text-muted-foreground">
                    {t('dashboardLetsCreate')}
                </p>
            </div>
            
            <div className="relative">
                <Card className="lg:col-span-2 bg-gradient-to-br from-primary via-purple-600 to-violet-700 text-white p-8 flex flex-col justify-between rounded-3xl min-h-[200px] shadow-2xl shadow-primary/20">
                   <div>
                     <h2 className="text-3xl font-bold font-headline">{t('dashboardAiContentGenerator')}</h2>
                     <p className="mt-2 text-purple-200 max-w-lg">{t('dashboardGeneratorDescription')}</p>
                   </div>
                   <div className="mt-8">
                        <Button onClick={() => setActiveTool('docs')} className="bg-white/20 hover:bg-white/30 text-white rounded-full">
                            {t('dashboardGetStarted')} <ArrowRight className="ml-2 w-4 h-4"/>
                        </Button>
                   </div>
                </Card>
            </div>

            

            {recentGenerations.length > 0 && (
                 <div className="pt-8">
                    <h2 className="text-2xl font-bold font-headline text-foreground mb-4">{t('dashboardRecentGenerations')}</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                         {displayedGenerations.map((item) => (
                           <RecentGenerationItem key={item.id} item={item} onSelect={handleViewGeneration}/>
                        ))}
                    </div>
                    {recentGenerations.length > 3 && (
                        <div className="mt-4 text-center">
                            <Button variant="ghost" onClick={() => setShowAllGenerations(!showAllGenerations)}>
                                {showAllGenerations ? 'Show Less' : 'Show All'}
                                <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", showAllGenerations && "rotate-180")} />
                            </Button>
                        </div>
                    )}
                 </div>
            )}
            
            <div className="pt-8">
                 <h2 className="text-2xl font-bold font-headline text-foreground mb-4">{t('dashboardQuickTools')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tools.map((tool) => {
                        const isPremium = premiumTools.includes(tool.tool);
                        const isFreemium = freemiumTools.includes(tool.tool);
                        const hasFreemiumAccess = isFreemiumUser || isPremiumUser;

                        return (
                        <Card 
                            key={tool.tool}
                            onClick={() => setActiveTool(tool.tool)}
                            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative"
                        >
                             {isPremium && (
                                isPremiumUser ? (
                                    <Badge variant="secondary" className="badge-glossy animate-shine absolute -top-2 -right-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-md">
                                        <CheckCircle className="w-3 h-3 mr-1"/>
                                        Unlocked
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="badge-glossy animate-shine absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-none shadow-md">
                                        <Crown className="w-3 h-3 mr-1"/>
                                        Premium
                                    </Badge>
                                )
                            )}
                             {isFreemium && !isPremium && (
                                hasFreemiumAccess ? (
                                    <Badge variant="secondary" className="badge-glossy animate-shine absolute -top-2 -right-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-md">
                                        <CheckCircle className="w-3 h-3 mr-1"/>
                                        Unlocked
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="badge-glossy animate-shine absolute -top-2 -right-2 bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-none shadow-md">
                                        <Crown className="w-3 h-3 mr-1"/>
                                        Freemium
                                    </Badge>
                                )
                            )}
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-32">
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110", tool.bgColor)}>
                                    <tool.icon className={cn("w-6 h-6", tool.color)} />
                                </div>
                                <h3 className="text-sm font-semibold">{t(tool.nameKey as any)}</h3>
                            </CardContent>
                        </Card>
                    )})}
                </div>
            </div>
            
            <div className="pt-8 text-center">
                <div className="flex items-center justify-center min-h-[400px]">
                    <RadialMenu tools={tools} setActiveTool={setActiveTool} />
                </div>
            </div>
            <NativeAdBanner />
        </div>
    );
}

    
