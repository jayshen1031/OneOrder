#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OneOrder 批量测试数据生成器
生成100+条真实订单数据，并跑通完整业务流程
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
API_BASE = f"{BASE_URL}/api/freight-orders"

class OneOrderDataGenerator:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # 真实客户名称 (外部收款法人)
        self.customers = [
            {"id": "CUST_001", "name": "CONG TY TNHH COCREATION GRASS CORPORATION VIET NAM", "country": "Vietnam"},
            {"id": "CUST_002", "name": "COCREATION GRASS CORPORATION (VIET NAM) CO., LTD", "country": "Vietnam"},
            {"id": "CUST_003", "name": "CONG TY TNHH CONG NGHIEP ZHANG LONG", "country": "Vietnam"},
            {"id": "CUST_004", "name": "CONG TY TNHH THOI TRANG G&G VIET NAM", "country": "Vietnam"},
            {"id": "CUST_005", "name": "VIETNAM FOUR SEASON MACHINERY MANUFACTORY COMPANY LIMITED", "country": "Vietnam"},
            {"id": "CUST_006", "name": "ALPHA AVIATION VIET NAM CO., LTD", "country": "Vietnam"},
            {"id": "CUST_007", "name": "BOE VISION ELECTRONIC TECHNOLOGY (VIET NAM) COMPANY LIMITED", "country": "Vietnam"},
            {"id": "CUST_008", "name": "CHI NHANH THANH PHO HAI PHONG CONG TY CO PHAN GIAO NHAN WIN WIN", "country": "Vietnam"},
            {"id": "CUST_009", "name": "CONG TY TNHH NINGBO CHANGYA PLASTIC (VIET NAM)", "country": "Vietnam"},
            {"id": "CUST_010", "name": "AN GIA GROUP COMPANY LIMITED", "country": "Vietnam"}
        ]
        
        # 真实供应商名称 (外部付款法人)  
        self.suppliers = [
            {"id": "SUPP_001", "name": "CONG TY TNHH OCEAN NETWORK EXPRESS (VIETNAM)", "type": "航运公司"},
            {"id": "SUPP_002", "name": "CONG TY CO PHAN CMA-CGM VIETNAM", "type": "航运公司"},
            {"id": "SUPP_003", "name": "CONG TY TNHH WAN HAI VIETNAM", "type": "航运公司"},
            {"id": "SUPP_004", "name": "CONG TY TNHH MAERSK VIETNAM", "type": "航运公司"},
            {"id": "SUPP_005", "name": "CONG TY TNHH DICH VU ZIM INTEGRATED SHIPPING VIETNAM", "type": "航运公司"},
            {"id": "SUPP_006", "name": "CÔNG TY TNHH DỊCH VỤ VẬN TẢI NHƯ Ý", "type": "运输公司"},
            {"id": "SUPP_007", "name": "NGUYEN LONG TRANSPORT FORWARDING SERVICE TRADING COMPANY LIMITED", "type": "货代"},
            {"id": "SUPP_008", "name": "YANG MING SHIPPING (VIET NAM) CO., LTD", "type": "航运公司"},
            {"id": "SUPP_009", "name": "ANH DUONG TRANSPORT SERVICES INVESTMENT COMPANY LIMITED", "type": "运输公司"},
            {"id": "SUPP_010", "name": "RUBY SKY CO., LTD", "type": "货代"}
        ]
        
        # 真实部门数据 (基于deptBusiness.md)
        self.sales_departments = [
            {"id": "DEPT_001", "name": "上海海领供应链", "level2": "销售部"},
            {"id": "DEPT_002", "name": "空运事业部", "level2": "空运南区"},
            {"id": "DEPT_003", "name": "集团大客户部", "level2": "半导体销售部"},
            {"id": "DEPT_004", "name": "中国西区", "level2": "大客户项目一部"},
            {"id": "DEPT_005", "name": "中国南区", "level2": "南区大客户部"},
            {"id": "DEPT_006", "name": "中国东区", "level2": "上海分公司"},
            {"id": "DEPT_007", "name": "中国北区", "level2": "青岛业务一部"},
            {"id": "DEPT_008", "name": "海运事业部", "level2": "宁波非美站"},
            {"id": "DEPT_009", "name": "半导体解决方案部", "level2": "无锡站"},
            {"id": "DEPT_010", "name": "海外中心", "level2": "亚洲区"}
        ]
        
        self.operation_departments = [
            {"id": "DEPT_011", "name": "上海海领供应链", "level2": "Gateway"},
            {"id": "DEPT_012", "name": "空运事业部", "level2": "空运西区"},
            {"id": "DEPT_013", "name": "中国南区", "level2": "深圳分公司"},
            {"id": "DEPT_014", "name": "中国东区", "level2": "合肥分公司"},
            {"id": "DEPT_015", "name": "中国西区", "level2": "成都分公司"},
            {"id": "DEPT_016", "name": "海运事业部", "level2": "海运东区"},
            {"id": "DEPT_017", "name": "铁运事业部", "level2": "铁运北区"},
            {"id": "DEPT_018", "name": "中国北区", "level2": "关务单证中心"},
            {"id": "DEPT_019", "name": "半导体解决方案部", "level2": "南京站"},
            {"id": "DEPT_020", "name": "海外中心", "level2": "北美区"}
        ]
        
        # 业务类型
        self.business_types = [
            {"code": "SEA_EXPORT", "name": "海运出口", "base_rate": 12000},
            {"code": "SEA_IMPORT", "name": "海运进口", "base_rate": 8000},
            {"code": "AIR_EXPORT", "name": "空运出口", "base_rate": 8000},
            {"code": "AIR_IMPORT", "name": "空运进口", "base_rate": 6000},
            {"code": "LAND_TRANSPORT", "name": "陆运", "base_rate": 3000},
            {"code": "RAIL_EXPORT", "name": "铁运出口", "base_rate": 5000},
            {"code": "CUSTOMS", "name": "报关", "base_rate": 2000},
            {"code": "WAREHOUSE", "name": "仓储", "base_rate": 1500}
        ]
        
        # 港口信息
        self.ports = [
            {"code": "CNSHA", "name": "上海港", "country": "中国"},
            {"code": "CNSHK", "name": "蛇口港", "country": "中国"},
            {"code": "CNNGB", "name": "宁波港", "country": "中国"},
            {"code": "CNQIN", "name": "青岛港", "country": "中国"},
            {"code": "VNSGN", "name": "胡志明港", "country": "越南"},
            {"code": "VNHPH", "name": "海防港", "country": "越南"},
            {"code": "USNYC", "name": "纽约港", "country": "美国"},
            {"code": "USLAX", "name": "洛杉矶港", "country": "美国"},
            {"code": "DEHAM", "name": "汉堡港", "country": "德国"},
            {"code": "NLRTM", "name": "鹿特丹港", "country": "荷兰"}
        ]
        
        # 法人实体
        self.legal_entities = [
            {"id": "LE_001", "name": "海程邦达供应链管理股份有限公司", "type": "总部"},
            {"id": "LE_002", "name": "上海海领供应链管理有限公司", "type": "子公司"},
            {"id": "LE_003", "name": "深圳邦达国际货运代理有限公司", "type": "子公司"},
            {"id": "LE_004", "name": "青岛海程邦达供应链管理有限公司", "type": "子公司"},
            {"id": "LE_005", "name": "宁波海程邦达供应链管理有限公司", "type": "子公司"}
        ]
        
    def generate_order_number(self, business_type_code, index):
        """生成订单号"""
        date_str = datetime.now().strftime("%Y%m%d")
        return f"{business_type_code}-{date_str}-{str(index).zfill(3)}"
    
    def calculate_fees(self, business_type, amount):
        """计算费用明细"""
        base_rate = business_type["base_rate"]
        container_count = random.randint(1, 4)
        
        # 外部收入 (向客户收取)
        external_income = {
            "freight_charge": base_rate * container_count,  # 运费
            "documentation_fee": random.randint(300, 800),  # 单证费
            "handling_fee": random.randint(200, 500),       # 操作费
            "fuel_surcharge": base_rate * 0.15,             # 燃油附加费
            "currency_adjustment": base_rate * 0.02         # 汇率调整费
        }
        
        # 外部支出 (向供应商支付)
        external_expense = {
            "shipping_cost": base_rate * container_count * 0.7,  # 船公司费用
            "terminal_handling": random.randint(800, 1200),      # 码头操作费
            "customs_fee": random.randint(500, 1000),            # 报关费
            "truck_cost": random.randint(800, 1500),             # 拖车费
            "warehouse_fee": random.randint(300, 600)            # 仓储费
        }
        
        total_income = sum(external_income.values())
        total_expense = sum(external_expense.values())
        gross_profit = total_income - total_expense
        
        return {
            "container_count": container_count,
            "external_income": external_income,
            "external_expense": external_expense,
            "total_income": total_income,
            "total_expense": total_expense,
            "gross_profit": gross_profit,
            "profit_margin": (gross_profit / total_income * 100) if total_income > 0 else 0
        }
    
    def create_order(self, index):
        """创建单个订单"""
        business_type = random.choice(self.business_types)
        customer = random.choice(self.customers)
        sales_dept = random.choice(self.sales_departments)
        operation_dept = random.choice(self.operation_departments)
        loading_port = random.choice(self.ports)
        discharge_port = random.choice([p for p in self.ports if p != loading_port])
        legal_entity = random.choice(self.legal_entities)
        
        # 计算费用
        fee_calculation = self.calculate_fees(business_type, random.randint(10000, 50000))
        
        # 订单基本信息
        order_data = {
            "orderNo": self.generate_order_number(business_type["code"], index),
            "customerId": customer["id"],
            "customerName": customer["name"],
            "salesEntityId": legal_entity["id"],
            "salesEntityName": legal_entity["name"],
            "businessType": business_type["code"],
            "businessTypeName": business_type["name"],
            "portOfLoading": loading_port["code"],
            "portOfLoadingName": loading_port["name"],
            "portOfDischarge": discharge_port["code"],
            "portOfDischargeName": discharge_port["name"],
            "totalAmount": fee_calculation["total_income"],
            "totalCost": fee_calculation["total_expense"],
            "currency": "CNY",
            "salesStaffId": f"STAFF_{random.randint(1001, 1050)}",
            "salesDepartmentId": sales_dept["id"],
            "salesDepartmentName": f"{sales_dept['name']}-{sales_dept['level2']}",
            "operationDepartmentId": operation_dept["id"],
            "operationDepartmentName": f"{operation_dept['name']}-{operation_dept['level2']}",
            "orderDate": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
            "remarks": f"批量生成测试订单 #{index}, 业务类型: {business_type['name']}, 毛利润: {fee_calculation['gross_profit']:.2f}, 毛利率: {fee_calculation['profit_margin']:.1f}%"
        }
        
        return order_data, fee_calculation
    
    def create_expense_entries(self, order_id, order_no, fee_calculation):
        """创建费用录入数据"""
        supplier = random.choice(self.suppliers)
        
        entries = []
        
        # 外部收入明细 (向客户收取)
        for fee_type, amount in fee_calculation["external_income"].items():
            entries.append({
                "orderId": order_id,
                "orderNo": order_no,
                "entryType": "INCOME",  # 收入
                "feeType": fee_type,
                "amount": round(amount, 2),
                "currency": "CNY",
                "counterpartyId": "CUSTOMER",
                "counterpartyName": "客户",
                "description": f"外部收入 - {fee_type}",
                "exchangeRate": 1.0,
                "entryDate": datetime.now().isoformat()
            })
        
        # 外部支出明细 (向供应商支付)  
        for fee_type, amount in fee_calculation["external_expense"].items():
            entries.append({
                "orderId": order_id,
                "orderNo": order_no,
                "entryType": "EXPENSE",  # 支出
                "feeType": fee_type,
                "amount": round(amount, 2),
                "currency": "CNY",
                "counterpartyId": supplier["id"],
                "counterpartyName": supplier["name"],
                "description": f"外部支出 - {fee_type} - {supplier['type']}",
                "exchangeRate": 1.0,
                "entryDate": datetime.now().isoformat()
            })
        
        return entries
    
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
    
    def generate_orders(self, count=120):
        """生成指定数量的订单"""
        print(f"🚀 开始生成 {count} 条测试订单...")
        
        created_orders = []
        failed_orders = []
        
        for i in range(1, count + 1):
            try:
                print(f"📝 创建订单 {i}/{count}...")
                
                # 1. 创建订单
                order_data, fee_calculation = self.create_order(i)
                
                # 调用创建订单API
                result = self.call_api("", "POST", order_data)
                if not result["success"]:
                    print(f"❌ 订单 {i} 创建失败: {result['error']}")
                    failed_orders.append({"index": i, "error": result["error"]})
                    continue
                
                order_response = result["data"]
                order_id = order_response.get("orderId") or order_response.get("id")
                
                print(f"✅ 订单 {order_data['orderNo']} 创建成功, ID: {order_id}")
                
                # 2. 创建费用录入数据
                expense_entries = self.create_expense_entries(order_id, order_data["orderNo"], fee_calculation)
                
                # 存储订单信息
                created_orders.append({
                    "index": i,
                    "order_id": order_id,
                    "order_no": order_data["orderNo"],
                    "customer": order_data["customerName"],
                    "business_type": order_data["businessTypeName"],
                    "total_amount": order_data["totalAmount"],
                    "total_cost": order_data["totalCost"],
                    "gross_profit": fee_calculation["gross_profit"],
                    "profit_margin": fee_calculation["profit_margin"],
                    "expense_entries": expense_entries
                })
                
                # 控制创建速度，避免过快
                if i % 10 == 0:
                    print(f"⏸️ 已创建 {i} 条订单，暂停 1 秒...")
                    time.sleep(1)
                    
            except Exception as e:
                print(f"💥 订单 {i} 创建过程中发生异常: {str(e)}")
                failed_orders.append({"index": i, "error": str(e)})
        
        print(f"\n📊 订单生成完成!")
        print(f"✅ 成功创建: {len(created_orders)} 条")
        print(f"❌ 失败: {len(failed_orders)} 条")
        
        return created_orders, failed_orders
    
    def process_expense_entries(self, orders):
        """批量处理费用录入"""
        print(f"\n💰 开始处理费用录入...")
        
        processed_count = 0
        failed_count = 0
        
        for order in orders:
            try:
                print(f"📝 处理订单 {order['order_no']} 的费用录入...")
                
                # 调用费用录入API（需要根据实际API调整）
                for entry in order["expense_entries"]:
                    result = self.call_api("/expense-entries", "POST", entry)
                    if not result["success"]:
                        print(f"❌ 费用录入失败: {result['error']}")
                        failed_count += 1
                    else:
                        processed_count += 1
                        
            except Exception as e:
                print(f"💥 费用录入异常: {str(e)}")
                failed_count += 1
        
        print(f"💰 费用录入完成: 成功 {processed_count}, 失败 {failed_count}")
        return processed_count, failed_count
    
    def execute_management_profit_sharing(self, orders):
        """执行管理账分润计算"""
        print(f"\n🧮 开始执行管理账分润计算...")
        
        processed_count = 0
        failed_count = 0
        
        for order in orders:
            try:
                # 调用管理账分润计算API
                result = self.call_api(f"/{order['order_id']}/management-profit-sharing", "POST")
                if result["success"]:
                    processed_count += 1
                    print(f"✅ 订单 {order['order_no']} 管理账分润计算完成")
                else:
                    failed_count += 1
                    print(f"❌ 订单 {order['order_no']} 管理账分润计算失败: {result['error']}")
                    
            except Exception as e:
                print(f"💥 管理账分润计算异常: {str(e)}")
                failed_count += 1
        
        print(f"🧮 管理账分润计算完成: 成功 {processed_count}, 失败 {failed_count}")
        return processed_count, failed_count
    
    def execute_clearing_and_passthrough(self, orders):
        """执行资金流清分+过账处理"""
        print(f"\n💸 开始执行资金流清分+过账处理...")
        
        processed_count = 0
        failed_count = 0
        
        for order in orders:
            try:
                # 1. 资金流清分
                clearing_result = self.call_api(f"/{order['order_id']}/clearing", "POST")
                if not clearing_result["success"]:
                    print(f"❌ 订单 {order['order_no']} 资金流清分失败: {clearing_result['error']}")
                    failed_count += 1
                    continue
                
                # 2. 过账处理
                passthrough_result = self.call_api(f"/{order['order_id']}/passthrough", "POST")
                if passthrough_result["success"]:
                    processed_count += 1
                    print(f"✅ 订单 {order['order_no']} 资金流清分+过账处理完成")
                else:
                    failed_count += 1
                    print(f"❌ 订单 {order['order_no']} 过账处理失败: {passthrough_result['error']}")
                    
            except Exception as e:
                print(f"💥 资金流处理异常: {str(e)}")
                failed_count += 1
        
        print(f"💸 资金流清分+过账处理完成: 成功 {processed_count}, 失败 {failed_count}")
        return processed_count, failed_count
    
    def generate_summary_report(self, orders):
        """生成汇总报告"""
        print(f"\n📋 生成业务数据汇总报告...")
        
        total_orders = len(orders)
        total_amount = sum(order["total_amount"] for order in orders)
        total_cost = sum(order["total_cost"] for order in orders)
        total_profit = sum(order["gross_profit"] for order in orders)
        avg_profit_margin = sum(order["profit_margin"] for order in orders) / total_orders if total_orders > 0 else 0
        
        # 按业务类型分组统计
        business_type_stats = {}
        for order in orders:
            bt = order["business_type"]
            if bt not in business_type_stats:
                business_type_stats[bt] = {"count": 0, "amount": 0, "profit": 0}
            business_type_stats[bt]["count"] += 1
            business_type_stats[bt]["amount"] += order["total_amount"]
            business_type_stats[bt]["profit"] += order["gross_profit"]
        
        # 按客户分组统计
        customer_stats = {}
        for order in orders:
            customer = order["customer"]
            if customer not in customer_stats:
                customer_stats[customer] = {"count": 0, "amount": 0}
            customer_stats[customer]["count"] += 1
            customer_stats[customer]["amount"] += order["total_amount"]
        
        report = {
            "summary": {
                "total_orders": total_orders,
                "total_amount": total_amount,
                "total_cost": total_cost,
                "total_profit": total_profit,
                "avg_profit_margin": round(avg_profit_margin, 2)
            },
            "business_type_stats": business_type_stats,
            "customer_stats": dict(sorted(customer_stats.items(), key=lambda x: x[1]["amount"], reverse=True)[:10]),
            "generation_time": datetime.now().isoformat()
        }
        
        # 保存报告到文件
        with open("test_data_report.json", "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"📋 汇总报告:")
        print(f"   📊 订单总数: {total_orders}")
        print(f"   💰 总营收: ¥{total_amount:,.2f}")
        print(f"   💸 总成本: ¥{total_cost:,.2f}")
        print(f"   💵 总毛利: ¥{total_profit:,.2f}")
        print(f"   📈 平均毛利率: {avg_profit_margin:.1f}%")
        print(f"   📄 详细报告已保存至: test_data_report.json")
        
        return report

def main():
    """主函数"""
    generator = OneOrderDataGenerator()
    
    print("🎯 OneOrder 批量测试数据生成器")
    print("=" * 50)
    
    # 1. 生成订单
    created_orders, failed_orders = generator.generate_orders(120)
    
    if not created_orders:
        print("❌ 没有成功创建的订单，程序退出")
        return
    
    # 2. 处理费用录入
    generator.process_expense_entries(created_orders)
    
    # 3. 执行管理账分润计算
    generator.execute_management_profit_sharing(created_orders)
    
    # 4. 执行资金流清分+过账处理
    generator.execute_clearing_and_passthrough(created_orders)
    
    # 5. 生成汇总报告
    generator.generate_summary_report(created_orders)
    
    print("\n🎉 批量测试数据生成完成!")
    print(f"🔗 访问系统: {BASE_URL}/api/freight-order.html")

if __name__ == "__main__":
    main()