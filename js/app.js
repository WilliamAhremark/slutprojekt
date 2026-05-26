// ============ SUBSCRIPTION SYSTEM ============
const safeStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage errors (private mode / quota)
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Ignore storage errors (private mode / quota)
    }
  }
};
class SubscriptionManager {
  static STORAGE_KEY = 'subscription_status';
  
  static hasProAccess() {
    const stored = safeStorage.get(this.STORAGE_KEY);
    return stored === 'active';
  }
  
  static activateProAccess() {
    safeStorage.set(this.STORAGE_KEY, 'active');
  }
  
  static cancelProAccess() {
    safeStorage.remove(this.STORAGE_KEY);
  }
  
  static renderSubscriptionCard() {
    const card = document.getElementById('subscriptionCard');
    if (!card) return;
    
    const hasAccess = this.hasProAccess();
    
    if (hasAccess) {
      card.innerHTML = `
        <div class="subscription-header">
          <div>
            <span class="subscription-badge">ACTIVE</span>
            <h3>Architect Pro</h3>
            <p>Full access to precision tools, jitter animations, and private architectural repositories.</p>
          </div>
          <div class="subscription-price">
            <span class="price">$49</span>
            <span class="period">/mo</span>
          </div>
        </div>
        <p class="next-billing">Active since today</p>
        <div class="subscription-actions">
          <button type="button" class="btn btn-outline" id="manageSubBtn">Manage Subscription</button>
        </div>
      `;
      
      // Add event listener to Manage button
      const manageBtn = document.getElementById('manageSubBtn');
      if (manageBtn) {
        manageBtn.addEventListener('click', () => this.showCancelConfirm());
      }
    } else {
      card.innerHTML = `
        <div class="subscription-header">
          <div>
            <span class="subscription-badge" style="background: rgba(255, 107, 107, 0.2); color: #ff6b6b;">INACTIVE</span>
            <h3>Architect Pro</h3>
            <p>Full access to precision tools, jitter animations, and private architectural repositories.</p>
          </div>
          <div class="subscription-price">
            <span class="price">$49</span>
            <span class="period">/mo</span>
          </div>
        </div>
        <p class="next-billing">Get unlimited access to all courses</p>
        <div class="subscription-actions">
          <button type="button" class="btn btn-run-cyan" id="buyProBtn">Buy Now</button>
        </div>
      `;
      
      // Add event listener to Buy button
      const buyBtn = document.getElementById('buyProBtn');
      if (buyBtn) {
        buyBtn.addEventListener('click', () => this.showPaymentModal());
      }
    }
  }
  
  static showPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }
  
  static hidePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  static showCancelConfirm() {
    const confirmed = confirm('Are you sure you want to cancel Architect Pro? You will lose access to Jitter lessons.');
    if (confirmed) {
      this.cancelProAccess();
      this.renderSubscriptionCard();
      LessonProgression.updateProgressionUI();
      alert('Subscription cancelled. Jitter lessons are now locked.');
    }
  }
  
  static processPayment() {
    const cardName = document.getElementById('cardName')?.value;
    const cardNumber = document.getElementById('cardNumber')?.value;
    
    if (!cardName || !cardNumber) {
      alert('Please fill in all fields');
      return;
    }
    
    // Show loading
    const payBtn = document.getElementById('payButton');
    const payText = document.getElementById('payButtonText');
    const loader = document.getElementById('paymentLoader');
    
    payBtn.disabled = true;
    payText.style.display = 'none';
    loader.style.display = 'inline';
    
    // Simulate payment processing
    setTimeout(() => {
      this.activateProAccess();
      this.hidePaymentModal();
      this.renderSubscriptionCard();
      LessonProgression.updateProgressionUI();
      
      // Reset form
      document.getElementById('paymentForm').reset();
      payBtn.disabled = false;
      payText.style.display = 'inline';
      loader.style.display = 'none';
      
      alert('Payment successful! Welcome to Architect Pro! 🎉');
    }, 2000);
  }
}

// ============ PROGRESSION SYSTEM ============
class LessonProgression {
  static STORAGE_KEY = 'lesson_progression';
  static LESSONS_SEQUENCE = [1, 2, 3, 4, 5, 6]; // All lessons: CSS 1,2 then JS 3,4 then Jitter 5,6

  static initializeProgression() {
    const stored = safeStorage.get(this.STORAGE_KEY);
    if (!stored) {
      safeStorage.set(this.STORAGE_KEY, JSON.stringify({ completed: [], currentUnlocked: 1 }));
    }
  }

  static getState() {
    const stored = safeStorage.get(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : { completed: [], currentUnlocked: 1 };
  }

  static isLessonUnlocked(lessonId) {
    const state = this.getState();
    return state.currentUnlocked >= lessonId;
  }

  static isLessonCompleted(lessonId) {
    const state = this.getState();
    return state.completed.includes(lessonId);
  }

  static completeLessonAndUnlockNext(lessonId) {
    const state = this.getState();
    if (!state.completed.includes(lessonId)) {
      state.completed.push(lessonId);
    }
    // Unlock next lesson
    const currentIndex = this.LESSONS_SEQUENCE.indexOf(lessonId);
    if (currentIndex !== -1 && currentIndex < this.LESSONS_SEQUENCE.length - 1) {
      state.currentUnlocked = this.LESSONS_SEQUENCE[currentIndex + 1];
    }
    safeStorage.set(this.STORAGE_KEY, JSON.stringify(state));
    this.updateProgressionUI();
  }

  static resetAllLessons() {
    safeStorage.set(this.STORAGE_KEY, JSON.stringify({ completed: [], currentUnlocked: 1 }));
    this.updateProgressionUI();
  }

  static updateProgressionUI() {
    // Map track-cards to lessons: Track 1->Lesson 1, Track 2->Lesson 2, Track 3->Lesson 5 (requires Pro)
    const trackToLessonMap = { 1: 1, 2: 2, 3: 5 };
    
    // Update track-cards on index
    const trackCards = document.querySelectorAll('.track-card');
    trackCards.forEach((card, idx) => {
      const trackNum = idx + 1;
      const requiredLessonId = trackToLessonMap[trackNum];
      
      // Track 3 (Jitter) requires Pro subscription
      const requiresPro = trackNum === 3;
      const isUnlocked = this.isLessonUnlocked(requiredLessonId);
      const hasProAccess = !requiresPro || SubscriptionManager.hasProAccess();
      
      if (!isUnlocked || !hasProAccess) {
        card.classList.add('track-card--locked');
        card.style.pointerEvents = 'none';
        card.style.opacity = '0.5';
      } else {
        card.classList.remove('track-card--locked');
        card.style.pointerEvents = 'auto';
        card.style.opacity = '1';
      }
    });
  }
}

// Initialize on load
LessonProgression.initializeProgression();

const LESSON_DATA = {
  1: {
    name: 'Pulse Effect',
    accent: 'cyan',
    hint: {
      title: 'Lesson 1: Build the glowing heart',
      summary: 'Start from the visual base: a dark background, a centered circle, and the heart symbol inside it.',
      steps: ['body sets the dark background and removes default spacing', '.pulse-dot makes the circle with a fixed size, round corners, and cyan fill', '.pulse-dot::after adds the heart symbol in the middle', '@keyframes pulse defines how the heart grows and shrinks over time', 'Exercise: change the pulse speed and color to fit a new theme'],
      moreTitle: 'Lesson 1: Add the pulse',
      moreSummary: 'The key idea is simple: keep the heart big most of the time, then briefly shrink it on each beat and return to the larger resting size.',
      codeTitle: 'Lesson 1 code example',
      code: 'body {\n  margin: 0;\n  min-height: 100vh;\n  background: #05080e;\n}\n\n.pulse-dot {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: #09cef6;\n  animation: pulse 1.8s ease-in-out infinite;\n}\n\n.pulse-dot::after {\n  content: "\\2665";\n  color: #072639;\n  font-size: 17px;\n}\n\n@keyframes pulse {\n  0%, 20%, 100% {\n    transform: scale(1.16);\n  }\n\n  10% {\n    transform: scale(0.86);\n  }\n\n  32% {\n    transform: scale(0.9);\n  }\n}'
    },
    guide: { title: 'Guide', summary: 'Reference implementation', steps: [], codeTitle: '', code: '' },
    reference: { css: `/* pulse css */\n.dot{width:54px;height:54px;border-radius:50%;background:#10d2ff;box-shadow:0 0 24px rgba(16,210,255,0.65);}`, html: '<div class="dot"></div>' },
    css: `body {\n  margin: 0;\n  min-height: 100vh;\n  background: #05080e;\n}\n\n.pulse-dot {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: #09cef6;\n  animation: pulse 1.8s ease-in-out infinite;\n}\n\n.pulse-dot::after {\n  content: '\\2665';\n  color: #072639;\n  font-size: 17px;\n}\n\n@keyframes pulse {\n  0%, 20%, 100% {\n    transform: scale(1.16);\n  }\n\n  10% {\n    transform: scale(0.86);\n  }\n\n  32% {\n    transform: scale(0.9);\n  }\n}\n`,
    html: `<!-- Build the heart and pulse effect here -->`
  },
  2: {
    name: 'Morphing Glow',
    accent: 'amber',
    hint: {
      title: 'Lesson 2: Build the morphing cube',
      summary: 'Start with a centered square, a dark page, and a warm glow so the morphing stands out.',
      steps: ['body creates the tall page and the dark background', '#cube creates the square with fixed width, height, and position', 'box-shadow gives the cube the warm glow from the reference', '@keyframes morph changes border-radius and rotation step by step', 'Exercise: add a pause at the circle state for half a second'],
      moreTitle: 'Lesson 2: Add the morph',
      moreSummary: 'The morph works by changing border-radius from small to round, while the cube rotates smoothly between the keyframes.',
      codeTitle: 'Lesson 2 code example',
      code: '@keyframes morph {\n  0% {\n    border-radius: 2px;\n    transform: translate(-50%, -50%) rotate(0deg);\n  }\n\n  50% {\n    border-radius: 50%;\n    transform: translate(-50%, -50%) rotate(180deg);\n  }\n\n  100% {\n    border-radius: 2px;\n    transform: translate(-50%, -50%) rotate(360deg);\n  }\n}\n\n#cube {\n  box-shadow: 0 0 44px rgba(232, 201, 145, 0.25);\n  animation: morph 3s ease-in-out infinite;\n}'
    },
    guide: { title: 'Guide', summary: 'Reference implementation', steps: [], codeTitle: '', code: '' },
    reference: { css: `/* morph css */\n.shape{width:52px;height:52px;background:#e6c790;border-radius:2px;}`, html: '<div class="shape"></div>' },
    css: `body {\n  height: 200vh;\n  margin: 0;\n  background: #05080e;\n}\n\n#cube {\n  width: 100px;\n  height: 100px;\n  background: black;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  border-radius: 2px;\n  box-shadow: 0 0 44px rgba(232, 201, 145, 0.25);\n}\n\n@keyframes morph {\n  0% {\n    border-radius: 2px;\n    transform: translate(-50%, -50%) rotate(0deg);\n  }\n\n  50% {\n    border-radius: 50%;\n    transform: translate(-50%, -50%) rotate(180deg);\n  }\n\n  100% {\n    border-radius: 2px;\n    transform: translate(-50%, -50%) rotate(360deg);\n  }\n}\n`,
    html: `<div id="cube"></div>\n\n<script>\n  // Build the scroll-driven morph here in lesson 4.\n</script>`
  },
  3: {
    name: 'Cursor-Following Heart',
    accent: 'cyan',
    hint: {
      title: 'Lesson 3: Add mouse follow',
      summary: 'Lesson 3 starts from lesson 1, so the heart already exists. Your only new job is to add the follow function.',
      steps: ['Start with variables: mouseX/mouseY store target position, currentX/currentY store current position', 'Add document.addEventListener(\'mousemove\', ...) so mouseX and mouseY always update from event.clientX and event.clientY', 'In animate(), move currentX/currentY a little toward mouseX/mouseY each frame', 'Apply the position with cursor.style.transform and keep looping with requestAnimationFrame(animate)', 'Exercise: tune the lerp value to make the follow slower or faster'],
      moreTitle: 'Lesson 3: Follow function',
      moreSummary: 'This is the only new logic: variables hold the state, mousemove updates targets, and animate() creates smooth motion toward those targets.',
      codeTitle: 'Lesson 3 code example',
      code: 'const cursor = document.getElementById("cursor");\n\nlet mouseX = 0;\nlet mouseY = 0;\n\nlet currentX = 0;\nlet currentY = 0;\n\ndocument.addEventListener("mousemove", (e) => {\n  mouseX = e.clientX;\n  mouseY = e.clientY;\n});\n\nfunction animate() {\n  // Lerp (smooth follow)\n  currentX += (mouseX - currentX) * 0.1;\n  currentY += (mouseY - currentY) * 0.1;\n\n  cursor.style.transform = \`translate(\${currentX}px, \${currentY}px)\`;\n\n  requestAnimationFrame(animate);\n}\n\nanimate();'
    },
    guide: { title: 'Guide', summary: 'Reference implementation', steps: [], codeTitle: '', code: '' },
    reference: {
      css: `#cursor {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 56px;\n  height: 56px;\n  display: grid;\n  place-items: center;\n  pointer-events: none;\n}\n\n@keyframes pulse {\n  0%,\n  100% {\n    transform: scale(1);\n    box-shadow: 0 0 0 0 rgba(9, 206, 246, 0.6), 0 0 40px rgba(9, 206, 246, 0.62);\n  }\n\n  50% {\n    transform: scale(1.12);\n    box-shadow: 0 0 0 12px rgba(9, 206, 246, 0.06), 0 0 54px rgba(9, 206, 246, 0.9);\n  }\n}\n\n.pulse-dot {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: #09cef6;\n  animation: pulse 1.8s ease-in-out infinite;\n  display: grid;\n  place-items: center;\n}\n\n.pulse-dot::after {\n  content: '\u2665';\n  color: #072639;\n  font-size: 15px;\n}`,
      html: `<div id="cursor"><div class="pulse-dot"></div></div>\n\n<script>\n  const cursor = document.getElementById("cursor");\n\n  let mouseX = 0;\n  let mouseY = 0;\n\n  let currentX = 0;\n  let currentY = 0;\n\n  document.addEventListener("mousemove", (e) => {\n    mouseX = e.clientX;\n    mouseY = e.clientY;\n  });\n\n  function animate() {\n    // Lerp (smooth follow)\n    currentX += (mouseX - currentX) * 0.1;\n    currentY += (mouseY - currentY) * 0.1;\n\n    cursor.style.transform = \`translate(\${currentX}px, \${currentY}px)\`;\n\n    requestAnimationFrame(animate);\n  }\n\n  animate();\n</script>`
    },
    css: `body {\n  margin: 0;\n  min-height: 100vh;\n  background: #05080e;\n  overflow: hidden;\n}\n\n#cursor {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 56px;\n  height: 56px;\n  display: grid;\n  place-items: center;\n  pointer-events: none;\n}\n\n.pulse-dot {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: #09cef6;\n  animation: pulse 1.8s ease-in-out infinite;\n  display: grid;\n  place-items: center;\n}\n\n.pulse-dot::after {\n  content: '\\2665';\n  color: #072639;\n  font-size: 17px;\n}\n\n@keyframes pulse {\n  0%, 20%, 100% {\n    transform: scale(1.16);\n  }\n\n  10% {\n    transform: scale(0.86);\n  }\n\n  32% {\n    transform: scale(0.9);\n  }\n}\n`,
    html: `<div id="cursor"><div class="pulse-dot"></div></div>\n\n<script>\n  const cursor = document.getElementById("cursor");\n\n  let mouseX = 0;\n  let mouseY = 0;\n  let currentX = 0;\n  let currentY = 0;\n\n  document.addEventListener("mousemove", (e) => {\n    mouseX = e.clientX;\n    mouseY = e.clientY;\n  });\n\n  function animate() {\n    // Lerp (smooth follow)\n    currentX += (mouseX - currentX) * 0.1;\n    currentY += (mouseY - currentY) * 0.1;\n\n    cursor.style.transform = "translate(" + currentX + "px, " + currentY + "px)";\n\n    requestAnimationFrame(animate);\n  }\n\n  animate();\n</script>`
  },
  4: {
    name: 'Morphing Glow',
    accent: 'amber',
    hint: {
      title: 'Lesson 4: Add scroll morph',
      summary: 'Lesson 4 starts from lesson 2, so the cube and morph styling already exist. Your only new job is to add the scroll function.',
      steps: ['The cube markup and morph styling stay exactly the same as lesson 2', 'lastScroll remembers where the page was before the next scroll', 'delta is the difference between the new scroll position and the old one', 'rotation and border-radius are updated from that delta so the cube morphs while you scroll', 'Exercise: also scale the cube based on scroll'],
      moreTitle: 'Lesson 4: Scroll function',
      moreSummary: 'This is the only new logic: the scroll amount drives the morph state instead of a timer, while the base cube and animation style remain the same as lesson 2.',
      codeTitle: 'Lesson 4 code example',
      code: 'const cube = document.getElementById("cube");\n\nlet lastScroll = window.scrollY;\nlet rotation = 0;\n\nwindow.addEventListener("scroll", () => {\n  const currentScroll = window.scrollY;\n  const delta = currentScroll - lastScroll;\n\n  // styr hur snabbt animationen reagerar pa scroll\n  rotation += delta * 0.5;\n\n  // normalisera till 0-1 for morph-logik\n  const progress = ((rotation % 360) + 360) % 360 / 360;\n\n  // samma "morph" som keyframes: 2px -> 50% -> 2px\n  let radius;\n  if (progress < 0.5) {\n    radius = 2 + (progress * 2) * (50 - 2);\n  } else {\n    radius = 50 - ((progress - 0.5) * 2) * (50 - 2);\n  }\n\n  cube.style.borderRadius = radius > 10 ? radius + "%" : radius + "px";\n  cube.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;\n\n  lastScroll = currentScroll;\n});'
    },
    guide: { title: 'Guide', summary: 'Reference implementation', steps: [], codeTitle: '', code: '' },
    reference: { css: `/* morph css */\n.shape{width:52px;height:52px;background:#e6c790;border-radius:2px;}`, html: '<div class="shape"></div>' },
    css: `body {\n  height: 200vh;\n  margin: 0;\n  background: #05080e;\n}\n\n#cube {\n  width: 100px;\n  height: 100px;\n  background: black;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  border-radius: 2px;\n  box-shadow: 0 0 44px rgba(232, 201, 145, 0.25);\n}\n\n@keyframes morph {\n  0% {\n    border-radius: 2px;\n    transform: translate(-50%, -50%) rotate(0deg);\n  }\n\n  50% {\n    border-radius: 50%;\n    transform: translate(-50%, -50%) rotate(180deg);\n  }\n\n  100% {\n    border-radius: 2px;\n    transform: translate(-50%, -50%) rotate(360deg);\n  }\n}\n`,
    html: `<div id="cube"></div>\n\n<script>\n  const cube = document.getElementById("cube");\n\n  let lastScroll = window.scrollY;\n  let rotation = 0;\n\n  window.addEventListener("scroll", () => {\n    const currentScroll = window.scrollY;\n    const delta = currentScroll - lastScroll;\n\n    // styr hur snabbt animationen reagerar pa scroll\n    rotation += delta * 0.5;\n\n    // normalisera till 0-1 for morph-logik\n    const progress = ((rotation % 360) + 360) % 360 / 360;\n\n    // samma "morph" som keyframes: 2px -> 50% -> 2px\n    let radius;\n    if (progress < 0.5) {\n      radius = 2 + (progress * 2) * (50 - 2);\n    } else {\n      radius = 50 - ((progress - 0.5) * 2) * (50 - 2);\n    }\n\n    cube.style.borderRadius = radius > 10 ? radius + "%" : radius + "px";\n    cube.style.transform = \`translate(-50%, -50%) rotate(\${rotation}deg)\`;\n\n    lastScroll = currentScroll;\n  });\n</script>`
  },
  5: {
    name: 'Jitter Micro Motion',
    accent: 'cyan',
    hint: {
      title: 'Lesson 5: Jitter micro motion',
      summary: 'Use tiny offsets and short durations to create a subtle jitter effect.',
      steps: [
        'Center the element and set a dark background so the motion stands out',
        'Style the jitter box with size, color, and rounded corners',
        'Create keyframes with small translate and rotate values',
        'Use a short duration and steps() to keep the motion snappy',
        'Exercise: expose jitter strength via a CSS variable'
      ],
      moreTitle: 'Lesson 5: Tune the jitter',
      moreSummary: 'Lower offsets make the motion calmer. Increase duration if it feels too aggressive.',
      codeTitle: 'Lesson 5 code example',
      code: 'body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #05080e;\n}\n\n.jitter-dot {\n  width: 64px;\n  height: 64px;\n  border-radius: 14px;\n  background: #09cef6;\n  animation: jitter 220ms steps(2) infinite;\n}\n\n@keyframes jitter {\n  0% { transform: translate(0, 0) rotate(0deg); }\n  25% { transform: translate(3px, -2px) rotate(-2deg); }\n  50% { transform: translate(-2px, 2px) rotate(2deg); }\n  75% { transform: translate(2px, 1px) rotate(-1deg); }\n  100% { transform: translate(0, 0) rotate(0deg); }\n}'
    },
    guide: { title: 'Guide', summary: 'Reference implementation', steps: [], codeTitle: '', code: '' },
    reference: {
      css: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #05080e;\n}\n\n.jitter-dot {\n  width: 64px;\n  height: 64px;\n  border-radius: 14px;\n  background: #09cef6;\n  animation: jitter 220ms steps(2) infinite;\n}\n\n@keyframes jitter {\n  0% { transform: translate(0, 0) rotate(0deg); }\n  25% { transform: translate(3px, -2px) rotate(-2deg); }\n  50% { transform: translate(-2px, 2px) rotate(2deg); }\n  75% { transform: translate(2px, 1px) rotate(-1deg); }\n  100% { transform: translate(0, 0) rotate(0deg); }\n}`,
      html: '<div class="jitter-dot"></div>'
    },
    css: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #05080e;\n}\n\n.jitter-dot {\n  width: 64px;\n  height: 64px;\n  border-radius: 14px;\n  background: #09cef6;\n  animation: jitter 220ms steps(2) infinite;\n}\n\n@keyframes jitter {\n  0% { transform: translate(0, 0) rotate(0deg); }\n  25% { transform: translate(3px, -2px) rotate(-2deg); }\n  50% { transform: translate(-2px, 2px) rotate(2deg); }\n  75% { transform: translate(2px, 1px) rotate(-1deg); }\n  100% { transform: translate(0, 0) rotate(0deg); }\n}`,
    html: `<div class="jitter-dot"></div>`
  },
  6: {
    name: 'Jitter With JavaScript',
    accent: 'amber',
    hint: {
      title: 'Lesson 6: Jitter with JavaScript',
      summary: 'Use requestAnimationFrame to update small random offsets each tick.',
      steps: [
        'Create a square element and center it on the page',
        'Add a short CSS transition so the motion is not too sharp',
        'Use requestAnimationFrame to update the transform regularly',
        'Limit the random range so the motion stays subtle',
        'Exercise: add a button that toggles jitter on and off'
      ],
      moreTitle: 'Lesson 6: Control the motion',
      moreSummary: 'Decrease the random range for calmer motion. Increase the tick delay for slower jitter.',
      codeTitle: 'Lesson 6 code example',
      code: 'const card = document.getElementById("jitterCard");\nlet last = 0;\n\nfunction animate(time) {\n  if (time - last > 90) {\n    const x = (Math.random() - 0.5) * 10;\n    const y = (Math.random() - 0.5) * 10;\n    const r = (Math.random() - 0.5) * 6;\n    card.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;\n    last = time;\n  }\n  requestAnimationFrame(animate);\n}\n\nrequestAnimationFrame(animate);'
    },
    guide: { title: 'Guide', summary: 'Reference implementation', steps: [], codeTitle: '', code: '' },
    reference: {
      css: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #05080e;\n}\n\n.jitter-card {\n  width: 120px;\n  height: 120px;\n  border-radius: 12px;\n  background: #e8c991;\n  box-shadow: 0 0 40px rgba(232, 201, 145, 0.25);\n  transition: transform 90ms ease;\n}`,
      html: `<div class="jitter-card" id="jitterCard"></div>\n\n<script>\n  const card = document.getElementById('jitterCard');\n  let last = 0;\n\n  function animate(time) {\n    if (time - last > 90) {\n      const x = (Math.random() - 0.5) * 10;\n      const y = (Math.random() - 0.5) * 10;\n      const r = (Math.random() - 0.5) * 6;\n      card.style.transform = "translate(" + x + "px, " + y + "px) rotate(" + r + "deg)";\n      last = time;\n    }\n    requestAnimationFrame(animate);\n  }\n\n  requestAnimationFrame(animate);\n</script>`
    },
    css: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #05080e;\n}\n\n.jitter-card {\n  width: 120px;\n  height: 120px;\n  border-radius: 12px;\n  background: #e8c991;\n  box-shadow: 0 0 40px rgba(232, 201, 145, 0.25);\n  transition: transform 90ms ease;\n}`,
    html: `<div class="jitter-card" id="jitterCard"></div>\n\n<script>\n  const card = document.getElementById('jitterCard');\n  let last = 0;\n\n  function animate(time) {\n    if (time - last > 90) {\n      const x = (Math.random() - 0.5) * 10;\n      const y = (Math.random() - 0.5) * 10;\n      const r = (Math.random() - 0.5) * 6;\n      card.style.transform = "translate(" + x + "px, " + y + "px) rotate(" + r + "deg)";\n      last = time;\n    }\n    requestAnimationFrame(animate);\n  }\n\n  requestAnimationFrame(animate);\n</script>`
  }
};

const LESSON_ENRICHMENT = {
  1: {
    intro: 'You will build a small glowing heart that feels like it has a heartbeat. This pattern is useful for loading states, likes, status indicators, and playful micro-interactions.',
    steps: [
      { title: 'Create the object', text: 'Start with one circular element. Keep the HTML tiny so the effect is easy to reason about.' },
      { title: 'Add the symbol', text: 'Use a pseudo-element for the heart so the shape and the icon can be styled separately.' },
      { title: 'Animate only transform', text: 'Scale the dot with keyframes. Transform animation stays smooth because it avoids layout recalculation.' }
    ],
    breakdown: [
      { title: 'Outer glow', text: 'The box-shadow creates the soft energy around the heart.' },
      { title: 'Core dot', text: 'The circular background is the main visible object.' },
      { title: 'Heartbeat', text: 'Scale changes create the illusion of a beat.' }
    ],
    codeNotes: [
      'border-radius: 50% turns the square box into a circle.',
      'box-shadow expands visually without changing the real element size.',
      'The keyframes spend most time near the resting scale, then briefly compress.'
    ],
    tip: 'Use transform and opacity for motion whenever possible. They are usually the smoothest properties to animate.',
    warning: 'Do not animate width or height for this effect. It can cause layout shifts and make nearby content jump.',
    recap: 'A pulse is just a stable element plus a short scale rhythm. Build the visual first, then add motion.'
  },
  2: {
    intro: 'You will morph a square into a circle while it rotates and glows. The same idea appears in loaders, brand moments, and state transitions.',
    steps: [
      { title: 'Define the base shape', text: 'A simple square gives the animation a clear starting state.' },
      { title: 'Morph the corners', text: 'Changing border-radius moves the shape from sharp to round.' },
      { title: 'Layer the glow', text: 'A warm shadow makes the motion feel more premium without adding extra markup.' }
    ],
    breakdown: [
      { title: 'Square state', text: 'The starting geometry gives users a readable before state.' },
      { title: 'Circle state', text: 'The midpoint uses a large radius to create the transformation.' },
      { title: 'Rotation layer', text: 'Rotation adds energy while the corner radius changes.' }
    ],
    codeNotes: [
      '50% is the visual peak of the morph, where the square becomes circular.',
      'The transform combines centering and rotation, so preserve translate when adding rotate.',
      'A slower duration makes shape morphing easier to understand.'
    ],
    tip: 'When combining transforms, write the whole transform value every time so one transform does not overwrite another.',
    warning: 'Avoid mixing CSS animation and JavaScript transform updates on the same element unless you intentionally coordinate them.',
    recap: 'Shape morphing is a controlled transition between visual states: geometry, rotation, and glow.'
  },
  3: {
    intro: 'You will make the heart follow the cursor with a smooth delayed motion. This teaches mouse input, state, and animation loops.',
    steps: [
      { title: 'Track the target', text: 'Mouse events update where the cursor wants the heart to go.' },
      { title: 'Store current position', text: 'The current position moves gradually, instead of snapping instantly.' },
      { title: 'Loop with requestAnimationFrame', text: 'The browser schedules the animation at the right time for smoother motion.' }
    ],
    breakdown: [
      { title: 'Target point', text: 'The latest mouse position is the destination.' },
      { title: 'Current point', text: 'The visible element sits slightly behind the target.' },
      { title: 'Lerp motion', text: 'Each frame moves a fraction of the remaining distance.' }
    ],
    codeNotes: [
      'mouseX and mouseY are the destination values.',
      'currentX and currentY are the rendered values.',
      'The 0.1 multiplier controls how soft or snappy the follow feels.'
    ],
    tip: 'Use pointer-events: none on decorative cursor followers so they never block real clicks.',
    warning: 'Do not update layout properties on every mousemove. Store values, then render them inside requestAnimationFrame.',
    recap: 'Smooth following is target state plus rendered state plus a loop that closes the distance over time.'
  },
  4: {
    intro: 'You will connect scroll movement to a morphing cube. This introduces scroll-driven interaction without needing a large framework.',
    steps: [
      { title: 'Read scroll delta', text: 'Compare the current scroll position with the previous one.' },
      { title: 'Convert motion to progress', text: 'Turn movement into a normalized value that can drive the visual state.' },
      { title: 'Update shape safely', text: 'Apply rotation and border-radius together so the object remains centered.' }
    ],
    breakdown: [
      { title: 'Scroll input', text: 'The page movement becomes the animation source.' },
      { title: 'Progress mapping', text: 'A number from 0 to 1 decides how round the cube is.' },
      { title: 'Visual output', text: 'Radius and rotation make the result feel responsive.' }
    ],
    codeNotes: [
      'delta tells you whether the user moved up or down.',
      'Modulo keeps rotation progress inside a predictable range.',
      'The radius formula mirrors the CSS keyframe states.'
    ],
    tip: 'Keep scroll handlers small and use passive listeners when you do not call preventDefault.',
    warning: 'Avoid doing expensive DOM queries inside every scroll event. Cache the element before the listener.',
    recap: 'Scroll animation works best when input, progress, and output are clearly separated.'
  },
  5: {
    intro: 'You will build a subtle jitter motion with CSS keyframes. It is useful for attention cues, alerts, and energetic interface details.',
    steps: [
      { title: 'Limit the distance', text: 'Tiny translate values keep the motion readable instead of chaotic.' },
      { title: 'Add rotation', text: 'Small rotation makes the jitter feel less mechanical.' },
      { title: 'Control timing', text: 'A short duration with steps creates a snappy handmade feel.' }
    ],
    breakdown: [
      { title: 'Position shift', text: 'The element moves a few pixels in different directions.' },
      { title: 'Angle shift', text: 'Rotation gives the movement character.' },
      { title: 'Timing', text: 'Steps make the animation jump between states.' }
    ],
    codeNotes: [
      'translate values should stay small so the element remains in its visual container.',
      'steps(2) creates a sharper, more jitter-like rhythm.',
      'The final keyframe returns to zero so the loop closes cleanly.'
    ],
    tip: 'Use CSS variables for jitter strength when you want reusable motion presets.',
    warning: 'Strong jitter can be distracting. Keep it subtle and respect reduced-motion settings.',
    recap: 'Jitter is controlled imperfection: small offsets, small angles, and fast timing.'
  },
  6: {
    intro: 'You will create jitter with JavaScript so the motion can change dynamically. This is useful when animation strength depends on user input or app state.',
    steps: [
      { title: 'Choose a tick rate', text: 'Update less often than every frame so the jitter has a deliberate rhythm.' },
      { title: 'Generate small offsets', text: 'Random x, y, and rotation values create variation.' },
      { title: 'Render with transform', text: 'The element moves without affecting document layout.' }
    ],
    breakdown: [
      { title: 'Random source', text: 'Math.random creates changing values.' },
      { title: 'Motion range', text: 'The range controls how intense the jitter feels.' },
      { title: 'Animation loop', text: 'requestAnimationFrame keeps updates synced with rendering.' }
    ],
    codeNotes: [
      'last stores the previous update time so the motion can be throttled.',
      'Random values are centered around zero by subtracting 0.5.',
      'Transform combines movement and rotation in one GPU-friendly update.'
    ],
    tip: 'Separate motion settings from rendering code so speed and intensity are easy to tune.',
    warning: 'Never let random motion grow without bounds. Keep every update inside a small safe range.',
    recap: 'JavaScript jitter is a controlled loop: timing, random values, and one transform update.'
  }
};

const LESSON_COURSE_SECTIONS = {
  1: {
    title: 'Pulse Effect System',
    summary: 'Build the pulse in a clean sequence: craft the visual object, add heartbeat logic, then connect both into one complete effect.',
    stages: [
      {
        key: 'visuals',
        title: 'Visuals',
        summary: 'Construct only the look of the pulse heart.',
        cards: [
          { title: 'Layout frame', text: 'Use a full-height dark canvas and center one object in the viewport.' },
          { title: 'Core shape', text: 'Create a circular dot with a strong cyan fill and fixed size.' },
          { title: 'Layered symbol', text: 'Place the heart icon as a pseudo-element for a separate visual layer.' }
        ],
        codeLabel: 'HTML + CSS structure',
        code: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #05080e;\n}\n\n.pulse-dot {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: #09cef6;\n  box-shadow: 0 0 28px rgba(9, 206, 246, 0.55);\n  display: grid;\n  place-items: center;\n}\n\n.pulse-dot::after {\n  content: '\\2665';\n  color: #072639;\n  font-size: 17px;\n}`,
        notes: [
          'Focus on sizing, shape, glow, and center alignment only.',
          'Do not add animation timing in this stage.'
        ],
        recap: 'The pulse object is now visually complete and ready for motion.'
      },
      {
        key: 'animation',
        title: 'Animation / Interaction',
        summary: 'Define only heartbeat motion behavior and timing.',
        cards: [
          { title: 'Keyframe states', text: 'Use a resting state, quick compression, then return for rhythmic breathing.' },
          { title: 'Timing curve', text: 'Use ease-in-out with a medium duration to avoid harsh movement.' },
          { title: 'Motion flow', text: 'Animate transform scale and glow intensity to keep movement smooth.' }
        ],
        codeLabel: 'Animation logic',
        code: `@keyframes pulse {\n  0%, 20%, 100% {\n    transform: scale(1.16);\n    box-shadow: 0 0 0 12px rgba(9, 206, 246, 0.06), 0 0 54px rgba(9, 206, 246, 0.9);\n  }\n\n  10% {\n    transform: scale(0.86);\n    box-shadow: 0 0 0 0 rgba(9, 206, 246, 0.55), 0 0 40px rgba(9, 206, 246, 0.62);\n  }\n\n  32% {\n    transform: scale(0.9);\n    box-shadow: 0 0 0 1px rgba(9, 206, 246, 0.08), 0 0 41px rgba(9, 206, 246, 0.68);\n  }\n}\n\n.pulse-dot {\n  animation: pulse 1.8s ease-in-out infinite;\n}`,
        notes: [
          'Transform-based motion keeps performance stable.',
          'Duration controls calmness versus urgency.'
        ],
        recap: 'Heartbeat behavior is now isolated and tuneable.'
      },
      {
        key: 'combination',
        title: 'Combination',
        summary: 'Connect visual layers and animation so the final pulse effect feels alive.',
        cards: [
          { title: 'Visuals as target', text: 'The styled pulse dot is the animation target element.' },
          { title: 'Animation control', text: 'Keyframes directly control scale and glow over time.' },
          { title: 'Final output', text: 'Static design plus timed motion creates the breathing heart.' }
        ],
        codeLabel: 'Combined system',
        code: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #05080e;\n}\n\n.pulse-dot {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: #09cef6;\n  box-shadow: 0 0 28px rgba(9, 206, 246, 0.55);\n  display: grid;\n  place-items: center;\n  animation: pulse 1.8s ease-in-out infinite;\n}\n\n.pulse-dot::after {\n  content: '\\2665';\n  color: #072639;\n  font-size: 17px;\n}\n\n@keyframes pulse {\n  0%, 20%, 100% { transform: scale(1.16); }\n  10% { transform: scale(0.86); }\n  32% { transform: scale(0.9); }\n}`,
        notes: [
          'Visual styling defines appearance; keyframes define behavior.',
          'Together they produce one coherent animated component.'
        ],
        recap: 'Now everything connects together: shape, glow, and rhythm in one system.'
      }
    ]
  },
  2: {
    title: 'Morphing Glow System',
    summary: 'Learn the morph in three controlled stages so structure and behavior stay clear.',
    stages: [
      {
        key: 'visuals',
        title: 'Visuals',
        summary: 'Build the static cube shape, placement, and glow first.',
        cards: [
          { title: 'Center positioning', text: 'Pin the object in the viewport center using fixed positioning and translate.' },
          { title: 'Shape setup', text: 'Start from a square with subtle corner radius to establish the base form.' },
          { title: 'Glow styling', text: 'Add warm shadow layers so transformations stay visually readable.' }
        ],
        codeLabel: 'Visual structure',
        code: `body {\n  height: 200vh;\n  margin: 0;\n  background: #05080e;\n}\n\n#cube {\n  width: 100px;\n  height: 100px;\n  background: black;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  border-radius: 2px;\n  box-shadow: 0 0 44px rgba(232, 201, 145, 0.25);\n}`,
        notes: ['This stage defines only geometry, color, and layout.', 'No motion formulas yet.'],
        recap: 'The morph object is visually ready before movement logic begins.'
      },
      {
        key: 'animation',
        title: 'Animation / Interaction',
        summary: 'Implement only morph timing and rotation transitions.',
        cards: [
          { title: 'State timeline', text: 'Move square to circle at midpoint, then return.' },
          { title: 'Transform control', text: 'Rotate progressively while preserving translate centering.' },
          { title: 'Timing behavior', text: 'Use one smooth loop so users can read each phase.' }
        ],
        codeLabel: 'Motion logic',
        code: `@keyframes morph {\n  0% {\n    border-radius: 2px;\n    transform: translate(-50%, -50%) rotate(0deg);\n  }\n\n  50% {\n    border-radius: 50%;\n    transform: translate(-50%, -50%) rotate(180deg);\n  }\n\n  100% {\n    border-radius: 2px;\n    transform: translate(-50%, -50%) rotate(360deg);\n  }\n}\n\n#cube {\n  animation: morph 3s ease-in-out infinite;\n}`,
        notes: ['Timing controls how quickly users perceive transformation.', 'Transforms are composed in one property value each keyframe.'],
        recap: 'The motion system is isolated and easy to tune.'
      },
      {
        key: 'combination',
        title: 'Combination',
        summary: 'Merge the styled cube and morph logic into one finished effect.',
        cards: [
          { title: 'What controls what', text: 'Keyframes control rotation and radius; base CSS controls material and glow.' },
          { title: 'Visual response', text: 'As border-radius changes, glow highlights the shape transition.' },
          { title: 'Final effect', text: 'The object reads as one premium morphing component.' }
        ],
        codeLabel: 'Combined system',
        code: `#cube {\n  width: 100px;\n  height: 100px;\n  background: black;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  border-radius: 2px;\n  box-shadow: 0 0 44px rgba(232, 201, 145, 0.25);\n  animation: morph 3s ease-in-out infinite;\n}\n\n@keyframes morph {\n  0% { border-radius: 2px; transform: translate(-50%, -50%) rotate(0deg); }\n  50% { border-radius: 50%; transform: translate(-50%, -50%) rotate(180deg); }\n  100% { border-radius: 2px; transform: translate(-50%, -50%) rotate(360deg); }\n}`,
        notes: ['Visual base stays constant while animation updates state.', 'Result = styling layer + behavior layer.'],
        recap: 'Now everything connects together into a complete morph system.'
      }
    ]
  },
  3: {
    title: 'Cursor Follow System',
    summary: 'Separate appearance from pointer logic, then fuse them for smooth interaction.',
    stages: [
      {
        key: 'visuals',
        title: 'Visuals',
        summary: 'Build the follower object and visual styling only.',
        cards: [
          { title: 'Follower shell', text: 'Create a fixed-position wrapper for the moving object.' },
          { title: 'Heart styling', text: 'Reuse the pulse dot appearance and icon layers.' },
          { title: 'Interaction-safe layer', text: 'Disable pointer events so the follower never blocks user input.' }
        ],
        codeLabel: 'Visual setup',
        code: `#cursor {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 56px;\n  height: 56px;\n  display: grid;\n  place-items: center;\n  pointer-events: none;\n}\n\n.pulse-dot {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: #09cef6;\n  display: grid;\n  place-items: center;\n}`,
        notes: ['Only visual build decisions are made here.', 'No motion event code in this stage.'],
        recap: 'The follower element is visually complete and input-safe.'
      },
      {
        key: 'animation',
        title: 'Animation / Interaction',
        summary: 'Create only cursor tracking state and requestAnimationFrame motion loop.',
        cards: [
          { title: 'Target state', text: 'mousemove updates mouseX and mouseY destination values.' },
          { title: 'Rendered state', text: 'currentX/currentY move gradually toward target values.' },
          { title: 'Frame loop', text: 'requestAnimationFrame applies transform updates continuously.' }
        ],
        codeLabel: 'Interaction logic',
        code: `let mouseX = 0;\nlet mouseY = 0;\nlet currentX = 0;\nlet currentY = 0;\n\ndocument.addEventListener('mousemove', (e) => {\n  mouseX = e.clientX;\n  mouseY = e.clientY;\n});\n\nfunction animate() {\n  currentX += (mouseX - currentX) * 0.1;\n  currentY += (mouseY - currentY) * 0.1;\n  cursor.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px)';\n  requestAnimationFrame(animate);\n}\n\nanimate();`,
        notes: ['Lerp factor controls snappy vs soft motion.', 'State update and render update are intentionally separated.'],
        recap: 'Pointer behavior now works independently from styling.'
      },
      {
        key: 'combination',
        title: 'Combination',
        summary: 'Bind the visual follower and motion system into one interactive result.',
        cards: [
          { title: 'Controller path', text: 'Mouse events update target state values.' },
          { title: 'Render path', text: 'Animation loop reads state and updates CSS transform.' },
          { title: 'Final output', text: 'A styled heart smoothly follows the user cursor.' }
        ],
        codeLabel: 'Combined system',
        code: `<div id=\"cursor\"><div class=\"pulse-dot\"></div></div>\n\n<script>\n  const cursor = document.getElementById('cursor');\n  let mouseX = 0;\n  let mouseY = 0;\n  let currentX = 0;\n  let currentY = 0;\n\n  document.addEventListener('mousemove', (e) => {\n    mouseX = e.clientX;\n    mouseY = e.clientY;\n  });\n\n  function animate() {\n    currentX += (mouseX - currentX) * 0.1;\n    currentY += (mouseY - currentY) * 0.1;\n    cursor.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px)';\n    requestAnimationFrame(animate);\n  }\n\n  animate();\n</script>`,
        notes: ['Visual component receives transform updates from interaction loop.', 'Appearance and behavior remain modular but connected.'],
        recap: 'Now everything connects together into a smooth pointer-driven component.'
      }
    ]
  },
  4: {
    title: 'Scroll Morph System',
    summary: 'Learn scroll-driven behavior in the same three-stage learning flow.',
    stages: [
      {
        key: 'visuals',
        title: 'Visuals',
        summary: 'Set up only the cube appearance and viewport placement.',
        cards: [
          { title: 'Centered object', text: 'Fix the cube in the center so scroll affects state, not layout position.' },
          { title: 'Shape identity', text: 'Start from a square with clear edges and warm glow.' },
          { title: 'Page context', text: 'Give the page extra height so scroll input is available.' }
        ],
        codeLabel: 'Visual setup',
        code: `body {\n  height: 200vh;\n  margin: 0;\n  background: #05080e;\n}\n\n#cube {\n  width: 100px;\n  height: 100px;\n  background: black;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  border-radius: 2px;\n  box-shadow: 0 0 44px rgba(232, 201, 145, 0.25);\n}`,
        notes: ['This stage is visual-only by design.', 'Do not attach scroll listeners yet.'],
        recap: 'The visual object is prepared for behavior mapping.'
      },
      {
        key: 'animation',
        title: 'Animation / Interaction',
        summary: 'Map scroll delta to rotation and morph progress.',
        cards: [
          { title: 'Input read', text: 'Capture current and previous scroll values to calculate delta.' },
          { title: 'State update', text: 'Convert delta into rotation, then normalize to 0..1 progress.' },
          { title: 'Output mapping', text: 'Translate progress into border-radius changes and transforms.' }
        ],
        codeLabel: 'Scroll logic',
        code: `const cube = document.getElementById('cube');\nlet lastScroll = window.scrollY;\nlet rotation = 0;\n\nwindow.addEventListener('scroll', () => {\n  const currentScroll = window.scrollY;\n  const delta = currentScroll - lastScroll;\n  rotation += delta * 0.5;\n\n  const progress = (((rotation % 360) + 360) % 360) / 360;\n  let radius;\n\n  if (progress < 0.5) {\n    radius = 2 + (progress * 2) * (50 - 2);\n  } else {\n    radius = 50 - ((progress - 0.5) * 2) * (50 - 2);\n  }\n\n  cube.style.borderRadius = radius > 10 ? radius + '%' : radius + 'px';\n  cube.style.transform = 'translate(-50%, -50%) rotate(' + rotation + 'deg)';\n  lastScroll = currentScroll;\n});`,
        notes: ['The scroll event updates state only, then writes style output.', 'Progress normalization keeps behavior predictable.'],
        recap: 'Scroll behavior is now clearly structured from input to output.'
      },
      {
        key: 'combination',
        title: 'Combination',
        summary: 'Merge shape styling with scroll logic for a complete reactive morph.',
        cards: [
          { title: 'Control chain', text: 'Scroll position controls rotation and morph progress.' },
          { title: 'Visual chain', text: 'Progress updates border-radius while base styling keeps material quality.' },
          { title: 'Final effect', text: 'User scrolling directly drives the object transformation.' }
        ],
        codeLabel: 'Combined system',
        code: `<div id=\"cube\"></div>\n\n<script>\n  const cube = document.getElementById('cube');\n  let lastScroll = window.scrollY;\n  let rotation = 0;\n\n  window.addEventListener('scroll', () => {\n    const currentScroll = window.scrollY;\n    const delta = currentScroll - lastScroll;\n    rotation += delta * 0.5;\n\n    const progress = (((rotation % 360) + 360) % 360) / 360;\n    const radius = progress < 0.5\n      ? 2 + (progress * 2) * (50 - 2)\n      : 50 - ((progress - 0.5) * 2) * (50 - 2);\n\n    cube.style.borderRadius = radius > 10 ? radius + '%' : radius + 'px';\n    cube.style.transform = 'translate(-50%, -50%) rotate(' + rotation + 'deg)';\n    lastScroll = currentScroll;\n  });\n</script>`,
        notes: ['Visual styles define look; scroll logic defines behavior.', 'The merged system stays readable because responsibilities are separated.'],
        recap: 'Now everything connects together through a clear input-to-visual pipeline.'
      }
    ]
  },
  5: {
    title: 'CSS Jitter System',
    summary: 'Create subtle micro-motion by separating shape design from jitter timing.',
    stages: [
      {
        key: 'visuals',
        title: 'Visuals',
        summary: 'Build the static jitter object and its styling first.',
        cards: [
          { title: 'Canvas setup', text: 'Center one component on a dark background for strong contrast.' },
          { title: 'Object styling', text: 'Use rounded corners, fixed size, and cyan glow to define the base.' },
          { title: 'Readability', text: 'Keep the shape simple so micro-motion remains understandable.' }
        ],
        codeLabel: 'Visual setup',
        code: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #05080e;\n}\n\n.jitter-dot {\n  width: 64px;\n  height: 64px;\n  border-radius: 14px;\n  background: #09cef6;\n  box-shadow: 0 0 26px rgba(9, 206, 246, 0.55);\n}`,
        notes: ['Only style and structure in this step.', 'Avoid discussing keyframe behavior yet.'],
        recap: 'The object is visually defined and ready for motion.'
      },
      {
        key: 'animation',
        title: 'Animation / Interaction',
        summary: 'Define jitter behavior with keyframe offsets and timing.',
        cards: [
          { title: 'Offset pattern', text: 'Use tiny translate and rotate values to avoid chaotic movement.' },
          { title: 'Timing style', text: 'steps(2) creates crisp, jitter-like state jumps.' },
          { title: 'Loop closure', text: 'Return to neutral at 100% for clean repetition.' }
        ],
        codeLabel: 'Jitter logic',
        code: `@keyframes jitter {\n  0% { transform: translate(0, 0) rotate(0deg); }\n  25% { transform: translate(3px, -2px) rotate(-2deg); }\n  50% { transform: translate(-2px, 2px) rotate(2deg); }\n  75% { transform: translate(2px, 1px) rotate(-1deg); }\n  100% { transform: translate(0, 0) rotate(0deg); }\n}\n\n.jitter-dot {\n  animation: jitter 220ms steps(2) infinite;\n}`,
        notes: ['Timing and transforms are the behavior layer.', 'Keep offset range tight for premium subtlety.'],
        recap: 'Jitter motion is now isolated and controllable.'
      },
      {
        key: 'combination',
        title: 'Combination',
        summary: 'Combine visual object and jitter loop into one polished micro-interaction.',
        cards: [
          { title: 'Control mapping', text: 'Keyframes control movement while base styles keep identity.' },
          { title: 'Visual feedback', text: 'Glow makes each tiny movement perceptible.' },
          { title: 'Final effect', text: 'A subtle animated alert-like component.' }
        ],
        codeLabel: 'Combined system',
        code: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #05080e;\n}\n\n.jitter-dot {\n  width: 64px;\n  height: 64px;\n  border-radius: 14px;\n  background: #09cef6;\n  box-shadow: 0 0 26px rgba(9, 206, 246, 0.55);\n  animation: jitter 220ms steps(2) infinite;\n}\n\n@keyframes jitter {\n  0% { transform: translate(0, 0) rotate(0deg); }\n  25% { transform: translate(3px, -2px) rotate(-2deg); }\n  50% { transform: translate(-2px, 2px) rotate(2deg); }\n  75% { transform: translate(2px, 1px) rotate(-1deg); }\n  100% { transform: translate(0, 0) rotate(0deg); }\n}`,
        notes: ['Styling provides the body; keyframes provide life.', 'Both layers must stay minimal to keep readability high.'],
        recap: 'Now everything connects together into a clean jitter component.'
      }
    ]
  },
  6: {
    title: 'JavaScript Jitter System',
    summary: 'Move from static styling to frame-based random motion, then merge both layers.',
    stages: [
      {
        key: 'visuals',
        title: 'Visuals',
        summary: 'Build the jitter card appearance only.',
        cards: [
          { title: 'Base form', text: 'Create a square card with warm color and soft radius.' },
          { title: 'Glow treatment', text: 'Use shadow to keep the element visible during quick offsets.' },
          { title: 'Transition polish', text: 'Short transform transition softens abrupt state changes.' }
        ],
        codeLabel: 'Visual setup',
        code: `.jitter-card {\n  width: 120px;\n  height: 120px;\n  border-radius: 12px;\n  background: #e8c991;\n  box-shadow: 0 0 40px rgba(232, 201, 145, 0.25);\n  transition: transform 90ms ease;\n}`,
        notes: ['This stage is only about styling and readability.', 'No requestAnimationFrame behavior yet.'],
        recap: 'The card is visually prepared for scripted motion.'
      },
      {
        key: 'animation',
        title: 'Animation / Interaction',
        summary: 'Implement frame loop, state timing, and random offset generation.',
        cards: [
          { title: 'Frame scheduling', text: 'Use requestAnimationFrame for render-synced updates.' },
          { title: 'Tick control', text: 'Throttle updates with time delta to set jitter rhythm.' },
          { title: 'State updates', text: 'Generate constrained random x, y, and rotation values each tick.' }
        ],
        codeLabel: 'JavaScript motion logic',
        code: `const card = document.getElementById('jitterCard');\nlet last = 0;\n\nfunction animate(time) {\n  if (time - last > 90) {\n    const x = (Math.random() - 0.5) * 10;\n    const y = (Math.random() - 0.5) * 10;\n    const r = (Math.random() - 0.5) * 6;\n    card.style.transform = 'translate(' + x + 'px, ' + y + 'px) rotate(' + r + 'deg)';\n    last = time;\n  }\n\n  requestAnimationFrame(animate);\n}\n\nrequestAnimationFrame(animate);`,
        notes: ['Throttle interval controls motion density.', 'Random range controls intensity.'],
        recap: 'The interaction engine now controls movement behavior.'
      },
      {
        key: 'combination',
        title: 'Combination',
        summary: 'Join styled card and JavaScript jitter engine into one complete effect.',
        cards: [
          { title: 'Control path', text: 'JavaScript computes state and writes transform output.' },
          { title: 'Visual path', text: 'CSS styling keeps shape, color, and glow stable while moving.' },
          { title: 'Final output', text: 'A responsive jitter card with premium readable motion.' }
        ],
        codeLabel: 'Combined system',
        code: `<div class=\"jitter-card\" id=\"jitterCard\"></div>\n\n<script>\n  const card = document.getElementById('jitterCard');\n  let last = 0;\n\n  function animate(time) {\n    if (time - last > 90) {\n      const x = (Math.random() - 0.5) * 10;\n      const y = (Math.random() - 0.5) * 10;\n      const r = (Math.random() - 0.5) * 6;\n      card.style.transform = 'translate(' + x + 'px, ' + y + 'px) rotate(' + r + 'deg)';\n      last = time;\n    }\n\n    requestAnimationFrame(animate);\n  }\n\n  requestAnimationFrame(animate);\n</script>`,
        notes: ['JavaScript controls behavior, CSS controls presentation.', 'Together they produce the final jitter effect.'],
        recap: 'Now everything connects together into a dynamic scripted component.'
      }
    ]
  }
};

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildPreview(cssCode, htmlCode) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
        ${cssCode}
      </style>
    </head>
    <body>
      ${htmlCode}
    </body>
    </html>
  `;
}

function renderLearningCards(items) {
  return items.map((item, index) => `
    <article class="learning-card">
      <span>${index + 1}</span>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join('');
}

function renderBreakdownCards(items) {
  return items.map((item, index) => `
    <article class="visual-breakdown-card">
      <span>${index + 1}</span>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join('');
}

function renderCodeNotes(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderStageCards(items) {
  return items.map((item, index) => `
    <article class="stage-card">
      <span class="stage-card-index">${index + 1}</span>
      <h5>${escapeHtml(item.title)}</h5>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join('');
}

function splitCodeIntoTeachingBlocks(code) {
  const rawParts = (code || '')
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);

  const parts = rawParts.length > 0 ? rawParts : [code || ''];
  return parts.slice(0, 3);
}

function explainLine(line) {
  const text = (line || '').trim();
  const lower = text.toLowerCase();

  if (lower.startsWith('@keyframes')) {
    return 'Creates a named animation timeline. The browser uses this timeline to know how values should change over time.';
  }
  if (lower.includes('requestanimationframe')) {
    return 'Schedules the next update right before the browser repaints. This is the smooth way to run frame-based animation loops.';
  }
  if (lower.includes('addeventlistener')) {
    return 'Listens for an event and runs code when that event happens. It connects user input to your logic.';
  }
  if (lower.includes('transform')) {
    return 'Updates visual position/scale/rotation using transform, which is fast and does not reflow the full page layout.';
  }
  if (lower.includes('translate(')) {
    return 'Moves the element along the x/y axes. Positive and negative values control direction.';
  }
  if (lower.includes('rotate(')) {
    return 'Rotates the element around its center by the specified angle.';
  }
  if (lower.includes('border-radius')) {
    return 'Controls corner roundness. Small values keep corners sharp; larger values make circles or pill shapes.';
  }
  if (lower.includes('let ') || lower.includes('const ') || lower.startsWith('let ') || lower.startsWith('const ')) {
    return 'Declares a variable so we can store data and reuse it in later lines.';
  }
  if (lower.startsWith('function ')) {
    return 'Defines a function: a reusable block of logic that can run whenever you call it.';
  }
  if (lower.includes('animation:')) {
    return 'Attaches a keyframe animation to this element and defines timing behavior.';
  }

  return 'Sets an important piece of state or styling for this block so later lines can build on it.';
}

function getConceptDetails(codeBlock) {
  const code = (codeBlock || '').toLowerCase();
  const conceptMap = [
    {
      key: 'transform',
      title: 'transform',
      text: 'Changes visual state (move, scale, rotate) without changing document flow.'
    },
    {
      key: 'translate(',
      title: 'translate',
      text: 'Moves an element on x/y axes, usually in pixels.'
    },
    {
      key: 'rotate(',
      title: 'rotate',
      text: 'Rotates an element by degrees.'
    },
    {
      key: 'border-radius',
      title: 'border-radius',
      text: 'Defines how rounded each corner is.'
    },
    {
      key: 'addeventlistener',
      title: 'event listener',
      text: 'Runs code in response to user or browser events.'
    },
    {
      key: 'requestanimationframe',
      title: 'requestAnimationFrame',
      text: 'Runs animation updates in sync with screen refresh.'
    },
    {
      key: 'let ',
      title: 'variables',
      text: 'Store values that can change while the script runs.'
    },
    {
      key: 'const ',
      title: 'constants',
      text: 'Store references that should not be reassigned.'
    },
    {
      key: 'function ',
      title: 'function',
      text: 'Groups logic into reusable named behavior.'
    },
    {
      key: '@keyframes',
      title: 'keyframes',
      text: 'Defines animation states at percentages over time.'
    },
    {
      key: '%',
      title: 'percent steps',
      text: 'Percentages represent positions inside an animation timeline.'
    },
    {
      key: 'delta',
      title: 'delta',
      text: 'Difference between current and previous values (often used for movement).' 
    },
    {
      key: 'progress',
      title: 'progress',
      text: 'Normalized value, often between 0 and 1, to map state transitions.'
    }
  ];

  return conceptMap.filter((concept) => code.includes(concept.key)).slice(0, 4);
}

function inferBlockSummary(codeBlock) {
  const code = (codeBlock || '').toLowerCase();

  if (code.includes('@keyframes')) {
    return 'This block defines the animation timeline: which states happen first, middle, and last.';
  }
  if (code.includes('addeventlistener') || code.includes('requestanimationframe')) {
    return 'This block handles behavior by reading input/state and updating the element over time.';
  }
  if (code.includes('transform') || code.includes('translate(') || code.includes('rotate(')) {
    return 'This block applies visual movement so state values become visible motion on screen.';
  }
  if (code.includes('border-radius') || code.includes('background') || code.includes('box-shadow')) {
    return 'This block builds visual appearance: shape, color, and depth.';
  }

  return 'This block sets up a core piece of the system so the next block can build on it.';
}

function renderConceptBadges(concepts) {
  if (!concepts.length) {
    return '<p class="walkthrough-concept-empty">No new concept here. Focus on how this snippet connects to the previous one.</p>';
  }

  return concepts.map((concept) => `
    <article class="concept-chip-card">
      <h6>${escapeHtml(concept.title)}</h6>
      <p>${escapeHtml(concept.text)}</p>
    </article>
  `).join('');
}

function renderWalkthroughBlocks(stage) {
  const blocks = splitCodeIntoTeachingBlocks(stage.code || '');

  return blocks.map((codeBlock, index) => {
    const lines = codeBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 4);

    const lineItems = lines.map((line) => `
      <li>
        <code>${escapeHtml(line)}</code>
        <p>${escapeHtml(explainLine(line))}</p>
      </li>
    `).join('');

    const concepts = getConceptDetails(codeBlock);
    const blockSummary = inferBlockSummary(codeBlock);

    return `
      <article class="walkthrough-block">
        <header class="walkthrough-head">
          <p>Snippet ${index + 1}</p>
          <span>Understand this first</span>
        </header>

        <div class="lesson-code-block walkthrough-code-block">
          <p>Isolated snippet</p>
          <pre><code>${escapeHtml(codeBlock)}</code></pre>
        </div>

        <div class="walkthrough-grid">
          <section class="walkthrough-lines">
            <h6>Important lines</h6>
            <ol>
              ${lineItems}
            </ol>
          </section>

          <section class="walkthrough-concepts">
            <h6>Concepts and syntax</h6>
            <div class="concept-chip-grid">
              ${renderConceptBadges(concepts)}
            </div>
          </section>
        </div>

        <section class="walkthrough-summary">
          <h6>What this block does</h6>
          <p>${escapeHtml(blockSummary)}</p>
        </section>
      </article>
    `;
  }).join('');
}

function renderStageModules(stages) {
  return stages.map((stage, index) => {
    const stageNotes = renderCodeNotes(stage.notes || []);
    const showConnector = index < stages.length - 1;

    return `
      <article class="lesson-stage-module stage-${escapeHtml(stage.key)}">
        <header class="stage-header">
          <p class="stage-step-label">Step ${index + 1}</p>
          <h4>${escapeHtml(stage.title)}</h4>
        </header>

        <p class="stage-summary">${escapeHtml(stage.summary)}</p>

        <div class="stage-card-grid">
          ${renderStageCards(stage.cards || [])}
        </div>

        <div class="lesson-code-block stage-code-block">
          <p>${escapeHtml(stage.codeLabel || 'Code')}</p>
          <pre><code>${escapeHtml(stage.code || '')}</code></pre>
        </div>

        <section class="stage-walkthrough">
          <header class="stage-walkthrough-head">
            <h5>Guided code walkthrough</h5>
            <p>One piece at a time: snippet, line meaning, concept, and result.</p>
          </header>
          <div class="walkthrough-stack">
            ${renderWalkthroughBlocks(stage)}
          </div>
        </section>

        <div class="stage-notes-wrap">
          <div>
            <p class="stage-notes-label">Key takeaway</p>
            <ol class="lesson-steps">
              ${stageNotes}
            </ol>
          </div>
          <div class="stage-recap-box">
            <h5>Mini recap</h5>
            <p>${escapeHtml(stage.recap || '')}</p>
          </div>
        </div>
      </article>
      ${showConnector ? '<div class="stage-connector" aria-hidden="true">↓</div>' : ''}
    `;
  }).join('');
}

function createHintPanel(lesson) {
  const course = LESSON_COURSE_SECTIONS[lesson.id] || LESSON_COURSE_SECTIONS[Number(lesson.id)] || null;
  const panel = document.createElement('section');
  panel.className = `lesson-panel lesson-panel-${lesson.accent} lesson-guide-panel`;
  panel.hidden = true;

  const detail = course || {
    title: lesson.name,
    summary: 'Follow the structured flow: visuals first, behavior second, and final integration last.',
    stages: [
      {
        key: 'visuals',
        title: 'Visuals',
        summary: 'Build the static visual structure.',
        cards: [{ title: 'Layout', text: 'Define shape, spacing, and appearance.' }],
        codeLabel: 'Visual code',
        code: lesson.reference.css || '',
        notes: ['Appearance only in this stage.'],
        recap: 'Visual structure complete.'
      },
      {
        key: 'animation',
        title: 'Animation / Interaction',
        summary: 'Add logic that controls movement and behavior.',
        cards: [{ title: 'Logic', text: 'Add timing, events, and transforms.' }],
        codeLabel: 'Logic code',
        code: lesson.hint && lesson.hint.code ? lesson.hint.code : '',
        notes: ['Behavior only in this stage.'],
        recap: 'Motion logic complete.'
      },
      {
        key: 'combination',
        title: 'Combination',
        summary: 'Connect visual and behavior systems.',
        cards: [{ title: 'Integration', text: 'Wire visuals and logic into one final effect.' }],
        codeLabel: 'Combined code',
        code: lesson.html || '',
        notes: ['Integrate both systems.'],
        recap: 'System fully connected.'
      }
    ]
  };

  panel.innerHTML = `
    <div class="lesson-panel-head">
      <div>
        <p class="lesson-panel-kicker">Structured learning path</p>
        <h3>${escapeHtml(detail.title)}</h3>
      </div>
      <span class="lesson-panel-chip">${escapeHtml(lesson.name)}</span>
    </div>

    <p class="lesson-panel-summary">${escapeHtml(detail.summary)}</p>

    <div class="stage-progress-rail" aria-hidden="true">
      <span>Visuals</span>
      <span>Animation / Interaction</span>
      <span>Combination</span>
    </div>

    <div class="lesson-stage-stack">
      ${renderStageModules(detail.stages || [])}
    </div>
`;
  
  return panel;
}

function createReferencePanel(lesson) {
  const panel = document.createElement('section');
  panel.className = `lesson-panel lesson-panel-${lesson.accent} lesson-reference-panel`;
  panel.hidden = true;
  const originalCss = lesson.css || lesson.reference?.css || '';
  const originalHtml = lesson.html || lesson.reference?.html || '';
  panel.innerHTML = `
    <div class="lesson-panel-head">
      <div>
        <p class="lesson-panel-kicker">Original code</p>
        <h3>Reference code</h3>
      </div>
      <span class="lesson-panel-chip">${escapeHtml(lesson.name)}</span>
    </div>
    <div class="lesson-code-grid">
      <div class="lesson-code-block">
        <p>styles.css</p>
        <pre><code>${escapeHtml(originalCss)}</code></pre>
      </div>
      <div class="lesson-code-block">
        <p>index.html</p>
        <pre><code>${escapeHtml(originalHtml)}</code></pre>
      </div>
    </div>
  `;
  return panel;
}

function createLessonStartSpotlight(lessonElement, hintButton, lesson) {
  const spotlight = document.createElement('section');
  spotlight.className = 'lesson-start-spotlight card';

  const sourceTitle = lessonElement.querySelector('.lesson-sidebar .lesson-title');
  const lessonLabel = sourceTitle?.textContent?.trim() || `Lesson ${lesson.id}`;

  const text = document.createElement('div');
  text.className = 'lesson-start-copy';
  text.innerHTML = `
    <div class="lesson-start-meta">
      <p class="lesson-start-kicker">Start here first</p>
      <span class="lesson-start-lesson-chip">${escapeHtml(lessonLabel)}</span>
    </div>
    <h3>Start Learning Path Before Coding</h3>
    <p>Open the guided path first. You will understand the structure and logic in small steps before you edit code.</p>
  `;

  const ctaColumn = document.createElement('div');
  ctaColumn.className = 'lesson-start-cta';

  hintButton.classList.add('lesson-start-btn');
  ctaColumn.append(hintButton);

  spotlight.append(text, ctaColumn);
  return spotlight;
}

function createLessonVisualReferencePanel(lessonElement) {
  const panel = document.createElement('section');
  panel.className = 'lesson-visual-reference-card card';

  const sourceLabel = lessonElement.querySelector('.lesson-sidebar .sidebar-label');
  const sourceVisual = lessonElement.querySelector('.lesson-sidebar .visual-card');

  const labelText = sourceLabel ? sourceLabel.textContent.trim() : 'Visual reference';
  const visualClone = sourceVisual ? sourceVisual.cloneNode(true) : document.createElement('div');

  if (!sourceVisual) {
    visualClone.className = 'visual-card';
  }

  panel.innerHTML = `<p class="sidebar-label">${escapeHtml(labelText)}</p>`;
  panel.append(visualClone);

  if (sourceLabel) sourceLabel.style.display = 'none';
  if (sourceVisual) sourceVisual.style.display = 'none';

  return panel;
}

function setButtonState(button, isActive, activeLabel, inactiveLabel) {
  button.classList.toggle('is-active', isActive);
  button.setAttribute('aria-expanded', String(isActive));
  button.innerHTML = isActive ? activeLabel : inactiveLabel;
}

function initLesson(lessonElement) {
  const lessonId = Number(lessonElement.dataset.lessonId);
  const lesson = LESSON_DATA[lessonId];
  if (!lesson) return;
  lesson.id = lessonId;

  const tabs = lessonElement.querySelectorAll('.tab');
  const panes = lessonElement.querySelectorAll('.code-pane');
  const cssPane = lessonElement.querySelector('[data-pane="css"]');
  const htmlPane = lessonElement.querySelector('[data-pane="html"]');
  const iframe = lessonElement.querySelector('iframe');
  const lessonMain = lessonElement.querySelector('.lesson-main');
  const hintButton = lessonElement.querySelector('.hint');
  const originalButton = lessonElement.querySelector('.btn-outline');

  const hintPanel = createHintPanel(lesson);
  const referencePanel = createReferencePanel(lesson);

  const lessonSidebar = lessonElement.querySelector('.lesson-sidebar');
  const editorShell = lessonMain.querySelector('.editor-shell');
  const previewShell = lessonMain.querySelector('.preview-shell');
  const topRow = document.createElement('div');
  const bottomRow = document.createElement('div');
  topRow.className = 'lesson-top-row';
  bottomRow.className = 'lesson-bottom-row';

  const visualReferencePanel = createLessonVisualReferencePanel(lessonElement);
  const startSpotlight = createLessonStartSpotlight(lessonElement, hintButton, lesson);

  // Stack startSpotlight above visual reference inside the top row
  const topInner = document.createElement('div');
  topInner.className = 'lesson-top-inner';
  topInner.append(startSpotlight, visualReferencePanel);
  topRow.append(topInner);
  lessonMain.insertBefore(topRow, editorShell);

  lessonMain.insertBefore(hintPanel, editorShell);
  lessonMain.insertBefore(referencePanel, previewShell);

  lessonMain.insertBefore(bottomRow, editorShell);
  bottomRow.append(editorShell, previewShell);

  const cssStarter = '/* write your code here */';
  const htmlStarter = '<!-- write your code here -->';

  cssPane.value = cssStarter;
  htmlPane.value = htmlStarter;
  iframe.srcdoc = buildPreview(cssPane.value, htmlPane.value);

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      tabs.forEach((btn) => btn.classList.remove('active'));
      tab.classList.add('active');
      panes.forEach((pane) => {
        const paneName = pane.dataset.pane;
        pane.classList.toggle('hidden', paneName !== tabName);
      });
    });
  });

  setButtonState(hintButton, false, 'Hide Learning Path', 'Start Learning Path');

  hintButton.addEventListener('click', () => {
    const isOpen = !hintPanel.hidden;
    hintPanel.hidden = isOpen;
    setButtonState(hintButton, !isOpen, 'Hide Learning Path', 'Start Learning Path');
    if (!isOpen) hintPanel.classList.add('is-visible');
  });

  originalButton.addEventListener('click', () => {
    const isOpen = !referencePanel.hidden;
    referencePanel.hidden = isOpen;
    setButtonState(originalButton, !isOpen, 'Hide original code', 'View original code');
    if (!isOpen) referencePanel.classList.add('is-visible');
  });

  lessonElement.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    if (action === 'run') {
      iframe.srcdoc = buildPreview(cssPane.value, htmlPane.value);
    }
    if (action === 'reset') {
      cssPane.value = cssStarter;
      htmlPane.value = htmlStarter;
      iframe.srcdoc = buildPreview(cssPane.value, htmlPane.value);
      hintPanel.hidden = true;
      referencePanel.hidden = true;
      setButtonState(hintButton, false, 'Hide Learning Path', 'Start Learning Path');
      setButtonState(originalButton, false, 'Hide original code', 'View original code');
      tabs.forEach((btn) => btn.classList.remove('active'));
      tabs[0].classList.add('active');
      panes.forEach((pane) => {
        pane.classList.toggle('hidden', pane.dataset.pane !== 'css');
      });
    }
  });
}

function initScrollReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = Array.from(document.body.querySelectorAll('*')).filter((element) => {
    return !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName);
  });

  targets.forEach((element, index) => {
    element.classList.add('reveal-item');
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 45}ms`;
  });

  if (reduceMotion) {
    targets.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  function checkScrollAnimations() {
    const viewportTop = window.scrollY;
    const viewportBottom = window.scrollY + window.innerHeight;

    targets.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elTopAbs = window.scrollY + rect.top;
      const elBottomAbs = elTopAbs + rect.height;
      let triggerRatio = 0.5;
      if (rect.height > 400) {
        triggerRatio = 0.33;
      } else if (rect.height < 200) {
        triggerRatio = 0.67;
      }

      const elTriggerPoint = elTopAbs + rect.height * triggerRatio;
      const isInViewport = elBottomAbs > viewportTop && elTopAbs < viewportBottom;

      if (isInViewport || (elTriggerPoint < viewportBottom && elTriggerPoint > viewportTop)) {
        if (!element.classList.contains('is-visible')) {
          element.classList.add('is-visible');
          element.style.transition = '';
        }
      } else if (element.classList.contains('is-visible') && elTopAbs > viewportBottom) {
        element.classList.remove('is-visible');
        element.style.transition = 'none';
        void element.offsetWidth;
        element.style.transition = '';
      }
    });
  }

  checkScrollAnimations();
  window.addEventListener('scroll', checkScrollAnimations, { passive: true });
  window.addEventListener('resize', checkScrollAnimations);
  window.triggerScrollAnimations = checkScrollAnimations;
}

function initVisualReferenceFollow() {
  document.querySelectorAll('.lesson[data-lesson-id="3"] .lesson-visual-reference-card .visual-card').forEach((card) => {
    const mover = card.querySelector('.visual-mover');
    const dot = card.querySelector('.pulse-dot');
    if (!mover || !dot) return;
    const cursor = mover;

    let rect = card.getBoundingClientRect();
    let dotRect = dot.getBoundingClientRect();
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    const updateRects = () => {
      rect = card.getBoundingClientRect();
      dotRect = dot.getBoundingClientRect();
    };

    card.addEventListener('mousemove', (e) => {
      updateRects();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // center-based coordinates
      const targetX = x - rect.width / 2;
      const targetY = y - rect.height / 2;
      // limit movement so the dot stays inside the card
      const maxX = Math.max(0, (rect.width - dotRect.width) / 2);
      const maxY = Math.max(0, (rect.height - dotRect.height) / 2);
      mouseX = Math.max(-maxX, Math.min(maxX, targetX));
      mouseY = Math.max(-maxY, Math.min(maxY, targetY));
    });

    card.addEventListener('mouseleave', () => {
      mouseX = 0;
      mouseY = 0;
    });

    function animate() {
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      cursor.style.transform = "translate(" + currentX + "px, " + currentY + "px)";
      requestAnimationFrame(animate);
    }
    animate();
  });
}

function initVisualMorphOnScroll() {
  // Apply scroll-driven morph only to lesson 4 visual reference
  document.querySelectorAll('.lesson[data-lesson-id="4"] .lesson-visual-reference-card .visual-card').forEach((card) => {
    const cube = card.querySelector('.morph-shape');
    if (!cube) return;

    // disable keyframe animation so we control morph via scroll
    cube.style.animation = 'none';
    cube.style.transition = 'border-radius 120ms linear, transform 120ms linear';

    let lastScroll = window.scrollY;
    let rotation = 0;

    function onScroll() {
      const currentScroll = window.scrollY;
      const delta = currentScroll - lastScroll;

      // control sensitivity
      rotation += delta * 0.5;

      // normalize 0..1
      const progress = (((rotation % 360) + 360) % 360) / 360;

      // morph between 2px -> 50% -> 2px (same mapping as keyframes)
      let radius;
      if (progress < 0.5) {
        radius = 2 + (progress * 2) * (50 - 2);
      } else {
        radius = 50 - ((progress - 0.5) * 2) * (50 - 2);
      }

      cube.style.borderRadius = radius > 10 ? radius + '%' : radius + 'px';
      cube.style.transform = `rotate(${rotation}deg)`;

      lastScroll = currentScroll;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  });
}

function initThemeSwitcher() {
  const htmlElement = document.documentElement;
  
  // Get saved theme from localStorage or default to 'dark'
  const savedTheme = safeStorage.get('theme') || 'dark';
  htmlElement.setAttribute('data-theme', savedTheme);
  
  // Handle radio button inputs (old method)
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  themeRadios.forEach(radio => {
    if (radio.value === savedTheme) {
      radio.checked = true;
    }
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        const theme = e.target.value;
        htmlElement.setAttribute('data-theme', theme);
        safeStorage.set('theme', theme);
      }
    });
  });
  
  // Handle button-based theme selector (new method)
  const themeButtons = document.querySelectorAll('.theme-option[data-theme]');
  themeButtons.forEach(btn => {
    if (btn.dataset.theme === savedTheme) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      htmlElement.setAttribute('data-theme', theme);
      safeStorage.set('theme', theme);
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

const AVATAR_STORAGE_KEY = 'profileAvatar';

function applyStoredAvatar() {
  const storedAvatar = safeStorage.get(AVATAR_STORAGE_KEY);
  const avatars = document.querySelectorAll('.avatar');

  avatars.forEach((avatar) => {
    if (storedAvatar) {
      avatar.style.backgroundImage = `url(${storedAvatar})`;
      avatar.style.backgroundSize = 'cover';
      avatar.style.backgroundPosition = 'center';
    } else {
      avatar.style.backgroundImage = '';
      avatar.style.backgroundSize = '';
      avatar.style.backgroundPosition = '';
    }
  });

  const avatarImg = document.getElementById('avatarPreview');
  const avatarPlaceholder = document.getElementById('avatarPlaceholder');
  if (avatarImg && avatarPlaceholder) {
    if (storedAvatar) {
      avatarImg.src = storedAvatar;
      avatarImg.style.display = 'block';
      avatarPlaceholder.style.display = 'none';
    } else {
      avatarImg.src = '';
      avatarImg.style.display = 'none';
      avatarPlaceholder.style.display = 'block';
    }
  }
}

function setActiveNavLink() {
  const navLinks = document.querySelectorAll('.app-nav a[href]');
  if (!navLinks.length) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    if (href === currentPath) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function initMobileMenu() {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const navMenu = document.querySelector('[data-nav-menu]');
  if (!menuToggle || !navMenu) return;

  const htmlElement = document.documentElement;
  const bodyElement = document.body;
  const linkSelector = 'a[href]';
  let scrollPosition = 0;
  let previousScrollBehavior = '';
  let scrollLockActive = false;

  const getScrollY = () => {
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  };

  const preventScroll = (event) => {
    if (!scrollLockActive) return;
    event.preventDefault();
  };

  const preventScrollKeys = (event) => {
    if (!scrollLockActive) return;
    const blockedKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    if (blockedKeys.includes(event.key)) {
      event.preventDefault();
    }
  };

  const enableScrollLock = () => {
    if (scrollLockActive) return;
    scrollLockActive = true;
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('keydown', preventScrollKeys);
  };

  const disableScrollLock = () => {
    if (!scrollLockActive) return;
    scrollLockActive = false;
    document.removeEventListener('wheel', preventScroll, { passive: false });
    document.removeEventListener('touchmove', preventScroll, { passive: false });
    document.removeEventListener('keydown', preventScrollKeys);
  };

  const setMenuState = (isOpen) => {
    if (isOpen) {
      scrollPosition = getScrollY();
      previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      document.documentElement.style.setProperty('--scroll-y', `-${scrollPosition}px`);
      enableScrollLock();
    } else {
      document.documentElement.style.removeProperty('--scroll-y');
      disableScrollLock();
      const restoreScroll = () => window.scrollTo(0, scrollPosition);
      requestAnimationFrame(restoreScroll);
      if (previousScrollBehavior) {
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      } else {
        document.documentElement.style.scrollBehavior = '';
      }
    }
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    navMenu.classList.toggle('is-open', isOpen);
    htmlElement.classList.toggle('menu-open', isOpen);
    bodyElement.classList.toggle('menu-open', isOpen);
  };

  const toggleMenu = () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      navMenu.classList.add('no-anim');
      setMenuState(false);
      requestAnimationFrame(() => {
        navMenu.classList.remove('no-anim');
      });
      return;
    }
    navMenu.classList.add('menu-anim');
    setMenuState(true);
  };

  menuToggle.addEventListener('click', toggleMenu);

  navMenu.addEventListener('click', (event) => {
    const targetLink = event.target.closest(linkSelector);
    if (targetLink) {
      navMenu.classList.add('menu-anim');
      setMenuState(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      navMenu.classList.add('menu-anim');
      setMenuState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      setMenuState(false);
    }
  });

  setMenuState(false);
}

function initSettingsPage() {
  // Render subscription card
  SubscriptionManager.renderSubscriptionCard();

  applyStoredAvatar();

  const storedSettings = safeStorage.get('userSettings');
  if (storedSettings) {
    try {
      const { fullName, email, bio } = JSON.parse(storedSettings);
      const fullNameInput = document.getElementById('fullName');
      const emailInput = document.getElementById('emailAddress');
      const bioInput = document.getElementById('professionalBio');

      if (fullNameInput && typeof fullName === 'string') fullNameInput.value = fullName;
      if (emailInput && typeof email === 'string') emailInput.value = email;
      if (bioInput && typeof bio === 'string') bioInput.value = bio;
    } catch (error) {
      safeStorage.remove('userSettings');
    }
  }
  
  // Handle profile picture upload
  const uploadBtn = document.getElementById('uploadPictureBtn');
  const fileInput = document.getElementById('profilePictureInput');
  const avatarImg = document.getElementById('avatarPreview');
  const avatarPlaceholder = document.getElementById('avatarPlaceholder');
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          safeStorage.set(AVATAR_STORAGE_KEY, event.target.result);
          applyStoredAvatar();
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Handle Save Changes button
  const saveBtn = Array.from(document.querySelectorAll('.settings-actions .btn')).find(
    btn => btn.textContent.includes('Save')
  );
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const fullName = document.getElementById('fullName')?.value || '';
      const email = document.getElementById('emailAddress')?.value || '';
      const bio = document.getElementById('professionalBio')?.value || '';
      
      // Store in localStorage for now
      safeStorage.set('userSettings', JSON.stringify({
        fullName,
        email,
        bio
      }));
      
      alert('Settings saved!');
    });
  }
  
  // Handle Reset Defaults button
  const resetBtn = Array.from(document.querySelectorAll('.settings-actions .btn')).find(
    btn => btn.textContent.includes('Reset')
  );
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all settings to defaults?')) {
        document.getElementById('fullName').value = '';
        document.getElementById('emailAddress').value = '';
        document.getElementById('professionalBio').value = '';
        safeStorage.remove('userSettings');
        safeStorage.remove(AVATAR_STORAGE_KEY);
        applyStoredAvatar();
      }
    });
  }
  
  // Payment Modal Handlers
  const paymentModal = document.getElementById('paymentModal');
  const jitterLockedModal = document.getElementById('jitterLockedModal');
  const closePaymentBtn = document.getElementById('closeModal');
  const cancelPaymentBtn = document.getElementById('cancelPayment');
  const payButton = document.getElementById('payButton');
  const closeLocked = document.getElementById('closeLocked');
  const buyFromLocked = document.getElementById('buyFromLocked');
  
  if (closePaymentBtn) {
    closePaymentBtn.addEventListener('click', () => SubscriptionManager.hidePaymentModal());
  }
  
  if (cancelPaymentBtn) {
    cancelPaymentBtn.addEventListener('click', () => SubscriptionManager.hidePaymentModal());
  }
  
  if (payButton) {
    payButton.addEventListener('click', () => SubscriptionManager.processPayment());
  }
  
  if (closeLocked) {
    closeLocked.addEventListener('click', () => {
      if (jitterLockedModal) jitterLockedModal.style.display = 'none';
    });
  }
  
  if (buyFromLocked) {
    buyFromLocked.addEventListener('click', () => {
      if (jitterLockedModal) jitterLockedModal.style.display = 'none';
      SubscriptionManager.showPaymentModal();
    });
  }
  
  // Close modals when clicking overlay
  const modals = [paymentModal, jitterLockedModal];
  modals.forEach(modal => {
    if (modal) {
      const overlay = modal.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => {
          modal.style.display = 'none';
        });
      }
    }
  });
  
  // Add onclick handler to Jitter track for locking
  const jitterLink = document.querySelector('a[href*="lessonsJitter"]');
  if (jitterLink && !SubscriptionManager.hasProAccess()) {
    jitterLink.addEventListener('click', (e) => {
      // Allow navigation on home page, but block on settings
      if (window.location.pathname.includes('settings')) {
        e.preventDefault();
        if (jitterLockedModal) {
          jitterLockedModal.style.display = 'flex';
        }
      }
    });
  }
}

initThemeSwitcher();
applyStoredAvatar();
setActiveNavLink();
initMobileMenu();
initSettingsPage();
document.querySelectorAll('.lesson').forEach(initLesson);
initVisualReferenceFollow();
initVisualMorphOnScroll();
initScrollReveal();

// Handle Jitter track click on home page
function handleJitterClick(event) {
  const hasProAccess = SubscriptionManager.hasProAccess();
  const isLessonUnlocked = LessonProgression.isLessonUnlocked(5);
  
  if (!isLessonUnlocked) {
    event.preventDefault();
    alert('Complete JavaScript lessons first!');
  } else if (!hasProAccess) {
    event.preventDefault();
    const jitterLockedModal = document.getElementById('jitterLockedModal');
    if (jitterLockedModal) {
      jitterLockedModal.style.display = 'flex';
    }
  }
}

function initHomePageModals() {
  const jitterLockedModal = document.getElementById('jitterLockedModal');
  const closeLocked = document.getElementById('closeLocked');
  const buyFromLocked = document.getElementById('buyFromLocked');
  
  if (closeLocked) {
    closeLocked.addEventListener('click', () => {
      if (jitterLockedModal) jitterLockedModal.style.display = 'none';
    });
  }
  
  if (buyFromLocked) {
    buyFromLocked.addEventListener('click', () => {
      if (jitterLockedModal) jitterLockedModal.style.display = 'none';
      SubscriptionManager.showPaymentModal();
    });
  }
  
  // Close modal when clicking overlay
  if (jitterLockedModal) {
    const overlay = jitterLockedModal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        jitterLockedModal.style.display = 'none';
      });
    }
  }
}

function initHomePagePaymentModal() {
  // Add payment modal to home page if it doesn't exist
  if (!document.getElementById('paymentModal')) {
    const paymentModalHTML = `
    <div id="paymentModal" class="modal" style="display: none;">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Upgrade to Architect Pro</h2>
          <button type="button" class="modal-close" id="closeModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="plan-details">
            <h3>Architect Pro</h3>
            <p class="plan-description">Full access to precision tools, jitter animations, and private architectural repositories.</p>
            
            <div class="plan-features">
              <div class="feature-item">✓ CSS Animations (Lessons 1-2)</div>
              <div class="feature-item">✓ JavaScript Animations (Lessons 3-4)</div>
              <div class="feature-item">✓ Jitter Animations (Lessons 5-6)</div>
              <div class="feature-item">✓ Full course access</div>
            </div>
            
            <div class="price-display">
              <span class="price">$49</span>
              <span class="billing-period">/month (one-time demo charge)</span>
            </div>
          </div>
          
          <form id="paymentForm" class="payment-form">
            <div class="form-group">
              <label for="cardName">Cardholder Name</label>
              <input type="text" id="cardName" placeholder="Alexander Shimmer" required />
            </div>
            
            <div class="form-group">
              <label for="cardNumber">Card Number</label>
              <input type="text" id="cardNumber" placeholder="4532 1234 5678 9010" required />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="expiryDate">Expiry Date</label>
                <input type="text" id="expiryDate" placeholder="MM/YY" required />
              </div>
              <div class="form-group">
                <label for="cvv">CVV</label>
                <input type="text" id="cvv" placeholder="123" required />
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="cancelPayment">Cancel</button>
          <button type="button" class="btn btn-run-cyan" id="payButton" style="min-width: 180px;">
            <span id="payButtonText">Pay $49</span>
            <span id="paymentLoader" style="display: none; margin-left: 8px;">⏳</span>
          </button>
        </div>
      </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', paymentModalHTML);
    
    const closePaymentBtn = document.getElementById('closeModal');
    const cancelPaymentBtn = document.getElementById('cancelPayment');
    const payButton = document.getElementById('payButton');
    
    if (closePaymentBtn) {
      closePaymentBtn.addEventListener('click', () => SubscriptionManager.hidePaymentModal());
    }
    
    if (cancelPaymentBtn) {
      cancelPaymentBtn.addEventListener('click', () => SubscriptionManager.hidePaymentModal());
    }
    
    if (payButton) {
      payButton.addEventListener('click', () => SubscriptionManager.processPayment());
    }
    
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
      const overlay = paymentModal.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => {
          paymentModal.style.display = 'none';
        });
      }
    }
  }
}

initHomePageModals();
initHomePagePaymentModal();

// Check if user is on Jitter lesson without Pro access
function checkJitterAccess() {
  const isJitterPage = document.body.classList.contains('page-lessons-jitter');
  const hasProAccess = SubscriptionManager.hasProAccess();
  
  if (isJitterPage && !hasProAccess) {
    const jitterLockedModal = document.getElementById('jitterLockedModal');
    if (jitterLockedModal) {
      // Setup modal handlers
      const closeLocked = jitterLockedModal.querySelector('#closeLocked');
      const buyFromLocked = jitterLockedModal.querySelector('#buyFromLocked');
      
      if (closeLocked) {
        closeLocked.addEventListener('click', () => {
          jitterLockedModal.style.display = 'none';
        });
      }
      
      if (buyFromLocked) {
        buyFromLocked.addEventListener('click', () => {
          jitterLockedModal.style.display = 'none';
          SubscriptionManager.showPaymentModal();
        });
      }
      
      jitterLockedModal.style.display = 'flex';
    }
  }
}

checkJitterAccess();



// Update progression UI on page load
LessonProgression.updateProgressionUI();
