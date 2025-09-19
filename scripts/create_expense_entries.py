#!/usr/bin/env python3
"""
OneOrder 录费数据创建器
为已创建的订单生成完整的外部收付款明细
"""
import requests
import random
import json
import time
from datetime import datetime, timedelta

class ExpenseEntryCreator:
    def __init__(self):
        self.base_url = "http://localhost:8081/api"
        
        # 费用科目映射（基于OneOrder 188个费用科目）
        self.revenue_items = [
            {"code": "OCEAN_FREIGHT", "name": "海运费", "min": 8000, "max": 15000},
            {"code": "BAF", "name": "燃油附加费", "min": 800, "max": 1500},
            {"code": "CAF", "name": "币值调整费", "min": 300, "max": 800},
            {"code": "THC_ORIGIN", "name": "起运港码头操作费", "min": 1200, "max": 2000},
            {"code": "DOCUMENTATION", "name": "文件费", "min": 200, "max": 500},
            {"code": "SEAL_FEE", "name": "铅封费", "min": 50, "max": 150},
            {"code": "CONTAINER_IMBALANCE", "name": "集装箱不平衡费", "min": 500, "max": 1200}
        ]
        
        self.cost_items = [
            {"code": "OCEAN_FREIGHT_COST", "name": "海运费成本", "min": 5000, "max": 12000},
            {"code": "THC_ORIGIN_COST", "name": "起运港码头操作费成本", "min": 800, "max": 1500},
            {"code": "TRUCKING_COST", "name": "内陆运输费成本", "min": 1000, "max": 2500},
            {"code": "CUSTOMS_CLEARANCE", "name": "报关费", "min": 300, "max": 800},
            {"code": "INSPECTION_FEE", "name": "商检费", "min": 200, "max": 600},
            {"code": "WAREHOUSE_COST", "name": "仓储费", "min": 400, "max": 1000}
        ]
        
        # 供应商映射
        self.suppliers = [
            {"id": "SUPPLIER001", "name": "中国远洋海运集团有限公司"},
            {"id": "SUPPLIER002", "name": "马士基（中国）有限公司"},
            {"id": "SUPPLIER003", "name": "东方海外货柜航运公司"},
            {"id": "SUPPLIER004", "name": "达飞轮船（中国）有限公司"}
        ]
    
    def get_all_orders(self):
        """获取所有订单列表"""
        try:
            response = requests.get(f"{self.base_url}/freight-orders?page=0&size=200")
            if response.status_code == 200:
                orders = response.json()
                print(f"✅ 获取到 {len(orders)} 个订单")
                return orders
            else:
                print(f"❌ 获取订单失败: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ 获取订单异常: {e}")
            return []
    
    def generate_revenue_entries(self, order):
        """为订单生成外部收款明细"""
        entries = []
        order_total = float(order['totalAmount'])
        
        # 主要收入项目
        main_revenue = random.choice(self.revenue_items[:3])  # 海运费、燃油费、币值调整费
        main_amount = order_total * random.uniform(0.6, 0.8)
        
        entries.append({
            "orderId": order['orderId'],
            "entryType": "REVENUE",
            "costType": main_revenue['code'],
            "description": main_revenue['name'],
            "amount": round(main_amount, 2),
            "currency": "CNY",
            "legalEntityId": "SALES001",  # 收款法人
            "supplierId": None,
            "remarks": f"主营业务收入 - {main_revenue['name']}"
        })
        
        # 其他收费项目
        remaining_amount = order_total - main_amount
        other_items = random.sample(self.revenue_items[3:], random.randint(2, 4))
        
        for i, item in enumerate(other_items):
            if i == len(other_items) - 1:  # 最后一项用剩余金额
                amount = remaining_amount
            else:
                amount = remaining_amount * random.uniform(0.1, 0.4)
                remaining_amount -= amount
            
            entries.append({
                "orderId": order['orderId'],
                "entryType": "REVENUE", 
                "costType": item['code'],
                "description": item['name'],
                "amount": round(amount, 2),
                "currency": "CNY",
                "legalEntityId": "SALES001",
                "supplierId": None,
                "remarks": f"附加收费 - {item['name']}"
            })
        
        return entries
    
    def generate_cost_entries(self, order):
        """为订单生成外部付款明细"""
        entries = []
        order_cost = float(order['totalCost'])
        
        # 主要成本项目
        main_cost = random.choice(self.cost_items[:2])  # 海运费成本、码头费成本
        supplier = random.choice(self.suppliers)
        main_amount = order_cost * random.uniform(0.5, 0.7)
        
        entries.append({
            "orderId": order['orderId'],
            "entryType": "COST",
            "costType": main_cost['code'],
            "description": main_cost['name'],
            "amount": round(main_amount, 2),
            "currency": "CNY",
            "legalEntityId": "DELIVERY001",  # 付款法人
            "supplierId": supplier['id'],
            "remarks": f"主要成本支出 - {supplier['name']}"
        })
        
        # 其他成本项目
        remaining_amount = order_cost - main_amount
        other_costs = random.sample(self.cost_items[2:], random.randint(2, 3))
        
        for i, item in enumerate(other_costs):
            supplier = random.choice(self.suppliers)
            if i == len(other_costs) - 1:  # 最后一项用剩余金额
                amount = remaining_amount
            else:
                amount = remaining_amount * random.uniform(0.2, 0.5)
                remaining_amount -= amount
            
            entries.append({
                "orderId": order['orderId'],
                "entryType": "COST",
                "costType": item['code'],
                "description": item['name'],
                "amount": round(amount, 2),
                "currency": "CNY",
                "legalEntityId": "DELIVERY001",
                "supplierId": supplier['id'],
                "remarks": f"供应商支出 - {supplier['name']}"
            })
        
        return entries
    
    def create_expense_entry(self, entry_data):
        """创建费用明细"""
        try:
            response = requests.post(
                f"{self.base_url}/api/expense-entries",
                json=entry_data,
                headers={'Content-Type': 'application/json'}
            )
            if response.status_code in [200, 201]:
                result = response.json()
                return True, result.get('data', {}).get('entryId', 'Unknown')
            else:
                print(f"❌ 费用创建失败: {response.status_code} - {response.text}")
                return False, None
        except Exception as e:
            print(f"❌ 费用创建异常: {e}")
            return False, None
    
    def process_order_expenses(self, order):
        """为单个订单处理所有费用明细"""
        print(f"📝 处理订单 {order['orderNo']} 的费用明细...")
        
        success_count = 0
        total_count = 0
        
        # 生成收入明细
        revenue_entries = self.generate_revenue_entries(order)
        for entry in revenue_entries:
            total_count += 1
            success, entry_id = self.create_expense_entry(entry)
            if success:
                success_count += 1
                print(f"   ✅ 收入明细: {entry['description']} - ¥{entry['amount']}")
            else:
                print(f"   ❌ 收入明细失败: {entry['description']}")
        
        # 生成成本明细
        cost_entries = self.generate_cost_entries(order)
        for entry in cost_entries:
            total_count += 1
            success, entry_id = self.create_expense_entry(entry)
            if success:
                success_count += 1
                print(f"   ✅ 成本明细: {entry['description']} - ¥{entry['amount']}")
            else:
                print(f"   ❌ 成本明细失败: {entry['description']}")
        
        return success_count, total_count
    
    def process_all_orders(self):
        """为所有订单处理费用明细"""
        orders = self.get_all_orders()
        if not orders:
            print("❌ 无法获取订单列表")
            return
        
        print(f"🚀 开始为 {len(orders)} 个订单生成费用明细...")
        print("=" * 60)
        
        total_success = 0
        total_entries = 0
        
        for i, order in enumerate(orders, 1):
            success, count = self.process_order_expenses(order)
            total_success += success
            total_entries += count
            
            if i % 10 == 0:
                print(f"⏸️ 已处理 {i} 个订单，暂停 1 秒...")
                time.sleep(1)
        
        print("=" * 60)
        print(f"📊 费用明细生成完成:")
        print(f"   ✅ 成功: {total_success}")
        print(f"   ❌ 失败: {total_entries - total_success}")
        print(f"   📈 成功率: {total_success/total_entries*100:.1f}%")
        
        return total_success, total_entries

if __name__ == "__main__":
    print("🎯 OneOrder 录费数据创建器")
    print("📝 为所有订单生成外部收付款明细")
    print("=" * 60)
    
    creator = ExpenseEntryCreator()
    
    # 先处理前5个订单进行测试
    orders = creator.get_all_orders()
    if orders:
        print(f"🧪 先测试前5个订单...")
        test_orders = orders[:5]
        total_success = 0
        total_entries = 0
        
        for order in test_orders:
            success, count = creator.process_order_expenses(order)
            total_success += success
            total_entries += count
        
        print(f"🎉 测试完成: {total_success}/{total_entries} 成功")
        if total_success > 0:
            print("✅ 费用明细API正常，继续处理所有订单...")
            success, total = creator.process_all_orders()
            print(f"🎉 全部录费处理完成: {success}/{total} 成功")
        else:
            print("❌ 费用明细API有问题，请检查日志")
    
    print("🔗 访问系统查看: http://localhost:8081/api/freight-order.html")