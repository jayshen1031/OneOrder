#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海运货代费用科目整理和分析工具
分析现有费用科目数据，通过互联网研究补充详细信息，生成标准化费用科目表
"""

import pandas as pd
import requests
import json
import time
import os
from typing import Dict, List, Set, Tuple
import re

class FreightCostAnalyzer:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.frequency_data = None
        self.comprehensive_data = None  
        self.cost_categories = None
        self.service_list = None
        self.unique_costs = set()
        self.merged_costs = []
        
    def load_data(self):
        """加载所有源数据"""
        print("=== 加载数据文件 ===")
        
        # 加载费用名称按频次分类
        freq_file = os.path.join(self.base_dir, "utf8_费用名称按频次分类.csv")
        self.frequency_data = pd.read_csv(freq_file)
        print(f"费用名称按频次分类: {self.frequency_data.shape[0]} 条记录")
        
        # 加载费用梳理-总表
        comp_file = os.path.join(self.base_dir, "utf8_费用梳理-总表.csv")
        self.comprehensive_data = pd.read_csv(comp_file)
        print(f"费用梳理-总表: {self.comprehensive_data.shape[0]} 条记录")
        
        # 加载费用分类
        cat_file = os.path.join(self.base_dir, "utf8_费用分类.csv")
        self.cost_categories = pd.read_csv(cat_file)
        print(f"费用分类: {self.cost_categories.shape[0]} 个分类")
        
        # 加载海运服务列表
        service_file = os.path.join(self.base_dir, "utf8_海运服务列表.csv")
        self.service_list = pd.read_csv(service_file)
        print(f"海运服务列表: {self.service_list.shape[0]} 个服务")
        
    def extract_unique_costs(self):
        """从两个源文件提取完整的费用名称列表"""
        print("\n=== 提取费用科目列表 ===")
        
        # 从费用名称按频次分类提取
        freq_costs = set()
        if not self.frequency_data.empty and '标准化费用名称' in self.frequency_data.columns:
            # 跳过标题行和空值
            freq_data = self.frequency_data[self.frequency_data['标准化费用名称'] != '标准化费用名称']
            freq_data = freq_data.dropna(subset=['标准化费用名称'])
            
            for _, row in freq_data.iterrows():
                cost_name = str(row['标准化费用名称']).strip()
                if cost_name and cost_name not in ['标准化费用名称', 'nan']:
                    freq_costs.add(cost_name)
                    # 提取费用代码
                    cost_code = str(row.get('费用代码', '')).strip()
                    if cost_code and cost_code != 'nan':
                        self.merged_costs.append({
                            'name': cost_name,
                            'code': cost_code,
                            'source': '频次分类',
                            'origin_port': '√' if str(row.get('起运港', '')).strip() == '√' else '',
                            'sea_transport': '√' if str(row.get('海运段', '')).strip() == '√' else '',
                            'dest_port': '√' if str(row.get('目的港', '')).strip() == '√' else '',
                        })
        
        print(f"从频次分类文件提取: {len(freq_costs)} 个费用科目")
        
        # 从费用梳理-总表提取
        comp_costs = set()
        if not self.comprehensive_data.empty and '费用名称（中）' in self.comprehensive_data.columns:
            comp_data = self.comprehensive_data.dropna(subset=['费用名称（中）'])
            
            for _, row in comp_data.iterrows():
                cost_name = str(row['费用名称（中）']).strip()
                if cost_name and cost_name not in ['费用名称（中）', 'nan']:
                    comp_costs.add(cost_name)
                    
                    # 查找是否已存在
                    existing = None
                    for cost in self.merged_costs:
                        if cost['name'] == cost_name:
                            existing = cost
                            break
                    
                    if not existing:
                        self.merged_costs.append({
                            'name': cost_name,
                            'code': str(row.get('对应的结算费用编码', '')).strip(),
                            'source': '总表',
                            'english_name': str(row.get('费用名称（英文）', '')).strip() if pd.notna(row.get('费用名称（英文）')) else '',
                            'abbreviation': str(row.get('缩写', '')).strip() if pd.notna(row.get('缩写')) else '',
                            'supplier': str(row.get('最终由谁收取（供应商)', '')).strip() if pd.notna(row.get('最终由谁收取（供应商)')) else '',
                            'parent_category': str(row.get('父记录', '')).strip() if pd.notna(row.get('父记录')) else '',
                        })
                    else:
                        # 补充信息
                        if not existing.get('english_name'):
                            existing['english_name'] = str(row.get('费用名称（英文）', '')).strip() if pd.notna(row.get('费用名称（英文）')) else ''
                        if not existing.get('abbreviation'):
                            existing['abbreviation'] = str(row.get('缩写', '')).strip() if pd.notna(row.get('缩写')) else ''
                        if not existing.get('supplier'):
                            existing['supplier'] = str(row.get('最终由谁收取（供应商)', '')).strip() if pd.notna(row.get('最终由谁收取（供应商)')) else ''
        
        print(f"从总表文件提取: {len(comp_costs)} 个费用科目")
        
        # 合并去重
        self.unique_costs = freq_costs.union(comp_costs)
        print(f"合计去重后: {len(self.unique_costs)} 个独特费用科目")
        
        return self.unique_costs
    
    def research_cost_concept(self, cost_name: str) -> Dict[str, str]:
        """通过互联网研究费用科目概念"""
        # 这里应该调用网络搜索API，但为了演示，我们使用预定义的概念
        # 在实际实现中，可以使用搜索引擎API或知识库API
        
        concepts = {
            # 跨境运输费用
            '燃油附加费': {
                'zh_desc': '因燃油价格波动而收取的附加费用，通常由船公司根据燃油市场价格变化进行调整，以弥补燃油成本上涨带来的损失。在海运整柜出口中，这是最常见的附加费之一。',
                'en_desc': 'Fuel surcharge imposed due to fuel price fluctuations, typically adjusted by shipping lines based on fuel market price changes to offset losses from rising fuel costs. This is one of the most common surcharges in container shipping.',
                'category': '跨境运输费用',
                'supplier': '船公司',
                'scenarios': '所有海运航线，价格随国际油价波动'
            },
            '海运费': {
                'zh_desc': '承运人承运货物的基本运输费用，是海运服务的核心收费项目。通常按照集装箱规格和航线距离计算，是货代业务中最主要的成本构成。',
                'en_desc': 'Basic transportation charges for carrying cargo by sea, the core service fee for maritime transport. Usually calculated based on container specifications and route distance, constituting the primary cost component in freight forwarding.',
                'category': '跨境运输费用',
                'supplier': '船公司',
                'scenarios': '所有海运出口业务的基础费用'
            },
            '报关费': {
                'zh_desc': '委托报关行或报关员办理货物出口报关手续所收取的服务费用。包括单证审核、报关单填制、与海关沟通等专业服务。',
                'en_desc': 'Service fee charged by customs brokers for handling export customs clearance procedures, including document review, customs declaration preparation, and communication with customs authorities.',
                'category': '关检费用',
                'supplier': '报关行',
                'scenarios': '所有需要报关的出口货物'
            },
            '码头操作费': {
                'zh_desc': '码头对集装箱进行装卸、堆存、理货等操作收取的费用。分为起运港码头操作费(OTHC)和目的港码头操作费(DTHC)。',
                'en_desc': 'Terminal handling charges for container loading/unloading, storage, and cargo handling operations. Divided into Origin Terminal Handling Charge (OTHC) and Destination Terminal Handling Charge (DTHC).',
                'category': '码头/港口/场站费用',
                'supplier': '码头/场站',
                'scenarios': '集装箱在码头的装卸和操作环节'
            },
        }
        
        return concepts.get(cost_name, {
            'zh_desc': f'{cost_name}相关的费用，具体概念待进一步研究补充。',
            'en_desc': f'Charges related to {cost_name}, detailed concept to be researched and supplemented.',
            'category': '待分类',
            'supplier': '待确认',
            'scenarios': '待研究'
        })
    
    def categorize_costs(self):
        """对费用科目进行分类"""
        print("\n=== 费用科目分类 ===")
        
        categorized_costs = []
        
        for cost_data in self.merged_costs:
            cost_name = cost_data['name']
            
            # 研究费用概念
            concept = self.research_cost_concept(cost_name)
            
            # 基于费用名称进行智能分类
            category = self._smart_categorize(cost_name, concept)
            
            categorized_cost = {
                **cost_data,
                'category': category,
                'zh_description': concept.get('zh_desc', ''),
                'en_description': concept.get('en_desc', ''),
                'supplier_type': concept.get('supplier', cost_data.get('supplier', '')),
                'scenarios': concept.get('scenarios', '')
            }
            
            categorized_costs.append(categorized_cost)
        
        self.merged_costs = categorized_costs
        return categorized_costs
    
    def _smart_categorize(self, cost_name: str, concept: Dict) -> str:
        """基于费用名称和概念的智能分类"""
        
        # 预定义关键词分类规则
        category_rules = {
            '跨境运输费用': ['海运费', '空运费', '铁路运费', '燃油', '附加费', 'BAF', 'CAF', 'PSS', 'GRI', 'CIC'],
            '集装箱费用': ['箱', '租箱', '提箱', '放箱', '押箱', '售箱', '洗箱', '修箱', '改装', '铅封'],
            '码头/港口/场站费用': ['码头', '港口', '场站', 'THC', '港杂', '堆存', '倒箱', '吊装', '搬倒'],
            '装卸费用': ['装卸', '理货', '装箱', '拆箱', '出库', '入库'],
            '境内运输费用': ['陆运', '拖车', '送货', '提货', '短驳', '停车', '待时', '油费'],
            '货物附加费用': ['危险品', '超重', '超限', '超尺寸'],
            '保险费用': ['保险'],
            '关检费用': ['报关', '转关', '报检', '查验', '关税', '增值税', '滞报', '退关'],
            '仓储费用': ['仓储', '仓库', '库前', '出入库'],
            '单证文件费用': ['单证', '文件', '电放', '换单', '舱单', 'VGM', '申报', '签证'],
            '设备使用及租赁费用': ['叉车', 'GPS', '设备', '租赁'],
            '增值服务费用': ['包装', '熏蒸', '消毒', '贴标', '加固', '托盘'],
            '人工费用': ['人工'],
            '利润分配': ['佣金', '分成', '返还'],
            '特殊科目': ['包干', '服务费', '门到门']
        }
        
        # 如果概念中已经指定了分类，优先使用
        if concept.get('category') and concept['category'] != '待分类':
            return concept['category']
        
        # 基于关键词匹配
        for category, keywords in category_rules.items():
            for keyword in keywords:
                if keyword in cost_name:
                    return category
        
        return '特殊科目'  # 默认分类
    
    def match_services(self):
        """将费用科目与海运服务环节进行匹配"""
        print("\n=== 费用科目与服务环节匹配 ===")
        
        # 预定义费用科目与服务的匹配规则
        service_rules = {
            '拖车': ['拖车', '陆运', '短驳', '送货', '提货'],
            '报关': ['报关', '转关', '报检', '关税', '增值税', '查验'],
            '仓储': ['仓储', '堆存', '入库', '出库', '库前'],
            '驳船': ['驳船', '内支线'],
            '国内铁路': ['铁路', '铁运'],
            '保险': ['保险'],
            '内装': ['装箱', '装货', '内装'],
            '舱单': ['舱单'],
            'HBL': ['HBL', '分单'],
            'MBL': ['MBL', '主单'],
            '订舱': ['订舱'],
            '换单': ['换单', '电放'],
            '清关': ['清关', '目的港报关'],
            '派送': ['派送', '送货'],
            '目的港仓储': ['目的港仓储'],
            '托盘': ['托盘'],
            '加固': ['加固'],
            '贴唛': ['贴标', '贴唛'],
            '熏蒸': ['熏蒸'],
            '质量控制': ['质量', '监理', '检查'],
            '设备保护': ['设备']
        }
        
        for cost_data in self.merged_costs:
            cost_name = cost_data['name']
            matched_services = []
            
            for service, keywords in service_rules.items():
                for keyword in keywords:
                    if keyword in cost_name:
                        matched_services.append(service)
                        break
            
            cost_data['matched_services'] = ','.join(matched_services) if matched_services else ''
        
        return self.merged_costs
    
    def generate_output_files(self):
        """生成最终的输出文件"""
        print("\n=== 生成输出文件 ===")
        
        # 创建输出目录
        output_dir = os.path.join(self.base_dir, "..", "版本2输出结果")
        os.makedirs(output_dir, exist_ok=True)
        
        # 生成全局费用科目-字段表
        cost_df = pd.DataFrame([
            {
                '全局费用编码': f'FC{str(i+1).zfill(4)}',
                '中文费用名称': cost['name'],
                '英文费用名称': cost.get('english_name', ''),
                '助记符': cost.get('abbreviation', ''),
                '默认币种': 'CNY',
                '默认应/免税': '应税',
                '可选开票类型': '专票/普票',
                '所属费用分类': cost.get('category', '特殊科目'),
                '对应的服务': cost.get('matched_services', ''),
                '对应的供应商类型': cost.get('supplier_type', ''),
                '对应的财务科目': '',
                '需提供的单据': '',
                '科目说明': cost.get('zh_description', ''),
                '收付方向': '应付',
                '原系统编码': cost.get('code', ''),
                '科目说明英文': cost.get('en_description', '')
            }
            for i, cost in enumerate(self.merged_costs)
        ])
        
        cost_output = os.path.join(output_dir, "全局费用科目-字段表.csv")
        cost_df.to_csv(cost_output, index=False, encoding='utf-8-sig')
        print(f"已生成: {cost_output}")
        
        # 生成增强的海运服务列表
        enhanced_services = []
        service_descriptions = {
            '拖车': '负责集装箱在陆地的短途运输，连接港口码头与货主工厂/仓库，是多式联运的重要环节。执行人：拖车公司/运输公司。',
            '报关': '向海关申报出口货物信息，办理通关手续。包括单证审核、税费计算、与海关沟通。执行人：报关行/报关员。',
            '仓储': '提供货物临时存储、分拣、配送等仓储服务。执行人：仓储公司/第三方物流公司。',
            '驳船': '通过内河水路运输连接内陆与海港，适用于长江等内河航道。执行人：驳船公司/内河运输公司。',
            '国内铁路': '利用铁路网络进行货物运输，连接内陆城市与沿海港口。执行人：铁路公司/铁路物流公司。',
            '保险': '为货物运输过程提供风险保障，承保运输途中的各类损失。执行人：保险公司/保险代理。',
            '内装': '在发货人工厂或指定地点将货物装入集装箱。执行人：装箱队/货代公司。',
            '舱单': '向海关申报船舶载运货物的舱单信息，是海运必备程序。执行人：船公司/船代。',
            'HBL': '货代签发给货主的运输单据，是货代与货主之间的运输合同。执行人：货代公司。',
            'MBL': '船公司签发的主提单，是承运人与托运人的运输合同。执行人：船公司/船代。',
            '订舱': '向船公司预订舱位和集装箱，确保货物能够按期装船。执行人：货代公司。',
            '换单': '在目的港用海运提单换取提货单，获得提取货物的权利。执行人：船代/目的港代理。',
            '清关': '在目的港向当地海关申报进口货物，办理清关手续。执行人：目的港代理/清关行。',
            '派送': '将货物从港口运输到收货人指定地点。执行人：拖车公司/派送公司。',
            '目的港仓储': '在目的港提供货物仓储、分拨等服务。执行人：目的港仓储公司。',
            '托盘': '提供托盘包装服务，便于货物装卸和堆垛。执行人：包装公司/货代。',
            '加固': '对货物进行加固包装，防止运输过程中损坏。执行人：包装公司/专业加固队。',
            '贴唛': '在货物包装上贴附运输标识和收货人信息。执行人：仓储公司/包装工。',
            '熏蒸': '对木质包装或货物进行除虫杀菌处理，符合进口国植检要求。执行人：熏蒸公司。',
            '质量控制': '对货物质量、包装等进行检验监督。执行人：检验公司/质检机构。',
            '设备保护': '为运输设备提供防护和维护服务。执行人：设备维护公司。'
        }
        
        for _, row in self.service_list.iterrows():
            service_name = row['服务']
            enhanced_services.append({
                '服务段': row['服务段'],
                '服务': service_name,
                '服务描述': service_descriptions.get(service_name, f'{service_name}相关服务，具体描述待补充。')
            })
        
        service_df = pd.DataFrame(enhanced_services)
        service_output = os.path.join(output_dir, "海运服务列表.csv")
        service_df.to_csv(service_output, index=False, encoding='utf-8-sig')
        print(f"已生成: {service_output}")
        
        # 生成分析报告
        self._generate_report(output_dir)
        
        return cost_output, service_output
    
    def _generate_report(self, output_dir: str):
        """生成分析报告"""
        report_content = f"""# 海运货代费用科目整理报告

## 数据统计
- 总费用科目数: {len(self.merged_costs)}
- 费用分类数: {len(self.cost_categories)}
- 服务环节数: {len(self.service_list)}

## 费用分类统计
"""
        
        # 统计各分类的费用数量
        category_stats = {}
        for cost in self.merged_costs:
            category = cost.get('category', '未分类')
            category_stats[category] = category_stats.get(category, 0) + 1
        
        for category, count in sorted(category_stats.items()):
            report_content += f"- {category}: {count}个费用科目\n"
        
        report_content += f"""
## 服务匹配统计
- 已匹配服务的费用科目: {len([c for c in self.merged_costs if c.get('matched_services')])}
- 未匹配服务的费用科目: {len([c for c in self.merged_costs if not c.get('matched_services')])}

## 数据源分析
- 频次分类文件贡献: {len([c for c in self.merged_costs if c.get('source') == '频次分类'])}个费用科目
- 总表文件贡献: {len([c for c in self.merged_costs if c.get('source') == '总表'])}个费用科目

## 建议
1. 对未分类的费用科目进行人工审核
2. 补充缺失的英文名称和简写
3. 完善供应商类型信息
4. 验证服务环节匹配的准确性
"""
        
        report_file = os.path.join(output_dir, "费用科目整理报告.md")
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        print(f"已生成分析报告: {report_file}")
    
    def run_analysis(self):
        """执行完整的费用科目分析流程"""
        print("开始海运货代费用科目整理分析...")
        
        # 加载数据
        self.load_data()
        
        # 提取费用科目
        self.extract_unique_costs()
        
        # 分类费用科目
        self.categorize_costs()
        
        # 匹配服务环节
        self.match_services()
        
        # 生成输出文件
        cost_file, service_file = self.generate_output_files()
        
        print(f"\n=== 分析完成 ===")
        print(f"处理了 {len(self.merged_costs)} 个费用科目")
        print(f"生成文件:")
        print(f"  - {cost_file}")
        print(f"  - {service_file}")
        
        return True

def main():
    """主函数"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    analyzer = FreightCostAnalyzer(base_dir)
    
    try:
        analyzer.run_analysis()
        print("\n✅ 费用科目整理完成！")
    except Exception as e:
        print(f"\n❌ 分析过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()