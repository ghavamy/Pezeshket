import express from 'express';
import path from 'path';

import { fileURLToPath } from 'node:url';


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Template engine ───────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Expose req.path to every view as `currentPath`
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Provide a default description if none is provided by the route
app.use((req, res, next) => {
  res.locals.description = res.locals.description || 'پزشکت — پلتفرم جامع سلامت آنلاین. پزشک متخصص پیدا کن، نوبت بگیر و مشاوره آنلاین داشته باش.';
  next();
});

// ── Data ──────────────────────────────────────────────────────
import doctors from './data/doctors.js';
import articles from './data/articles.js';
import specialties from './data/specialties.js';


// ── Shared lookup sets (derived once) ────────────────────────
const specialtyList = [...new Set(doctors.map(d => d.specialty))].sort();
const cityList      = [...new Set(doctors.map(d => d.city))].sort();

// ═══════════════════════════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.render('index', {
    title: 'پزشکت | پلتفرم جامع سلامت آنلاین',
    description: 'پزشک متخصص پیدا کن، نوبت آنلاین بگیر و مشاوره داشته باش.',

    popularSearches: ['قلب', 'پوست', 'روان‌شناسی', 'دندان'],

    specialties: specialties.slice(0, 12),

    featuredDoctors: doctors.filter(d => d.available).slice(0, 6),

    latestArticles: articles.slice(0, 6),

    consultTypes: [
      { icon: '📱', name: 'مشاوره متنی',    sub: 'پاسخ در کمتر از ۱ ساعت' },
      { icon: '📞', name: 'مشاوره تلفنی',   sub: 'صحبت مستقیم با پزشک' },
      { icon: '🎥', name: 'مشاوره تصویری',  sub: 'ویزیت آنلاین کامل' },
      { icon: '⚡', name: 'اورژانس آنلاین', sub: 'مشاوره فوری ۲۴/۷' },
    ],

    trustItems: [
      { icon: '🏅', title: 'پزشکان تأیید‌شده',   sub: 'مدارک و پروانه معتبر' },
      { icon: '🔒', title: 'اطلاعات محرمانه',     sub: 'حریم خصوصی کامل' },
      { icon: '⚡', title: 'نوبت فوری',            sub: 'رزرو در کمتر از ۲ دقیقه' },
      { icon: '💬', title: 'مشاوره آنلاین',        sub: 'ویدیو، تلفن و متن' },
      { icon: '⭐', title: 'نظرات واقعی',          sub: 'تجربه بیماران' },
    ],

    testimonials: [
      { name: 'فاطمه رضایی', city: 'تهران',    avatar: '👩', bg: '#e4f7ef',
        text: 'در کمتر از ۵ دقیقه نوبت گرفتم و پزشک دقیقاً همان چیزی بود که دنبالش بودم.' },
      { name: 'علی محمدی',   city: 'مشهد',     avatar: '👨', bg: '#ddeaff',
        text: 'مشاوره آنلاین پزشکت واقعاً راحت بود. بدون صف و انتظار مشکلم رو حل کردم.' },
      { name: 'مریم کریمی',  city: 'اصفهان',   avatar: '👩', bg: '#ffedf4',
        text: 'نظرات بیماران قبلی کمک زیادی در انتخاب پزشک کرد. ممنون پزشکت!' },
    ],
  });
});

// ═══════════════════════════════════════════════════════════════
//  DOCTORS LIST  —  GET /doctors?q=&specialty=&city=&sort=
// ═══════════════════════════════════════════════════════════════
app.get('/doctors', (req, res) => {
  const { q = '', specialty = '', city = '', sort = 'rating' } = req.query;

  let result = [...doctors];

  if (q)         result = result.filter(d => d.name.includes(q) || d.specialty.includes(q));
  if (specialty) result = result.filter(d => d.specialty === specialty);
  if (city)      result = result.filter(d => d.city === city);

  const sorters = {
    rating:   (a, b) => b.rating - a.rating,
    exp:      (a, b) => b.exp    - a.exp,
    fee_asc:  (a, b) => a.fee    - b.fee,
    fee_desc: (a, b) => b.fee    - a.fee,
  };
  result.sort(sorters[sort] || sorters.rating);

  res.render('doctors', {
    title: 'پزشکان',
    description: 'لیست پزشکان متخصص برای دریافت نوبت آنلاین و مشاوره. بر اساس تخصص، شهر و امتیاز فیلتر و مرتب‌سازی کنید.',
    doctors: result,
    allDoctors: doctors,
    specialtyList,
    cityList,
    query: req.query,
  });
});

// ═══════════════════════════════════════════════════════════════
//  DOCTOR PROFILE  —  GET /doctors/:id
// ═══════════════════════════════════════════════════════════════
app.get('/doctors/:id', (req, res) => {
  const doctor = doctors.find(d => d.id === parseInt(req.params.id));
  if (!doctor) return res.redirect('/doctors');

  const availableDays = [
    { name: 'شنبه',    label: 'شنبه ۱۶ آبان',     busy: false },
    { name: 'یک‌شنبه', label: 'یک‌شنبه ۱۷ آبان',  busy: false },
    { name: 'دوشنبه',  label: 'دوشنبه ۱۸ آبان',   busy: false },
    { name: 'سه‌شنبه', label: 'سه‌شنبه ۱۹ آبان',  busy: false },
    { name: 'چهارشنبه',label: 'چهارشنبه ۲۰ آبان', busy: true  },
    { name: 'پنج‌شنبه',label: 'پنج‌شنبه ۲۱ آبان', busy: false },
  ];
  const timeSlots = [
    { time: '۹:۰۰',  busy: false }, { time: '۹:۳۰',  busy: false },
    { time: '۱۰:۰۰', busy: true  }, { time: '۱۰:۳۰', busy: false },
    { time: '۱۱:۰۰', busy: true  }, { time: '۱۱:۳۰', busy: false },
    { time: '۱۴:۰۰', busy: false }, { time: '۱۴:۳۰', busy: false },
    { time: '۱۵:۰۰', busy: true  },
  ];

  res.render('doctor-profile', {
    title: doctor.name,
    description: `پروفایل دکتر ${doctor.name} - ${doctor.specialty} در شهر ${doctor.city}. نمره ${doctor.rating}/5، ${doctor.exp} سال سابقه کار.`,
    doctor,
    availableDays,
    timeSlots,
  });
});

// ═══════════════════════════════════════════════════════════════
//  SPECIALTIES  —  GET /specialties?q=&cat=
// ═══════════════════════════════════════════════════════════════
app.get('/specialties', (req, res) => {
  const { q = '', cat = '' } = req.query;
  const cats = [...new Set(specialties.map(s => s.cat))];

  let result = [...specialties];
  if (q)   result = result.filter(s => s.name.includes(q) || s.desc.includes(q));
  if (cat) result = result.filter(s => s.cat === cat);

  res.render('specialties', {
    title: 'تخصص‌ها',
    description: 'مروری بر تخصص‌های پزشکی ارائه‌شده در پزشکت. قلب، پوست، روان‌شناسی، زنان و زایمان، دندان‌پزشکی و بسیاری دیگر.',
    specialties: result,
    cats,
    query: q,
    cat,
  });
});

// ═══════════════════════════════════════════════════════════════
//  ARTICLES LIST  —  GET /articles?cat=
// ═══════════════════════════════════════════════════════════════
app.get('/articles', (req, res) => {
  const { cat = '' } = req.query;

  const categories = [
    { name: 'تغذیه',     icon: '🍎' },
    { name: 'سلامت روان', icon: '🧘' },
    { name: 'سبک زندگی', icon: '💤' },
    { name: 'تحرک',      icon: '🚶' },
    { name: 'قلب',       icon: '❤️' },
    { name: 'پوست',      icon: '🌿' },
  ];

  const result  = cat ? articles.filter(a => a.cat === cat) : articles;
  const popular = articles.slice(0, 4);

  res.render('articles', {
    title: 'مجله سلامت',
    description: 'مقالات پزشکی معتبر و جدید در زمینه تغذیه، سلامت روان، سبک زندگی و بیماری‌های شایع.',
    articles: result,
    categories,
    popular,
    currentCat: cat,
  });
});

// ═══════════════════════════════════════════════════════════════
//  ARTICLE SINGLE  —  GET /articles/:id
// ═══════════════════════════════════════════════════════════════
app.get('/articles/:id', (req, res) => {
  const article = articles.find(a => a.id === parseInt(req.params.id));
  if (!article) return res.redirect('/articles');

  // Related: same category, different article, max 2
  const related = articles
    .filter(a => a.cat === article.cat && a.id !== article.id)
    .slice(0, 2);

  // Recent sidebar: latest 4 excluding current
  const recent = articles.filter(a => a.id !== article.id).slice(0, 4);

  res.render('article-single', {
    title: article.title,
    description: `${article.excerpt} - مطالعه کامل مقاله در مجله سلامت پزشکت.`,
    article,
    related,
    recent,
  });
});

// ═══════════════════════════════════════════════════════════════
//  ONLINE CONSULT
// ═══════════════════════════════════════════════════════════════
app.get('/online-consult', (req, res) => {
  res.render('online-consult', {
    title: 'مشاوره آنلاین',
    description: 'مشاوره آنلاین با پزشکان متخصص از طریق متن، تلفن و ویدیو. ۲۴/۷ در دسترس، حریم خصوصی کامل، پاسخ در کمتر از ۱ ساعت.',
    heroStats: [
      { value: '۲۴/۷', label: 'در دسترس' },
      { value: '+۱۰۰۰', label: 'پزشک آنلاین' },
      { value: '۱ ساعت', label: 'زمان پاسخ' },
      { value: '۱۰۰٪', label: 'محرمانه' },
    ],
    steps: [
      { num: '۱', icon: '🩺', title: 'انتخاب پزشک',    desc: 'از میان پزشکان آنلاین بر اساس تخصص و امتیاز انتخاب کن.' },
      { num: '۲', icon: '💳', title: 'پرداخت آنلاین',   desc: 'هزینه مشاوره را به صورت امن آنلاین پرداخت کن.' },
      { num: '۳', icon: '💬', title: 'شروع مشاوره',     desc: 'از طریق متن، تلفن یا ویدیو با پزشک ارتباط بگیر.' },
      { num: '۴', icon: '📋', title: 'دریافت نسخه',     desc: 'نسخه دیجیتال و راهنمای درمانی را دریافت کن.' },
    ],
    consultTypes: [
      { icon: '📱', name: 'مشاوره متنی',   desc: 'سوالت را بنویس و در کمتر از ۱ ساعت پاسخ بگیر.',     price: 'از ۵۰,۰۰۰ تومان' },
      { icon: '📞', name: 'مشاوره تلفنی',  desc: 'مستقیم با پزشک صحبت کن. ۱۵ تا ۳۰ دقیقه.',           price: 'از ۱۵۰,۰۰۰ تومان' },
      { icon: '🎥', name: 'ویزیت تصویری', desc: 'ویزیت آنلاین کامل با تصویر زنده. ۳۰ دقیقه.',          price: 'از ۲۵۰,۰۰۰ تومان' },
    ],
    onlineDoctors: [
      { ...doctors[2], online: true,  waitMin: null },
      { ...doctors[1], online: true,  waitMin: null },
      { ...doctors[0], online: false, waitMin: 20   },
    ],
  });
});

// ═══════════════════════════════════════════════════════════════
//  ABOUT
// ═══════════════════════════════════════════════════════════════
app.get('/about', (req, res) => {
  res.render('about', {
    title: 'درباره ما',
    description: 'درباره پزشکت: پلتفرم جامع سلامت آنلاین که در سال ۱۴۰۰ تأسیس شد. مأموریت ما ساده کردن دسترسی به خدمات پزشکی است.',
    mission: 'پزشکت در سال ۱۴۰۰ با هدف ساده کردن دسترسی به خدمات پزشکی در ایران راه‌اندازی شد. ما معتقدیم هر کسی باید بتواند به راحتی به یک پزشک متخصص دسترسی داشته باشد.',
    missionCards: [
      { icon: '🏥', label: 'مراقبت حرفه‌ای',       bg1: '#e8f0fd', bg2: '#ddeaff' },
      { icon: '🔒', label: 'امنیت و حریم خصوصی',   bg1: '#e4f7ef', bg2: '#d4f0e6' },
      { icon: '💙', label: 'مراقبت از بیمار',       bg1: '#fff0e4', bg2: '#ffe6d0' },
      { icon: '⚡', label: 'دسترسی سریع',           bg1: '#f0eaff', bg2: '#e8e0ff' },
    ],
    stats: [
      { value: '+۵۰۰۰',   label: 'پزشک متخصص',          color: '#2368e8' },
      { value: '+۱۲۰,۰۰۰', label: 'نوبت ثبت‌شده',        color: '#1a52c2' },
      { value: '+۳۰',     label: 'تخصص پزشکی',           color: '#1a9e8e' },
      { value: '۴.۸',     label: 'امتیاز رضایت کاربران', color: '#7c3aed' },
    ],
    values: [
      { icon: '🎯', title: 'دقت و کیفیت',     desc: 'همه پزشکان ما مدارک معتبر دارند و فرآیند تأیید دقیقی طی کرده‌اند.' },
      { icon: '🤝', title: 'اعتماد',           desc: 'شفافیت در قیمت‌گذاری، نظرات واقعی و اطلاعات کامل پزشکان.' },
      { icon: '♿', title: 'دسترسی همگانی',   desc: 'هدف ما دسترسی آسان به خدمات پزشکی برای همه ایرانیان است.' },
      { icon: '🔐', title: 'حریم خصوصی',      desc: 'اطلاعات پزشکی شما کاملاً محرمانه و ایمن نگهداری می‌شود.' },
    ],
    team: [
      { avatar: '👨‍💼', name: 'علی رضایی',          role: 'مدیرعامل و بنیان‌گذار' },
      { avatar: '👩‍⚕️', name: 'دکتر مریم احمدی',    role: 'مدیر پزشکی' },
      { avatar: '👨‍💻', name: 'سامان کریمی',         role: 'مدیر فنی' },
      { avatar: '👩‍🎨', name: 'نیلوفر حسینی',        role: 'مدیر تجربه کاربری' },
    ],
  });
});

// ═══════════════════════════════════════════════════════════════
//  CONTACT  —  GET & POST /contact
// ═══════════════════════════════════════════════════════════════
const contactData = {
  title: 'تماس با ما',
  description: 'تماس با پشتیبانی پزشکت از طریق تلفن، ایمیل، تلگرام یا فرم تماس. پاسخگویی شنبه تا پنج‌شنبه، ۹ تا ۲۱.',
  subjects: ['سوال عمومی', 'مشکل فنی', 'همکاری پزشک', 'گزارش مشکل', 'پیشنهاد و انتقاد'],
  contactInfo: [
    { icon: '📞', label: 'تلفن پشتیبانی', value: '۰۲۱-۸۸۰۰۰۰۰۰<br>شنبه تا پنج‌شنبه، ۹ تا ۲۱' },
    { icon: '📧', label: 'ایمیل',          value: 'info@pezeshket.com' },
    { icon: '📍', label: 'آدرس',           value: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک' },
    { icon: '✈️', label: 'تلگرام',         value: '@pezeshket_support' },
  ],
};

app.get('/contact', (req, res) => {
  res.render('contact', contactData);
});

app.post('/contact', (req, res) => {
  const { firstName, email, message } = req.body;
  if (!firstName || !email || !message) {
    return res.render('contact', { ...contactData, error: 'همه فیلدهای اجباری را پر کنید.' });
  }
  console.log('[Contact]', { firstName, email, message });
  res.render('contact', { ...contactData, success: true });
});

// ═══════════════════════════════════════════════════════════════
//  FAQ  —  GET /faq?q=&cat=
// ═══════════════════════════════════════════════════════════════
const allFaqs = [
  { cat: 'نوبت',    q: 'چطور نوبت آنلاین بگیرم؟',                     a: 'پزشک مورد نظر را پیدا کن، پروفایل او را باز کن و از بخش رزرو نوبت، تاریخ و ساعت را انتخاب کن.' },
  { cat: 'نوبت',    q: 'آیا می‌توانم نوبت را لغو کنم؟',               a: 'بله، تا ۲۴ ساعت قبل از زمان ملاقات می‌توانید نوبت را لغو کنید.' },
  { cat: 'نوبت',    q: 'اگر دکتر نوبت خالی نداشت چطور؟',              a: 'می‌توانید در لیست انتظار ثبت‌نام کنید. در صورت آزاد شدن نوبت، از طریق پیامک مطلع می‌شوید.' },
  { cat: 'مشاوره',  q: 'مشاوره آنلاین چطور انجام می‌شود؟',           a: 'پس از انتخاب نوع مشاوره و پرداخت، با پزشک ارتباط برقرار می‌شود.' },
  { cat: 'مشاوره',  q: 'مشاوره آنلاین معتبر و قانونی است؟',          a: 'بله. تمام پزشکان پزشکت دارای پروانه پزشکی معتبر از سازمان نظام پزشکی هستند.' },
  { cat: 'مشاوره',  q: 'آیا نسخه دیجیتال اعتبار دارد؟',              a: 'بله، نسخه‌های دیجیتال در داروخانه‌های طرف قرارداد معتبر هستند.' },
  { cat: 'پرداخت',  q: 'روش‌های پرداخت چیست؟',                       a: 'کارت‌های عضو شبکه شتاب، پرداخت اینترنتی، و در برخی موارد پرداخت در محل.' },
  { cat: 'پرداخت',  q: 'اگر از مشاوره راضی نبودم پول پس می‌گیرم؟',  a: 'بله، در صورت عدم رضایت در ۲۴ ساعت اول می‌توانید درخواست بازگشت وجه دهید.' },
  { cat: 'پرداخت',  q: 'آیا بیمه را قبول می‌کنید؟',                  a: 'برای بیمه تکمیلی در برخی پزشکان فاکتور رسمی صادر می‌شود.' },
  { cat: 'حساب',    q: 'چطور ثبت‌نام کنم؟',                           a: 'با شماره موبایل ثبت‌نام کنید. یک کد تأیید ارسال می‌شود.' },
  { cat: 'حساب',    q: 'اطلاعات پزشکی‌ام محرمانه است؟',               a: 'بله، طبق قوانین حفظ حریم خصوصی اطلاعات شما محرمانه نگهداری می‌شود.' },
  { cat: 'حساب',    q: 'رمز عبورم را فراموش کردم چطور؟',              a: 'از صفحه ورود، روی «فراموشی رمز عبور» کلیک کن.' },
];

app.get('/faq', (req, res) => {
  const { q = '', cat = '' } = req.query;
  const cats = [
    { key: 'نوبت',   label: '🗓 نوبت‌گیری' },
    { key: 'مشاوره', label: '💬 مشاوره آنلاین' },
    { key: 'پرداخت', label: '💳 پرداخت' },
    { key: 'حساب',   label: '👤 حساب کاربری' },
  ];

  let faqs = [...allFaqs];
  if (cat) faqs = faqs.filter(f => f.cat === cat);
  if (q)   faqs = faqs.filter(f => f.q.includes(q) || f.a.includes(q));

  res.render('faq', { 
    title: 'سوالات متداول', 
    description: 'پاسخ به سوالات متداول درباره نوبت‌گیری، مشاوره آنلاین، پرداخت و حساب کاربری در پزشکت.',
    faqs, 
    cats, 
    cat, 
    query: q 
  });
});

// ═══════════════════════════════════════════════════════════════
//  AUTH  —  login & register (GET renders, POST handles)
// ═══════════════════════════════════════════════════════════════
app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'ورود',
    description: 'ورود به حساب کاربری پزشکت. با شماره موبایل وارد شوید و از خدمات پزشکی آنلاین استفاده کنید.'
  });
});

app.post('/login', (req, res) => {
  // In a real app: validate credentials, create session
  console.log('[Login]', req.body.email);
  res.redirect('/');
});

app.get('/register', (req, res) => {
  res.render('register', { 
    title: 'ثبت‌نام', 
    description: 'ثبت‌نام در پزشکت برای بیماران و پزشکان. دسترسی به خدمات نوبت‌گیری و مشاوره آنلاین.',
    specialties: specialtyList 
  });
});

app.post('/register', (req, res) => {
  // In a real app: hash password, save user, create session
  console.log('[Register]', req.body.firstName, req.body.phone, req.body.userType);
  res.redirect('/');
});

// ═══════════════════════════════════════════════════════════════
//  JSON API  (used by client-side booking form)
// ═══════════════════════════════════════════════════════════════
app.post('/api/appointment', (req, res) => {
  const { doctorId, name, phone, date, time } = req.body;
  if (!doctorId || !name || !phone || !date || !time) {
    return res.status(400).json({ error: 'اطلاعات ناقص است' });
  }
  const ref = 'PZ' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  console.log('[Appointment]', { doctorId, name, phone, date, time, ref });
  res.json({ success: true, ref });
});

app.post('/api/newsletter', (req, res) => {
  console.log('[Newsletter]', req.body.email);
  res.redirect('/articles');
});

// ═══════════════════════════════════════════════════════════════
//  404
// ═══════════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'صفحه یافت نشد',
    description: 'صفحه مورد نظر یافت نشد. لطفاً آدرس را بررسی کنید یا به صفحه اصلی بازگردید.'
  });
});

// ═══════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅  http://localhost:${PORT}`));
