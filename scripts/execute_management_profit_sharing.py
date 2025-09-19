#!/usr/bin/env python3
"""
OneOrder 管理账分润计算执行器
为所有完成录费的订单执行管理账分润计算
"""
import requests
import json
import time
from datetime import datetime

class ManagementProfitSharingExecutor:
    def __init__(self):
        self.base_url = "http://localhost:8081/api"
    
    def get_orders_for_profit_sharing(self):
        """获取可以进行分润计算的订单"""
        try:
            # 获取所有订单
            response = requests.get(f"{self.base_url}/freight-orders?page=0&size=200")
            if response.status_code == 200:
                orders = response.json()
                # 过滤状态为CONFIRMED的订单（已完成录费）
                eligible_orders = [order for order in orders if order.get('orderStatus') == 'CONFIRMED']
                print(f"✅ 获取到 {len(eligible_orders)} 个可进行分润计算的订单")
                return eligible_orders
            else:
                print(f"❌ 获取订单失败: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ 获取订单异常: {e}")
            return []
    
    def get_expense_entries(self, order_id):
        """获取订单的费用明细"""
        try:
            response = requests.get(f"{self.base_url}/api/expense-entries/order/{order_id}")
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ 获取订单 {order_id} 费用明细失败: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ 获取费用明细异常: {e}")
            return []
    
    def execute_profit_sharing(self, order_id):
        """执行管理账分润计算"""
        try:
            # 构建分润计算请求（简化参数）
            request_data = {
                "calculationType": "MANAGEMENT_ACCOUNT",
                "remarks": "自动管理账分润计算"
            }
            
            response = requests.post(
                f"{self.base_url}/api/profit-sharing/calculate/{order_id}",
                json=request_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                return True, result
            else:
                print(f"❌ 分润计算失败: {response.status_code} - {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ 分润计算异常: {e}")
            return False, None
    
    def process_order_profit_sharing(self, order):
        """处理单个订单的分润计算"""
        order_id = order['orderId']
        order_no = order['orderNo']
        total_amount = order.get('totalAmount', 0)
        total_cost = order.get('totalCost', 0)
        estimated_profit = total_amount - total_cost
        
        print(f"📝 处理订单 {order_no}:")
        print(f"   💰 总收入: ¥{total_amount:,.2f}")
        print(f"   💸 总成本: ¥{total_cost:,.2f}")
        print(f"   💎 预估毛利: ¥{estimated_profit:,.2f}")
        
        success, result = self.execute_profit_sharing(order_id)
        
        if success:
            data = result.get('data', {})
            sales_profit = data.get('salesDepartmentProfit', 0)
            operation_profit = data.get('operationDepartmentProfit', 0)
            
            print(f"   ✅ 分润计算成功:")
            print(f"      📊 销售部门分润: ¥{sales_profit:,.2f}")
            print(f"      🔧 操作部门分润: ¥{operation_profit:,.2f}")
            print(f"      📋 分润结果ID: {data.get('resultId', 'Unknown')}")
            return True
        else:
            print(f"   ❌ 分润计算失败")
            return False
    
    def execute_all_profit_sharing(self):
        """执行所有订单的管理账分润计算"""
        orders = self.get_orders_for_profit_sharing()
        if not orders:
            print("❌ 无符合条件的订单")
            return
        
        print(f"🚀 开始为 {len(orders)} 个订单执行管理账分润计算...")
        print("=" * 80)
        
        success_count = 0
        failed_count = 0
        total_profit_calculated = 0
        
        for i, order in enumerate(orders, 1):
            success = self.process_order_profit_sharing(order)
            
            if success:
                success_count += 1
                total_profit_calculated += (order.get('totalAmount', 0) - order.get('totalCost', 0))
            else:
                failed_count += 1
            
            # 每10个订单暂停一下
            if i % 10 == 0:
                print(f"⏸️ 已处理 {i} 个订单，暂停 1 秒...")
                time.sleep(1)
        
        print("=" * 80)
        print(f"📊 管理账分润计算完成:")
        print(f"   ✅ 成功: {success_count}")
        print(f"   ❌ 失败: {failed_count}")
        print(f"   📈 成功率: {success_count/(success_count+failed_count)*100:.1f}%")
        print(f"   💎 累计分润毛利: ¥{total_profit_calculated:,.2f}")
        
        return success_count, failed_count
    
    def check_profit_sharing_results(self):
        """检查分润计算结果"""
        try:
            response = requests.get(f"{self.base_url}/api/profit-sharing/results?page=0&size=10")
            if response.status_code == 200:
                results = response.json()
                print(f"📋 最新分润结果（前10条）:")
                
                for result in results[:5]:  # 显示前5条
                    print(f"   📄 订单: {result.get('orderNo', 'Unknown')}")
                    print(f"      💰 销售分润: ¥{result.get('salesDepartmentProfit', 0):,.2f}")
                    print(f"      🔧 操作分润: ¥{result.get('operationDepartmentProfit', 0):,.2f}")
                    print(f"      📅 计算时间: {result.get('calculatedAt', 'Unknown')}")
                
                return len(results)
            else:
                print(f"❌ 获取分润结果失败: {response.status_code}")
                return 0
        except Exception as e:
            print(f"❌ 获取分润结果异常: {e}")
            return 0

if __name__ == "__main__":
    print("🎯 OneOrder 管理账分润计算执行器")
    print("📝 为所有已录费订单执行管理账分润计算")
    print("=" * 80)
    
    executor = ManagementProfitSharingExecutor()
    
    # 执行分润计算
    success, failed = executor.execute_all_profit_sharing()
    
    if success > 0:
        print("\n🔍 检查分润计算结果...")
        result_count = executor.check_profit_sharing_results()
        print(f"✅ 已生成 {result_count} 条分润记录")
    
    print(f"\n🎉 管理账分润计算完成: {success} 成功, {failed} 失败")
    print("🔗 访问系统查看: http://localhost:8081/api/system-overview.html")