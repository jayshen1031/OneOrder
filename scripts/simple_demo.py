#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OneOrder 简化演示脚本
使用现有API创建演示数据并展示完整业务流程
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8081"

class SimpleDemo:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def create_sample_orders(self, count=10):
        """创建演示订单数据"""
        print(f"🚀 创建 {count} 批次演示订单...")
        
        all_orders = []
        for i in range(count):
            print(f"📝 创建第 {i+1} 批订单...")
            
            try:
                response = self.session.post(f"{BASE_URL}/api/freight-orders/demo/create-sample")
                if response.status_code == 200:
                    orders = response.json()
                    all_orders.extend(orders)
                    print(f"  ✅ 成功创建 {len(orders)} 个订单")
                else:
                    print(f"  ❌ 创建失败: HTTP {response.status_code}")
                
                # 稍微延迟避免太快
                time.sleep(0.5)
                
            except Exception as e:
                print(f"  💥 创建异常: {str(e)}")
        
        print(f"📊 总共创建了 {len(all_orders)} 个订单")
        return all_orders
    
    def simulate_expense_entry(self, order):
        """模拟费用录入过程"""
        order_id = order["orderId"]
        order_no = order["orderNo"]
        
        print(f"💰 模拟订单 {order_no} 费用录入...")
        
        # 基于订单项目生成费用录入数据
        total_income = order.get("totalAmount", 0)
        total_cost = order.get("totalCost", 0)
        
        # 模拟外部收入
        external_income = {
            "ocean_freight": total_income * 0.6,  # 海运费
            "local_charges": total_income * 0.2,  # 本地费用
            "documentation": total_income * 0.1,  # 单证费
            "handling": total_income * 0.1        # 操作费
        }
        
        # 模拟外部支出
        external_expense = {
            "shipping_cost": total_cost * 0.7,    # 船公司费用
            "terminal_cost": total_cost * 0.2,    # 码头费用
            "customs_cost": total_cost * 0.1      # 报关费用
        }
        
        print(f"  📊 模拟收入明细:")
        for item, amount in external_income.items():
            print(f"    - {item}: ${amount:,.2f}")
        
        print(f"  📊 模拟支出明细:")
        for item, amount in external_expense.items():
            print(f"    - {item}: ${amount:,.2f}")
        
        gross_profit = sum(external_income.values()) - sum(external_expense.values())
        profit_margin = (gross_profit / sum(external_income.values()) * 100) if sum(external_income.values()) > 0 else 0
        
        print(f"  💵 毛利润: ${gross_profit:,.2f} ({profit_margin:.1f}%)")
        
        return {
            "order_id": order_id,
            "order_no": order_no,
            "external_income": external_income,
            "external_expense": external_expense,
            "gross_profit": gross_profit,
            "profit_margin": profit_margin
        }
    
    def simulate_management_profit_sharing(self, expense_data):
        """模拟管理账分润计算"""
        print(f"🧮 模拟订单 {expense_data['order_no']} 管理账分润计算...")
        
        gross_profit = expense_data["gross_profit"]
        
        # 模拟分润规则
        sales_commission_rate = 0.15    # 销售部门15%
        operation_commission_rate = 0.10 # 操作部门10%
        
        sales_profit = gross_profit * sales_commission_rate
        operation_profit = gross_profit * operation_commission_rate
        company_profit = gross_profit - sales_profit - operation_profit
        
        print(f"  📊 分润结果:")
        print(f"    - 销售部门分润: ${sales_profit:,.2f}")
        print(f"    - 操作部门分润: ${operation_profit:,.2f}")
        print(f"    - 公司留存利润: ${company_profit:,.2f}")
        
        return {
            "sales_profit": sales_profit,
            "operation_profit": operation_profit,
            "company_profit": company_profit,
            "total_distributed": sales_profit + operation_profit + company_profit
        }
    
    def simulate_clearing_and_passthrough(self, expense_data, profit_sharing):
        """模拟资金流清分和过账处理"""
        print(f"💸 模拟订单 {expense_data['order_no']} 资金流清分+过账处理...")
        
        # 模拟法人实体间资金流
        entities = [
            "海程邦达供应链管理股份有限公司",
            "上海海领供应链管理有限公司", 
            "深圳邦达国际货运代理有限公司"
        ]
        
        total_income = sum(expense_data["external_income"].values())
        total_expense = sum(expense_data["external_expense"].values())
        
        # 星式清分模拟
        clearing_flows = []
        
        # 客户付款到总包公司
        clearing_flows.append({
            "from": "客户",
            "to": entities[0],
            "amount": total_income,
            "type": "外部收入"
        })
        
        # 总包公司支付供应商
        clearing_flows.append({
            "from": entities[0],
            "to": "供应商",
            "amount": total_expense,
            "type": "外部支出"
        })
        
        # 内部分润转账
        clearing_flows.append({
            "from": entities[0],
            "to": entities[1],
            "amount": profit_sharing["sales_profit"],
            "type": "销售分润"
        })
        
        clearing_flows.append({
            "from": entities[0],
            "to": entities[2],
            "amount": profit_sharing["operation_profit"],
            "type": "操作分润"
        })
        
        print(f"  📊 资金流清分结果:")
        for flow in clearing_flows:
            print(f"    - {flow['from']} → {flow['to']}: ${flow['amount']:,.2f} ({flow['type']})")
        
        # 过账处理（模拟轧差结算）
        print(f"  🔄 过账处理: 应用路由规则和轧差结算")
        
        return clearing_flows
    
    def process_order_workflow(self, order):
        """处理单个订单的完整工作流程"""
        order_no = order["orderNo"]
        print(f"\n🎯 开始处理订单: {order_no}")
        print("=" * 50)
        
        # 1. 费用录入
        expense_data = self.simulate_expense_entry(order)
        
        # 2. 管理账分润计算
        profit_sharing = self.simulate_management_profit_sharing(expense_data)
        
        # 3. 资金流清分+过账处理
        clearing_flows = self.simulate_clearing_and_passthrough(expense_data, profit_sharing)
        
        return {
            "order": order,
            "expense_data": expense_data,
            "profit_sharing": profit_sharing,
            "clearing_flows": clearing_flows
        }
    
    def generate_summary_report(self, workflow_results):
        """生成汇总报告"""
        print(f"\n📋 生成业务处理汇总报告...")
        
        total_orders = len(workflow_results)
        total_income = sum(sum(r["expense_data"]["external_income"].values()) for r in workflow_results)
        total_expense = sum(sum(r["expense_data"]["external_expense"].values()) for r in workflow_results)
        total_profit = total_income - total_expense
        avg_profit_margin = (total_profit / total_income * 100) if total_income > 0 else 0
        
        # 分润汇总
        total_sales_profit = sum(r["profit_sharing"]["sales_profit"] for r in workflow_results)
        total_operation_profit = sum(r["profit_sharing"]["operation_profit"] for r in workflow_results)
        total_company_profit = sum(r["profit_sharing"]["company_profit"] for r in workflow_results)
        
        # 业务类型统计
        business_stats = {}
        for result in workflow_results:
            order = result["order"]
            port_route = f"{order['portOfLoading']} → {order['portOfDischarge']}"
            if port_route not in business_stats:
                business_stats[port_route] = {"count": 0, "income": 0}
            business_stats[port_route]["count"] += 1
            business_stats[port_route]["income"] += sum(result["expense_data"]["external_income"].values())
        
        report = {
            "execution_summary": {
                "total_orders": total_orders,
                "execution_time": datetime.now().isoformat(),
                "process_status": "COMPLETED"
            },
            "financial_summary": {
                "total_income": round(total_income, 2),
                "total_expense": round(total_expense, 2),
                "total_profit": round(total_profit, 2),
                "avg_profit_margin": round(avg_profit_margin, 2)
            },
            "profit_sharing_summary": {
                "total_sales_profit": round(total_sales_profit, 2),
                "total_operation_profit": round(total_operation_profit, 2),
                "total_company_profit": round(total_company_profit, 2)
            },
            "business_statistics": business_stats,
            "detailed_results": workflow_results
        }
        
        # 保存报告
        with open("oneorder_demo_report.json", "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 打印摘要
        print(f"📊 业务处理汇总:")
        print(f"   📋 处理订单总数: {total_orders}")
        print(f"   💰 总营收: ${total_income:,.2f}")
        print(f"   💸 总成本: ${total_expense:,.2f}")
        print(f"   💵 总毛利: ${total_profit:,.2f}")
        print(f"   📈 平均毛利率: {avg_profit_margin:.1f}%")
        
        print(f"\n💼 分润汇总:")
        print(f"   📊 销售部门总分润: ${total_sales_profit:,.2f}")
        print(f"   🔧 操作部门总分润: ${total_operation_profit:,.2f}")
        print(f"   🏢 公司留存利润: ${total_company_profit:,.2f}")
        
        print(f"\n🚢 热门航线:")
        for route, stats in sorted(business_stats.items(), key=lambda x: x[1]["income"], reverse=True)[:5]:
            print(f"   {route}: {stats['count']} 票, ${stats['income']:,.2f}")
        
        print(f"\n📄 详细报告已保存至: oneorder_demo_report.json")
        
        return report
    
    def run_complete_demo(self):
        """运行完整演示"""
        print("🚀 OneOrder 业务流程完整演示")
        print("=" * 60)
        print("📝 演示内容:")
        print("   1. 创建演示订单数据")
        print("   2. 模拟完整业务流程:")
        print("      - 接单派单 ✅")
        print("      - 录费处理 🔄")
        print("      - 管理账分润计算 🔄")
        print("      - 资金流清分+过账处理 🔄")
        print("   3. 生成业务汇总报告")
        print("=" * 60)
        
        # 1. 创建演示订单
        sample_orders = self.create_sample_orders(count=5)  # 创建5批，每批3个订单
        
        if not sample_orders:
            print("❌ 没有成功创建订单，演示终止")
            return False
        
        # 2. 处理业务流程
        print(f"\n🔄 开始处理 {len(sample_orders)} 个订单的业务流程...")
        
        workflow_results = []
        for i, order in enumerate(sample_orders, 1):
            print(f"\n⏱️ 进度: {i}/{len(sample_orders)}")
            try:
                result = self.process_order_workflow(order)
                workflow_results.append(result)
                
                # 每处理3个订单暂停一下
                if i % 3 == 0:
                    print(f"⏸️ 已处理 {i} 个订单，暂停 1 秒...")
                    time.sleep(1)
                    
            except Exception as e:
                print(f"💥 处理订单异常: {str(e)}")
        
        # 3. 生成汇总报告
        report = self.generate_summary_report(workflow_results)
        
        print(f"\n🎉 OneOrder业务流程演示完成!")
        print(f"📊 成功处理 {len(workflow_results)} 个订单")
        print(f"🔗 访问系统查看订单: {BASE_URL}/api/freight-order.html")
        
        return True

def main():
    """主函数"""
    demo = SimpleDemo()
    success = demo.run_complete_demo()
    
    if success:
        print(f"\n✅ 演示成功完成！")
        print(f"🌐 系统访问地址:")
        print(f"   📋 订单管理: {BASE_URL}/api/freight-order.html")
        print(f"   🏠 系统概览: {BASE_URL}/api/system-overview.html")
        print(f"   💰 财务清分: {BASE_URL}/api/index.html")
    else:
        print(f"\n❌ 演示过程中遇到问题")

if __name__ == "__main__":
    main()