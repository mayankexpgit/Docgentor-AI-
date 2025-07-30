
"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Menu, UserCircle, HelpCircle, Bot, Info, Settings, LogIn, ArrowLeft, LogOut, MessageSquareMore, Gem } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ScrollArea } from "./ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";
import { useRouter } from "next/navigation";

type Tool = 'dashboard' | 'docs' | 'slides' | 'resume' | 'analyzer' | 'settings' | 'illustrations' | 'exam' | 'notes' | 'solver' | 'blueprint' | 'handwriting' | 'editor';

interface AppHeaderProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

export function AppHeader({ activeTool, setActiveTool }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader className="text-left">
            <SheetTitle>{t('helpCenterSheetTitle')}</SheetTitle>
            <SheetDescription>
              {t('helpCenterSheetDescription')}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6">
            <div className="px-6 py-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="how-to-use">
                  <AccordionTrigger><HelpCircle className="mr-2 h-4 w-4" />{t('helpHowToUse')}</AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: t('helpWelcome') + t('helpIntro') + t('helpStep1') + t('helpStep1Desc') + t('helpStep2') + t('helpStep2Desc') + t('helpStep2Doc') + t('helpStep2Exam') + t('helpStep2Editor') + t('helpStep3') + t('helpStep3Desc') + t('helpStep4') + t('helpStep4Desc') + t('helpStep5') + t('helpStep5Desc') }} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tools-intro">
                  <AccordionTrigger><Bot className="mr-2 h-4 w-4" />{t('helpToolsIntro')}</AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert">
                     <div dangerouslySetInnerHTML={{ __html: t('helpExploreTools') + t('helpToolsDesc') + t('helpContentCreation') + t('helpToolDoc') + t('helpToolExam') + t('helpToolNotes') + t('helpToolHandwriting') + t('helpEditingAnalysis') + t('helpToolEditor') + t('helpToolSolver') + t('helpToolAnalyzer') + t('helpDesignUtility') + t('helpToolBlueprint') + t('helpToolResume') + t('helpToolIllustration') }} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="subscriptions">
                  <AccordionTrigger><Gem className="mr-2 h-4 w-4" />{t('helpSubscriptionPlansTitle')}</AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert">
                     <div dangerouslySetInnerHTML={{ __html: t('helpSubscriptionIntro') + t('helpFreemiumTitle') + t('helpFreemiumDesc') + t('helpFreemiumBenefit1') + t('helpFreemiumBenefit2') + t('helpFreemiumBenefit3') + t('helpFreemiumBenefit4') + t('helpPremiumTitle') + t('helpPremiumDesc') + t('helpPremiumBenefit1') + t('helpPremiumBenefit2') + t('helpPremiumBenefit3') + t('helpPremiumBenefit4') + t('helpPremiumBenefit5') + t('helpPremiumBenefit6')  }} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="about-us">
                  <AccordionTrigger><Info className="mr-2 h-4 w-4" />{t('helpAboutPolicies')}</AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: t('helpAboutUs') + t('helpAboutUsDesc') + t('helpOurServices') + t('helpServicesDesc1') + t('helpServiceDoc') + t('helpServiceEdu') + t('helpServiceCreative') + t('helpServicesDesc2') + t('helpPrivacyPolicy') + t('helpPrivacyDesc1') + t('helpPrivacyDesc2') + t('helpContactUs') + t('helpContactUsDesc') }} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="feedback">
                  <AccordionTrigger><MessageSquareMore className="mr-2 h-4 w-4" />{t('helpFeedbackSupport')}</AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert">
                     <div dangerouslySetInnerHTML={{ __html: t('helpFeedbackTitle') + t('helpFeedbackDesc') + t('helpHowToGiveFeedback') + t('helpFeedbackDesc2') + t('helpCommonIssues') + t('helpIssueSlow') + t('helpIssueLogin') + t('helpIssueDownload') + t('helpFutureUpdates') + t('helpFutureDesc') + t('helpFutureUpdate1') + t('helpFutureUpdate2') + t('helpFutureUpdate3') + t('helpStayTuned') }} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      
      <div className="flex-1">
        {activeTool !== 'dashboard' && (
            <Button variant="ghost" onClick={() => setActiveTool('dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backButton')}
            </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserCircle className="h-6 w-6" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user ? user.email : t('guestAccount')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setActiveTool('settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('settingsTitle')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user ? (
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('signOut')}</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => router.push('/login')}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>{t('signIn')} / Sign Up</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
