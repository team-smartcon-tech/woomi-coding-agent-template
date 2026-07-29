import { renderMarkdown } from "~/shared/lib/markdown"
import { cn } from "~/shared/lib/cn"

/**
 * 마크다운 텍스트를 안전하게 렌더한다(경량 파서 + HTML 이스케이프, 의존성 없음).
 * 타이포그래피는 app.css 의 `.md` 규칙이 담당한다.
 */
export function Markdown({ text, className }: { text?: string | null; className?: string }) {
  return (
    <div
      className={cn("md", className)}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text ?? "") }}
    />
  )
}
