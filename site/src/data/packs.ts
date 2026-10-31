// 起步包与示例项目。起步包数据对齐产品仓 market/catalog.json 的 1.1.0（版本、计数、体积），说明文字取自原 packs.ts。
// 1.1.0 的变化按 1.0.0 → 1.1.0 的计数差写出。

export const PACK_VERSION = '1.1.0';
export const PACK_DATE = '2026-10-28';
export const PACK_PUBLISHER = 'IAI 官方';
export const PACK_LICENSE = 'CC-BY-4.0';
export const COUNT_LABELS = ['类型', '示例对象', '出处文章', '能力问题', '智能体', '驾驶舱'] as const;

export type Pack = {
  slug: string; title: string; sub: string; domain: string; tags: string[]; size: number; minApp: string;
  counts: number[]; desc: string[]; hl: string[]; perm: string[]; grants: string; chg: string[];
  icon: string; keywords: string;
};

export const PACKS: Pack[] = [
  {
    "slug": "contact-lens-factory",
    "title": "隐形眼镜工厂起步包",
    "sub": "从原料、工序到质检的离散制造示例世界",
    "domain": "离散制造",
    "tags": [
      "隐形眼镜",
      "离散制造",
      "质检",
      "SOP",
      "设备"
    ],
    "size": 103398,
    "minApp": "0.2.0",
    "counts": [
      7,
      28,
      12,
      12,
      3,
      1
    ],
    "desc": [
      "以干湿双线隐形眼镜工厂为样本，覆盖产线、工序/工位、检测、缺陷、Spec、SOP、案例与设备八类对象。",
      "装入后能看到从工位交接、缺陷归因到检测规范的完整示例，并可在数据孪生中映射产线与车间。所有示例对象都带〔示例〕标记，可以随时清理后重新装回。"
    ],
    "hl": [
      "7 个类型覆盖产线、工位、检测、缺陷、设备与 SOP",
      "28 个带〔示例〕标记的对象，装完即可浏览与问答",
      "12 篇测试文章作为出处，回答时可以引用",
      "3 位智能体、1 个驾驶舱；含参考场景，可映射到数据孪生"
    ],
    "perm": [
      "alarm:read",
      "field:report"
    ],
    "grants": "安装时会授予 alarm:read、field:report 与本人资源树管理权限（resources:manage）。",
    "chg": [
      "新增 3 位智能体、1 个驾驶舱和 2 个方法。",
      "1.0.0：首个随客户端分发的官方精选版本：干湿双线工厂的产线、工位、检测与缺陷示例。"
    ],
    "icon": "building",
    "keywords": "离散制造 隐形眼镜 工厂 产线 质检 SOP 设备"
  },
  {
    "slug": "formulation-team",
    "title": "配方研发组起步包",
    "sub": "配方、实验批次与表征结果的研发协作世界",
    "domain": "研发实验",
    "tags": [
      "配方",
      "实验",
      "表征",
      "研发",
      "批次"
    ],
    "size": 161492,
    "minApp": "0.2.0",
    "counts": [
      10,
      153,
      14,
      10,
      3,
      1
    ],
    "desc": [
      "以配方演化脉络、实验批次与关键理化指标为核心，覆盖研发项目、配方、实验、表征结果、性能指标、物料、工艺路线、研发工站与样品批次。",
      "装入后可以对比配方版本、追溯实验批次与原料去向，并查看由示例数据生成的 Wiki 对象页和驾驶舱。示例对象都带〔示例〕标记，可清理后恢复。"
    ],
    "hl": [
      "配方版本与实验批次可追溯",
      "153 个示例对象覆盖原料、实验与表征结果",
      "14 篇测试文章作为出处",
      "3 位智能体、1 个示例驾驶舱"
    ],
    "perm": [
      "rnd:data:read",
      "rnd:data:write",
      "rnd:formula:view",
      "rnd:project:manage"
    ],
    "grants": "安装时会授予 rnd:data:read、rnd:data:write、rnd:formula:view、rnd:project:manage 与本人资源树管理权限（resources:manage）。",
    "chg": [
      "新增 3 位智能体和 2 个方法。",
      "1.0.0：首个随客户端分发的官方精选版本：配方、实验与表征的研发协作示例。"
    ],
    "icon": "flask",
    "keywords": "研发实验 配方 实验 表征 批次 原料"
  },
  {
    "slug": "personal-opc",
    "title": "一人公司起步包",
    "sub": "一个人加 AI 代理经营的业务本体",
    "domain": "组织经营",
    "tags": [
      "一人公司",
      "创业",
      "AI 代理",
      "项目",
      "交付"
    ],
    "size": 97052,
    "minApp": "0.2.0",
    "counts": [
      13,
      34,
      9,
      13,
      5,
      1
    ],
    "desc": [
      "把一人公司的业务范畴、AI 代理画像、委托契约、流程、任务、交付成果、线索、营销活动与收支等经营要素放进同一套本体。",
      "装入后可以按部门与岗位组织 AI 代理，留下委托与签批记录，并生成对象 Wiki 页与经营驾驶舱。示例对象与示例智能体都带〔示例〕标记，可在「我的包」里清理。"
    ],
    "hl": [
      "13 个类型覆盖创始人、虚拟部门、委托契约与交付成果",
      "5 个示例智能体，展示一个人如何组织 AI 代理",
      "34 个示例对象与 9 篇测试文章",
      "含 1 个经营驾驶舱"
    ],
    "perm": [
      "data:read",
      "ontology:model"
    ],
    "grants": "本包含 5 个示例智能体；安装时会授予 data:read、ontology:model 与本人资源树管理权限（resources:manage），并按现有个人版策略启用示例智能体。",
    "chg": [
      "新增 2 个方法。",
      "1.0.0：首个随客户端分发的官方精选版本：一人公司的组织、委托与交付示例。"
    ],
    "icon": "users",
    "keywords": "组织经营 一人公司 销售 市场 会计 委托 交付"
  }
];

export type Example = { title: string; icon: string; keywords: string; tag: string };

/** 七个示例项目。未随安装包提供，页面上一律标“规划中”。 */
export const EXAMPLES: Example[] = [
  {
    "title": "专利审查",
    "icon": "file",
    "keywords": "示例项目 专利 审查 规范 冷却",
    "tag": "示例项目 · 规划中"
  },
  {
    "title": "冷却系统数据校验",
    "icon": "wave",
    "keywords": "示例项目 离散制造 冷却 校验 设备 数据",
    "tag": "示例项目 · 规划中"
  },
  {
    "title": "泵站维护",
    "icon": "pump",
    "keywords": "示例项目 离散制造 泵站 维护 保养",
    "tag": "示例项目 · 规划中"
  },
  {
    "title": "单位换算库开发",
    "icon": "code",
    "keywords": "示例项目 研发实验 软件 代码 测试 单位换算",
    "tag": "示例项目 · 规划中"
  },
  {
    "title": "水性涂料配方研发",
    "icon": "flask",
    "keywords": "示例项目 研发实验 配方 涂料",
    "tag": "示例项目 · 规划中"
  },
  {
    "title": "项目周报",
    "icon": "chart",
    "keywords": "示例项目 组织经营 周报 项目管理",
    "tag": "示例项目 · 规划中"
  },
  {
    "title": "产品宣传片分镜",
    "icon": "video",
    "keywords": "示例项目 组织经营 视频 分镜",
    "tag": "示例项目 · 规划中"
  }
];
