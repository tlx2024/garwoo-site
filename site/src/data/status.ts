// 各平台的发布状态只有这一个来源：有 public:true 的清单就是“已发布/公开测试”，否则沿用下面声明的默认档。
// 页面、公告条和获取入口共用平台发布状态。
import { loadManifest, type Manifest, type Platform } from '../lib/releases';

export type PlatformState = 'released' | 'invite' | 'planned';

/** 没有公开清单时的状态。依据是产品仓的主张—证据台账；改动要先改台账。 */
const DECLARED: Record<Platform, PlatformState> = { windows: 'invite', android: 'planned' };

export type PlatformStatus = {
  state: PlatformState;
  /** 页面上的状态词：邀请内测 / 公开测试 / 已发布 / 规划中 */
  label: string;
  manifest: Manifest | null;
};

export async function platformStatus(platform: Platform): Promise<PlatformStatus> {
  const found = await loadManifest(platform);
  const manifest = found?.public ? found : null;
  if (manifest) return { state: 'released', label: manifest.channel === 'stable' ? '已发布' : '公开测试', manifest };
  const state = DECLARED[platform];
  return { state, label: state === 'invite' ? '邀请内测' : '规划中', manifest: null };
}

/** Windows 下载页的入口按钮。 */
export async function windowsCta(): Promise<{ label: string; released: boolean; status: string }> {
  const status = await platformStatus('windows');
  return { label: status.state === 'released' ? '下载' : '了解内测', released: status.state === 'released', status: status.label };
}
