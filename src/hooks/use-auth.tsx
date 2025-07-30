
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, type User as FirebaseUser, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from './use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from './use-translation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<FirebaseUser>;
    signUp: (email: string, pass: string) => Promise<FirebaseUser>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<FirebaseUser>;
    getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { t } = useTranslation();
    const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; description: string; details?: string[] }>({ open: false, title: '', description: '' });


    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            setLoading(false);
            console.warn("Firebase not configured, auth features disabled.");
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            // On initial load or auth state change, clear the guest flag
            if (user) {
                sessionStorage.removeItem('isGuest');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    const getAccessToken = async (): Promise<string | null> => {
        if (!user) {
            console.error("User not signed in, cannot get access token.");
            return null;
        }
        try {
            return await user.getIdToken(true); // Force refresh the token
        } catch (error) {
            console.error("Error getting access token:", error);
            return null;
        }
    };

    const signIn = async (email: string, pass: string): Promise<FirebaseUser> => {
        if (!auth) throw new Error("Firebase is not initialized.");
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        return userCredential.user;
    };

    const signUp = async (email: string, pass: string): Promise<FirebaseUser> => {
        if (!auth) throw new Error("Firebase is not initialized.");
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        return userCredential.user;
    };
    
    const signInWithGoogle = async (): Promise<FirebaseUser> => {
        if (!auth) throw new Error("Firebase is not initialized.");
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                toast({
                    variant: "destructive",
                    title: "Sign-In Cancelled",
                    description: "The sign-in popup was closed before completion.",
                });
            } else if (error.code === 'auth/auth-domain-config-required' || error.message.includes('redirect_uri_mismatch')) {
                const domainName = window.location.hostname;
                setErrorDialog({
                    open: true,
                    title: t('toastActionRequired'),
                    description: t('toastUserErrorDesc'),
                    details: [
                        t('toastDeveloperTitle'),
                        t('toastActionRequiredDesc1'),
                        t('toastActionRequiredDesc2'),
                        domainName,
                        t('toastActionRequiredDesc3'),
                        t('toastActionRequiredDesc4'),
                        t('toastActionRequiredDesc5'),
                    ]
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: t('toastSignInError'),
                    description: t('toastSignInErrorDesc', { code: error.code || 'unknown' }),
                });
            }
            throw error; // Re-throw the error so the calling component knows it failed
        }
    };

    const signOut = async () => {
        if (!auth) throw new Error("Firebase is not initialized.");
        sessionStorage.removeItem('isGuest');
        await firebaseSignOut(auth);
        toast({ title: t('toastSignOutSuccess'), description: t('toastSignOutSuccessDesc') });
    };

    if (!isFirebaseConfigured) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
                <h1 className="text-2xl font-bold text-destructive">Firebase Not Configured</h1>
                <p className="mt-2 text-muted-foreground">
                    Please add your Firebase configuration variables to the <strong>.env</strong> file to enable authentication and other features.
                </p>
            </div>
        );
    }

    const value = { user, loading, signIn, signUp, signOut, signInWithGoogle, getAccessToken };

    return (
        <AuthContext.Provider value={value}>
            {children}
            <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({...prev, open}))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{errorDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {errorDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {errorDialog.details && (
                        <Collapsible>
                            <CollapsibleTrigger asChild>
                                <Button variant="link" className="text-xs p-0 h-auto">Show Details <ChevronDown className="w-4 h-4 ml-1"/></Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="mt-4 text-xs space-y-2 bg-muted p-4 rounded-md">
                                    <p className="font-bold">{errorDialog.details[0]}</p>
                                    <p>{errorDialog.details[1]}</p>
                                    <p>1. {errorDialog.details[2]}</p>
                                    <div className="flex items-center gap-2">
                                        <pre className="bg-background p-2 rounded-md text-destructive-foreground break-all flex-1">{errorDialog.details[3]}</pre>
                                        <Button size="sm" onClick={() => {
                                            navigator.clipboard.writeText(errorDialog.details![3]);
                                            toast({ title: t('toastCopiedToClipboard') });
                                        }}>Copy</Button>
                                    </div>
                                    <p>2. {errorDialog.details[4]}</p>
                                    <p className="pl-4">{errorDialog.details[5]}</p>
                                    <p className="pl-4">{errorDialog.details[6]}</p>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setErrorDialog(prev => ({...prev, open: false}))}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return { ...context, isFirebaseConfigured };
};

    