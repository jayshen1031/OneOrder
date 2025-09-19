#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OneOrder 完整业务流程执行器
执行：录费 → 管理账分润计算 → 资金流清分+过账处理
"""

import requests
import json
import random
import time
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

# 配置
BASE_URL = "http://localhost:8081"
API_BASE = f"{BASE_URL}/api"

class WorkflowExecutor:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # 费用科目配置
        self.fee_codes = {
            "FCL001": {"name": "海运费", "category": "跨境运输费用", "service": "MBL_PROCESSING"},
            "THC001": {"name": "码头操作费", "category": "码头港口场站费用", "service": "TERMINAL_HANDLING"},
            "CUSTOMS001": {"name": "报关费", "category": "单证文件费用", "service": "CUSTOMS_DECLARATION"},
            "TRUCKING001": {"name": "拖车费", "category": "境内运输费用", "service": "INLAND_TRANSPORT"},
            "BAF001": {"name": "燃油附加费", "category": "跨境运输费用", "service": "MBL_PROCESSING"},
            "CFS001": {"name": "拼箱费", "category": "集装箱费用", "service": "TERMINAL_HANDLING"},
            "WAREHOUSE001": {"name": "仓储费", "category": "仓储服务费用", "service": "WAREHOUSE_SERVICE"}
        }
        
        # 法人实体配置
        self.legal_entities = [
            {"id": "HCBD_SHANGHAI", "name": "海程邦达物流(上海)有限公司"},
            {"id": "HCBD_BEIJING", "name": "海程邦达物流(北京)有限公司"},
            {"id": "HCBD_SHENZHEN", "name": "海程邦达物流(深圳)有限公司"},
            {"id": "HCBD_HONGKONG", "name": "海程邦达物流(香港)有限公司"},
            {"id": "HCBD_SINGAPORE", "name": "海程邦达物流(新加坡)有限公司"}
        ]
        
        # 真实供应商数据
        self.suppliers = [
            {"id": "SUPP_001", "name": "CONG TY TNHH OCEAN NETWORK EXPRESS (VIETNAM)", "type": "SHIPPING_COMPANY"},
            {"id": "SUPP_002", "name": "CONG TY CO PHAN CMA-CGM VIETNAM", "type": "SHIPPING_COMPANY"},
            {"id": "SUPP_003", "name": "CONG TY TNHH WAN HAI VIETNAM", "type": "SHIPPING_COMPANY"},
            {"id": "SUPP_004", "name": "CONG TY TNHH MAERSK VIETNAM", "type": "SHIPPING_COMPANY"},
            {"id": "SUPP_005", "name": "CÔNG TY TNHH DỊCH VỤ VẬN TẢI NHƯ Ý", "type": "TRUCKING_COMPANY"},
            {"id": "SUPP_006", "name": "NGUYEN LONG TRANSPORT FORWARDING SERVICE TRADING COMPANY LIMITED", "type": "CUSTOMS_BROKER"}
        ]
    
    def call_api(self, endpoint, method="GET", data=None):
        """调用API"""
        url = f"{API_BASE}{endpoint}"
        try:
            if method == "POST":
                response = self.session.post(url, json=data)
            elif method == "PUT":
                response = self.session.put(url, json=data)
            elif method == "DELETE":
                response = self.session.delete(url)
            else:
                response = self.session.get(url)
            
            if response.status_code in [200, 201]:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_existing_orders(self):
        """获取现有订单列表"""
        print("📋 获取现有订单列表...")
        
        result = self.call_api("/freight-orders?page=0&size=200")
        if result["success"]:
            orders = result["data"]
            print(f"✅ 找到 {len(orders)} 个订单")
            return orders
        else:
            print(f"❌ 获取订单失败: {result['error']}")
            return []
    
    def generate_expense_entries(self, order):
        """为订单生成费用录入数据"""
        order_id = order.get("orderId") or order.get("id")
        order_no = order.get("orderNo")
        business_type = order.get("businessType", "SEA_EXPORT")
        
        entries = []
        
        # 计算基础金额
        base_amount = order.get("totalAmount", 20000)
        container_count = random.randint(1, 3)
        
        # 选择适合业务类型的费用科目
        applicable_fees = list(self.fee_codes.keys())
        if business_type in ["SEA_EXPORT", "SEA_IMPORT"]:
            applicable_fees = ["FCL001", "THC001", "BAF001", "CUSTOMS001", "TRUCKING001"]
        elif business_type in ["AIR_EXPORT", "AIR_IMPORT"]:
            applicable_fees = ["CUSTOMS001", "TRUCKING001", "WAREHOUSE001"]
        
        # 生成外部收入明细
        total_income = 0
        for i, fee_code in enumerate(applicable_fees[:4]):  # 最多4个收入项
            fee_info = self.fee_codes[fee_code]
            amount = random.randint(2000, 8000) * container_count
            total_income += amount
            
            entries.append({
                "orderId": order_id,
                "orderNo": order_no,
                "entryType": "RECEIVABLE",  # 应收（外部收入）
                "feeCode": fee_code,
                "feeName": fee_info["name"],
                "serviceCode": fee_info["service"],
                "amount": amount,
                "currency": "CNY",
                "counterpartyType": "CUSTOMER",
                "counterpartyId": f"CUST_{random.randint(1, 10):03d}",
                "counterpartyName": "客户公司",
                "ourEntityId": random.choice(self.legal_entities)["id"],
                "description": f"向客户收取 - {fee_info['name']}",
                "entryDate": datetime.now().isoformat(),
                "paymentTerms": "T/T 30 DAYS",
                "remarks": f"业务类型: {business_type}, 箱数: {container_count}"
            })
        
        # 生成外部支出明细
        total_expense = 0
        for i, fee_code in enumerate(applicable_fees[:3]):  # 最多3个支出项
            fee_info = self.fee_codes[fee_code]
            supplier = random.choice(self.suppliers)
            amount = random.randint(1500, 6000) * container_count
            total_expense += amount
            
            entries.append({
                "orderId": order_id,
                "orderNo": order_no,
                "entryType": "PAYABLE",  # 应付（外部支出）
                "feeCode": fee_code,
                "feeName": fee_info["name"],
                "serviceCode": fee_info["service"],
                "amount": amount,
                "currency": "CNY",
                "counterpartyType": "SUPPLIER",
                "counterpartyId": supplier["id"],
                "counterpartyName": supplier["name"],
                "supplierType": supplier["type"],
                "ourEntityId": random.choice(self.legal_entities)["id"],
                "description": f"向供应商支付 - {fee_info['name']}",
                "entryDate": datetime.now().isoformat(),
                "paymentTerms": "T/T 15 DAYS",
                "remarks": f"供应商类型: {supplier['type']}, 箱数: {container_count}"
            })
        
        gross_profit = total_income - total_expense
        profit_margin = (gross_profit / total_income * 100) if total_income > 0 else 0
        
        return entries, {
            "total_income": total_income,
            "total_expense": total_expense,
            "gross_profit": gross_profit,
            "profit_margin": profit_margin
        }
    
    def execute_expense_entry(self, order):
        """执行费用录入流程"""
        order_id = order.get("orderId") or order.get("id")
        order_no = order.get("orderNo")
        
        print(f"💰 处理订单 {order_no} 费用录入...")
        
        # 生成费用明细
        entries, summary = self.generate_expense_entries(order)
        
        # 逐条录入费用明细
        success_count = 0
        failed_count = 0
        
        for entry in entries:
            result = self.call_api("/expense-entries", "POST", entry)
            if result["success"]:
                success_count += 1
                entry_type = "收入" if entry["entryType"] == "RECEIVABLE" else "支出"
                print(f"  ✅ {entry_type} - {entry['feeName']}: ¥{entry['amount']:,}")
            else:
                failed_count += 1
                print(f"  ❌ 录入失败: {result['error']}")
        
        # 完成录费
        if success_count > 0:
            complete_result = self.call_api(f"/expense-entries/complete/{order_id}", "POST")
            if complete_result["success"]:
                print(f"  ✅ 录费完成 - 总收入: ¥{summary['total_income']:,}, 总支出: ¥{summary['total_expense']:,}, 毛利: ¥{summary['gross_profit']:,} ({summary['profit_margin']:.1f}%)")
                return True, summary
            else:
                print(f"  ❌ 完成录费失败: {complete_result['error']}")
        
        return False, summary
    
    def execute_management_profit_sharing(self, order):
        """执行管理账分润计算"""
        order_id = order.get("orderId") or order.get("id")
        order_no = order.get("orderNo")
        
        print(f"🧮 执行订单 {order_no} 管理账分润计算...")
        
        # 调用管理账分润计算API
        result = self.call_api(f"/profit-sharing/management/{order_id}", "POST")
        if result["success"]:
            data = result["data"]
            print(f"  ✅ 管理账分润计算完成")
            if "profitSharingResults" in data:
                results = data["profitSharingResults"]
                for dept_result in results:
                    dept_name = dept_result.get("departmentName", "未知部门")
                    dept_profit = dept_result.get("departmentProfit", 0)
                    print(f"    📊 {dept_name}: ¥{dept_profit:,}")
            return True, data
        else:
            print(f"  ❌ 管理账分润计算失败: {result['error']}")
            return False, {}
    
    def execute_clearing_process(self, order):
        """执行资金流清分处理"""
        order_id = order.get("orderId") or order.get("id")
        order_no = order.get("orderNo")
        
        print(f"💸 执行订单 {order_no} 资金流清分...")
        
        # 调用资金流清分API
        result = self.call_api(f"/clearing-processing/financial/{order_id}", "POST", {
            "clearingMode": "STAR",  # 星式清分
            "includePassthrough": True
        })
        
        if result["success"]:
            data = result["data"]
            print(f"  ✅ 资金流清分完成")
            if "clearingResults" in data:
                results = data["clearingResults"]
                for clearing_result in results:
                    from_entity = clearing_result.get("fromEntityName", "未知")
                    to_entity = clearing_result.get("toEntityName", "未知")
                    amount = clearing_result.get("amount", 0)
                    print(f"    💱 {from_entity} → {to_entity}: ¥{amount:,}")
            return True, data
        else:
            print(f"  ❌ 资金流清分失败: {result['error']}")
            return False, {}
    
    def execute_passthrough_process(self, order):
        """执行过账处理"""
        order_id = order.get("orderId") or order.get("id")
        order_no = order.get("orderNo")
        
        print(f"🔄 执行订单 {order_no} 过账处理...")
        
        # 调用过账处理API
        result = self.call_api(f"/passthrough-processing/{order_id}", "POST", {
            "routingStrategy": "COST_OPTIMIZATION",
            "enableNetting": True
        })
        
        if result["success"]:
            data = result["data"]
            print(f"  ✅ 过账处理完成")
            if "passthroughResults" in data:
                results = data["passthroughResults"]
                for passthrough_result in results:
                    from_entity = passthrough_result.get("fromEntityName", "未知")
                    to_entity = passthrough_result.get("toEntityName", "未知")
                    amount = passthrough_result.get("finalAmount", 0)
                    print(f"    🔄 {from_entity} → {to_entity}: ¥{amount:,}")
            return True, data
        else:
            print(f"  ❌ 过账处理失败: {result['error']}")
            return False, {}
    
    def process_single_order(self, order):
        """处理单个订单的完整流程"""
        order_no = order.get("orderNo")
        print(f"\n🎯 开始处理订单: {order_no}")
        print("=" * 60)
        
        workflow_results = {
            "order_no": order_no,
            "expense_entry": {"success": False, "data": {}},
            "management_profit_sharing": {"success": False, "data": {}},
            "clearing_process": {"success": False, "data": {}},
            "passthrough_process": {"success": False, "data": {}}
        }
        
        # 1. 费用录入
        success, data = self.execute_expense_entry(order)
        workflow_results["expense_entry"] = {"success": success, "data": data}
        
        if not success:
            print(f"❌ 订单 {order_no} 费用录入失败，跳过后续流程")
            return workflow_results
        
        # 等待1秒
        time.sleep(1)
        
        # 2. 管理账分润计算
        success, data = self.execute_management_profit_sharing(order)
        workflow_results["management_profit_sharing"] = {"success": success, "data": data}
        
        # 等待1秒
        time.sleep(1)
        
        # 3. 资金流清分
        success, data = self.execute_clearing_process(order)
        workflow_results["clearing_process"] = {"success": success, "data": data}
        
        # 等待1秒
        time.sleep(1)
        
        # 4. 过账处理
        success, data = self.execute_passthrough_process(order)
        workflow_results["passthrough_process"] = {"success": success, "data": data}
        
        # 统计结果
        completed_steps = sum(1 for step in workflow_results.values() if isinstance(step, dict) and step.get("success"))
        total_steps = len([k for k, v in workflow_results.items() if k != "order_no"])
        
        print(f"\n📊 订单 {order_no} 处理完成: {completed_steps}/{total_steps} 步骤成功")
        
        return workflow_results
    
    def generate_workflow_report(self, all_results):
        """生成工作流程执行报告"""
        print(f"\n📋 生成工作流程执行报告...")
        
        total_orders = len(all_results)
        
        # 统计各步骤成功率
        step_stats = {
            "expense_entry": {"success": 0, "failed": 0},
            "management_profit_sharing": {"success": 0, "failed": 0},
            "clearing_process": {"success": 0, "failed": 0},
            "passthrough_process": {"success": 0, "failed": 0}
        }
        
        for result in all_results:
            for step_name, step_data in result.items():
                if step_name == "order_no":
                    continue
                if step_data["success"]:
                    step_stats[step_name]["success"] += 1
                else:
                    step_stats[step_name]["failed"] += 1
        
        # 计算完整流程成功的订单
        complete_success = sum(1 for result in all_results 
                              if all(step["success"] for k, step in result.items() if k != "order_no"))
        
        # 汇总财务数据
        total_income = 0
        total_expense = 0
        total_profit = 0
        
        for result in all_results:
            expense_data = result.get("expense_entry", {}).get("data", {})
            total_income += expense_data.get("total_income", 0)
            total_expense += expense_data.get("total_expense", 0)
            total_profit += expense_data.get("gross_profit", 0)
        
        avg_profit_margin = (total_profit / total_income * 100) if total_income > 0 else 0
        
        # 生成报告
        report = {
            "execution_summary": {
                "total_orders_processed": total_orders,
                "complete_workflow_success": complete_success,
                "complete_success_rate": f"{(complete_success / total_orders * 100):.1f}%" if total_orders > 0 else "0%"
            },
            "step_statistics": {
                step_name: {
                    "success_count": stats["success"],
                    "failed_count": stats["failed"],
                    "success_rate": f"{(stats['success'] / total_orders * 100):.1f}%" if total_orders > 0 else "0%"
                }
                for step_name, stats in step_stats.items()
            },
            "financial_summary": {
                "total_income": total_income,
                "total_expense": total_expense,
                "total_profit": total_profit,
                "avg_profit_margin": round(avg_profit_margin, 2)
            },
            "execution_time": datetime.now().isoformat(),
            "detailed_results": all_results
        }
        
        # 保存报告
        with open("workflow_execution_report.json", "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 打印摘要
        print(f"📊 工作流程执行摘要:")
        print(f"   📋 处理订单总数: {total_orders}")
        print(f"   ✅ 完整流程成功: {complete_success} ({(complete_success / total_orders * 100):.1f}%)" if total_orders > 0 else "   ✅ 完整流程成功: 0 (0%)")
        print(f"   💰 总营收: ¥{total_income:,.2f}")
        print(f"   💸 总成本: ¥{total_expense:,.2f}")
        print(f"   💵 总毛利: ¥{total_profit:,.2f}")
        print(f"   📈 平均毛利率: {avg_profit_margin:.1f}%")
        
        print(f"\n📊 各步骤成功率:")
        step_names = {
            "expense_entry": "费用录入",
            "management_profit_sharing": "管理账分润计算",
            "clearing_process": "资金流清分",
            "passthrough_process": "过账处理"
        }
        for step_name, stats in step_stats.items():
            success_rate = (stats["success"] / total_orders * 100) if total_orders > 0 else 0
            print(f"   {step_names[step_name]}: {stats['success']}/{total_orders} ({success_rate:.1f}%)")
        
        print(f"\n📄 详细报告已保存至: workflow_execution_report.json")
        
        return report
    
    def execute_complete_workflow(self, max_orders=50):
        """执行完整的业务流程"""
        print("🚀 OneOrder 完整业务流程执行器")
        print("=" * 60)
        
        # 1. 获取现有订单
        orders = self.get_existing_orders()
        if not orders:
            print("❌ 没有找到任何订单，请先运行数据生成脚本")
            return
        
        # 限制处理数量
        if len(orders) > max_orders:
            orders = orders[:max_orders]
            print(f"⚠️ 订单数量较多，仅处理前 {max_orders} 个订单")
        
        print(f"📝 开始处理 {len(orders)} 个订单的完整业务流程...")
        
        # 2. 逐个处理订单
        all_results = []
        for i, order in enumerate(orders, 1):
            print(f"\n⏱️ 进度: {i}/{len(orders)}")
            try:
                result = self.process_single_order(order)
                all_results.append(result)
                
                # 每处理5个订单暂停一下
                if i % 5 == 0:
                    print(f"⏸️ 已处理 {i} 个订单，暂停 2 秒...")
                    time.sleep(2)
                    
            except Exception as e:
                print(f"💥 处理订单异常: {str(e)}")
                all_results.append({
                    "order_no": order.get("orderNo", "未知"),
                    "error": str(e)
                })
        
        # 3. 生成执行报告
        report = self.generate_workflow_report(all_results)
        
        print(f"\n🎉 完整业务流程执行完成!")
        print(f"🔗 访问系统查看结果: {BASE_URL}/api/freight-order.html")
        
        return report

def main():
    """主函数"""
    executor = WorkflowExecutor()
    
    # 执行完整业务流程
    report = executor.execute_complete_workflow(max_orders=30)  # 处理30个订单

if __name__ == "__main__":
    main()