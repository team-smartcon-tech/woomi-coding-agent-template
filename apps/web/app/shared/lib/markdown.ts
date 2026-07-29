// 경량 마크다운 → HTML 렌더러 (의존성 없음).
// 보안: 입력 전체를 먼저 HTML 이스케이프한 뒤 제한된 마크다운 구문만 controlled 태그로 되살린다.
// 따라서 원본의 raw HTML/스크립트는 절대 통과하지 못한다(XSS 안전). 링크 URL도 화이트리스트 검사.
// 지원: # ## ### 제목, **굵게**, *기울임* / _기울임_, `코드`, [텍스트](url), - / * / · 목록,
//       1. 순서목록, > 인용, --- 구분선, 문단 내 줄바꿈(<br>).

const escapeHtml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeHref = (url: string): string =>
    /^(https?:\/\/|mailto:|\/)/i.test(url.trim()) ? url.trim() : '#';

// 인라인(이미 이스케이프된 텍스트에 적용).
const inline = (s: string): string => {
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, txt, url) =>
        `<a href="${safeHref(url)}" target="_blank" rel="noopener noreferrer">${txt}</a>`);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^\w])_([^_\n]+)_(?![\w])/g, '$1<em>$2</em>');
    return s;
};

export function renderMarkdown(src: string): string {
    const lines = escapeHtml(src || '').replace(/\r\n?/g, '\n').split('\n');
    const out: string[] = [];
    let list: 'ul' | 'ol' | null = null;
    let para: string[] = [];

    const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
    const flushPara = () => {
        if (para.length) { out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; }
    };

    for (const raw of lines) {
        const line = raw.trimEnd();
        if (!line.trim()) { flushPara(); closeList(); continue; }

        let m: RegExpMatchArray | null;
        if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
            flushPara(); closeList();
            const lvl = m[1].length + 2; // # → h3, ## → h4, ### → h5
            out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
        } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
            flushPara(); closeList();
            out.push('<hr>');
        } else if ((m = line.match(/^&gt;\s?(.*)$/))) { // '>'가 이스케이프되어 &gt; 로 들어온다
            flushPara(); closeList();
            out.push(`<blockquote>${inline(m[1])}</blockquote>`);
        } else if ((m = line.match(/^\s*(?:[-*]|·|•)\s+(.*)$/))) {
            flushPara();
            if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
            out.push(`<li>${inline(m[1])}</li>`);
        } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
            flushPara();
            if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
            out.push(`<li>${inline(m[1])}</li>`);
        } else {
            closeList();
            para.push(line);
        }
    }
    flushPara();
    closeList();
    return out.join('\n');
}
