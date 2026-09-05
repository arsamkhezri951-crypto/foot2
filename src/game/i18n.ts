export type Lang = 'en' | 'fa';

const LANG_KEY = 'magic-football:lang';
const MUTE_KEY = 'magic-football:mute';

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
  /* buttons */
  shoot: string;
  pass: string;
  cross: string;
  dribble: string;
  close: string;
  back: string;
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
  aboutDesc: string;
  aboutName: string;
  aboutClass: string;
  aboutContact: string;
  version: string;
  /* in-game menu & settings */
  settingsTitle: string;
  masterVol: string;
  musicVol: string;
  sfxVol: string;
  muteAll: string;
  languageLabel: string;
  inGameMenu: string;
  ariaMenu: string;
  /* rotate */
  rotateTitle: string;
  rotateText: string;
  rotateContinue: string;
}

export const STR: Record<Lang, Dict> = {
  en: {
    dir: 'ltr',
    demoBadge: 'LIVE DEMO ON PITCH',
    kicker: 'ARCADE FOOTBALL',
    subtitleA: 'A fast 3D match with a broadcast camera that follows the ball.',
    subtitleB: '3 MIN · TWO KEEPER TEAMS · EASY GOALS',
    play: 'PLAY',
    help: 'Help',
    about: 'About',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Off',
    guide1: 'W A S D / joystick to move · SPACE to shoot (hold for power)',
    guide2: 'X pass · C cross · V dribble · P pause · nearest blue player is auto-selected',
    camNote: 'Broadcast camera follows the ball · BLUE attacks right · WHITE attacks left',
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
    win: 'VICTORY!',
    lose: 'DEFEAT',
    draw: 'DRAW',
    stGoals: 'Goals',
    stShots: 'Shots',
    stPasses: 'Passes',
    stSaves: 'Keeper saves faced',
    playAgain: 'PLAY AGAIN',
    menuBtn: 'MENU',
    shoot: 'SHOOT',
    pass: 'PASS',
    cross: 'CROSS',
    dribble: 'DRIBBLE',
    close: 'Close',
    back: 'Back',
    ariaPause: 'Pause or resume the match',
    ariaSound: 'Toggle sound',
    ariaShoot: 'Shoot — hold for a more powerful strike',
    ariaPass: 'Pass to teammate',
    ariaCross: 'Cross into the box',
    ariaDribble: 'Quick dribble burst',
    ariaLanguage: 'Choose language',
    helpTitle: 'Help',
    howto: 'How to Play',
    menus: 'Menu Guide',
    helpHowto: [
      {
        title: 'About the game',
        body: 'MAGIC FOOTBALL is a fast 3D arcade match: 2 vs 2 plus two goalkeepers, seen through a broadcast camera that smoothly follows the ball and zooms with the action.',
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
        title: 'Dribbling',
        body: 'DRIBBLE gives a short speed burst with the ball glued to your feet — great for slipping past an opponent. It has a small cooldown.',
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
        title: 'Desktop keys',
        body: 'WASD / arrow keys move · SPACE shoot (hold longer = stronger shot) · X pass · C cross · V or SHIFT dribble sprint · P or ESC pause.',
      },
      {
        title: 'Touch controls',
        body: 'The left joystick moves your player. SHOOT (hold for power), PASS, CROSS and DRIBBLE sit at the bottom-right. The menu button at the top-right opens Resume, Restart, Settings, Help and About during the match.',
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
        body: 'Joystick at bottom-left · SHOOT / PASS / CROSS / DRIBBLE at bottom-right · pause and sound at top-right.',
      },
    ],
    aboutTitle: 'About the Developer',
    aboutDesc:
      'MAGIC FOOTBALL is a fast, easy, fun 3D arcade football game — quick 3-minute matches under the floodlights, one-touch passing, charged shots and a living night stadium full of fans.',
    aboutName: 'Arsam, 11 years old, from Dubai',
    aboutClass: "Student in Dr. Aghaei's class",
    aboutContact: 'Teacher Contact:',
    version: 'Version 1.2.0',
    settingsTitle: 'Settings',
    masterVol: 'Master Volume',
    musicVol: 'Crowd & Music',
    sfxVol: 'Sound Effects',
    muteAll: 'Mute All',
    languageLabel: 'Language',
    inGameMenu: 'Match Menu',
    ariaMenu: 'Open match menu',
    rotateTitle: 'Rotate your phone',
    rotateText:
      'MAGIC FOOTBALL plays best in landscape — turn your phone sideways for the full 3D stadium view.',
    rotateContinue: 'Play anyway',
  },

  fa: {
    dir: 'rtl',
    demoBadge: 'نمایش زنده روی زمین',
    kicker: 'فوتبال جادویی',
    subtitleA: 'فوتبال آرکید سه‌بعدی با دوربین تلویزیونی که دنبال توپ حرکت می‌کند.',
    subtitleB: '۳ دقیقه · دو دروازه‌بان · گل‌زدن آسان',
    play: 'شروع بازی',
    help: 'راهنما',
    about: 'درباره سازنده',
    soundOn: 'صدا: روشن',
    soundOff: 'صدا: خاموش',
    guide1: 'کلیدهای W A S D / جوی‌استیک — حرکت · SPACE — شوت (نگه‌داشتن = قدرت بیشتر)',
    guide2: 'X پاس · C سانتر · V دریبل · P توقف · نزدیک‌ترین بازیکن آبی به‌صورت خودکار انتخاب می‌شود',
    camNote: 'دوربین تلویزیونی دنبال توپ · تیم آبی به سمت راست حمله می‌کند · تیم سفید به سمت چپ',
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
    back: 'بازگشت',
    ariaPause: 'توقف یا ادامه بازی',
    ariaSound: 'قطع و وصل صدا',
    ariaShoot: 'شوت — برای قدرت بیشتر نگه دارید',
    ariaPass: 'پاس به هم‌تیمی',
    ariaCross: 'سانتر به محوطه جریمه',
    ariaDribble: 'دریبل سریع',
    ariaLanguage: 'انتخاب زبان',
    helpTitle: 'راهنما',
    howto: 'نحوه بازی',
    menus: 'راهنمای منوها',
    helpHowto: [
      {
        title: 'درباره بازی',
        body: 'مجیک فوتبال یک مسابقه سریع آرکید سه‌بعدی است: ۲ به‌علاوه دو دروازه‌بان، که با دوربین تلویزیونیِ نرمی دنبال توپ حرکت می‌کند و با صحنه زوم می‌شود.',
      },
      {
        title: 'هدف بازی',
        body: 'قبل از پایان زمان ۳ دقیقه‌ای، بیشتر از تیم سفید گل بزنید. بازی طوری تنظیم شده که آسان و سرگرم‌کننده باشد — شانس برد شما بالاست.',
      },
      {
        title: 'شروع مسابقه',
        body: 'در منوی اصلی دکمه «شروع بازی» را بزنید. بازیکنان سر جای خود می‌روند و با سوت داور مسابقه شروع می‌شود.',
      },
      {
        title: 'حرکت',
        body: 'با جوی‌استیک روی صفحه (پایین چپ) یا کلیدهای W A S D / جهت‌نما حرکت کنید. بازیکن به‌نرمی شتاب می‌گیرد، می‌چرخد و می‌ایستد.',
      },
      {
        title: 'شوت',
        body: 'دکمه «شوت» را بزنید تا توپ به سمت دروازه شوت شود. اگر دکمه را نگه دارید، شوت قوی‌تری زده می‌شود — حلقه رنگی دور بازیکن قدرت را نشان می‌دهد.',
      },
      {
        title: 'پاس',
        body: 'دکمه «پاس» توپ را به‌صورت خودکار به هم‌تیمی‌تان می‌فرستد — نیازی به نشانه‌گیری نیست.',
      },
      {
        title: 'سانتر',
        body: 'دکمه «سانتر» توپ را بلند به محوطه جریمه حریف می‌فرستد. یک نشانگر نورانی محل فرود توپ را نشان می‌دهد.',
      },
      {
        title: 'دریبل',
        body: 'دکمه «دریبل» یک جهش سرعت کوتاه می‌دهد و توپ به پای بازیکن می‌چسبد — برای ردشدن از حریف عالی است. کمی زمان استراحت دارد.',
      },
      {
        title: 'دفاع',
        body: 'به سمت بازیکنی که توپ را دارد بدوید تا توپ را بگیرید. هم‌تیمی و دروازه‌بان شما هم خودکار دفاع می‌کنند.',
      },
      {
        title: 'تعویض بازیکن',
        body: 'نزدیک‌ترین بازیکن آبی به توپ به‌صورت خودکار انتخاب می‌شود — با فلش و حلقه نورانی مشخص است.',
      },
      {
        title: 'توقف و شروع دوباره',
        body: 'کلید P یا دکمه توقف (بالا راست) را بزنید. در صفحه توقف می‌توانید ادامه دهید، مسابقه را از اول شروع کنید یا به منوی اصلی برگردید.',
      },
      {
        title: 'امتیاز و زمان',
        body: 'جدول بالای صفحه نتیجه و زمان باقی‌مانده را نشان می‌دهد. بعد از پایان بازی، نتیجه و آمار شما (گل، شوت، پاس، مهار) نمایش داده می‌شود.',
      },
      {
        title: 'کلیدهای کیبورد',
        body: 'حرکت با WASD یا کلیدهای جهت‌نما · شوت با SPACE (نگه‌داشتنِ بیشتر = شوت قوی‌تر) · پاس با X · سانتر با C · دریبل و سرعت با V یا SHIFT · توقف با P یا ESC.',
      },
      {
        title: 'کنترل‌های لمسی',
        body: 'جوی‌استیک سمت چپ بازیکن شما را حرکت می‌دهد. دکمه‌های شوت (نگه‌داشتن برای قدرت)، پاس، سانتر و دریبل پایین راست قرار دارند. دکمه منو در بالا راست، در طول مسابقه گزینه‌های ادامه، شروع دوباره، تنظیمات، راهنما و درباره سازنده را باز می‌کند.',
      },
    ],
    helpMenus: [
      { title: 'شروع بازی (PLAY)', body: 'بلافاصله یک مسابقه جدید را شروع می‌کند.' },
      {
        title: 'راهنما',
        body: 'همین پنجره را با دو بخش مجزا باز می‌کند: «نحوه بازی» و «راهنمای منوها».',
      },
      {
        title: 'درباره سازنده',
        body: 'سازنده بازی و شماره تماس استاد را نشان می‌دهد.',
      },
      {
        title: 'زبان (Language)',
        body: 'بین English و فارسی جابه‌جا می‌شود. انتخاب شما در مرورگر ذخیره می‌شود و بعد از رفرش باقی می‌ماند.',
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
        body: 'جوی‌استیک پایین چپ · دکمه‌های شوت / پاس / سانتر / دریبل پایین راست · توقف و صدا بالا راست قرار دارند.',
      },
    ],
    aboutTitle: 'درباره سازنده',
    aboutDesc:
      'مجیک فوتبال یک بازی فوتبال آرکید سه‌بعدی، سریع و سرگرم‌کننده است — مسابقه‌های ۳ دقیقه‌ای زیر نور پروژکتورها، پاس‌های تک‌ضربه‌ای، شوت‌های قدرتی و ورزشگاه شبانه‌ای پر از تماشاگر.',
    aboutName: 'آرسام، 11 ساله از دبی',
    aboutClass: 'از هنرجویان کلاس خانم دکتر آقایی',
    aboutContact: 'شماره استاد:',
    version: 'نسخه 1.2.0',
    settingsTitle: 'تنظیمات',
    masterVol: 'بلندی صدای اصلی',
    musicVol: 'صدای تماشاگران و موسیقی',
    sfxVol: 'افکت‌های صوتی',
    muteAll: 'قطع کامل صدا',
    languageLabel: 'زبان',
    inGameMenu: 'منوی مسابقه',
    ariaMenu: 'بازکردن منوی مسابقه',
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

const VOL_KEY = 'magic-football:volumes';

export interface StoredVolumes {
  master: number;
  music: number;
  sfx: number;
}

/** Invalid / corrupted stored values fall back to full volume — never crash. */
export function loadVolumes(): StoredVolumes {
  const num = (v: unknown) =>
    typeof v === 'number' && isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
  try {
    const s = localStorage.getItem(VOL_KEY);
    if (s) {
      const o = JSON.parse(s) as Partial<StoredVolumes>;
      return { master: num(o.master), music: num(o.music), sfx: num(o.sfx) };
    }
  } catch {
    /* corrupted data → defaults */
  }
  return { master: 1, music: 1, sfx: 1 };
}

export function saveVolumes(v: StoredVolumes) {
  try {
    localStorage.setItem(VOL_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}
