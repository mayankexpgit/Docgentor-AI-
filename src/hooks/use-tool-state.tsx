
"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { GenerateDocumentOutput } from "@/ai/flows/generate-document";
import { SolveBookletOutput } from '@/ai/flows/booklet-solver';
import { GenerateExamPaperOutput } from '@/ai/flows/exam-paper-generator';
import { GenerateIllustrationOutput } from '@/ai/flows/generate-illustration';
import { GenerateProjectBlueprintOutput } from '@/ai/flows/generate-project-blueprint';
import { GenerateResumeOutput } from '@/ai/flows/generate-resume';
import { GenerateShortNotesOutput } from '@/ai/flows/generate-short-notes';
import { HandwritingConverterOutput } from '@/ai/flows/handwriting-converter';
import { ProfessionalDocumentEditorOutput } from '@/ai/flows/professional-document-editor';
import { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document';
import { AnyRecentGeneration } from './use-recent-generations';
import { AddWatermarkOutput } from '@/ai/flows/add-watermark';

export type Tool = 'dashboard' | 'docs' | 'resume' | 'analyzer' | 'settings' | 'illustrations' | 'storage' | 'exam' | 'notes' | 'solver' | 'blueprint' | 'handwriting' | 'editor' | 'watermark-adder';

// A mapped type to hold the state for each tool
export type AllToolStates = {
    docs: GenerateDocumentOutput;
    resume: GenerateResumeOutput;
    analyzer: AnalyzeDocumentOutput;
    illustrations: GenerateIllustrationOutput;
    exam: GenerateExamPaperOutput;
    notes: GenerateShortNotesOutput;
    solver: SolveBookletOutput;
    blueprint: GenerateProjectBlueprintOutput;
    handwriting: HandwritingConverterOutput;
    editor: ProfessionalDocumentEditorOutput;
    'watermark-adder': AddWatermarkOutput;
};

// This type maps a tool name to its expected data type
export type ToolStateMap = {
    [K in Tool]?: K extends keyof AllToolStates ? AllToolStates[K] : any;
}


interface ToolStateContextType {
    toolStates: Partial<ToolStateMap>;
    setToolState: <T extends keyof ToolStateMap>(tool: T, state: ToolStateMap[T] | null) => void;
    getToolState: <T extends keyof ToolStateMap>(tool: T) => ToolStateMap[T] | null;
}

const ToolStateContext = createContext<ToolStateContextType | undefined>(undefined);

export const ToolStateProvider = ({ children }: { children: ReactNode }) => {
    const [toolStates, setToolStates] = useState<Partial<ToolStateMap>>({});

    const setToolStateCallback = useCallback(<T extends keyof ToolStateMap>(tool: T, state: ToolStateMap[T] | null) => {
        setToolStates(prev => ({
            ...prev,
            [tool]: state,
        }));
    }, []);

    const getToolStateCallback = useCallback(<T extends keyof ToolStateMap>(tool: T): ToolStateMap[T] | null => {
        return toolStates[tool] || null;
    }, [toolStates]);

    const value = {
        toolStates,
        setToolState: setToolStateCallback,
        getToolState: getToolStateCallback,
    };

    return (
        <ToolStateContext.Provider value={value}>
            {children}
        </ToolStateContext.Provider>
    );
};

export const useToolState = <T,>(tool: keyof ToolStateMap | null) => {
    const context = useContext(ToolStateContext);
    if (context === undefined) {
        throw new Error('useToolState must be used within a ToolStateProvider');
    }
    
    // If no tool is provided, return a generic setter that can set state for any tool.
    if (!tool) {
        return {
            getToolState: () => null,
            setToolState: context.setToolState,
        };
    }

    return {
        getToolState: (): T | null => context.getToolState(tool) as T | null,
        setToolState: (state: T | null) => context.setToolState(tool, state),
    };
};
