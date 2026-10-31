import { siteTarget } from '../../site-target.mjs';

// 构建期的站点目标（预览或正式）。只有构建期的源地址，没有浏览器端的 API 客户端或凭据。
export const ENDPOINTS = siteTarget(process.env);
