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
  language: string;
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
  close: string;
  back: string;
  /* aria */
  ariaPause: string;
  ariaSound: string;
  ariaShoot: string;
  ariaPass: string;
  ariaCross: string;
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
  /* orientation */
  rotateTitle: string;
  rotateText: string;
  rotateContinue: string;
}

export const STR: Record<Lang, Dict> = {
  /* ================================ ENGLISH ================================ */
  en: {
    dir: 'ltr',
    demoBadge: 'LIVE DEMO ON THE PITCH',
    kicker: 'ARCADE FOOTBALL',
    subtitleA: 'Full-pitch arcade football — the whole stadium stays on screen.',
    subtitleB: '3 minutes · Two keepers · Easy to score',
    play: 'PLAY',
    help: 'Help',
    about: 'About',
    language: 'Language',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Off',
    guide1: 'W A S D / joystick — move · SPACE — shoot (hold = power)',
    guide2: 'X pass · C cross · P pause · nearest blue player is auto-selected',
    camNote: 'Fixed broadcast camera · BLUE attacks right · WHITE attacks left',
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
    close: 'Close',
    back: 'Back',
    ariaPause: 'Pause',
    ariaSound: 'Toggle sound',
    ariaShoot: 'Shoot — hold for power',
    ariaPass: 'Pass',
    ariaCross: 'Cross',
    ariaLanguage: 'Change language',
    helpTitle: 'Game Guide',
    howto: 'How to Play',
    menus: 'Menu Guide',
    helpHowto: [
      {
        title: 'About the game',
        body: 'MAGIC FOOTBALL is a fast arcade match: 2 vs 2 plus two goalkeepers, all on one screen with a fixed camera that always shows the full pitch.',
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
        body: 'Use the on-screen joystick (bottom-left) or the W A S D / arrow keys. The player accelerates, turns and stops smoothly across the whole pitch.',
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
      {
        title: 'Levels',
        body: 'There are no levels — every match is one quick 3-minute game. Replay as many times as you like.',
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
        title: 'Settings',
        body: 'Language and sound are the game settings — both are saved automatically, no account needed.',
      },
      {
        title: 'In-game buttons',
        body: 'Joystick at bottom-left · SHOOT / PASS / CROSS at bottom-right · pause and sound at top-right.',
      },
    ],
    aboutTitle: 'About the Developer',
    aboutName: 'Arsam, 11 years old, from Dubai',
    aboutClass: "Student in Dr. Aghaei's class",
    aboutContact: 'Teacher Contact:',
    rotateTitle: 'Rotate your phone',
    rotateText:
      'MAGIC FOOTBALL plays best in landscape — turn your phone sideways to see the whole pitch.',
    rotateContinue: 'Play anyway',
  },

  /* ================================ فارسی ================================ */
  fa: {
    dir: 'rtl',
    demoBadge: 'نمایش زنده روی زمین',
    kicker: 'فوتبال جادویی',
    subtitleA: 'فوتبال آرکید با نمای کامل زمین — کل ورزشگاه همیشه در صفحه می‌ماند.',
    subtitleB: '۳ دقیقه · دو دروازه‌بان · گل‌زدن آسان',
    play: 'شروع بازی',
    help: 'راهنما',
    about: 'درباره سازنده',
    language: 'زبان',
    soundOn: 'صدا: روشن',
    soundOff: 'صدا: خاموش',
    guide1: 'کلیدهای W A S D / جوی‌استیک — حرکت · SPACE — شوت (نگه‌داشتن = قدرت بیشتر)',
    guide2: 'X پاس · C سانتر · P توقف · نزدیک‌ترین بازیکن آبی به‌صورت خودکار انتخاب می‌شود',
    camNote: 'دوربین ثابت تلویزیونی · تیم آبی به سمت راست حمله می‌کند · تیم سفید به سمت چپ',
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
    close: 'بستن',
    back: 'بازگشت',
    ariaPause: 'توقف بازی',
    ariaSound: 'قطع و وصل صدا',
    ariaShoot: 'شوت — برای قدرت بیشتر نگه دارید',
    ariaPass: 'پاس',
    ariaCross: 'سانتر',
    ariaLanguage: 'تغییر زبان',
    helpTitle: 'راهنمای بازی',
    howto: 'راهنمای بازی',
    menus: 'راهنمای منوها',
    helpHowto: [
      {
        title: 'معرفی بازی',
        body: 'مجیک فوتبال یک مسابقه فوتبال آرکید و سریع است؛ ۲ در برابر ۲ به‌همراه دو دروازه‌بان، همه‌چیز در یک صفحه و با دوربین ثابتی که همیشه کل زمین را نشان می‌دهد.',
      },
      {
        title: 'هدف بازی',
        body: 'پیش از پایان زمان ۳ دقیقه‌ای، بیشتر از تیم سفید گل بزنید. بازی طوری تنظیم شده که آسان و سرگرم‌کننده باشد و شانس برد شما بالا باشد.',
      },
      {
        title: 'شروع بازی',
        body: 'در منوی اصلی دکمه «شروع بازی» را بزنید؛ بازیکن‌ها سر جای خود می‌ایستند و با سوت داور مسابقه آغاز می‌شود.',
      },
      {
        title: 'حرکت',
        body: 'با جوی‌استیک روی صفحه (گوشه پایین چپ) یا کلیدهای W A S D / جهت‌نما حرکت کنید. بازیکن به‌نرمی در کل زمین شتاب می‌گیرد، می‌چرخد و می‌ایستد.',
      },
      {
        title: 'شوت',
        body: 'یک ضربه روی دکمه «شوت» = شوت معمولی به سمت دروازه. نگه‌داشتن دکمه = شوت قدرتمند؛ حلقه رنگی دور بازیکن میزان قدرت را نشان می‌دهد.',
      },
      {
        title: 'پاس',
        body: 'دکمه «پاس» توپ را به‌طور خودکار و دقیق به هم‌تیمی‌تان می‌فرستد — هیچ نیازی به نشانه‌گیری نیست.',
      },
      {
        title: 'سانتر',
        body: 'دکمه «سانتر» توپ را به‌صورت هوایی به محوطه جریمه حریف می‌فرستد؛ یک نشانگر درخشان محل فرود توپ را مشخص می‌کند.',
      },
      {
        title: 'دفاع',
        body: 'با دویدن به سمت حریفِ صاحب‌توپ، توپ را از او بگیرید (تکل). هم‌تیمی و دروازه‌بان شما هم به‌صورت خودکار دفاع می‌کنند.',
      },
      {
        title: 'تعویض بازیکن',
        body: 'نزدیک‌ترین بازیکن آبی به توپ به‌صورت خودکار انتخاب می‌شود و با فلش و حلقه نورانی مشخص است.',
      },
      {
        title: 'توقف و شروع دوباره',
        body: 'کلید P یا دکمه توقف (بالا راست) بازی را نگه می‌دارد؛ از آن‌جا می‌توانید ادامه دهید، مسابقه را از اول شروع کنید یا به منوی اصلی برگردید.',
      },
      {
        title: 'امتیاز و زمان',
        body: 'جدول بالای صفحه نتیجه «آبی — سفید» و زمان باقی‌مانده را نشان می‌دهد؛ پس از پایان بازی، نتیجه و آمار شما (گل، شوت، پاس، مهارها) نمایش داده می‌شود.',
      },
      {
        title: 'مراحل',
        body: 'مرحله‌ای وجود ندارد — هر مسابقه یک بازی سریع ۳ دقیقه‌ای است و می‌توانید هر چقدر بخواهید دوباره بازی کنید.',
      },
    ],
    helpMenus: [
      { title: 'شروع بازی (PLAY)', body: 'بلافاصله یک مسابقه جدید را شروع می‌کند.' },
      {
        title: 'راهنما (Help)',
        body: 'همین پنجره را باز می‌کند؛ شامل دو بخش جدا و واضح: «راهنمای بازی» و «راهنمای منوها».',
      },
      {
        title: 'درباره سازنده (About)',
        body: 'اطلاعات سازنده بازی و شماره تماس استاد را نشان می‌دهد.',
      },
      {
        title: 'زبان (Language)',
        body: 'بین English و فارسی جابه‌جا می‌شود. انتخاب شما در مرورگر ذخیره می‌شود و بعد از رفرش هم باقی می‌ماند.',
      },
      {
        title: 'صدا و موسیقی (Sound)',
        body: 'دکمه بلندگو (در منو و داخل بازی) همه افکت‌های صوتی و صدای تماشاگران را روشن یا خاموش می‌کند. این تنظیم ذخیره می‌شود.',
      },
      {
        title: 'تنظیمات (Settings)',
        body: 'زبان و صدا تنظیمات بازی هستند — هر دو به‌صورت خودکار ذخیره می‌شوند و نیازی به حساب کاربری نیست.',
      },
      {
        title: 'دکمه‌های داخل بازی',
        body: 'جوی‌استیک در پایین چپ · دکمه‌های شوت / پاس / سانتر در پایین راست · توقف و صدا در بالا راست قرار دارند.',
      },
    ],
    aboutTitle: 'درباره سازنده',
    aboutName: 'آرسام، 11 ساله از دبی',
    aboutClass: 'از هنرجویان کلاس خانم دکتر آقایی',
    aboutContact: 'شماره استاد:',
    rotateTitle: 'گوشی را بچرخانید',
    rotateText:
      'مجیک فوتبال در حالت افقی بهترین تجربه را دارد — برای دیدنِ کل زمین، گوشی را بچرخانید.',
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
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('fa'))
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
