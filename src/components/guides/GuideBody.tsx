import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function isInternal(href: string): boolean {
  return href.startsWith("/") || href.startsWith("#");
}

const components: Components = {
  a({ href, children }) {
    const url = href ?? "";
    if (isInternal(url)) {
      return <Link href={url}>{children}</Link>;
    }
    return (
      <a href={url} rel="noopener" target="_blank">
        {children}
      </a>
    );
  },
};

export function GuideBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose-guide">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
