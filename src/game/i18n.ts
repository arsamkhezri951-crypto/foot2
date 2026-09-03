export type Lang = 'en' | 'fa';

export const LANG_KEY = 'magic-football:lang';
export const MUTE_KEY = 'magic-football:muted';

export interface HelpItem {
  title: string;
  body: string;
}

export interface Dict {
  dir: 'ltr' | 'rtl';
  /* menu */
  demoBadge: string;
  kicker: string;
  subtitleA: string;
  subtitleB: string;
  play: string;
  help: string;
  about: string;
  soundOn: string;
  soundOff: string;
  guide1: string;
  guide2: string;
  camNote: string;
  /* hud */
  blue: string;
  white: string;
  kickoff: string;
  goal: string;
  blueScores: string;
  whiteScores: string;
  paused: string;
  resume: string;
  restart: string;
  mainMenu: string;
  fullTime: string;
  win: string;
  lose: string;
  draw: string;
  stGoals: string;
  stShots: string;
  stPasses: string;
  stSaves: string;
  playAgain: string;
  menuBtn: string;
  shoot: string;
  pass: string;
  cross: string;
  dribble: string;
  close: string;
  /* aria */
  ariaPause: string;
  ariaSound: string;
  ariaShoot: string;
  ariaPass: string;
  ariaCross: string;
  ariaDribble: string;
  ariaLanguage: string;
  /* help */
  helpTitle: string;
  howto: string;
  menus: string;
  helpHowto: HelpItem[];
  helpMenus: HelpItem[];
  /* about */
  aboutTitle: string;
  aboutName: string;
  aboutClass: string;
  aboutContact: string;
  /* publish */
  publish: string;
  publishTitle: string;
  publishIntro: string;
  publishSteps: HelpItem[];
  publishCmdsTitle: string;
  publishCopy: string;
  publishCopied: string;
  ariaPublish: string;
  /* orientation */
  rotateTitle: string;
  rotateText: string;
  rotateContinue: string;
}

export const STR: Record<Lang, Dict> = {
  /* ================================ ENGLISH ================================ */
  en: {
    dir: 'ltr',
    demoBadge: 'LIVE MATCH ON THE PITCH',
    kicker: '3D ARCADE FOOTBALL',
    subtitleA:
      'A broadcast-style 3D camera glides after the ball across a big, floodlit stadium.',
    subtitleB: '3 minutes · Two keepers · Easy to score',
    play: 'PLAY',
    help: 'Help',
    about: 'About',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Off',
    guide1:
      'W A S D / joystick — move · SPACE — shoot (hold = power) · V — dribble',
    guide2: 'X pass · C cross · P pause · nearest blue player is auto-selected',
    camNote:
      '3D follow camera · BLUE attacks right · WHITE attacks left',
    blue: 'BLUE',
    white: 'WHITE',
    kickoff: 'KICK OFF',
    goal: 'GOAL!',
    blueScores: 'BLUE TEAM SCORES',
    whiteScores: 'WHITE TEAM SCORES',
    paused: 'PAUSED',
    resume: 'RESUME',
    restart: 'RESTART MATCH',
    mainMenu: 'MAIN MENU',
    fullTime: 'FULL TIME',
    win: 'YOU WIN!',
    lose: 'DEFEAT',
    draw: 'DRAW',
    stGoals: 'Goals',
    stShots: 'Shots',
    stPasses: 'Passes',
    stSaves: 'Saves faced',
    playAgain: 'PLAY AGAIN',
    menuBtn: 'MENU',
    shoot: 'SHOOT',
    pass: 'PASS',
    cross: 'CROSS',
    dribble: 'DRIBBLE',
    close: 'Close',
    ariaPause: 'Pause',
    ariaSound: 'Toggle sound',
    ariaShoot: 'Shoot — hold for power',
    ariaPass: 'Pass',
    ariaCross: 'Cross',
    ariaDribble: 'Dribble burst',
    ariaLanguage: 'Change language',
    helpTitle: 'Game Guide',
    howto: 'How to Play',
    menus: 'Menu Guide',
    helpHowto: [
      {
        title: 'About the game',
        body: 'MAGIC FOOTBALL is a fast 3D arcade match: 2 vs 2 plus two goalkeepers under the floodlights, with a broadcast camera that follows the ball.',
      },
      {
        title: 'Objective',
        body: 'Score more goals than the WHITE team before the 3-minute clock ends. The game is tuned to be easy and fun — you have a strong chance to win.',
      },
      {
        title: 'Starting a match',
        body: 'Press PLAY on the main menu. Players take their places, then the referee whistle kicks off the match.',
      },
      {
        title: 'Movement',
        body: 'Use the joystick (bottom-left) or W A S D / arrow keys. The player accelerates, turns and stops smoothly; the camera glides along with the action.',
      },
      {
        title: 'Shooting',
        body: 'Tap SHOOT for a normal shot at goal. Hold SHOOT to charge a powerful strike — the colored ring around your player shows the power.',
      },
      {
        title: 'Passing',
        body: 'PASS sends the ball straight to your teammate automatically — no aiming needed.',
      },
      {
        title: 'Crossing',
        body: 'CROSS floats a high ball into the opponent penalty area. A glowing marker shows where the ball will land.',
      },
      {
        title: 'Dribbling',
        body: 'DRIBBLE gives a quick burst of speed while the ball stays glued to your feet — perfect for slipping past an opponent. Short cooldown.',
      },
      {
        title: 'Defense',
        body: 'Run into the opponent who has the ball to tackle it away. Your teammate and your goalkeeper also defend automatically.',
      },
      {
        title: 'Player switching',
        body: 'The blue player closest to the ball is auto-selected — marked with an arrow and a glowing ring.',
      },
      {
        title: 'Pause & Restart',
        body: 'Press P or the pause button (top-right). From the pause screen you can Resume, Restart the match, or return to the Main Menu.',
      },
      {
        title: 'Score & Timer',
        body: 'The top scoreboard shows BLUE — WHITE and the remaining time. After full time, the result and your stats (goals, shots, passes, saves) appear.',
      },
    ],
    helpMenus: [
      { title: 'PLAY', body: 'Starts a new match immediately.' },
      {
        title: 'Help',
        body: 'Opens this window with two clear sections: How to Play and Menu Guide.',
      },
      {
        title: 'About the Developer',
        body: 'Shows who made the game and the teacher contact number.',
      },
      {
        title: 'Language',
        body: 'Switches between English and فارسی. Your choice is saved in the browser and kept after refresh.',
      },
      {
        title: 'Sound & Music',
        body: 'The speaker button (main menu and in-game) turns all sound effects and crowd audio on or off. The setting is saved.',
      },
      {
        title: 'Publish',
        body: 'Opens a short step-by-step guide (with copyable commands) for putting the game online free on GitHub Pages.',
      },
      {
        title: 'In-game buttons',
        body: 'Joystick at bottom-left · SHOOT / PASS / CROSS / DRIBBLE at bottom-right · pause and sound at top-right.',
      },
    ],
    aboutTitle: 'About the Developer',
    aboutName: 'Arsam, 11 years old, from Dubai',
    aboutClass: "Student in Dr. Aghaei's class",
    aboutContact: 'Teacher Contact:',
    publish: 'Publish',
    publishTitle: 'Publish the Game',
    publishIntro:
      'This game is 100% static (HTML + JS + CSS), so you can host it online for free on GitHub Pages in a few minutes.',
    publishSteps: [
      {
        title: 'Create a repository',
        body: 'On github.com, create a new empty repository (for example: magic-football).',
      },
      {
        title: 'Upload the code',
        body: 'Push the project folder to the repository — with Git, GitHub Desktop, or the “Upload files” button on GitHub.',
      },
      {
        title: 'Build the project',
        body: 'Run the build command. A dist folder containing the final game will be created.',
      },
      {
        title: 'Deploy the dist folder',
        body: 'Publish the dist folder to the gh-pages branch. The easiest way is the gh-pages tool command below.',
      },
      {
        title: 'Enable GitHub Pages',
        body: 'In the repository: Settings → Pages → set “Source” to the gh-pages branch. A few minutes later your game link is live!',
      },
    ],
    publishCmdsTitle: 'Commands',
    publishCopy: 'Copy',
    publishCopied: 'Copied!',
    ariaPublish: 'How to publish the game',
    rotateTitle: 'Rotate your phone',
    rotateText:
      'MAGIC FOOTBALL plays best in landscape — turn your phone sideways for the full 3D stadium view.',
    rotateContinue: 'Play anyway',
  },

  /* ================================ فارسی ================================ */
  fa: {
    dir: 'rtl',
    demoBadge: 'مسابقه زنده روی زمین',
    kicker: 'فوتبال سه‌بعدی آرکید',
    subtitleA:
      'دوربین تلویزیونی سه‌بعدی همراه با توپ در یک ورزشگاه بزرگ و پرنور حرکت می‌کند.',
    subtitleB: '۳ دقیقه · دو دروازه‌بان · گل‌زدن آسان',
    play: 'شروع بازی',
    help: 'راهنما',
    about: 'درباره سازنده',
    soundOn: 'صدا: روشن',
    soundOff: 'صدا: خاموش',
    guide1:
      'کلیدهای W A S D / جوی‌استیک — حرکت · SPACE — شوت (نگه‌داشتن = قدرت) · V — دریبل',
    guide2: 'X پاس · C سانتر · P توقف · نزدیک‌ترین بازیکن آبی خودکار انتخاب می‌شود',
    camNote: 'دوربین سه‌بعدی دنبال‌کننده · تیم آبی به سمت راست حمله می‌کند · تیم سفید به سمت چپ',
    blue: 'آبی',
    white: 'سفید',
    kickoff: 'شروع مسابقه',
    goal: 'گل!',
    blueScores: 'تیم آبی گل زد',
    whiteScores: 'تیم سفید گل زد',
    paused: 'توقف بازی',
    resume: 'ادامه بازی',
    restart: 'شروع دوباره بازی',
    mainMenu: 'منوی اصلی',
    fullTime: 'پایان بازی',
    win: 'پیروزی!',
    lose: 'شکست',
    draw: 'مساوی',
    stGoals: 'گل‌ها',
    stShots: 'شوت‌ها',
    stPasses: 'پاس‌ها',
    stSaves: 'مهارهای دروازه‌بان',
    playAgain: 'بازی دوباره',
    menuBtn: 'منو',
    shoot: 'شوت',
    pass: 'پاس',
    cross: 'سانتر',
    dribble: 'دریبل',
    close: 'بستن',
    ariaPause: 'توقف بازی',
    ariaSound: 'قطع و وصل صدا',
    ariaShoot: 'شوت — برای قدرت بیشتر نگه دارید',
    ariaPass: 'پاس',
    ariaCross: 'سانتر',
    ariaDribble: 'دریبل سرعتی',
    ariaLanguage: 'تغییر زبان',
    helpTitle: 'راهنمای بازی',
    howto: 'نحوه بازی',
    menus: 'راهنمای منوها',
    helpHowto: [
      {
        title: 'درباره بازی',
        body: 'مجیک فوتبال یک مسابقه سریع سه‌بعدی است: ۲ در برابر ۲ به‌علاوه دو دروازه‌بان زیر نور پروژکتورها، با دوربین تلویزیونی که دنبال توپ حرکت می‌کند.',
      },
      {
        title: 'هدف بازی',
        body: 'قبل از پایان ۳ دقیقه، بیشتر از تیم سفید گل بزنید. بازی طوری تنظیم شده که آسان و سرگرم‌کننده باشد — شانس پیروزی شما زیاد است.',
      },
      {
        title: 'شروع مسابقه',
        body: 'در منوی اصلی دکمه «شروع بازی» را بزنید. بازیکن‌ها سر جای خود قرار می‌گیرند و با سوت داور مسابقه شروع می‌شود.',
      },
      {
        title: 'حرکت کردن',
        body: 'از جوی‌استیک (پایین سمت چپ) یا کلیدهای W A S D / جهت‌نما استفاده کنید. بازیکن به‌نرمی شتاب می‌گیرد، می‌چرخد و می‌ایستد؛ دوربین هم همراه صحنه حرکت می‌کند.',
      },
      {
        title: 'شوت زدن',
        body: 'با یک لمس دکمه شوت، ضربه معمولی به سمت دروازه زده می‌شود. اگر دکمه را نگه دارید، شوت قدرتمندتر می‌شود — حلقه رنگی دور بازیکن قدرت را نشان می‌دهد.',
      },
      {
        title: 'پاس دادن',
        body: 'دکمه پاس توپ را به‌صورت خودکار و دقیق به هم‌تیمی‌تان می‌رساند — نیازی به هدف‌گیری نیست.',
      },
      {
        title: 'سانتر',
        body: 'دکمه سانتر توپ را به‌صورت هوایی و بلند به محوطه جریمه حریف می‌فرستد. یک نشانگر درخشان محل فرود توپ را نشان می‌دهد.',
      },
      {
        title: 'دریبل',
        body: 'دکمه دریبل یک جهش سرعتی کوتاه به بازیکن می‌دهد در حالی که توپ به پایش می‌چسبد — عالی برای رد شدن از مدافع حریف. چند ثانیه زمان لازم دارد تا دوباره آماده شود.',
      },
      {
        title: 'دفاع کردن',
        body: 'با دویدن به سمت حریفی که توپ را دارد، توپ را از او بگیرید. هم‌تیمی و دروازه‌بان شما هم به‌صورت خودکار دفاع می‌کنند.',
      },
      {
        title: 'انتخاب بازیکن',
        body: 'نزدیک‌ترین بازیکن آبی به توپ به‌صورت خودکار انتخاب می‌شود — با یک فلش و حلقه درخشان مشخص است.',
      },
      {
        title: 'توقف و شروع دوباره',
        body: 'کلید P یا دکمه توقف (بالا راست) بازی را متوقف می‌کند. از صفحه توقف می‌توانید ادامه دهید، بازی را دوباره شروع کنید یا به منوی اصلی برگردید.',
      },
      {
        title: 'امتیاز و زمان',
        body: 'جدول بالای صفحه نتیجه آبی — سفید و زمان باقی‌مانده را نشان می‌دهد. بعد از پایان بازی، نتیجه و آمار شما (گل‌ها، شوت‌ها، پاس‌ها، مهارها) نمایش داده می‌شود.',
      },
    ],
    helpMenus: [
      { title: 'شروع بازی', body: 'بلافاصله یک مسابقه جدید را شروع می‌کند.' },
      {
        title: 'راهنما',
        body: 'همین پنجره را با دو بخش «نحوه بازی» و «راهنمای منوها» باز می‌کند.',
      },
      {
        title: 'درباره سازنده',
        body: 'نشان می‌دهد سازنده بازی کیست و شماره تماس استاد را نمایش می‌دهد.',
      },
      {
        title: 'زبان',
        body: 'بین English و فارسی جابه‌جا می‌شود. انتخاب شما در مرورگر ذخیره می‌شود و بعد از رفرش باقی می‌ماند.',
      },
      {
        title: 'صدا و موسیقی',
        body: 'دکمه بلندگو (در منو و داخل بازی) همه افکت‌های صوتی و صدای تماشاگران را روشن یا خاموش می‌کند. این تنظیم ذخیره می‌شود.',
      },
      {
        title: 'انتشار بازی (Publish)',
        body: 'یک راهنمای کوتاه و مرحله‌به‌مرحله (با دستورهایی که می‌شود کپی کرد) برای آنلاین‌کردن رایگان بازی روی GitHub Pages باز می‌کند.',
      },
      {
        title: 'دکمه‌های داخل بازی',
        body: 'جوی‌استیک پایین چپ · دکمه‌های شوت / پاس / سانتر / دریبل پایین راست · توقف و صدا بالا راست قرار دارند.',
      },
    ],
    aboutTitle: 'درباره سازنده',
    aboutName: 'آرسام، 11 ساله از دبی',
    aboutClass: 'از هنرجویان کلاس خانم دکتر آقایی',
    aboutContact: 'شماره استاد:',
    publish: 'انتشار بازی',
    publishTitle: 'انتشار بازی روی اینترنت',
    publishIntro:
      'این بازی کاملاً استاتیک است (HTML + JS + CSS) و می‌توانید در چند دقیقه، رایگان، روی GitHub Pages منتشرش کنید.',
    publishSteps: [
      {
        title: 'ساخت ریپازیتوری',
        body: 'در github.com یک ریپازیتوری جدید و خالی بسازید (مثلاً با نام magic-football).',
      },
      {
        title: 'آپلود کدها',
        body: 'پوشه پروژه را داخل ریپازیتوری بفرستید — با Git یا GitHub Desktop یا دکمه «Upload files» در خود گیت‌هاب.',
      },
      {
        title: 'بیلد گرفتن',
        body: 'دستور بیلد را اجرا کنید تا پوشه dist شامل نسخه نهایی بازی ساخته شود.',
      },
      {
        title: 'انتشار پوشه dist',
        body: 'پوشه dist را روی شاخه gh-pages منتشر کنید. ساده‌ترین راه، دستور ابزار gh-pages در پایین همین صفحه است.',
      },
      {
        title: 'فعال‌کردن GitHub Pages',
        body: 'در ریپازیتوری: Settings → Pages → گزینه «Source» را روی شاخه gh-pages بگذارید. چند دقیقه بعد لینک بازی شما آنلاین می‌شود!',
      },
    ],
    publishCmdsTitle: 'دستورها',
    publishCopy: 'کپی',
    publishCopied: 'کپی شد!',
    ariaPublish: 'راهنمای انتشار بازی',
    rotateTitle: 'گوشی را بچرخانید',
    rotateText:
      'مجیک فوتبال در حالت افقی بهترین تجربه را دارد — برای دیدن نمای کامل ورزشگاه سه‌بعدی، گوشی را بچرخانید.',
    rotateContinue: 'ادامه در همین حالت',
  },
};

export function loadLang(): Lang {
  try {
    const s = localStorage.getItem(LANG_KEY);
    if (s === 'fa' || s === 'en') return s;
  } catch {
    /* ignore */
  }
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.language?.toLowerCase().startsWith('fa')
    )
      return 'fa';
  } catch {
    /* ignore */
  }
  return 'en';
}

export function saveLang(l: Lang) {
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    /* ignore */
  }
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* ignore */
  }
}
