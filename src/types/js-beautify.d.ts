declare module 'js-beautify' {
  export function html_beautify(html: string, options?: Record<string, any>): string;
  export function js_beautify(js: string, options?: Record<string, any>): string;
  export function css_beautify(css: string, options?: Record<string, any>): string;
}
