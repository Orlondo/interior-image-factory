/**
 * For shops that turn away the app's own visits (a bot check): the person opens the product page in their
 * own browser and a bookmark copies just the product data from it (the page's title, tags and product data,
 * no passwords or personal details), which they paste into the app. Safe to import in the browser.
 */

/** The bookmark's code. It copies the data to the clipboard, or shows it to copy by hand if the browser says no. */
export const CAPTURE_BOOKMARKLET =
  "javascript:(()=>{const d=document.documentElement.outerHTML;" +
  "const l=[...d.matchAll(/<script[^>]+application\\/ld\\+json[^>]*>[\\s\\S]*?<\\/script>/gi)].map(m=>m[0]);" +
  "const m=[...d.matchAll(/<meta\\b[^>]*>/gi)].map(m=>m[0]).filter(t=>/og:|twitter:|product:|price|brand/i.test(t));" +
  "const t=(d.match(/<title[^>]*>[\\s\\S]*?<\\/title>/i)||[''])[0];" +
  "const o='<!--url:'+location.href+'-->'+t+'\\n'+m.join('\\n')+'\\n'+l.join('\\n');" +
  "navigator.clipboard.writeText(o).then(()=>alert('Product data copied. Paste it into the app.'),()=>prompt('Copy this, then paste it into the app:',o))})()";

/** The product's address a captured page carries (the bookmark writes it in), or "". */
export function captureUrl(text: string): string {
  const found = text.match(/<!--url:(https?:\/\/[^\s>]+?)-->/i)?.[1] ?? "";

  return found;
}
