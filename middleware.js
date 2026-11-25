// LYNX PRO — Vercel Edge Middleware (Zero-Dependency Static Compatible)
// Handles dynamic Open Graph metadata for WhatsApp / Social crawlers on receipt links
// without interfering with normal user traffic or static assets.

export const config = {
  matcher: ['/app/', '/app/index.html', '/r/:path*', '/t/:path*', '/i/:path*'],
};

export default async function middleware(request) {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const isCrawler = /whatsapp|facebookexternalhit|telegrambot|twitterbot|linkedinbot|discordbot|slackbot/i.test(ua);

  // Regular users pass straight through to static files / vercel.json rewrites
  if (!isCrawler) {
    return;
  }

  const url = new URL(request.url);
  const receiptId = url.searchParams.get('r') || url.searchParams.get('id') || '';
  const trialCode = url.searchParams.get('t') || '';

  let dynamicTitle = 'פרונט טכנו קאר • קבלה דיגיטלית והטבת VIP';
  let dynamicDesc = 'קבלה מאומתת, תעודת אחריות מלאה והטבת VIP אישית • המלאכה 3, עפולה';

  if (receiptId) {
    dynamicTitle = `פרונט טכנו קאר • קבלה דיגיטלית #${receiptId}`;
  } else if (trialCode) {
    dynamicTitle = 'LYNX PRO • מערכת קבלות דיגיטליות (גישת ניסיון)';
    dynamicDesc = 'היכנס להתנסות במערכת הקבלות הדיגיטליות החכמה LYNX PRO';
  }

  const origin = url.origin;
  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${dynamicTitle}</title>
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="he_IL" />
  <meta property="og:site_name" content="פרונט טכנו קאר • LYNX PRO" />
  <meta property="og:title" content="${dynamicTitle}" />
  <meta property="og:description" content="${dynamicDesc}" />
  <meta property="og:url" content="${url.href}" />
  <meta property="og:image" content="${origin}/app-preview.jpg" />
  <meta property="og:image:secure_url" content="${origin}/app-preview.jpg" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${dynamicTitle}" />
  <meta name="twitter:description" content="${dynamicDesc}" />
  <meta name="twitter:image" content="${origin}/app-preview.jpg" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
}
