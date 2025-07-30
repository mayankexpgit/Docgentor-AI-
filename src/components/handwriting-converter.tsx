
"use client";

import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PenSquare, Wand2, Download, FileType, Type, CloudUpload, Loader2, FileX2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { convertToHandwriting, HandwritingConverterOutput } from "@/ai/flows/handwriting-converter";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";
import { useAuth } from "@/hooks/use-auth";
import { uploadToGoogleDrive } from "@/services/storage";
import { useToolState } from "@/hooks/use-tool-state";
import { useRecentGenerations } from "@/hooks/use-recent-generations";


const handwritingFonts = [
    { name: 'Patrick Hand', className: 'font-patrick-hand', description: "Neat & Friendly" },
    { name: 'Kalam', className: 'font-kalam', description: "Natural & Slanted" },
    { name: 'Reenie Beanie', className: 'font-reenie-beanie', description: "Thin & Scratchy" },
    { name: 'Rock Salt', className: 'font-rock-salt', description: "Bold Marker" },
    { name: 'Caveat', className: 'font-caveat', description: "Casual & Looping" },
    { name: 'Dancing Script', className: 'font-dancing-script', description: "Elegant & Flowing" },
    { name: 'Indie Flower', className: 'font-indie-flower', description: "Bubbly & Rounded" },
];

const fontEnum = z.enum(['Caveat', 'Dancing Script', 'Patrick Hand', 'Indie Flower', 'Kalam', 'Reenie Beanie', 'Rock Salt']);
const humanizeLevels = ['none', 'medium', 'high', 'ultra', 'max'] as const;
const humanizeLevelEnum = z.enum(humanizeLevels);

const formSchema = z.object({
  sourceText: z.string().min(20, {
    message: "Please enter at least 20 characters of text to convert.",
  }),
  fontName: fontEnum.default('Patrick Hand'),
  humanizeLevel: humanizeLevelEnum.default('high'),
});

export function HandwritingConverter() {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const { toast } = useToast();
    const { user, getAccessToken, signIn } = useAuth();
    const previewRef = useRef<HTMLDivElement>(null);
    const { getToolState, setToolState } = useToolState<HandwritingConverterOutput>('handwriting');
    const { addRecentGeneration } = useRecentGenerations();
    const result = getToolState();


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            sourceText: "This is a sample of handwritten text created by an AI. The goal is to make this look as natural and human-like as possible, with subtle variations in each character. Higher humanization levels will instruct the AI to rewrite this text to include more natural connections and ligatures, like real cursive writing.",
            fontName: "Patrick Hand",
            humanizeLevel: "high",
        },
    });

    const humanizeValue = form.watch('humanizeLevel');

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setToolState(null);
        try {
            const output = await convertToHandwriting({
                sourceText: values.sourceText,
                fontName: values.fontName,
                humanizeLevel: values.humanizeLevel,
            });
            setToolState(output);
            addRecentGeneration({
                type: 'handwriting',
                title: `Handwritten Note (${values.fontName})`,
                data: output,
                formValues: values,
            });
            toast({
                title: 'Note Generated!',
                description: 'The preview has been updated.',
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to generate the note content. Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const generatePdfBlob = async (): Promise<Blob | null> => {
        const contentToCapture = previewRef.current;
        if (!contentToCapture) {
            toast({ variant: "destructive", title: "Error", description: "Could not find content to generate PDF from." });
            return null;
        }

        let canvas;
        try {
            canvas = await html2canvas(contentToCapture, {
                scale: 2,
                useCORS: true,
                backgroundColor: null, // important for transparent background on capture
            });
        } catch(e) {
            console.error("html2canvas failed", e);
            toast({ variant: "destructive", title: "PDF Generation Error", description: "Could not render the note for PDF conversion." });
            return null;
        }

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        return pdf.output('blob');
    }
    
    const handleDownload = async () => {
        setIsGeneratingPdf(true);
        toast({ title: "Preparing Download...", description: "Your PDF note is being generated." });
        
        const blob = await generatePdfBlob();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'handwritten-note.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({ title: "Download Complete!", description: "Your handwritten note has been downloaded." });
        }
        setIsGeneratingPdf(false);
    }

    const handleSaveToCloud = async () => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Login Required",
                description: "You must be signed in to save documents to the cloud.",
                action: <Button onClick={signIn}>Sign In</Button>
            });
            return;
        }

        const accessToken = await getAccessToken();
        if (!accessToken) {
            toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Could not get Google access token. Please sign in again.",
                action: <Button onClick={signIn}>Sign In</Button>
            });
            return;
        }


        setIsUploading(true);
        toast({
            title: "Uploading to Cloud...",
            description: "Your handwritten note is being saved.",
        });

        try {
            const blob = await generatePdfBlob();
            if (!blob) {
                 throw new Error("Failed to generate PDF blob for upload.");
            }
            const fileName = `Handwritten_Note_${new Date().toISOString()}.pdf`;
            const driveFile = await uploadToGoogleDrive(accessToken, fileName, blob, "application/pdf");

            toast({
                title: "Saved to Cloud!",
                description: "Your note has been successfully saved.",
                action: (
                    <a href={driveFile.webViewLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">View File</Button>
                    </a>
                )
            });
        } catch (error) {
             console.error("Cloud upload failed:", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: "Could not save your note. Please try again.",
            });
        } finally {
            setIsUploading(false);
        }
    };

    if (result && !isLoading) {
         return (
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Generated Note Preview</CardTitle>
                            <CardDescription>Your converted note is ready to download.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handleSaveToCloud} disabled={isUploading || isGeneratingPdf}>
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <CloudUpload className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleDownload} disabled={isGeneratingPdf}>
                                {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    
                    <div className={cn("h-full w-full rounded-md border-2 border-dashed flex items-center justify-center p-4", "border-primary")}>
                        <div 
                            ref={previewRef}
                            className="w-full h-full" 
                            dangerouslySetInnerHTML={{ __html: result.handwrittenNoteHtml }}
                        />
                    </div>
                    <Button onClick={() => setToolState(null)} variant="outline" className="w-full mt-4">
                        <FileX2 className="mr-2 h-4 w-4" />
                        Generate a New Note
                    </Button>
                    
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>AI Handwritten Notes</CardTitle>
                        <CardDescription>
                            Convert your typed notes into a chosen handwriting style on a lined notebook page (A4 PDF).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="sourceText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Your Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Type or paste the notes you want to convert here..."
                                                    className="min-h-[200px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="fontName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><Type /> Handwriting Style</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a handwriting style" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Choose a Human-like Font</SelectLabel>
                                                        {handwritingFonts.map(font => (
                                                            <SelectItem key={font.name} value={font.name} className={font.className}>
                                                                <span className="font-semibold">{font.description}</span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Select a handwriting style for your note.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="humanizeLevel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                <span className="flex items-center gap-2">Humanization Level: <span className="font-bold capitalize">{humanizeValue}</span></span>
                                            </FormLabel>
                                            <FormControl>
                                                <Slider
                                                    min={0}
                                                    max={humanizeLevels.length - 1}
                                                    step={1}
                                                    defaultValue={[humanizeLevels.indexOf(field.value)]}
                                                    onValueChange={(value) => field.onChange(humanizeLevels[value[0]])}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                            Controls the realism. Higher levels use AI to add more variations and connections.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating Preview...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            Generate Note Preview
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card className="min-h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Generated Note Preview</CardTitle>
                        <CardDescription>Your converted note will be shown here.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <div className={cn("h-full w-full rounded-md border-2 border-dashed flex items-center justify-center p-4")}>
                            {isLoading && (
                                <div className="text-center text-muted-foreground space-y-4">
                                    <PenSquare className="h-12 w-12 animate-pulse text-primary mx-auto" />
                                    <p>AI is writing your note...</p>
                                </div>
                            )}
                            {!result && !isLoading && (
                                <div className="text-center text-muted-foreground p-8">
                                    <FileType className="w-12 h-12 mx-auto mb-4" />
                                    <p>Your generated note preview will be displayed here.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
        </div>
    );
}
