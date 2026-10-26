/**
 * CogniFlow Motion Graphics Engine
 * Deterministic frame-by-frame renderer for 35s commercial.
 * Resolution: 1920x1080 | 30/60 FPS
 */

// Mathematical easing helpers
const Easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutBack: (t, s = 1.70158) => {
    t = t - 1;
    return t * t * ((s + 1) * t + s) + 1;
  },
  clamp: (val, min = 0, max = 1) => Math.min(max, Math.max(min, val)),
  lerp: (a, b, t) => a + (b - a) * t,
  range: (t, start, end) => Easing.clamp((t - start) / (end - start), 0, 1)
};

class CogniFlowMotionRenderer {
  constructor() {
    this.stage = document.getElementById('stage');
    this.canvas = document.getElementById('fx-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // DOM Node Cache
    this.browser = document.getElementById('browser-window');
    this.mainContent = document.getElementById('main-content');
    this.sidepanel = document.getElementById('sidepanel');
    this.cursor = document.getElementById('user-cursor');
    this.cursorRing = document.getElementById('cursor-ring');
    this.blurOverlay = document.getElementById('context-blur-overlay');
    this.memorySymbol = document.getElementById('memory-symbol-container');
    this.focusedWorkspace = document.getElementById('focused-workspace');
    this.brandEnding = document.getElementById('brand-ending');
    this.ambientPulse = document.querySelector('.ambient-violet-pulse');

    // Typography
    this.hScene1A = document.getElementById('text-s1a');
    this.hScene1B = document.getElementById('text-s1b');
    this.hScene2 = document.getElementById('text-s2');
    this.hScene3 = document.getElementById('text-s3');
    this.hScene4A = document.getElementById('text-s4a');
    this.hScene4B = document.getElementById('text-s4b');
    this.hScene5 = document.getElementById('text-s5');
    this.hScene6A = document.getElementById('text-s6a');
    this.hScene6B = document.getElementById('text-s6b');

    // Notifications & Clutter
    this.notifSlack = document.getElementById('notif-slack');
    this.notifJira = document.getElementById('notif-jira');
    this.notifGmail = document.getElementById('notif-gmail');
    this.notifNotion = document.getElementById('notif-notion');
    this.floatingStack = document.getElementById('floating-window-stack');

    // Sidepanel sub-elements
    this.resumeBtn = document.getElementById('btn-resume');
    this.checklist = document.getElementById('summary-checklist');
    this.workflowCards = document.querySelectorAll('.workflow-card');

    // Canvas dimensions
    this.canvas.width = 1920;
    this.canvas.height = 1080;
  }

  render(t) {
    // Clear canvas
    this.ctx.clearRect(0, 0, 1920, 1080);

    // Render DOM scenes
    this.renderScene1(t); // 00 - 04s
    this.renderScene2(t); // 04 - 08s
    this.renderScene3(t); // 08 - 12s
    this.renderScene4(t); // 12 - 18s
    this.renderScene5(t); // 18 - 25s
    this.renderScene6(t); // 25 - 30s
    this.renderScene7(t); // 30 - 35s

    // Global subtle camera movement
    this.renderCamera(t);
  }

  renderCamera(t) {
    let scale = 1.0;
    let jitterX = 0;
    let jitterY = 0;

    if (t < 4.0) {
      const p = Easing.range(t, 2.0, 4.0);
      scale = 1.0 + p * 0.035;
      if (t > 2.2 && t < 3.8) {
        jitterX = Math.sin(t * 45.0) * (p * 2.5);
        jitterY = Math.cos(t * 38.0) * (p * 2.5);
      }
    } else if (t >= 25.0 && t < 30.0) {
      const p = Easing.range(t, 25.0, 30.0);
      scale = 1.0 + p * 0.03;
    }

    this.browser.style.transform = `translate(${jitterX}px, ${jitterY}px) scale(${scale})`;
  }

  // --- SCENE 1: THE OVERLOAD (00 - 04s) ---
  renderScene1(t) {
    if (t < 0.0 || t > 5.0) {
      if (t > 5.0) {
        this.notifSlack.style.opacity = '0';
        this.notifJira.style.opacity = '0';
        this.notifGmail.style.opacity = '0';
        this.notifNotion.style.opacity = '0';
        this.floatingStack.style.opacity = '0';
        this.hScene1A.style.opacity = '0';
        this.hScene1B.style.opacity = '0';
      }
      return;
    }

    const p1aIn = Easing.easeOutCubic(Easing.range(t, 0.4, 0.9));
    const p1aOut = Easing.easeInCubic(Easing.range(t, 1.9, 2.3));
    this.hScene1A.style.opacity = p1aIn * (1 - p1aOut);
    this.hScene1A.style.transform = `translateY(${Easing.lerp(25, 0, p1aIn) - p1aOut * 15}px)`;

    const p1bIn = Easing.easeOutBack(Easing.range(t, 2.0, 2.5));
    const p1bOut = Easing.easeInCubic(Easing.range(t, 3.6, 4.0));
    this.hScene1B.style.opacity = p1bIn * (1 - p1bOut);
    this.hScene1B.style.transform = `translateY(${Easing.lerp(25, 0, p1bIn) - p1bOut * 15}px) scale(${Easing.lerp(0.95, 1.0, p1bIn)})`;

    const pSlack = Easing.easeOutBack(Easing.range(t, 0.8, 1.3));
    this.notifSlack.style.opacity = pSlack;
    this.notifSlack.style.transform = `translate(${Easing.lerp(100, 0, pSlack)}px, ${Easing.lerp(15, 0, pSlack)}px)`;

    const pJira = Easing.easeOutBack(Easing.range(t, 1.6, 2.1));
    this.notifJira.style.opacity = pJira;
    this.notifJira.style.transform = `translate(${Easing.lerp(100, 0, pJira)}px, ${Easing.lerp(15, 0, pJira)}px)`;

    const pGmail = Easing.easeOutBack(Easing.range(t, 2.4, 2.9));
    this.notifGmail.style.opacity = pGmail;
    this.notifGmail.style.transform = `translate(${Easing.lerp(100, 0, pGmail)}px, ${Easing.lerp(15, 0, pGmail)}px)`;

    const pNotion = Easing.easeOutBack(Easing.range(t, 3.1, 3.6));
    this.notifNotion.style.opacity = pNotion;
    this.notifNotion.style.transform = `translate(${Easing.lerp(80, 0, pNotion)}px, ${Easing.lerp(15, 0, pNotion)}px)`;

    const pStack = Easing.easeOutCubic(Easing.range(t, 2.8, 3.8));
    this.floatingStack.style.opacity = pStack * (t < 4.0 ? 1 : Math.max(0, 1 - (t - 4.0) * 2));
    this.floatingStack.style.transform = `scale(${Easing.lerp(0.88, 1.0, pStack)}) rotateX(${Easing.lerp(6, 2, pStack)}deg)`;
  }

  // --- SCENE 2: LOST CONTEXT (04 - 08s) ---
  renderScene2(t) {
    if (t < 3.8 || t > 8.5) {
      if (t > 8.5) {
        this.blurOverlay.style.opacity = '0';
        this.hScene2.style.opacity = '0';
        this.cursorRing.style.opacity = '0';
      }
      return;
    }

    let curX = 960;
    let curY = 540;

    if (t < 4.6) {
      const p = Easing.range(t, 4.0, 4.6);
      curX = Easing.lerp(720, 480, Easing.easeInOutCubic(p));
      curY = Easing.lerp(480, 140, Easing.easeInOutCubic(p));
    } else if (t < 5.5) {
      const p = Easing.range(t, 4.6, 5.5);
      curX = Easing.lerp(480, 960, Easing.easeInOutCubic(p));
      curY = Easing.lerp(140, 540, Easing.easeInOutCubic(p));
    } else {
      curX = 960;
      curY = 540;
    }
    this.cursor.style.transform = `translate(${curX}px, ${curY}px)`;

    if (t >= 5.6 && t < 7.8) {
      const pRing = ((t - 5.6) * 1.5) % 1.0;
      this.cursorRing.style.opacity = (1.0 - pRing) * 0.9;
      this.cursorRing.style.transform = `scale(${0.5 + pRing * 1.5})`;
    } else {
      this.cursorRing.style.opacity = '0';
    }

    const blurIn = Easing.easeOutCubic(Easing.range(t, 5.6, 6.5));
    const blurOut = Easing.easeInCubic(Easing.range(t, 8.0, 8.5));
    this.blurOverlay.style.opacity = blurIn * (1 - blurOut);

    const pTxtIn = Easing.easeOutCubic(Easing.range(t, 6.0, 6.6));
    const pTxtOut = Easing.easeInCubic(Easing.range(t, 7.8, 8.3));
    this.hScene2.style.opacity = pTxtIn * (1 - pTxtOut);
    this.hScene2.style.transform = `translateY(${Easing.lerp(30, 0, pTxtIn) - pTxtOut * 15}px)`;
  }

  // --- SCENE 3: THE AI REVEAL (08 - 12s) ---
  renderScene3(t) {
    if (t < 8.0 || t > 12.3) {
      if (t > 12.3) {
        this.memorySymbol.style.opacity = '0';
        this.hScene3.style.opacity = '0';
      }
      return;
    }

    const pAmb = Easing.range(t, 8.2, 11.8);
    this.ambientPulse.style.opacity = Math.sin(pAmb * Math.PI) * 0.8;

    const pSymIn = Easing.easeOutBack(Easing.range(t, 8.3, 9.4));
    const pSymOut = Easing.easeInCubic(Easing.range(t, 11.6, 12.2));
    const opSym = pSymIn * (1 - pSymOut);
    const symScale = Easing.lerp(0.5, 1.0, pSymIn) + Math.sin(t * 3.0) * 0.04;
    this.memorySymbol.style.opacity = opSym;
    this.memorySymbol.style.transform = `translate(-50%, -50%) scale(${symScale})`;

    const pTxtIn = Easing.easeOutCubic(Easing.range(t, 8.6, 9.3));
    const pTxtOut = Easing.easeInCubic(Easing.range(t, 11.5, 12.0));
    this.hScene3.style.opacity = pTxtIn * (1 - pTxtOut);
    this.hScene3.style.transform = `translateY(${Easing.lerp(35, 0, pTxtIn) - pTxtOut * 15}px)`;

    if (t >= 9.4 && t <= 12.0) {
      this.drawLightTrails(this.ctx, t);
    }
  }

  drawLightTrails(ctx, t) {
    const originX = 960;
    const originY = 540;

    const targets = [
      { x: 380, y: 130, color: '#F24E1E' },
      { x: 640, y: 130, color: '#0052CC' },
      { x: 900, y: 130, color: '#000000' },
      { x: 1140, y: 130, color: '#4A154B' }
    ];

    targets.forEach((tgt, idx) => {
      const trailProgress = Easing.easeOutCubic(Easing.clamp((t - (9.4 + idx * 0.12)) / 0.8, 0, 1));
      if (trailProgress <= 0) return;

      const curTgtX = Easing.lerp(originX, tgt.x, trailProgress);
      const curTgtY = Easing.lerp(originY, tgt.y, trailProgress);
      const controlY = originY - 140 - Math.sin(t * 4.0 + idx) * 30;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.quadraticCurveTo((originX + tgt.x) / 2, controlY, curTgtX, curTgtY);

      ctx.strokeStyle = '#7357FF';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#A9BFFF';
      ctx.shadowBlur = 18;
      ctx.stroke();

      const packetPos = (t * 2.0 + idx * 0.25) % 1.0;
      const pktX = (1 - packetPos) * (1 - packetPos) * originX + 2 * (1 - packetPos) * packetPos * ((originX + tgt.x) / 2) + packetPos * packetPos * tgt.x;
      const pktY = (1 - packetPos) * (1 - packetPos) * originY + 2 * (1 - packetPos) * packetPos * controlY + packetPos * packetPos * tgt.y;

      ctx.beginPath();
      ctx.arc(pktX, pktY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#7357FF';
      ctx.shadowBlur = 20;
      ctx.fill();

      ctx.restore();
    });
  }

  // --- SCENE 4: MEET COGNIFLOW (12 - 18s) ---
  renderScene4(t) {
    if (t < 11.8 || t > 25.0) {
      if (t < 11.8) {
        this.sidepanel.style.right = '-450px';
      }
      return;
    }

    const pSlide = Easing.easeOutCubic(Easing.range(t, 12.0, 12.8));
    this.sidepanel.style.right = `${Easing.lerp(-450, 0, pSlide)}px`;
    this.mainContent.style.marginRight = `${Easing.lerp(0, 440, pSlide)}px`;

    if (t >= 12.3 && t < 18.0) {
      const p4aIn = Easing.easeOutCubic(Easing.range(t, 12.4, 12.9));
      const p4aOut = Easing.easeInCubic(Easing.range(t, 14.5, 14.9));
      this.hScene4A.style.opacity = p4aIn * (1 - p4aOut);
      this.hScene4A.style.transform = `translateY(${Easing.lerp(25, 0, p4aIn) - p4aOut * 15}px)`;

      const p4bIn = Easing.easeOutCubic(Easing.range(t, 14.6, 15.2));
      const p4bOut = Easing.easeInCubic(Easing.range(t, 17.5, 18.0));
      this.hScene4B.style.opacity = p4bIn * (1 - p4bOut);
      this.hScene4B.style.transform = `translateY(${Easing.lerp(25, 0, p4bIn) - p4bOut * 15}px)`;
    } else {
      this.hScene4A.style.opacity = '0';
      this.hScene4B.style.opacity = '0';
    }

    this.workflowCards.forEach((card, idx) => {
      const pCard = Easing.easeOutCubic(Easing.range(t, 13.2 + idx * 0.15, 13.8 + idx * 0.15));
      card.style.opacity = pCard;
      card.style.transform = `translateX(${Easing.lerp(40, 0, pCard)}px)`;
    });
  }

  // --- SCENE 5: HOW IT WORKS (18 - 25s) ---
  renderScene5(t) {
    if (t < 17.8 || t > 25.2) {
      if (t > 25.2) {
        this.hScene5.style.opacity = '0';
      }
      return;
    }

    this.hScene5.style.opacity = '1';

    if (t < 20.2) {
      this.hScene5.textContent = "Remember context.";
      this.workflowCards[0].classList.add('active-tab');
      this.workflowCards[1].classList.add('active-tab');
    } else if (t < 22.6) {
      this.hScene5.textContent = "Summarize progress.";
      this.checklist.style.maxHeight = '180px';
      this.checklist.style.opacity = '1';
    } else {
      this.hScene5.textContent = "Resume where you left off.";

      const pCur = Easing.easeInOutCubic(Easing.range(t, 22.4, 22.8));
      const curX = Easing.lerp(960, 1530, pCur);
      const curY = Easing.lerp(540, 880, pCur);
      this.cursor.style.transform = `translate(${curX}px, ${curY}px)`;

      if (t >= 22.8) {
        this.resumeBtn.classList.add('restored');
        this.resumeBtn.innerHTML = `<span>✓</span> Restoring 4 tabs & workspace...`;

        const pRip = Easing.range(t, 22.8, 24.5);
        if (pRip > 0 && pRip < 1) {
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(1530, 880, Easing.lerp(10, 1800, Easing.easeOutCubic(pRip)), 0, Math.PI * 2);
          this.ctx.strokeStyle = `rgba(32, 201, 151, ${1 - pRip})`;
          this.ctx.lineWidth = 12 * (1 - pRip);
          this.ctx.shadowColor = '#20C997';
          this.ctx.shadowBlur = 30;
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    }
  }

  // --- SCENE 6: BACK IN FLOW (25 - 30s) ---
  renderScene6(t) {
    if (t < 24.8 || t > 30.5) {
      if (t > 30.5) {
        this.focusedWorkspace.style.opacity = '0';
        this.hScene6A.style.opacity = '0';
        this.hScene6B.style.opacity = '0';
      }
      return;
    }

    const pTrans = Easing.easeOutCubic(Easing.range(t, 24.8, 25.8));
    this.sidepanel.style.right = `${Easing.lerp(0, -450, pTrans)}px`;
    this.mainContent.style.marginRight = '0px';

    this.focusedWorkspace.style.opacity = pTrans;
    this.focusedWorkspace.style.transform = `scale(${Easing.lerp(0.96, 1.0, pTrans)})`;

    const p6aIn = Easing.easeOutCubic(Easing.range(t, 25.4, 26.0));
    const p6aOut = Easing.easeInCubic(Easing.range(t, 27.2, 27.6));
    this.hScene6A.style.opacity = p6aIn * (1 - p6aOut);
    this.hScene6A.style.transform = `translateY(${Easing.lerp(25, 0, p6aIn) - p6aOut * 15}px)`;

    const p6bIn = Easing.easeOutCubic(Easing.range(t, 27.5, 28.1));
    const p6bOut = Easing.easeInCubic(Easing.range(t, 29.8, 30.2));
    this.hScene6B.style.opacity = p6bIn * (1 - p6bOut);
    this.hScene6B.style.transform = `translateY(${Easing.lerp(25, 0, p6bIn) - p6bOut * 15}px)`;
  }

  // --- SCENE 7: BRAND ENDING (30 - 35s) ---
  renderScene7(t) {
    if (t < 29.8) {
      this.brandEnding.style.opacity = '0';
      return;
    }

    const pFade = Easing.easeOutCubic(Easing.range(t, 29.8, 30.6));
    this.brandEnding.style.opacity = pFade;
    this.browser.style.opacity = 1 - pFade;

    const pLogo = Easing.easeOutCubic(Easing.range(t, 30.4, 32.5));
    const heroLogo = document.querySelector('.brand-hero-logo');
    if (heroLogo) {
      heroLogo.style.transform = `scale(${Easing.lerp(0.85, 1.0, pLogo)})`;
    }

    if (t >= 34.8) {
      const pEnd = (t - 34.8) / 0.2;
      this.stage.style.opacity = 1 - pEnd;
    } else {
      this.stage.style.opacity = '1';
    }
  }

  // =========================================================================
  // STANDALONE 1920x1080 CANVAS COMPOSITOR (FOR DIRECT VIDEO EXPORT)
  // Ensures every visual pixel, text, card, and animation encodes cleanly!
  // =========================================================================
  renderToCanvas(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, 1920, 1080);

    // 1. Soft Cloud Background
    ctx.fillStyle = '#F7F7FF';
    ctx.fillRect(0, 0, 1920, 1080);

    // Ambient radial gradient
    const ambGrad = ctx.createRadialGradient(960, 500, 50, 960, 500, 800);
    ambGrad.addColorStop(0, 'rgba(169, 191, 255, 0.25)');
    ambGrad.addColorStop(1, 'rgba(247, 247, 255, 0)');
    ctx.fillStyle = ambGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    // If Scene 7 Brand Ending is active
    if (t >= 30.0) {
      this.renderCanvasScene7(ctx, t);
      ctx.restore();
      return;
    }

    // 2. Browser Window Box
    const bx = 180, by = 100, bw = 1560, bh = 880;
    ctx.save();
    ctx.shadowColor = 'rgba(23, 27, 53, 0.16)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 20;

    // Rounded Browser Container
    this.roundRect(ctx, bx, by, bw, bh, 18);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    // Clip inside browser
    ctx.save();
    this.roundRect(ctx, bx, by, bw, bh, 18);
    ctx.clip();

    // Browser Chrome Top (Header)
    ctx.fillStyle = '#F1F2F8';
    ctx.fillRect(bx, by, bw, 52);
    ctx.strokeStyle = '#E2E4ED';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by + 52);
    ctx.lineTo(bx + bw, by + 52);
    ctx.stroke();

    // Traffic Lights
    this.circle(ctx, bx + 24, by + 26, 6, '#FF5F56');
    this.circle(ctx, bx + 42, by + 26, 6, '#FFBD2E');
    this.circle(ctx, bx + 60, by + 26, 6, '#27C93F');

    // Tabs
    const tabs = [
      { name: "Checkout Flow v3.2", badge: "Figma", active: true, width: 200 },
      { name: "#design-system (12)", active: false, width: 150 },
      { name: "CF-42: Payment Flow", active: false, width: 160 },
      { name: "Q4 Product Strategy", active: false, width: 160 },
      { name: "Inbox (14)", active: false, width: 110 }
    ];
    let tabX = bx + 90;
    tabs.forEach(tb => {
      ctx.fillStyle = tb.active ? '#FFFFFF' : '#E5E7F0';
      this.roundRect(ctx, tabX, by + 12, tb.width, 40, 8);
      ctx.fill();
      ctx.fillStyle = tb.active ? '#171B35' : '#555A75';
      ctx.font = tb.active ? 'bold 12px Inter, sans-serif' : '500 12px Inter, sans-serif';
      ctx.fillText(tb.name, tabX + 14, by + 34);
      tabX += tb.width + 6;
    });

    // Omnibox Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bx, by + 52, bw, 44);
    ctx.fillStyle = '#F3F4F9';
    this.roundRect(ctx, bx + 60, by + 58, bw - 140, 32, 6);
    ctx.fill();
    ctx.fillStyle = '#171B35';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText("🔒 figma.com/file/CF-Mobile-Checkout/v3.2", bx + 80, by + 78);

    // Extension Icon Button
    this.roundRect(ctx, bx + bw - 60, by + 60, 28, 28, 6);
    ctx.fillStyle = '#7357FF';
    ctx.fill();
    this.circle(ctx, bx + bw - 46, by + 74, 5, '#FFFFFF');

    // Viewport Content
    const vpX = bx, vpY = by + 96, vpW = bw, vpH = bh - 96;

    // Split workspace if Scene 6
    if (t >= 25.0 && t < 30.0) {
      this.renderCanvasScene6(ctx, vpX, vpY, vpW, vpH, t);
    } else {
      // Figma Sidebar + Canvas
      ctx.fillStyle = '#F7F8FA';
      ctx.fillRect(vpX, vpY, 230, vpH);
      ctx.fillStyle = '#8D93A8';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText("LAYERS", vpX + 18, vpY + 30);
      ctx.fillStyle = '#7357FF';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.fillText("❖ Mobile Checkout Frame", vpX + 18, vpY + 54);
      ctx.fillStyle = '#555A75';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText("↳ Header Navigation", vpX + 28, vpY + 76);
      ctx.fillText("↳ Payment Method", vpX + 28, vpY + 98);
      ctx.fillText("↳ Order Summary", vpX + 28, vpY + 120);

      // Figma Canvas area
      ctx.fillStyle = '#EAEBF2';
      ctx.fillRect(vpX + 230, vpY, vpW - 230, vpH);

      // Mobile Artboard
      const artX = vpX + 380, artY = vpY + 50, artW = 320, artH = 580;
      this.roundRect(ctx, artX, artY, artW, artH, 24);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#1E202B';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Artboard Header
      ctx.fillStyle = '#7357FF';
      this.roundRect(ctx, artX + 4, artY + 4, artW - 8, 48, 20);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText("Checkout", artX + 20, artY + 32);
      ctx.fillText("$128.00", artX + artW - 75, artY + 32);

      // Spec boxes
      ctx.fillStyle = '#F4F6FC';
      this.roundRect(ctx, artX + 20, artY + 70, artW - 40, 70, 10);
      ctx.fill();
      ctx.fillStyle = '#171B35';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText("Express Checkout", artX + 32, artY + 94);
      ctx.fillStyle = '#6C7289';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText("Saved cards ready with biometric ID.", artX + 32, artY + 114);

      // Action Button
      ctx.fillStyle = '#7357FF';
      this.roundRect(ctx, artX + 20, artY + 480, artW - 40, 44, 10);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText("Confirm Payment →", artX + 85, artY + 507);
    }

    // Notifications in Scene 1
    if (t >= 0.8 && t < 4.2) {
      if (t >= 0.8) this.renderNotificationCard(ctx, vpX + vpW - 420, vpY + 24, "Slack · #product-launch", "Sarah: 'Can we get final copy approved?'", '#4A154B');
      if (t >= 1.6) this.renderNotificationCard(ctx, vpX + vpW - 420, vpY + 105, "Jira · Sprint CF-104", "Payment gateway timeout reported in staging.", '#0052CC');
      if (t >= 2.4) this.renderNotificationCard(ctx, vpX + vpW - 420, vpY + 186, "Gmail · Urgent Sync", "Q4 Roadmap moved to 11:30 AM.", '#EA4335');
      if (t >= 3.1) this.renderNotificationCard(ctx, vpX + vpW - 420, vpY + 267, "Notion · David Chen", "Please link updated API specs from Jira.", '#000000');
    }

    // Context Blur Overlay in Scene 2
    if (t >= 5.6 && t < 8.2) {
      const bOp = Easing.range(t, 5.6, 6.5) * (t < 8.0 ? 1 : Math.max(0, 1 - (t - 8.0) * 4));
      ctx.fillStyle = `rgba(247, 247, 255, ${0.75 * bOp})`;
      ctx.fillRect(vpX, vpY, vpW, vpH);
    }

    // Sidepanel in Scene 4 & 5
    if (t >= 12.0 && t < 25.0) {
      this.renderCanvasSidepanel(ctx, bx + bw - 440, by, 440, bh, t);
    }

    ctx.restore(); // end browser clip

    // Draw Light Trails in Scene 3
    if (t >= 9.4 && t <= 12.0) {
      this.drawLightTrails(ctx, t);
    }

    // Draw Kinetic Typography Overlays
    this.renderCanvasTypography(ctx, t);

    // Draw Cursor
    this.renderCanvasCursor(ctx, t);

    ctx.restore();
  }

  renderNotificationCard(ctx, x, y, title, desc, iconBg) {
    ctx.save();
    ctx.shadowColor = 'rgba(23, 27, 53, 0.14)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    this.roundRect(ctx, x, y, 390, 68, 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.fill();
    ctx.restore();

    this.roundRect(ctx, x + 14, y + 15, 38, 38, 8);
    ctx.fillStyle = iconBg;
    ctx.fill();

    ctx.fillStyle = '#171B35';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(title, x + 62, y + 33);
    ctx.fillStyle = '#555A75';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(desc, x + 62, y + 51);
  }

  renderCanvasSidepanel(ctx, spX, spY, spW, spH, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.fillRect(spX, spY, spW, spH);

    ctx.strokeStyle = 'rgba(23, 27, 53, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(spX, spY, 1, spH);

    // Sidepanel Header
    ctx.fillStyle = '#7357FF';
    this.roundRect(ctx, spX + 24, spY + 22, 32, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#171B35';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText("CogniFlow", spX + 66, spY + 44);

    // Active Sync Pill
    ctx.fillStyle = 'rgba(32, 201, 151, 0.12)';
    this.roundRect(ctx, spX + spW - 130, spY + 26, 105, 24, 12);
    ctx.fill();
    this.circle(ctx, spX + spW - 116, spY + 38, 4, '#20C997');
    ctx.fillStyle = '#20C997';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText("ACTIVE SYNC", spX + spW - 104, spY + 42);

    // Greeting
    ctx.fillStyle = '#7357FF';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText("WELCOME BACK", spX + 24, spY + 90);
    ctx.fillStyle = '#171B35';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText("Here’s where you left off", spX + 24, spY + 115);

    // AI Summary Card
    const cardY = spY + 135;
    ctx.fillStyle = 'rgba(233, 223, 255, 0.75)';
    this.roundRect(ctx, spX + 24, cardY, spW - 48, 140, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(115, 87, 255, 0.25)';
    ctx.stroke();

    ctx.fillStyle = '#7357FF';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText("✦ AI QUICK SUMMARY", spX + 38, cardY + 26);
    ctx.fillStyle = '#171B35';
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillText("You were finalizing checkout interaction states", spX + 38, cardY + 48);
    ctx.fillText("in Figma, responding to CF-42 in Jira, and", spX + 38, cardY + 68);
    ctx.fillText("updating team launch specs in Notion.", spX + 38, cardY + 88);

    if (t >= 20.2) {
      ctx.fillStyle = '#20C997';
      ctx.fillText("✓ 3 comments resolved · CF-42 ready · Specs synced", spX + 38, cardY + 118);
    }

    // Tabs List
    const tabsY = cardY + 160;
    ctx.fillStyle = '#8C92A8';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText("RELATED WORKFLOW TABS", spX + 24, tabsY);

    const wCards = [
      { title: "Figma · Checkout Flow v3.2", desc: "Active canvas · 3 comments", col: '#F24E1E' },
      { title: "Jira · CF-42 Payment API", desc: "Issue assigned · In review", col: '#0052CC' },
      { title: "Notion · Launch Strategy", desc: "Requirements & copy deck", col: '#000000' },
      { title: "Slack · #checkout-sprint", desc: "4 unread team messages", col: '#4A154B' }
    ];

    wCards.forEach((wc, i) => {
      const cy = tabsY + 16 + i * 58;
      ctx.fillStyle = '#FFFFFF';
      this.roundRect(ctx, spX + 24, cy, spW - 48, 48, 10);
      ctx.fill();
      ctx.strokeStyle = (i < 2 && t >= 18.0) ? '#7357FF' : '#EAECEF';
      ctx.stroke();

      this.roundRect(ctx, spX + 34, cy + 9, 30, 30, 6);
      ctx.fillStyle = wc.col;
      ctx.fill();

      ctx.fillStyle = '#171B35';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(wc.title, spX + 74, cy + 24);
      ctx.fillStyle = '#71778E';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(wc.desc, spX + 74, cy + 40);
    });

    // Resume Button
    const btnY = spH + spY - 90;
    ctx.fillStyle = (t >= 22.8) ? '#20C997' : '#7357FF';
    this.roundRect(ctx, spX + 24, btnY, spW - 48, 54, 14);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px Inter, sans-serif';
    const btnText = (t >= 22.8) ? "✓ Restoring 4 tabs & workspace..." : "Resume Workflow →";
    ctx.fillText(btnText, spX + 90, btnY + 33);

    ctx.restore();
  }

  renderCanvasScene6(ctx, x, y, w, h, t) {
    ctx.fillStyle = '#FAFBFD';
    ctx.fillRect(x, y, w, h);

    // Left Focused Figma Pane
    const pw = (w - 60) / 2;
    this.roundRect(ctx, x + 20, y + 20, pw, h - 40, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E4E6F0';
    ctx.stroke();
    ctx.fillStyle = '#171B35';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText("Checkout Flow v3.2 · Live Artboard", x + 38, y + 50);

    // Right Focused Notion Pane
    this.roundRect(ctx, x + 40 + pw, y + 20, pw, h - 40, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E4E6F0';
    ctx.stroke();
    ctx.fillStyle = '#171B35';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText("Launch Specs & PRD (Synced)", x + 58 + pw, y + 50);

    // Flow State Restored Badge
    this.roundRect(ctx, x + w - 240, y + 35, 210, 34, 17);
    ctx.fillStyle = 'rgba(32, 201, 151, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#20C997';
    ctx.stroke();
    this.circle(ctx, x + w - 222, y + 52, 5, '#20C997');
    ctx.fillStyle = '#0E8360';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText("FLOW STATE RESTORED", x + w - 208, y + 56);
  }

  renderCanvasScene7(ctx, t) {
    ctx.fillStyle = '#F7F7FF';
    ctx.fillRect(0, 0, 1920, 1080);

    const radGrad = ctx.createRadialGradient(960, 500, 40, 960, 500, 700);
    radGrad.addColorStop(0, 'rgba(233, 223, 255, 0.7)');
    radGrad.addColorStop(1, '#F7F7FF');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    const pScale = Easing.easeOutCubic(Easing.range(t, 30.2, 32.5));
    const sc = Easing.lerp(0.85, 1.0, pScale);

    ctx.save();
    ctx.translate(960, 420);
    ctx.scale(sc, sc);

    // 3D Glass Hero Logo
    this.roundRect(ctx, -70, -70, 140, 140, 36);
    ctx.fillStyle = '#7357FF';
    ctx.shadowColor = 'rgba(115, 87, 255, 0.45)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    ctx.fill();

    // Inner CF neural mark
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0.2, Math.PI * 1.5);
    ctx.stroke();
    this.circle(ctx, 16, -10, 8, '#FFFFFF');

    ctx.restore();

    // Brand Typography
    ctx.fillStyle = '#171B35';
    ctx.font = '850 68px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("CogniFlow", 960, 580);

    ctx.fillStyle = '#7357FF';
    ctx.font = '600 26px Inter, sans-serif';
    ctx.fillText("Your work. Remembered.", 960, 630);

    // CTA Pill
    this.roundRect(ctx, 800, 680, 320, 54, 27);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(115, 87, 255, 0.2)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;
    ctx.fill();
    ctx.strokeStyle = '#7357FF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#171B35';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText("cogniflow.ai · Add to Chrome", 960, 713);
  }

  renderCanvasTypography(ctx, t) {
    ctx.textAlign = 'center';

    if (t >= 0.4 && t < 2.3) {
      ctx.fillStyle = '#171B35';
      ctx.font = '800 56px Inter, sans-serif';
      ctx.fillText("Too many tools.", 960, 520);
    } else if (t >= 2.0 && t < 4.0) {
      ctx.fillStyle = '#171B35';
      ctx.font = '800 56px Inter, sans-serif';
      ctx.fillText("Too many interruptions.", 960, 520);
    } else if (t >= 6.0 && t < 8.3) {
      ctx.fillStyle = '#171B35';
      ctx.font = '800 58px Inter, sans-serif';
      ctx.fillText("Where was I?", 960, 520);
    } else if (t >= 8.6 && t < 12.0) {
      ctx.fillStyle = '#171B35';
      ctx.font = '800 52px Inter, sans-serif';
      ctx.fillText("What if your browser remembered?", 960, 380);
    } else if (t >= 12.4 && t < 14.8) {
      ctx.fillStyle = '#171B35';
      ctx.font = '800 56px Inter, sans-serif';
      ctx.fillText("Meet CogniFlow", 960, 60);
    } else if (t >= 14.8 && t < 17.8) {
      ctx.fillStyle = '#7357FF';
      ctx.font = '800 48px Inter, sans-serif';
      ctx.fillText("Your AI workflow memory.", 960, 60);
    } else if (t >= 18.0 && t < 25.0) {
      ctx.fillStyle = '#7357FF';
      ctx.font = '800 50px Inter, sans-serif';
      const s5text = t < 20.2 ? "Remember context." : (t < 22.6 ? "Summarize progress." : "Resume where you left off.");
      ctx.fillText(s5text, 960, 60);
    } else if (t >= 25.4 && t < 27.5) {
      ctx.fillStyle = '#171B35';
      ctx.font = '800 54px Inter, sans-serif';
      ctx.fillText("Less mental rebuilding.", 960, 60);
    } else if (t >= 27.5 && t < 30.0) {
      ctx.fillStyle = '#7357FF';
      ctx.font = '800 54px Inter, sans-serif';
      ctx.fillText("More meaningful work.", 960, 60);
    }
  }

  renderCanvasCursor(ctx, t) {
    if (t > 30.0) return;
    let cx = 960, cy = 540;

    if (t < 4.0) {
      cx = 720; cy = 480;
    } else if (t < 5.5) {
      const p = Easing.range(t, 4.0, 5.5);
      cx = Easing.lerp(480, 960, p);
      cy = Easing.lerp(140, 540, p);
    } else if (t >= 22.4 && t < 25.0) {
      const p = Easing.range(t, 22.4, 22.8);
      cx = Easing.lerp(960, 1530, p);
      cy = Easing.lerp(540, 880, p);
    }

    ctx.save();
    ctx.translate(cx, cy);

    if (t >= 5.6 && t < 7.8) {
      const rOp = ((t - 5.6) * 1.5) % 1.0;
      this.circle(ctx, 0, 0, 20 + rOp * 30, 'transparent');
      ctx.strokeStyle = `rgba(115, 87, 255, ${1 - rOp})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, 20);
    ctx.lineTo(12, 12);
    ctx.lineTo(20, 8);
    ctx.closePath();
    ctx.fillStyle = '#171B35';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  circle(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (color !== 'transparent') {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

window.motionRenderer = new CogniFlowMotionRenderer();
