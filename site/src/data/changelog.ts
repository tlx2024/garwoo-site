// 更新日志：只列发行版本，只写用户能感知到的变化。开发里程碑不进日志。每个版本以 git tag 为准。
import { platformStatus } from './status';
import { PLATFORMS } from '../lib/releases';

export const releaseAnchor = (release: ReleaseNote) =>
  (release.platform === 'Android' ? 'android-v' : 'v') + release.version;

export async function releaseNotes(): Promise<ReleaseNote[]> {
  const active = await Promise.all(PLATFORMS.map(async platform => {
    const { manifest, label } = await platformStatus(platform);
    if (!manifest) return null;
    const name = platform === 'windows' ? 'Windows' : 'Android';
    const recorded = RELEASES.find(r => r.version === manifest.version && r.platform === name);
    return {
      version: manifest.version, platform: name, date: manifest.published_at.slice(0, 10), label,
      sections: recorded?.sections ?? [{ title: '更新内容', items: manifest.notes }],
    };
  }));
  const published = active.filter(entry => entry !== null);
  const historical = RELEASES.filter(r => !published.some(a => releaseAnchor(a) === releaseAnchor(r)));
  return [...published, ...historical].sort((a, b) => b.date.localeCompare(a.date));
}

export type ReleaseNote = {
  version: string;
  date: string;
  platform: string;
  label?: string;
  sections: { title: string; items: string[] }[];
};

const RELEASES: ReleaseNote[] = [
  {
    "version": "0.2.1",
    "date": "2026-10-31",
    "platform": "Windows",
    "sections": [
      {
        "title": "新增",
        "items": [
          "一句话新建个人智能体，在项目对话里也可以用一句话修改它；从名册里移除智能体时，它的日程自动暂停。",
          "项目对话里能看到这一轮读了哪些资料、读的是哪个版本。",
          "项目页新增工作台抽屉和引用入口；文件页支持分页签、可拖宽的文件树、筛选和行号。",
          "本体包可以带上方法，支持导出参考场景，升级前先预检；配方研发组和隐形眼镜工厂补上了示例团队。",
          "周报和模板报告保留事件证据，支持离线 PDF、客户模板和来源检查。"
        ]
      },
      {
        "title": "改进",
        "items": [
          "官方 AI 拒绝请求时，说明具体原因，不再只提示服务不可用。",
          "深色主题改为分层的中性黑灰。",
          "登录授权完成后的回调页换了界面，并自动关闭或回到首页。",
          "个人版首次启动时预置官方 AI 档位。"
        ]
      },
      {
        "title": "升级注意",
        "items": [
          "安装包尚未做代码签名，Windows 安装时会提示未知发布者，请核对下载页给出的 SHA-256。",
          "手机伴侣与微信小程序不在本版本范围内。"
        ]
      }
    ]
  },
  {
    version: '0.2.0',
    date: '2026-10-28',
    platform: 'Windows',
    sections: [
      {
        "title": "新增",
        "items": [
          "项目对话先查资料再回答：读取项目里的文件、对象和 Wiki，回答带出处，没查到就说没查到。",
          "在对话里提议类型、对象、方法和 Wiki 草稿，进草稿区，你采纳后才生效。",
          "从项目文件里的字段表提出类型与关系草稿。",
          "项目周报：按项目事件生成，改动时保留证据。",
          "日程与委派的结果写回发起的对话。",
          "知识版本采纳、上游资料变化后重新提议；已发布的知识可在项目间共享，也可收回。",
          "版本心跳（可在账号页关闭）、兑换码入账、点击确认后上传诊断包。"
        ]
      },
      {
        "title": "改进",
        "items": [
          "官方 AI 成为桌面端首选的模型入口，自带模型仍可在模型设置里接入。",
          "项目文件页区分扫描件、部分可读和已损坏的文档。",
          "被阻断或暂停的安装版本不再计费。",
          "云端配置经验签后才生效；验签不过保留上一版。",
          "请求鉴权开销降低，打开页面和切换项目更快。"
        ]
      },
      {
        "title": "修复",
        "items": [
          "没有写权限的对象，对话里不再弹出修改对象的确认卡。"
        ]
      },
      {
        "title": "升级注意",
        "items": [
          "安装包尚未做代码签名，Windows 安装时会提示未知发布者，请核对下载页给出的 SHA-256。",
          "手机伴侣与微信小程序不在本版本范围内。"
        ]
      }
    ],
  },
];
