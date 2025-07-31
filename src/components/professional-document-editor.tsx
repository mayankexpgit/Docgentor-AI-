"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ResultType {
  editedContent: string;
}

function ProfessionalDocumentEditor() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        body: JSON.stringify({ content: input }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Original Content</CardTitle>
            <CardDescription>Paste your text here to be improved.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[200px]"
              placeholder="Enter your text..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button className="mt-4" onClick={handleEdit} disabled={isLoading || !input}>
              {isLoading ? "Processing..." : "Edit Professionally"}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle>AI Edited Result</CardTitle>
            <CardDescription>The revised content from the AI will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="h-[40vh] border-2 border-dashed rounded-lg p-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : result?.editedContent ? (
              <pre className="whitespace-pre-wrap font-sans text-sm">{result.editedContent}</pre>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Your edited text will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { ProfessionalDocumentEditor };
export default ProfessionalDocumentEditor;
