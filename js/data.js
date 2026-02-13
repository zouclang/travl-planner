/**
 * 旅游规划助手 — 示例行程数据
 * 基于截图还原：2026 春节自驾（北京→邯郸→保定→返京，7天）
 *
 * 替换行程：修改此文件中的 TRIP_DATA 即可。
 */

const TRIP_DATA = {
  meta: {
    title: '2026 春节自驾',
    subtitle: '概要行程预览',
    route: '2/17 北京出发 → 邯郸5晚（酒店A/酒店B）→ 2/22保定1晚 → 2/23返京',
    travelers: '2成人+1名4岁儿童',
    startDate: '2026-02-17',
    endDate: '2026-02-23',
    totalDays: 7,
    stats: {
      totalDistance: 1458.8,
      totalDriving: '26小时35分钟',
      tollFees: 355,
      fuelCost: 1094
    },
    budget: {
      range: [6563, 7067],
      includes: '含油费/过路费/餐饮/住宿/门票/停车'
    },
    schedule: {
      departure: '2/17 10:00出发',
      midpoint: '2/22下午到保定',
      return: '2/23 14:00返京'
    }
  },

  /** 路线颜色（按天，与 pyproject.toml 一致） */
  routeColors: ['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0ea5e9', '#ec4899'],

  /** 关键途经点坐标 [lng, lat]（高德坐标系） */
  keyPoints: [
    { name: '北京（出发）', coords: [116.417, 39.968] },
    { name: '邯郸', coords: [114.490, 36.612] },
    { name: '广府古城', coords: [114.694, 36.561] },
    { name: '邯郸方特', coords: [114.432, 36.628] },
    { name: '东太行景区', coords: [113.850, 36.450] },
    { name: '武安', coords: [114.194, 36.696] },
    { name: '娲皇宫', coords: [114.062, 36.544] },
    { name: '响堂山石窟', coords: [114.108, 36.515] },
    { name: '保定', coords: [115.464, 38.874] },
    { name: '直隶总督署', coords: [115.494, 38.874] }
  ],

  days: [
    /* ==================== D1 ==================== */
    {
      day: 1,
      date: '2026-02-17',
      weekday: '周二',
      theme: '北京出发 → 邯郸入住，夜游邯郸道',
      tags: ['长途自驾', '亲子出行'],
      weather: { condition: '多云', high: 5, low: -3 },
      highlights: ['邯郸道历史文化园区'],
      departure: '10:00（固定）',
      hotel: { name: '酒店A', landmark: '学步桥小学' },
      driving: { distance: 472.3, duration: '6小时36分钟', toll: 164, fuel: 354 },
      route: {
        start: { name: '北京', coords: [116.417, 39.968] },
        end: { name: '酒店A（学步桥小学）', coords: [114.490, 36.612] },
        waypoints: [],
        color: '#e11d48'
      },
      timeline: [
        { time: '10:00', event: '北京出发，走京港澳高速（G4）' },
        { time: '12:30', event: '石家庄服务区休息、午餐' },
        { time: '13:30', event: '继续南下前往邯郸' },
        { time: '16:30', event: '到达邯郸，酒店办理入住' },
        { time: '17:30', event: '稍作休息' },
        { time: '18:30', event: '夜游邯郸道历史文化园区' },
        { time: '20:30', event: '返回酒店休息' }
      ],
      attractions: [
        {
          name: '邯郸道历史文化园区',
          level: 'AAA',
          ticket: '免费开放',
          intro: '邯郸道是邯郸市的著名历史文化街区，因"邯郸学步"的成语典故而闻名。园区内汇集了赵文化元素，包括学步桥、回车巷等历史遗迹，夜晚灯光璀璨，适合全家漫步游览。',
          tips: '建议傍晚前往，灯光效果最佳。带小朋友可以在学步桥拍照打卡。冬季注意保暖，园区内有热饮小店。',
          pitfalls: '部分商铺春节期间可能歇业，建议提前备好零食。停车位较紧张，建议步行前往。',
          childTips: '园区地面平坦，推车友好。注意桥面栏杆间距，看护好儿童。'
        }
      ],
      meals: [
        { type: '午餐', suggestion: '石家庄服务区简餐', budget: 80 },
        { type: '晚餐', suggestion: '邯郸道附近特色小吃（驴肉火烧、豆沫等）', budget: 120 }
      ],
      costBreakdown: {
        routes: [
          { segment: '北京 → 邯郸', distance: 472.3, toll: 164, fuel: 354 }
        ],
        budget: {
          住宿: 350,
          门票: 0,
          餐饮: 200,
          停车: 30,
          油费: 354,
          过路费: 164
        },
        totalRange: [1048, 1148]
      }
    },

    /* ==================== D2 ==================== */
    {
      day: 2,
      date: '2026-02-18',
      weekday: '周三',
      theme: '邯郸市博物馆 + 广府古城（必去组合）',
      tags: ['文化历史', '亲子出行'],
      weather: { condition: '晴', high: 8, low: -2 },
      highlights: ['邯郸市博物馆', '广府古城'],
      departure: '09:00',
      hotel: { name: '酒店A', landmark: '学步桥小学' },
      driving: { distance: 62.7, duration: '2小时34分钟', toll: 0, fuel: 47 },
      route: {
        start: { name: '酒店A', coords: [114.490, 36.612] },
        end: { name: '酒店A', coords: [114.490, 36.612] },
        waypoints: [
          { name: '邯郸市博物馆', coords: [114.482, 36.618] },
          { name: '广府古城', coords: [114.694, 36.561] }
        ],
        color: '#2563eb'
      },
      timeline: [
        { time: '09:00', event: '酒店出发，前往邯郸市博物馆' },
        { time: '09:30', event: '参观邯郸市博物馆（预计2小时）' },
        { time: '11:30', event: '博物馆附近午餐' },
        { time: '13:00', event: '驱车前往广府古城' },
        { time: '13:40', event: '游览广府古城（城墙、弘济桥、武禹襄故居）' },
        { time: '17:00', event: '返回邯郸市区' },
        { time: '18:00', event: '晚餐、休息' }
      ],
      attractions: [
        {
          name: '邯郸市博物馆',
          level: '国家一级博物馆',
          ticket: '免费（需预约）',
          intro: '邯郸市博物馆是了解赵文化和邯郸历史的最佳场所。馆内藏有大量战国时期赵国文物，包括青铜器、玉器和陶器。"赵文化"专题展厅尤为精彩，适合带孩子了解历史典故。',
          tips: '建议预留2小时参观。语音导览可在公众号免费获取。周一闭馆，建议提前在公众号预约。',
          pitfalls: '春节期间开放时间可能调整，出发前确认。馆内禁止使用闪光灯。',
          childTips: '适合4岁以上儿童，可以讲"将相和"、"完璧归赵"等成语故事增加趣味。'
        },
        {
          name: '广府古城',
          level: 'AAAAA',
          ticket: '进城免费，城墙+景点联票65元/人',
          intro: '广府古城是中国保存最完好的古城之一，拥有完整的护城河和城墙。城内有武禹襄故居、杨露禅故居等太极拳文化遗址，是太极拳的发源地。冬日古城别有韵味，游人较少。',
          tips: '建议登城墙俯瞰全景，护城河冬季可能结冰，景色独特。古城内有多家特色面馆。',
          pitfalls: '古城内道路为石板路，推车通行稍有不便。部分景点春节可能临时调整开放时间。',
          childTips: '城墙台阶较陡，需牵好小朋友。4岁儿童免门票。'
        }
      ],
      meals: [
        { type: '午餐', suggestion: '博物馆附近餐厅', budget: 100 },
        { type: '晚餐', suggestion: '邯郸特色菜（一篓油水饺、磁县焖子）', budget: 130 }
      ],
      costBreakdown: {
        routes: [
          { segment: '酒店A → 博物馆', distance: 3.2, toll: 0, fuel: 2 },
          { segment: '博物馆 → 广府古城', distance: 26.5, toll: 0, fuel: 20 },
          { segment: '广府古城 → 酒店A', distance: 33.0, toll: 0, fuel: 25 }
        ],
        budget: {
          住宿: 350,
          门票: 130,
          餐饮: 230,
          停车: 20,
          油费: 47,
          过路费: 0
        },
        totalRange: [727, 827]
      }
    },

    /* ==================== D3 ==================== */
    {
      day: 3,
      date: '2026-02-19',
      weekday: '周四',
      theme: '邯郸方特国色春秋（整日）',
      tags: ['主题乐园', '亲子必去'],
      weather: { condition: '晴', high: 10, low: 0 },
      highlights: ['邯郸方特国色春秋'],
      departure: '09:00',
      hotel: { name: '酒店A', landmark: '学步桥小学' },
      driving: { distance: 100.0, duration: '2小时37分钟', toll: 19, fuel: 75 },
      route: {
        start: { name: '酒店A', coords: [114.490, 36.612] },
        end: { name: '酒店A', coords: [114.490, 36.612] },
        waypoints: [
          { name: '邯郸方特国色春秋', coords: [114.432, 36.628] }
        ],
        color: '#16a34a'
      },
      timeline: [
        { time: '09:00', event: '酒店出发，前往方特乐园' },
        { time: '09:30', event: '到达方特，入园' },
        { time: '09:45', event: '体验"女娲补天"（必玩项目）' },
        { time: '11:00', event: '游览"九州神韵"4D影院' },
        { time: '12:00', event: '园内午餐' },
        { time: '13:30', event: '体验"牛郎织女"、"孟姜女"等项目' },
        { time: '16:00', event: '观看花车巡游（如有）' },
        { time: '17:00', event: '离园返回酒店' },
        { time: '18:30', event: '邯郸市区晚餐' }
      ],
      attractions: [
        {
          name: '邯郸方特国色春秋',
          level: 'AAAA',
          ticket: '标准票280元/人，儿童票（1.1-1.4m）199元',
          intro: '以华夏历史文明和邯郸地域文化为创意基础的高科技主题乐园。园内包含"女娲补天"、"九州神韵"等40余个主题项目，融合4D、巨幕等技术，非常适合亲子游玩。春节期间有特色灯会和演出。',
          tips: '建议先玩热门项目"女娲补天"和"九州神韵"，避开午后排队高峰。下载方特App可查看实时排队时间。春节期间营业时间通常延长至20:00。',
          pitfalls: '部分刺激项目有身高限制（1.1m以上），4岁小朋友可玩的项目约60%。园内餐饮偏贵，可自带零食。春节高峰期停车场可能紧张，建议早到。',
          childTips: '推荐"熊出没剧场"、"嘟比农庄"等亲子项目。园内可租借婴儿车。注意保暖，室外项目排队时较冷。'
        }
      ],
      meals: [
        { type: '午餐', suggestion: '方特园内餐厅', budget: 150 },
        { type: '晚餐', suggestion: '邯郸市区（烤鸭、家常菜）', budget: 130 }
      ],
      costBreakdown: {
        routes: [
          { segment: '酒店A → 方特', distance: 48.0, toll: 10, fuel: 36 },
          { segment: '方特 → 酒店A', distance: 52.0, toll: 9, fuel: 39 }
        ],
        budget: {
          住宿: 350,
          门票: 759,
          餐饮: 280,
          停车: 30,
          油费: 75,
          过路费: 19
        },
        totalRange: [1463, 1563]
      }
    },

    /* ==================== D4 ==================== */
    {
      day: 4,
      date: '2026-02-20',
      weekday: '周五',
      theme: '东太行景区（整日）+ 晚上换住酒店B',
      tags: ['自然风光', '带4岁儿童'],
      weather: { condition: '晴', high: 10, low: 1 },
      highlights: ['东太行景区'],
      departure: '09:00',
      hotel: { name: '酒店B', landmark: '武安市第十中学' },
      driving: { distance: 111.2, duration: '2小时33分钟', toll: 0, fuel: 83 },
      route: {
        start: { name: '酒店A（学步桥小学）', coords: [114.490, 36.612] },
        end: { name: '酒店B（武安市第十中学）', coords: [114.194, 36.696] },
        waypoints: [
          { name: '东太行景区', coords: [113.850, 36.450] }
        ],
        color: '#f59e0b'
      },
      timeline: [
        { time: '09:00', event: '酒店A出发，前往东太行' },
        { time: '10:00-16:00', event: '东太行景区（栈道+从黑梯）' },
        { time: '16:00-17:00', event: '前往武安市办理入住酒店B' },
        { time: '18:00', event: '武安市区晚餐' }
      ],
      attractions: [
        {
          name: '东太行景区',
          level: 'AAAAA',
          ticket: '门票+索道联票150元/人（儿童1.2m以下免门票，索道半价）',
          intro: '东太行景区位于太行山东麓，以"太行天路"玻璃栈道闻名。景区内有悬崖栈道、丛林穿越、九曲十八弯等特色景点，海拔约1400米，可俯瞰太行山脉全景。冬季山顶可能有积雪，景色壮观。适合全家徒步和拍照打卡，是亲子出游的优质选择。也是大年初四出游放松心情的理想去处。',
          tips: '地势攻略：主景台入口出发，乘索道上山。上午阳光好，适合"太行天路"玻璃栈道拍照。建议顺时针游览路线：索道上站→太行天路→九曲十八弯→丛林栈道→索道下站。全程约4-5小时。',
          pitfalls: '冬季山顶气温低（可能-5℃），务必穿厚外套和防滑鞋。玻璃栈道段需额外购买鞋套（5元），排队可能较长。山上餐饮选择有限且偏贵，建议自带干粮和热水。',
          childTips: '4岁儿童建议乘索道上下，减少体力消耗。玻璃栈道段需大人牵好。注意防风保暖，准备好帽子手套。部分陡峭路段可使用背带。大门入口到索道站约需步行15分钟，可使用景区接驳车。'
        }
      ],
      meals: [
        { type: '午餐', suggestion: '景区内简餐/自带干粮', budget: 100 },
        { type: '晚餐', suggestion: '武安市区（武安拽面、驴肉）', budget: 120 }
      ],
      costBreakdown: {
        routes: [
          { segment: '酒店A → 东太行景区', distance: 64.1, toll: 0, fuel: 48 },
          { segment: '东太行景区 → 酒店B', distance: 47.1, toll: 0, fuel: 35 }
        ],
        budget: {
          住宿: 350,
          门票: 310,
          餐饮: 220,
          停车: 20,
          油费: 83,
          过路费: 0
        },
        totalRange: [933, 1033]
      }
    },

    /* ==================== D5 ==================== */
    {
      day: 5,
      date: '2026-02-21',
      weekday: '周六',
      theme: '娲皇宫（整日）+ 傍晚顺路到大洼村加餐',
      tags: ['文化古迹', '亲子出行'],
      weather: { condition: '多云', high: 8, low: -1 },
      highlights: ['娲皇宫', '大洼村'],
      departure: '09:00',
      hotel: { name: '酒店B', landmark: '武安市第十中学' },
      driving: { distance: 151.2, duration: '3小时40分钟', toll: 0, fuel: 113 },
      route: {
        start: { name: '酒店B', coords: [114.194, 36.696] },
        end: { name: '酒店B', coords: [114.194, 36.696] },
        waypoints: [
          { name: '娲皇宫', coords: [114.062, 36.544] },
          { name: '大洼村', coords: [113.950, 36.550] }
        ],
        color: '#7c3aed'
      },
      timeline: [
        { time: '09:00', event: '酒店B出发，前往娲皇宫' },
        { time: '10:00', event: '到达娲皇宫景区' },
        { time: '10:15-14:00', event: '游览娲皇宫（主殿、补天阁、石刻）' },
        { time: '14:00', event: '景区午餐' },
        { time: '15:00', event: '驱车前往大洼村' },
        { time: '16:00', event: '游览大洼村（石头村落、传统民居）' },
        { time: '17:30', event: '大洼村农家餐' },
        { time: '19:00', event: '返回酒店B' }
      ],
      attractions: [
        {
          name: '娲皇宫',
          level: 'AAAAA',
          ticket: '70元/人（儿童1.2m以下免票）',
          intro: '娲皇宫是全国规模最大的祭祀女娲的古建筑群，始建于北齐，距今已有1400多年历史。主殿悬挂于半山腰悬崖之上，被誉为"天造地设之境"。景区内有摩崖石刻、补天阁、女娲塑像等。',
          tips: '建议上午游览，光线最佳。主殿区域台阶较多，预留充足时间。山顶有观景台，可远眺太行山。',
          pitfalls: '冬季部分步道可能有冰，注意防滑。景区较大，全程需3-4小时。春节期间香火旺盛，人流量大。',
          childTips: '主殿台阶陡峭，4岁儿童需大人抱或背。准备好保暖衣物。可给孩子讲"女娲补天"的故事增加兴趣。'
        },
        {
          name: '大洼村',
          level: '传统村落',
          ticket: '免费',
          intro: '大洼村是太行山深处的传统石头村落，村内建筑全部由当地石材砌筑，保留了完整的太行山区传统民居风貌。村内有石板路、石头院、石磨等传统生活遗迹，非常适合摄影和体验乡村慢生活。',
          tips: '适合傍晚到访，夕阳下石头村落非常上镜。村内有朴素的农家餐，推荐尝试当地手工面和山野菜。',
          pitfalls: '村内道路为石板路，不适合推车。冬季天黑较早（约17:30），注意合理安排时间。',
          childTips: '石板路不平整，注意脚下安全。可以让小朋友体验推石磨等互动项目。'
        }
      ],
      meals: [
        { type: '午餐', suggestion: '娲皇宫景区附近', budget: 100 },
        { type: '晚餐', suggestion: '大洼村农家菜（山野菜、手工面）', budget: 80 }
      ],
      costBreakdown: {
        routes: [
          { segment: '酒店B → 娲皇宫', distance: 55.0, toll: 0, fuel: 41 },
          { segment: '娲皇宫 → 大洼村', distance: 35.2, toll: 0, fuel: 26 },
          { segment: '大洼村 → 酒店B', distance: 61.0, toll: 0, fuel: 46 }
        ],
        budget: {
          住宿: 350,
          门票: 140,
          餐饮: 180,
          停车: 20,
          油费: 113,
          过路费: 0
        },
        totalRange: [753, 853]
      }
    },

    /* ==================== D6 ==================== */
    {
      day: 6,
      date: '2026-02-22',
      weekday: '周日',
      theme: '上午响堂山石窟，下午开车到保定',
      tags: ['文化古迹', '长途转移'],
      weather: { condition: '晴', high: 9, low: -1 },
      highlights: ['响堂山石窟'],
      departure: '09:00',
      hotel: { name: '保定住宿点', landmark: '实验小学' },
      driving: { distance: 374.3, duration: '4小时54分钟', toll: 125, fuel: 281 },
      route: {
        start: { name: '酒店B（武安）', coords: [114.194, 36.696] },
        end: { name: '保定住宿点', coords: [115.464, 38.874] },
        waypoints: [
          { name: '响堂山石窟', coords: [114.108, 36.515] }
        ],
        color: '#0ea5e9'
      },
      timeline: [
        { time: '09:00', event: '酒店B出发，前往响堂山石窟' },
        { time: '09:40', event: '到达响堂山石窟' },
        { time: '10:00-12:00', event: '游览响堂山石窟（南响堂主区）' },
        { time: '12:30', event: '附近午餐' },
        { time: '13:30', event: '出发前往保定（约3小时车程）' },
        { time: '16:30', event: '到达保定，办理入住' },
        { time: '18:00', event: '保定市区晚餐（直隶官府菜）' }
      ],
      attractions: [
        {
          name: '响堂山石窟',
          level: 'AAAA（全国重点文物保护单位）',
          ticket: '35元/人（儿童1.2m以下免票）',
          intro: '响堂山石窟始凿于北齐，是与云冈、龙门齐名的中国三大皇家石窟之一。南窟共有七窟，保存有大量精美的石刻造像和壁画。石窟依山而建，气势恢宏，是中国石窟艺术的重要代表。',
          tips: '建议重点游览1号窟和3号窟，造像最为精美。全程参观约1.5-2小时。有讲解员可预约（50元/次），推荐。冬季游客少，可以安静欣赏。',
          pitfalls: '石窟内光线较暗，建议带手电或用手机辅助照明。台阶较多且部分路段较陡。',
          childTips: '可以让孩子数石窟里的佛像，增加互动趣味。注意石窟内不能触摸文物。'
        }
      ],
      meals: [
        { type: '午餐', suggestion: '响堂山附近农家菜', budget: 80 },
        { type: '晚餐', suggestion: '保定直隶官府菜/驴肉火烧', budget: 150 }
      ],
      costBreakdown: {
        routes: [
          { segment: '酒店B → 响堂山石窟', distance: 28.0, toll: 0, fuel: 21 },
          { segment: '响堂山石窟 → 保定', distance: 346.3, toll: 125, fuel: 260 }
        ],
        budget: {
          住宿: 350,
          门票: 70,
          餐饮: 230,
          停车: 20,
          油费: 281,
          过路费: 125
        },
        totalRange: [1026, 1126]
      }
    },

    /* ==================== D7 ==================== */
    {
      day: 7,
      date: '2026-02-23',
      weekday: '周一',
      theme: '上午直隶总督署，14:00从保定返京',
      tags: ['文化历史', '返程'],
      weather: { condition: '晴', high: 7, low: -2 },
      highlights: ['直隶总督署'],
      departure: '09:00（14:00返京固定）',
      hotel: { name: '当日返京', landmark: '不再新增住宿' },
      driving: { distance: 187.2, duration: '4小时11分钟', toll: 47, fuel: 140 },
      route: {
        start: { name: '保定住宿点', coords: [115.464, 38.874] },
        end: { name: '北京', coords: [116.417, 39.968] },
        waypoints: [
          { name: '直隶总督署', coords: [115.494, 38.874] }
        ],
        color: '#ec4899'
      },
      timeline: [
        { time: '09:00', event: '酒店退房，前往直隶总督署' },
        { time: '09:20', event: '参观直隶总督署（约2小时）' },
        { time: '11:30', event: '保定市区午餐' },
        { time: '12:30', event: '稍作休整，准备返程' },
        { time: '14:00', event: '保定出发返京（固定时间）' },
        { time: '18:00', event: '预计到达北京' }
      ],
      attractions: [
        {
          name: '直隶总督署',
          level: 'AAAA（全国重点文物保护单位）',
          ticket: '30元/人（儿童1.2m以下免票）',
          intro: '直隶总督署是中国保存最完整的一座清代省级衙署，始建于雍正年间。这里曾是直隶省(今河北省)的最高行政机构，先后有李鸿章、曾国藩等74位知名总督在此就任。建筑群规模宏大，保存完好，展示了清代官衙文化。',
          tips: '建议预留1.5-2小时参观。重点看大堂、仪门和后花园。可租借语音导览（20元），内容详实。出门后可顺路逛保定老城区。',
          pitfalls: '春节假期最后一天可能人较多。周一可能调整开放时间，提前确认。',
          childTips: '可以跟孩子讲"清官"的故事。署内空间开阔，适合小朋友跑动。注意看护好儿童，部分展品不能触摸。'
        }
      ],
      meals: [
        { type: '午餐', suggestion: '保定老字号（白运章包子、驴肉火烧）', budget: 100 },
        { type: '路上零食', suggestion: '高速服务区备些简单食物', budget: 50 }
      ],
      costBreakdown: {
        routes: [
          { segment: '保定 → 直隶总督署', distance: 3.0, toll: 0, fuel: 2 },
          { segment: '直隶总督署 → 北京', distance: 184.2, toll: 47, fuel: 138 }
        ],
        budget: {
          住宿: 0,
          门票: 60,
          餐饮: 150,
          停车: 10,
          油费: 140,
          过路费: 47
        },
        totalRange: [357, 457]
      }
    }
  ]
};
