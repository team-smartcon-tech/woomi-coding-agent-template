import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

// 이 파서는 결과가 dangerouslySetInnerHTML 로 들어가고(`~/shared/ui/markdown`),
// 헤더에서 "raw HTML/스크립트는 절대 통과하지 못한다"를 약속한다. 그 약속만 검증한다.
describe('renderMarkdown — XSS 방어', () => {
    it('raw HTML 을 태그로 되살리지 않는다', () => {
        const html = renderMarkdown('<script>alert(1)</script>');
        expect(html).not.toContain('<script');
        expect(html).toContain('&lt;script&gt;');
    });

    it('img onerror 같은 주입도 이스케이프한다', () => {
        const html = renderMarkdown('<img src=x onerror=alert(1)>');
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    it('javascript: 링크를 # 로 무력화한다', () => {
        expect(renderMarkdown('[x](javascript:alert)')).toContain('href="#"');
        expect(renderMarkdown('[x](data:text/html,abc)')).toContain('href="#"');
    });

    it('href 속성을 깨는 quote 를 이스케이프한다', () => {
        const html = renderMarkdown('[x](https://a"onerror=1)');
        expect(html).toContain('&quot;'); // 원본 " 가 그대로 나가면 속성 밖으로 탈출한다
    });

    it('허용된 링크는 noopener 와 함께 유지한다', () => {
        const html = renderMarkdown('[깃허브](https://example.com/a)');
        expect(html).toContain('href="https://example.com/a"');
        expect(html).toContain('rel="noopener noreferrer"');
    });
});

describe('renderMarkdown — 구문', () => {
    it('제목은 h3 부터 시작한다 (문서 본문에 삽입되므로)', () => {
        expect(renderMarkdown('# T')).toBe('<h3>T</h3>');
        expect(renderMarkdown('### T')).toBe('<h5>T</h5>');
    });

    it('인용은 blockquote 로 변환한다', () => {
        expect(renderMarkdown('> 인용문')).toBe('<blockquote>인용문</blockquote>');
    });

    it('목록을 ul/ol 로 감싼다', () => {
        expect(renderMarkdown('- a\n- b')).toBe('<ul>\n<li>a</li>\n<li>b</li>\n</ul>');
        expect(renderMarkdown('1. a')).toBe('<ol>\n<li>a</li>\n</ol>');
    });

    it('& 를 한 번만 이스케이프한다', () => {
        expect(renderMarkdown('a & b')).toBe('<p>a &amp; b</p>');
    });
});
