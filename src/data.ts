export type MapId = 'town' | 'coast' | 'forest';
export type TimeId = 'day' | 'sunset' | 'night';
export type WeatherId = 'clear' | 'rain' | 'snow';
export interface Word { text: string; hint: string }
export interface Book { id: string; name: string; subtitle: string; language: 'en' | 'zh'; color: string; words: Word[]; custom?: boolean }
const en = (lines: string): Word[] => lines.trim().split('\n').map(line => { const [text, hint] = line.split('|'); return { text, hint }; });
export const BOOKS: Book[] = [
  { id: 'daily', name: '日常的微小美好', subtitle: '英语 · 60 词 · 入门', language: 'en', color: '#e2b870', words: en(`breeze|微风
coffee|咖啡
morning|早晨
sunshine|阳光
journey|旅程
garden|花园
flower|花朵
gentle|温柔的
window|窗户
friend|朋友
smile|微笑
dream|梦想
summer|夏天
forest|森林
river|河流
ocean|海洋
little|小小的
happy|快乐的
music|音乐
rainbow|彩虹
relax|放松
bright|明亮的
simple|简单的
quiet|安静的
lovely|可爱的
travel|旅行
green|绿色
cloud|云朵
rain|雨
warm|温暖的
orange|橙子
bicycle|自行车
street|街道
light|光
sunset|日落
hello|你好
welcome|欢迎
story|故事
hope|希望
peace|平静
freedom|自由
wonder|惊喜
picnic|野餐
lemon|柠檬
sweet|甜蜜的
walk|散步
home|家
paper|纸张
letter|信
book|书
star|星星
moon|月亮
night|夜晚
spring|春天
autumn|秋天
winter|冬天
listen|倾听
remember|记住
tomorrow|明天
beautiful|美丽的`) },
  { id: 'academic', name: '向更远处出发', subtitle: '英语 · 40 词 · 进阶', language: 'en', color: '#9ab6ac', words: en(`explore|探索
achieve|实现
ensure|确保
inspire|启发
creative|有创造力的
discover|发现
knowledge|知识
experience|经验
perspective|视角
essential|必不可少的
benefit|益处
challenge|挑战
develop|发展
environment|环境
opportunity|机会
potential|潜力
research|研究
sustainable|可持续的
community|社区
significant|重要的
evaluate|评价
approach|方法
evidence|证据
identify|识别
strategy|策略
influence|影响
analyze|分析
resource|资源
individual|个人
contribute|贡献
improve|改善
balance|平衡
objective|目标
efficient|高效的
practice|练习
progress|进步
curiosity|好奇心
confidence|信心
adventure|冒险
possibility|可能性`) },
  { id: 'chinese', name: '把日子过成诗', subtitle: '中文 · 40 词 · 意境', language: 'zh', color: '#c6a1a0', words: en(`春风|春日里轻柔的风
微光|细小而温柔的光芒
山海|高山与大海
远方|旅途尚未抵达的地方
晴空|没有云遮挡的天空
清晨|太阳刚刚升起的时候
骑行|踏着脚踏车向前
花开|花朵舒展的时刻
自在|无拘无束的状态
温柔|柔和、体贴的态度
夏日|阳光明亮的季节
森林|一片树木的世界
海岸|陆地与海洋交汇处
晚霞|日落时天边的色彩
星河|满天繁星像一条河
月光|夜里来自月亮的光
雨后|一场雨结束以后
小巷|城市里狭窄的街道
旅途|出发到抵达之间
自由|按照心意生活
你好|相遇时的问候
快乐|心里的欢喜
梦想|心中想要实现的事
希望|对未来的美好期待
时光|流动的时间
宁静|没有喧闹的平和
风景|一路看见的美好
故事|值得讲述的经历
明天|今天之后的日子
朋友|一起分享生活的人
漫步|慢慢地散步
落叶|离开枝头的叶子
细雨|轻轻飘落的小雨
暖阳|温暖的阳光
归途|回家的路
相遇|两个世界的碰面
心动|内心突然的悸动
流云|天空缓缓移动的云
竹林|成片的竹子
未来|还没有到来的时间`) }
];
export const MAPS: { id: MapId; name: string; en: string; description: string; color: string; icon: string }[] = [
  { id: 'town', name: '晴日街区', en: 'SUNNY NEIGHBORHOOD', description: '拐过街角，遇见一杯好心情。', color: '#cfa77d', icon: 'town' },
  { id: 'coast', name: '海风来信', en: 'COASTAL LETTERS', description: '椰影、白沙与浪花，让夏天慢下来。', color: '#75a8b8', icon: 'wave' },
  { id: 'forest', name: '林间小路', en: 'INTO THE WOODS', description: '经过森林小屋，和林间的小动物打个招呼。', color: '#839d78', icon: 'tree' }
];
export const RIDERS = [
  { id: 'lin', kind: 'student', name: '林小满', en: 'AFTER SCHOOL', description: '层叠栗色短发、金边校服与红色帆布鞋。书包里藏着刚买的唱片。', jacket: '#234ca5', hat: '#422a26', hair: '#422a26', skin: '#f4c898', bike: '#308cec' },
  { id: 'mango', kind: 'mango', name: '芒芒', en: 'SUNSHINE EXPRESS', description: '方块长耳、巧克力鼻子和翘尾巴，像素肚皮装满今天的阳光。', jacket: '#f7d16b', hat: '#f7d16b', hair: '#f7d16b', skin: '#f7d16b', bike: '#1abebc' },
  { id: 'pudding', kind: 'pudding', name: '布丁', en: 'SLOW DAYS, FAST FEET', description: '肥大的方块伙伴，宽厚身躯、奶油色大肚皮和绿色眼睛陪你出发。', jacket: '#f0cb7a', hat: '#f0cb7a', hair: '#f0cb7a', skin: '#f0cb7a', bike: '#eb7656' }
];
export interface Settings {
  map: MapId; time: TimeId; weather: WeatherId; rider: number;
  book: string; mode: 'endless' | 'book'; practice: 'read' | 'listen';
  chapter: number; music: boolean; effects: boolean; volume: number; quality: 'auto' | 'low' | 'high';
}
export const DEFAULT_SETTINGS: Settings = { map: 'town', time: 'day', weather: 'clear', rider: 0, book: 'daily', mode: 'endless', practice: 'read', chapter: 0, music: true, effects: true, volume: 0.45, quality: 'auto' };
export interface RideRecord { id: number; date: string; distance: number; wpm: number; accuracy: number; words: number; combo: number; duration: number; won: boolean; book: string; map: MapId; language: string; mode: string; practice: string }
export interface SaveData { settings: Settings; records: RideRecord[]; mistakes: Record<string, number>; customBooks: Book[]; unlocked: string[]; totals: { rides: number; distance: number; bestDistance: number } }
const STORAGE_KEY = 'type-and-ride-v1';
export function loadSave(): SaveData {
  const fallback = { settings: { ...DEFAULT_SETTINGS }, records: [], mistakes: {}, customBooks: [], unlocked: [], totals: { rides: 0, distance: 0, bestDistance: 0 } };
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!data || typeof data !== 'object') return fallback;
    const s = { ...DEFAULT_SETTINGS, ...data.settings };
    if (!MAPS.some(m => m.id === s.map)) s.map = 'town';
    if (!['day', 'sunset', 'night'].includes(s.time)) s.time = 'day';
    if (!['clear', 'rain', 'snow'].includes(s.weather)) s.weather = 'clear';
    // Old numeric slots 1/2 belonged to retired characters; new saves remember a stable character ID.
    const rememberedRider = RIDERS.findIndex(r => r.id === data.settings?.riderId);
    s.rider = rememberedRider >= 0 ? rememberedRider : 0;
    if (!['endless', 'book'].includes(s.mode)) s.mode = 'endless';
    if (!['read', 'listen'].includes(s.practice)) s.practice = 'read';
    if (!['auto', 'low', 'high'].includes(s.quality)) s.quality = 'auto';
    s.volume = Number.isFinite(s.volume) ? Math.max(0, Math.min(1, s.volume)) : 0.45;
    s.chapter = Number.isInteger(s.chapter) && s.chapter >= 0 ? s.chapter : 0;
    s.music = typeof s.music === 'boolean' ? s.music : true;
    s.effects = typeof s.effects === 'boolean' ? s.effects : true;
    const customBooks = Array.isArray(data.customBooks) ? data.customBooks.filter((b: Book) => b && typeof b.id === 'string' && typeof b.name === 'string' && ['en', 'zh'].includes(b.language) && Array.isArray(b.words) && b.words.length && b.words.every(w => typeof w.text === 'string' && typeof w.hint === 'string')).slice(0, 20) : [];
    for (const b of customBooks) if (!/^#[0-9a-fA-F]{6}$/.test(b.color)) b.color = '#a8b6a0';
    const selectedBook = [...BOOKS, ...customBooks].find(b => b.id === s.book);
    if (!selectedBook) s.book = 'daily';
    s.chapter = Math.min(Math.ceil((selectedBook || BOOKS[0]).words.length / 12) - 1, s.chapter);
    const records = Array.isArray(data.records) ? data.records.filter((r: RideRecord) => r && Number.isFinite(r.distance) && Number.isFinite(r.wpm) && Number.isFinite(r.accuracy) && Number.isFinite(r.words) && Number.isFinite(r.combo) && Number.isFinite(r.duration) && typeof r.date === 'string').slice(0, 100) : [];
    const mistakes: Record<string, number> = {};
    if (data.mistakes && typeof data.mistakes === 'object') for (const [k, v] of Object.entries(data.mistakes)) if (typeof v === 'number' && Number.isFinite(v) && v > 0) mistakes[k] = v;
    const unlocked = Array.isArray(data.unlocked) ? data.unlocked.filter((v: unknown) => typeof v === 'string') : [];
    const totals = {
      rides: Number.isFinite(data.totals?.rides) && data.totals.rides >= records.length ? data.totals.rides : records.length,
      distance: Number.isFinite(data.totals?.distance) && data.totals.distance >= 0 ? data.totals.distance : records.reduce((sum: number, r: RideRecord) => sum + r.distance, 0),
      bestDistance: Number.isFinite(data.totals?.bestDistance) && data.totals.bestDistance >= 0 ? data.totals.bestDistance : Math.max(0, ...records.map((r: RideRecord) => r.distance))
    };
    return { settings: s, records, mistakes, customBooks, unlocked, totals };
  } catch { return fallback; }
}
export function persist(data: SaveData): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, settings: { ...data.settings, riderId: RIDERS[data.settings.rider]?.id || 'lin' } })); return true; } catch { return false; }
}
export function chapterWords(book: Book, chapter: number): Word[] {
  const count = Math.ceil(book.words.length / 12);
  const safe = Math.min(count - 1, Math.max(0, chapter));
  return book.words.slice(safe * 12, (safe + 1) * 12);
}
export function parseBook(raw: string, name: string, language: 'en' | 'zh'): Book {
  const words = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const parts = line.split(/[|\t]/); const text = parts[0].trim().normalize('NFC');
    return { text, hint: parts.slice(1).join(' ').trim() || (language === 'zh' ? '自定义中文词条' : '自定义词条') };
  }).filter(w => w.text.length > 0 && w.text.length <= 48).slice(0, 1000);
  if (!words.length) throw new Error('请至少填写一个词条，每行一个。');
  return { id: `custom-${Date.now()}`, name: name.trim().slice(0, 24) || '我的随身词本', subtitle: `${language === 'en' ? '英语' : '中文'} · ${words.length} 词 · 自定义`, color: '#a8b6a0', language, words, custom: true };
}
export const ACHIEVEMENTS = [
  { name: '风的起点', description: '完成第一次骑行', icon: 'flag', test: (rs: RideRecord[]) => rs.length > 0 },
  { name: '渐入佳境', description: '单次骑行 500 米', icon: 'bike', test: (rs: RideRecord[]) => rs.some(r => r.distance >= 500) },
  { name: '指尖的风', description: '达到平均 40 WPM', icon: 'wind', test: (rs: RideRecord[]) => rs.some(r => r.wpm >= 40 && r.duration >= 15) },
  { name: '一气呵成', description: '连续正确输入 50 字符', icon: 'spark', test: (rs: RideRecord[]) => rs.some(r => r.combo >= 50) },
  { name: '字字认真', description: '10 个词，准确率 100%', icon: 'target', test: (rs: RideRecord[]) => rs.some(r => r.accuracy === 100 && r.words >= 10) },
  { name: '翻过一章', description: '完成一个词本章节', icon: 'book', test: (rs: RideRecord[]) => rs.some(r => r.won) },
  { name: '山海之间', description: '骑过全部三张地图', icon: 'map', test: (rs: RideRecord[]) => MAPS.every(m => rs.some(r => r.map === m.id)) },
  { name: '中文也浪漫', description: '完成一次中文骑行', icon: 'flower', test: (rs: RideRecord[]) => rs.some(r => r.language === 'zh' && r.words >= 5) }
];
