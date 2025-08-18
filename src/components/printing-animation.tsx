"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function PrintingAnimation() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span>Generating your document{dots}</span>
    </div>
  );
}
