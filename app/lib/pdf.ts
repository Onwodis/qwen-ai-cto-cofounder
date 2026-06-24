import type { StructuredReport, Message, Perspective } from '@/app/types';

// ── Agent registry ────────────────────────────────────────────────────────────

const AGENT_RGB: Record<string, [number, number, number]> = {
  CTO:      [99,  102, 241],
  Infra:    [217, 119, 6  ],
  Product:  [16,  185, 129],
  Security: [6,   182, 212],
  CEO:      [139, 92,  246],
  CRO:      [34,  197, 94 ],
  CMO:      [236, 72,  153],
  CFO:      [14,  165, 233],
  COO:      [251, 146, 60 ],
  BizDev:   [99,  102, 241],
  CPO:      [20,  184, 166],
  DataML:   [168, 85,  247],
  Frontend: [244, 63,  94 ],
  Backend:  [132, 204, 22 ],
  QA:       [234, 179, 8  ],
};

const AGENT_LABEL: Record<string, string> = {
  CTO:      'Atlas · CTO',
  Infra:    'Rex · Infrastructure',
  Product:  'Nova · Product',
  Security: 'Cipher · Security',
  CEO:      'Victoria · CEO',
  CRO:      'Marcus · CRO',
  CMO:      'Diana · CMO',
  CFO:      'Robert · CFO',
  COO:      'Sarah · COO',
  BizDev:   'James · BizDev',
  CPO:      'Alexis · CPO',
  DataML:   'Kai · Data & ML',
  Frontend: 'Luna · Frontend',
  Backend:  'Sage · Backend',
  QA:       'Finn · QA',
};

function agentRgb(key?: string): [number, number, number] {
  return (key && AGENT_RGB[key]) ? AGENT_RGB[key] : [99, 102, 241];
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function downloadPDF(
  report: StructuredReport,
  productName: string,
  founderName: string,
  messages: Message[] = [],
  logs: string[] = [],
  perspective: Perspective = 'management',
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const M = 20;              // margin
  const CW = W - M * 2;     // content width
  let y = M;

  const isMgmt = perspective === 'management';

  // ── Utility helpers ───────────────────────────────────────────────────────

  const safe = (val: unknown): string => {
    if (typeof val === 'string') return val;
    if (val == null) return '';
    return String(val);
  };

  const clean = (val: unknown) =>
    safe(val).replace(/\*\*/g, '').replace(/#{1,6}\s*/g, '').replace(/`/g, '').trim();

  const darkBg = () => {
    doc.setFillColor(15, 15, 20);
    doc.rect(0, 0, W, H, 'F');
    // Left accent bar — indigo
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 5, H, 'F');
  };

  const addPage = (): number => { doc.addPage(); darkBg(); return M; };

  const guard = (need: number) => { if (y + need > H - 22) { y = addPage(); } };

  const hr = (color: [number, number, number] = [35, 35, 50]) => {
    guard(5);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.25);
    doc.line(M, y, W - M, y);
    y += 5;
  };

  // Full-width section header bar
  const secHeader = (title: string, rgb: [number, number, number]) => {
    guard(16);
    doc.setFillColor(...rgb);
    doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), M + 5, y + 7);
    y += 15;
  };

  // Small accent-bar sub-header
  const subHeader = (title: string, rgb: [number, number, number]) => {
    guard(14);
    doc.setFillColor(...rgb);
    doc.rect(M, y, 3, 7, 'F');
    doc.setTextColor(...rgb);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), M + 6, y + 5.5);
    y += 11;
  };

  // Body paragraph
  const body = (val: unknown, indent = 6) => {
    const text = clean(val);
    if (!text) return;
    doc.setTextColor(190, 190, 210);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, CW - indent - 2);
    for (const line of lines as string[]) {
      guard(6);
      doc.text(line, M + indent, y);
      y += 5;
    }
    y += 3;
  };

  // Bullet list
  const bullets = (items: string[], rgb: [number, number, number]) => {
    for (const raw of items) {
      const item = clean(raw).replace(/^[-•*]\s*/, '');
      if (!item) continue;
      const lines = doc.splitTextToSize(item, CW - 14) as string[];
      guard(lines.length * 5 + 4);
      doc.setFillColor(...rgb);
      doc.circle(M + 8, y - 1, 1, 'F');
      doc.setTextColor(190, 190, 210);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], M + 11, y + i * 5);
      }
      y += lines.length * 5 + 2;
    }
    y += 2;
  };

  // Page footer stamp
  const footer = () => {
    doc.setTextColor(45, 45, 60);
    doc.setFontSize(6);
    doc.text('Confidential · Qwen Co-Founder Engine · AI-generated advisory', M, H - 10);
    doc.text(`${productName || 'War Room Report'}`, W - M, H - 10, { align: 'right' });
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — Cover
  // ════════════════════════════════════════════════════════════════════════════
  darkBg();

  // Logo badge
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(M, 26, 14, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('QCE', M + 2.5, 35);
  doc.setTextColor(130, 130, 155);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('QWEN CO-FOUNDER ENGINE', M + 18, 35);

  // Mode badge (top-right)
  const badgeRgb: [number, number, number] = isMgmt ? [139, 92, 246] : [99, 102, 241];
  doc.setFillColor(...badgeRgb);
  doc.roundedRect(W - M - 30, 24, 30, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(isMgmt ? '  MGMT  MODE' : '   DEV  MODE', W - M - 28, 30.5);

  // Product title
  doc.setTextColor(240, 240, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(productName || 'Product Analysis', CW) as string[];
  doc.text(titleLines, M, 78);

  doc.setTextColor(90, 90, 110);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('WAR ROOM CO-FOUNDER REPORT', M, 78 + titleLines.length * 12 + 8);

  // Meta table
  const metaY = 138;
  const metas: [string, string][] = [
    ['FOUNDER',   founderName || 'Unknown'],
    ['DATE',      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
    ['PERSPECTIVE', isMgmt ? 'Management Board' : 'Developer Team'],
    ['ENGINE',    'Qwen AI · Alibaba Cloud DashScope'],
    ['SENTIMENT', safe(report.worthinessScore?.sentiment || 'N/A').toUpperCase()],
    ['MESSAGES',  `${messages.length} exchanges logged`],
  ];
  metas.forEach(([label, value], i) => {
    doc.setTextColor(70, 70, 90);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(label, M, metaY + i * 11);
    doc.setTextColor(200, 200, 225);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(value, M + 40, metaY + i * 11);
  });

  // Worthiness score gauges
  if (report.worthinessScore) {
    const ws = report.worthinessScore;
    const gY = 208;
    doc.setTextColor(70, 70, 90);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('BUILD WORTHINESS SCORES', M, gY);

    const scoreItems = [
      { label: 'Overall',   val: ws.overall,   x: M,       rgb: [99, 102, 241] as [number, number, number] },
      { label: 'Technical', val: ws.technical,  x: M + 43,  rgb: [16, 185, 129] as [number, number, number] },
      { label: 'Market',    val: ws.market,     x: M + 86,  rgb: [245, 158, 11] as [number, number, number] },
      { label: 'Security',  val: ws.security,   x: M + 129, rgb: [6, 182, 212]  as [number, number, number] },
    ];
    scoreItems.forEach(({ label, val, x, rgb }) => {
      doc.setFillColor(32, 32, 45);
      doc.roundedRect(x, gY + 4, 37, 23, 2, 2, 'F');
      doc.setFillColor(...rgb);
      doc.roundedRect(x, gY + 4, Math.max(3, 37 * (val / 100)), 23, 2, 2, 'F');
      doc.setTextColor(240, 240, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`${val}`, x + 4, gY + 17);
      doc.setTextColor(110, 110, 135);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(label.toUpperCase(), x + 4, gY + 22.5);
    });

    // Sentiment pill + summary
    const sentY = gY + 33;
    const sColors: Record<string, [number, number, number]> = {
      bullish:  [16, 185, 129],
      cautious: [245, 158, 11],
      bearish:  [239, 68, 68],
      neutral:  [99, 102, 241],
    };
    const sc = sColors[ws.sentiment] || [99, 102, 241];
    doc.setFillColor(...sc);
    doc.roundedRect(M, sentY, 26, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(ws.sentiment.toUpperCase(), M + 2, sentY + 5);

    doc.setTextColor(155, 155, 185);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    const sumLines = doc.splitTextToSize(`"${clean(ws.summary)}"`, CW - 30) as string[];
    doc.text(sumLines, M + 30, sentY + 5);
  }

  footer();

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 2 — Agent War Room Analyses
  // ════════════════════════════════════════════════════════════════════════════
  y = addPage();

  doc.setTextColor(240, 240, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AGENT WAR ROOM ANALYSES', M, y);
  y += 5;
  doc.setTextColor(75, 75, 95);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(isMgmt ? 'Management perspective — boardroom strategic language' : 'Developer perspective — technical implementation depth', M, y);
  y += 13;

  const agentSections: {
    label: string;
    rgb: [number, number, number];
    devKey: keyof typeof report.agentsFeedback;
    mgmtKey: keyof typeof report.agentsFeedback;
  }[] = [
    { label: 'ATLAS — AI CTO VERDICT',          rgb: [99, 102, 241], devKey: 'ctoAnalysis',      mgmtKey: 'ctoManagement'      },
    { label: 'REX — INFRASTRUCTURE ASSESSMENT',  rgb: [217, 119, 6],  devKey: 'infraAnalysis',    mgmtKey: 'infraManagement'    },
    { label: 'NOVA — PRODUCT STRATEGY',          rgb: [16, 185, 129], devKey: 'productAnalysis',  mgmtKey: 'productManagement'  },
    { label: 'CIPHER — SECURITY AUDIT',          rgb: [6, 182, 212],  devKey: 'securityAnalysis', mgmtKey: 'securityManagement' },
  ];

  for (const s of agentSections) {
    const content = (isMgmt ? report.agentsFeedback[s.mgmtKey] : undefined) || report.agentsFeedback[s.devKey];
    secHeader(s.label, s.rgb);
    body(content);
    hr();
  }

  footer();

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 3+ — Chat War Room Conversation
  // ════════════════════════════════════════════════════════════════════════════
  if (messages.length > 0) {
    y = addPage();

    doc.setTextColor(240, 240, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('WAR ROOM CONVERSATION LOG', M, y);
    y += 5;
    doc.setTextColor(75, 75, 95);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${messages.length} messages · ${messages.filter(m => m.role === 'assistant').length} advisor responses`,
      M, y
    );
    y += 13;

    for (const msg of messages) {
      const rawContent = isMgmt
        ? (msg.content || safe(msg.devContent))
        : (safe(msg.devContent) || msg.content);
      const text = clean(rawContent);
      if (!text) continue;

      if (msg.role === 'user') {
        // Founder message — right-aligned bubble style
        const msgLines = doc.splitTextToSize(text, CW - 14) as string[];
        const bH = msgLines.length * 5 + 12;
        guard(bH + 6);
        doc.setFillColor(28, 28, 42);
        doc.roundedRect(M + 8, y, CW - 8, bH, 2, 2, 'F');
        doc.setFillColor(99, 102, 241);
        doc.rect(M + 8, y, 3, bH, 'F');
        doc.setTextColor(160, 160, 210);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${founderName || 'Founder'}  (You)`, M + 14, y + 6.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(195, 195, 225);
        for (let i = 0; i < msgLines.length; i++) {
          doc.text(msgLines[i], M + 14, y + 12 + i * 5);
        }
        y += bH + 5;
      } else {
        // Agent response bubble
        const rgb = agentRgb(msg.agent);
        const label = (msg.agent && AGENT_LABEL[msg.agent]) ? AGENT_LABEL[msg.agent] : (msg.agent || 'Advisor');
        const msgLines = doc.splitTextToSize(text, CW - 14) as string[];
        const maxLines = 18; // cap so one agent doesn't eat the whole page
        const visLines = msgLines.slice(0, maxLines);
        const truncated = msgLines.length > maxLines;
        const bH = visLines.length * 5 + (truncated ? 16 : 12);
        guard(bH + 6);
        doc.setFillColor(20, 20, 32);
        doc.roundedRect(M, y, CW - 8, bH, 2, 2, 'F');
        doc.setFillColor(...rgb);
        doc.rect(M, y, 3, bH, 'F');
        doc.setTextColor(...rgb);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), M + 6, y + 6.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(190, 190, 215);
        for (let i = 0; i < visLines.length; i++) {
          doc.text(visLines[i], M + 6, y + 12 + i * 5);
        }
        if (truncated) {
          doc.setTextColor(65, 65, 85);
          doc.setFontSize(6.5);
          doc.text('... [response truncated — full text in app]', M + 6, y + bH - 4);
        }
        y += bH + 5;
      }
    }

    footer();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE N — Market Feasibility
  // ════════════════════════════════════════════════════════════════════════════
  y = addPage();

  doc.setTextColor(240, 240, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MARKET FEASIBILITY REPORT', M, y);
  y += 14;

  secHeader('TAM / SAM / SOM — MARKET SIZE STUDY', [99, 102, 241]);
  body(report.marketFeasibility?.marketSizeStudy);
  hr();

  secHeader('ARR PROJECTION & REVENUE MODEL', [16, 185, 129]);
  body(report.marketFeasibility?.expectedProfitARR);
  hr();

  secHeader('RISK MITIGATION STRATEGY', [239, 68, 68]);
  body(report.marketFeasibility?.riskMitigation);
  hr();

  footer();

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE N — Merits, Demerits & Improved Suggestions
  // ════════════════════════════════════════════════════════════════════════════
  y = addPage();

  doc.setTextColor(240, 240, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MERITS, DEMERITS & IMPROVEMENTS', M, y);
  y += 14;

  // Merits — extract positive signals from CTO + Product analysis
  subHeader('Key Strengths & Merits', [16, 185, 129]);
  const ctoText = clean(isMgmt ? (report.agentsFeedback.ctoManagement || report.agentsFeedback.ctoAnalysis) : report.agentsFeedback.ctoAnalysis);
  const productText = clean(isMgmt ? (report.agentsFeedback.productManagement || report.agentsFeedback.productAnalysis) : report.agentsFeedback.productAnalysis);
  // Extract lines that read like positives
  const meritLines = [
    ...ctoText.split('\n'),
    ...productText.split('\n'),
  ].filter(l => {
    const lo = l.toLowerCase();
    return lo.match(/strength|merit|advantage|opportunit|positive|enables|allows|benefit|powerful|efficient|scalab|innovat/);
  }).slice(0, 8);

  if (meritLines.length > 0) {
    bullets(meritLines, [16, 185, 129]);
  } else {
    // Fall back to first portion of product analysis
    body(productText.substring(0, 600));
  }
  hr();

  subHeader('Risks, Challenges & Demerits', [239, 68, 68]);
  const secText = clean(isMgmt ? (report.agentsFeedback.securityManagement || report.agentsFeedback.securityAnalysis) : report.agentsFeedback.securityAnalysis);
  const infraText = clean(isMgmt ? (report.agentsFeedback.infraManagement || report.agentsFeedback.infraAnalysis) : report.agentsFeedback.infraAnalysis);
  const riskLines = [
    ...secText.split('\n'),
    ...infraText.split('\n'),
  ].filter(l => {
    const lo = l.toLowerCase();
    return lo.match(/risk|threat|challenge|concern|vulnerab|demerits|weakness|gap|expensive|complex|difficult|latency|cost|bottleneck/);
  }).slice(0, 8);

  if (riskLines.length > 0) {
    bullets(riskLines, [239, 68, 68]);
  } else {
    body(secText.substring(0, 600));
  }
  hr();

  // Improvement suggestions — infra + product
  subHeader('Infrastructure Improvement Recommendations', [217, 119, 6]);
  body(infraText);
  hr([35, 35, 50]);

  subHeader('Product & Growth Improvement Recommendations', [16, 185, 129]);
  body(productText);

  footer();

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE N — Final Resolution & Board Verdict
  // ════════════════════════════════════════════════════════════════════════════
  y = addPage();

  // Gold header bar
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(M, y, CW, 13, 3, 3, 'F');
  doc.setTextColor(20, 14, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FINAL RESOLUTION — BOARD VERDICT', M + 5, y + 9.5);
  y += 20;

  // Overall verdict badge
  if (report.worthinessScore) {
    const ws = report.worthinessScore;
    const sColors: Record<string, [number, number, number]> = {
      bullish:  [16, 185, 129],
      cautious: [245, 158, 11],
      bearish:  [239, 68, 68],
      neutral:  [99, 102, 241],
    };
    const sc = sColors[ws.sentiment] || [99, 102, 241];
    doc.setFillColor(...sc);
    doc.roundedRect(M, y, 75, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL VERDICT', M + 4, y + 7);
    doc.setFontSize(14);
    doc.text(`${ws.overall}/100  —  ${ws.sentiment.toUpperCase()}`, M + 4, y + 16.5);

    // Score breakdown in the same row
    [
      { label: 'Technical', val: ws.technical, x: M + 83,  rgb: [16, 185, 129]  as [number, number, number] },
      { label: 'Market',    val: ws.market,    x: M + 115, rgb: [245, 158, 11]  as [number, number, number] },
      { label: 'Security',  val: ws.security,  x: M + 147, rgb: [6, 182, 212]   as [number, number, number] },
    ].forEach(({ label, val, x, rgb }) => {
      doc.setFillColor(32, 32, 45);
      doc.roundedRect(x, y, 28, 20, 2, 2, 'F');
      doc.setFillColor(...rgb);
      doc.roundedRect(x, y, Math.max(2, 28 * (val / 100)), 20, 2, 2, 'F');
      doc.setTextColor(240, 240, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${val}`, x + 3, y + 12);
      doc.setTextColor(100, 100, 120);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(label, x + 3, y + 17.5);
    });

    y += 28;

    secHeader('BOARD CONSENSUS & SUMMARY', [245, 158, 11]);
    body(ws.summary);
    hr();
  }

  secHeader('ATLAS (CTO) — FINAL TECHNICAL RESOLUTION', [99, 102, 241]);
  const ctoFull = clean(isMgmt ? (report.agentsFeedback.ctoManagement || report.agentsFeedback.ctoAnalysis) : report.agentsFeedback.ctoAnalysis);
  body(ctoFull.length > 500 ? '...' + ctoFull.slice(-500) : ctoFull);
  hr();

  secHeader('NOVA (PRODUCT) — GO-TO-MARKET RESOLUTION', [16, 185, 129]);
  const productFull = clean(isMgmt ? (report.agentsFeedback.productManagement || report.agentsFeedback.productAnalysis) : report.agentsFeedback.productAnalysis);
  body(productFull.length > 500 ? '...' + productFull.slice(-500) : productFull);
  hr();

  secHeader('CIPHER (SECURITY) — COMPLIANCE RESOLUTION', [6, 182, 212]);
  const secFull = clean(isMgmt ? (report.agentsFeedback.securityManagement || report.agentsFeedback.securityAnalysis) : report.agentsFeedback.securityAnalysis);
  body(secFull.length > 400 ? '...' + secFull.slice(-400) : secFull);

  footer();

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE N — System Activity Logs
  // ════════════════════════════════════════════════════════════════════════════
  if (logs.length > 0) {
    y = addPage();

    doc.setTextColor(240, 240, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SYSTEM ACTIVITY LOGS', M, y);
    y += 5;
    doc.setTextColor(75, 75, 95);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${logs.length} log entries captured during this session`, M, y);
    y += 13;

    const logTagColors: [string, [number, number, number]][] = [
      ['[ERROR]',   [239, 68, 68]   ],
      ['[SUCCESS]', [16, 185, 129]  ],
      ['[ENGINE]',  [99, 102, 241]  ],
      ['[SYSTEM]',  [99, 102, 241]  ],
      ['[MARKET]',  [245, 158, 11]  ],
    ];

    for (const log of logs) {
      guard(7);
      let logRgb: [number, number, number] = [60, 60, 80];
      for (const [tag, rgb] of logTagColors) {
        if (log.includes(tag)) { logRgb = rgb; break; }
      }
      const logLines = doc.splitTextToSize(safe(log), CW - 6) as string[];
      doc.setFillColor(...logRgb);
      doc.rect(M, y - 3, 2, 4.5, 'F');
      doc.setTextColor(...logRgb);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(logLines[0] || '', M + 4, y);
      y += 5;
    }

    footer();
  }

  const filename = `${(productName || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-war-room.pdf`;
  doc.save(filename);
}
