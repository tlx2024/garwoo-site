// Public walkthroughs based on the seven synthetic example folders.
// Outputs describe the intended task, not a completed live model run.
export const PROJECT_STORIES = [
  {id:'patent', name:'专利审查', folder:'patent-review', role:'专利审查助手', goal:'这份技术方案，哪些参数需要复核？', files:['专利 / 冷却液流量自适应控制装置.md','规范 / 冷却系统流量控制要求.md','参数对照.csv','审查要点.md'], task:'逐条对照技术参数与规范，列出一致、冲突和缺少依据的内容。', result:'参数对照与审查意见草稿', decision:'审阅人核对适用条款，确认最终意见。', fact:'示例里，回水温度上限写了 85 ℃，规范要求不超过 80 ℃。'},
  {id:'cooling', name:'冷却数据校验', folder:'cooling-check', role:'数据校验员', goal:'这批运行数据，能直接用于分析吗？', files:['规程 / 冷却系统校验规程.md','台账 / 设备台账.csv','数据 / 运行数据.csv'], task:'按规程检查单位、限值、缺测与设备编号，定位需要复核的数据行。', result:'问题行与校验依据清单', decision:'工程师核实原始数据，再决定如何使用。', fact:'同一份示例数据中同时出现 ℃ 和 ℉，比较限值前需要统一单位。'},
  {id:'pump', name:'泵站维护', folder:'pump-maintenance', role:'维护秘书', goal:'本周先检查哪台泵？', files:['维护记录.csv','巡检表.md','手册 / 离心泵保养要点.md'], task:'结合保养周期和巡检记录，汇总到期项目与待复查异常。', result:'按设备整理的维护事项', decision:'站长确认现场情况，安排检查与派工。', fact:'P3 的前次记录是“异响，待复查”，后次记录是“振动上升”。'},
  {id:'software', name:'软件开发', folder:'software-dev', role:'代码审查员', goal:'这次提交，还缺哪些测试？', files:['docs / 需求.md','src / unit_convert.py','tests / test_unit_convert.py'], task:'对照需求检查源码与测试，指出边界情况和错误路径的覆盖缺口。', result:'审查意见与补测建议', decision:'开发者修改代码，执行测试后再提交。', fact:'示例要求未知单位与跨类别换算报错，审查需要对应到具体条款。'},
  {id:'recipe', name:'配方研发', folder:'recipe-rnd', role:'配方实验记录员', goal:'下一轮实验，先补测什么？', files:['目标.md','配比表.csv','物料规格.md','实验记录 / 批次记录.csv'], task:'把配方与批次对应起来，按目标比较实测结果，单独列出缺测指标。', result:'配方对比与待补实验清单', decision:'研发人员确定下一轮实验，不把缺测写成达标。', fact:'F-03 的粘度与对比率已有记录，耐擦洗仍待测。'},
  {id:'weekly', name:'项目周报', folder:'weekly-report', role:'周报助手', goal:'这周做到了哪里，还有什么风险？', files:['任务清单.csv','会议纪要 / 周会.md','模板 / 周报模板.md'], task:'按周报要求整理进展，注明出处，把冲突和未确认事项单独列出。', result:'周报草稿与待确认事项', decision:'负责人确认进展和日期，再自行发送。', fact:'任务表与纪要对迁移完成日期的描述不同，需要负责人确认。'},
  {id:'video', name:'产品视频', folder:'product-video', role:'分镜校对员', goal:'开拍之前，哪些镜头还要改？', files:['产品事实表.csv','分镜脚本.md','素材清单.csv'], task:'逐镜核对产品参数与素材，列出内容差异和缺少的画面。', result:'带镜号的修改与补素材清单', decision:'制作人员核实参数，修改脚本后再制作。', fact:'事实表的精度是 ±0.5%，脚本写成了 ±0.2%，两处需要核对。'},
];
