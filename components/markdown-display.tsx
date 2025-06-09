"use client";

import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownDisplayProps {
  markdown: string;
}

export function MarkdownDisplay({ markdown }: MarkdownDisplayProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto">
                  <table
                    className="min-w-full divide-y divide-border my-4"
                    {...props}
                  />
                </div>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
