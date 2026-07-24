/**
 * SheetGrid — 도메인 무관 "excel식" 표 셸(공용).
 *
 * 이 프로젝트의 표는 이 컴포넌트로 만든다(지침: .agents/ui/COMPONENTS.md).
 *
 * 제공(읽기 상호작용 + 셸):
 *  - 스티키 헤더, 좌/우 열 고정(sticky), 가로 스크롤, 얇은 격자선
 *  - 셀 키보드 주행: ↑/↓/Enter(아래)/←/→(텍스트 캐럿 경계에서 열 이동)
 *  - 범위 선택: 드래그 / Shift+클릭 / Shift+화살표
 *  - 범위 복사: Ctrl/⌘+C → TSV(엑셀 붙여넣기 호환)
 *
 * 제공하지 않음(도메인/편집기 몫): 데이터 모델·저장·행 추가·붙여넣기 입력·열 설정.
 * 편집 셀은 호출부가 cell() 안에 input/select/button 을 넣으면 된다 — 주행이 그 컨트롤로 포커스한다
 * (select 는 네이티브 키 동작을 유지하려 주행에서 제외). 편집 불가 셀은 td 자체가 포커스 대상이 된다.
 */
import * as React from "react";
import { cn } from "~/shared/lib/cn";

export interface SheetColumn<T> {
  key: string;
  header: React.ReactNode;
  /** 셀 내용. input/select/button 을 넣으면 키보드 주행이 그 컨트롤을 포커스한다. */
  cell: (row: T, pos: { r: number; c: number }) => React.ReactNode;
  /** 범위 복사(TSV)용 셀 텍스트. 미지정 시 빈 칸으로 복사된다. */
  copyText?: (row: T) => string;
  /** 최소 폭(tailwind min-w-* 클래스). */
  minW?: string;
  align?: "left" | "right" | "center";
  /** 좌/우 고정(색인·작업 열 등). 고정 셀은 배경을 깔아 스크롤 콘텐츠를 가린다. */
  sticky?: "left" | "right";
  /** 키보드 주행·범위 선택 대상 여부(기본 true). 색인/작업 버튼 열은 false 로. */
  focusable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
}

const ALIGN: Record<NonNullable<SheetColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function SheetGrid<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  empty,
  className,
}: {
  columns: SheetColumn<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  /** 행별 <tr> 클래스(zebra/강조 등). */
  rowClassName?: (row: T, i: number) => string | undefined;
  /** 행 0개일 때 표시(colSpan 전체). */
  empty?: React.ReactNode;
  /** 스크롤 컨테이너(루트) 추가 클래스. */
  className?: string;
}) {
  const gridRef = React.useRef<HTMLDivElement>(null);

  // 주행 가능한 열 인덱스(색인/버튼 열 제외). 좌우 이동은 이 목록을 점프한다.
  const navCols = React.useMemo(
    () => columns.map((_, i) => i).filter((i) => columns[i]!.focusable !== false),
    [columns],
  );

  const focusCell = React.useCallback((r: number, c: number) => {
    const td = gridRef.current?.querySelector<HTMLElement>(`[data-cell="${r}:${c}"]`);
    if (!td) return;
    const inner = td.querySelector<HTMLElement>("input,textarea,button,select");
    const el = inner ?? td;
    el.focus();
    if (el instanceof HTMLInputElement && el.type !== "checkbox") el.select();
  }, []);

  // ── 범위 선택(드래그 / Shift+클릭 / Shift+화살표) ──────────────────────────
  const [sel, setSel] = React.useState<{ anchor: { r: number; c: number }; focus: { r: number; c: number } } | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef<{ x: number; y: number; active: boolean } | null>(null);

  const selRect = (s: NonNullable<typeof sel>) => ({
    r0: Math.min(s.anchor.r, s.focus.r), r1: Math.max(s.anchor.r, s.focus.r),
    c0: Math.min(s.anchor.c, s.focus.c), c1: Math.max(s.anchor.c, s.focus.c),
  });
  const inSelRange = (r: number, c: number) => {
    if (!sel) return false;
    const { r0, r1, c0, c1 } = selRect(sel);
    if (r0 === r1 && c0 === c1) return false; // 단일 셀은 focus 링으로 충분
    return r >= r0 && r <= r1 && c >= c0 && c <= c1;
  };
  const cellFromEvent = (t: EventTarget | null): { r: number; c: number } | null => {
    const el = (t as HTMLElement | null)?.closest?.("[data-cell]") as HTMLElement | null;
    if (!el) return null;
    const [r, c] = el.dataset.cell!.split(":").map(Number);
    return { r: r!, c: c! };
  };
  const onGridMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const cell = cellFromEvent(e.target);
    if (!cell) return;
    setSel((prev) => (e.shiftKey && prev ? { anchor: prev.anchor, focus: cell } : { anchor: cell, focus: cell }));
    if (!e.shiftKey) dragRef.current = { x: e.clientX, y: e.clientY, active: false };
  };
  const onGridMouseOver = (e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d || e.buttons !== 1) return;
    if (!d.active && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return; // 임계 미만은 클릭
    const cell = cellFromEvent(e.target);
    if (!cell) return;
    if (!d.active) {
      d.active = true;
      setDragging(true);
      (document.activeElement as HTMLElement | null)?.blur?.();
      window.getSelection()?.removeAllRanges();
    }
    setSel((prev) => (prev ? { anchor: prev.anchor, focus: cell } : { anchor: cell, focus: cell }));
  };
  React.useEffect(() => {
    const up = () => { dragRef.current = null; setDragging(false); };
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, []);

  const onCopy = (e: React.ClipboardEvent) => {
    if (!sel) return;
    const { r0, r1, c0, c1 } = selRect(sel);
    if (r0 === r1 && c0 === c1) return; // 단일 셀 → 네이티브 복사
    const lines: string[] = [];
    for (let r = r0; r <= r1; r++) {
      const out: string[] = [];
      for (let c = c0; c <= c1; c++) {
        const col = columns[c]; const row = rows[r];
        out.push(col && row ? (col.copyText?.(row) ?? "") : "");
      }
      lines.push(out.join("\t"));
    }
    e.clipboardData.setData("text/plain", lines.join("\n"));
    e.preventDefault();
  };

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing) return; // IME 조합 중 통과
    const target = e.target as HTMLElement;
    if (target instanceof HTMLSelectElement) return; // select 는 네이티브 키 유지
    const cellEl = target.closest<HTMLElement>("[data-cell]");
    if (!cellEl) return;
    const [r, c] = cellEl.dataset.cell!.split(":").map(Number) as [number, number];
    const field =
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLInputElement && (target.type === "text" || target.type === "number" || target.type === ""))
        ? (target as HTMLInputElement | HTMLTextAreaElement)
        : null;
    const start = field ? field.selectionStart : null;
    const end = field ? field.selectionEnd : null;
    const len = field ? field.value.length : 0;
    const single = (nr: number, nc: number) => {
      focusCell(nr, nc);
      setSel({ anchor: { r: nr, c: nc }, focus: { r: nr, c: nc } });
    };

    // Shift+화살표: 범위 확장(anchor 고정).
    if (e.shiftKey && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const cur = sel ?? { anchor: { r, c }, focus: { r, c } };
      let fr = cur.focus.r;
      let fc = cur.focus.c;
      if (e.key === "ArrowDown") fr = Math.min(rows.length - 1, fr + 1);
      else if (e.key === "ArrowUp") fr = Math.max(0, fr - 1);
      else {
        const idx = navCols.indexOf(fc);
        if (e.key === "ArrowLeft" && idx > 0) fc = navCols[idx - 1]!;
        else if (e.key === "ArrowRight" && idx >= 0 && idx < navCols.length - 1) fc = navCols[idx + 1]!;
      }
      setSel({ anchor: cur.anchor, focus: { r: fr, c: fc } });
      focusCell(fr, fc);
      return;
    }

    if (e.key === "Enter" || e.key === "ArrowDown") {
      if (e.key === "Enter" && target instanceof HTMLButtonElement) return; // 버튼 Enter 는 네이티브
      if (e.key === "Enter" && target instanceof HTMLTextAreaElement && (e.altKey || e.shiftKey)) return; // 셀 안 개행
      if (r < rows.length - 1) { e.preventDefault(); single(r + 1, c); }
    } else if (e.key === "ArrowUp") {
      if (r > 0) { e.preventDefault(); single(r - 1, c); }
    } else if (e.key === "ArrowLeft") {
      if (!field || (start === 0 && end === 0)) {
        const idx = navCols.indexOf(c);
        if (idx > 0) { e.preventDefault(); single(r, navCols[idx - 1]!); }
      }
    } else if (e.key === "ArrowRight") {
      if (!field || (start === len && end === len)) {
        const idx = navCols.indexOf(c);
        if (idx >= 0 && idx < navCols.length - 1) { e.preventDefault(); single(r, navCols[idx + 1]!); }
      }
    } else if (e.key === "Escape") {
      if (sel) { const { r0, r1, c0, c1 } = selRect(sel); if (r0 !== r1 || c0 !== c1) setSel({ anchor: sel.focus, focus: sel.focus }); }
    }
  }

  const stickyCls = (col: SheetColumn<T>, kind: "head" | "body") =>
    col.sticky
      ? cn(
          "sticky z-10",
          col.sticky === "left" ? "left-0" : "right-0",
          kind === "head" ? "z-20 bg-background" : "bg-card",
          col.sticky === "left" ? "border-r" : "border-l",
        )
      : undefined;

  return (
    <div
      ref={gridRef}
      onKeyDown={onKeyDown}
      onCopy={onCopy}
      onMouseDown={onGridMouseDown}
      onMouseOver={onGridMouseOver}
      className={cn("overflow-auto", dragging && "select-none", className)}
    >
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-20 bg-background">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "whitespace-nowrap border-b border-border px-3 py-2 text-xs font-semibold text-foreground",
                  ALIGN[col.align ?? "left"],
                  col.minW,
                  stickyCls(col, "head"),
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={rowKey(row, r)} className={rowClassName?.(row, r)}>
              {columns.map((col, c) => {
                const focusable = col.focusable !== false;
                return (
                  <td
                    key={col.key}
                    {...(focusable ? { "data-cell": `${r}:${c}`, tabIndex: -1 } : {})}
                    className={cn(
                      "border-t border-border/60 px-3 py-1.5 align-middle text-foreground",
                      ALIGN[col.align ?? "left"],
                      focusable &&
                        "focus:relative focus:z-[5] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring focus-within:relative focus-within:z-[5] focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring",
                      inSelRange(r, c) && "bg-accent",
                      col.minW,
                      stickyCls(col, "body"),
                      col.cellClassName,
                    )}
                  >
                    {col.cell(row, { r, c })}
                  </td>
                );
              })}
            </tr>
          ))}
          {rows.length === 0 && empty != null && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-muted-foreground">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
