#!/usr/bin/env python3
"""
OneOrder 资金流清分+过账处理执行器
为完成管理账分润的订单执行资金流清分和过账处理
"""
import requests
import json
import time
from datetime import datetime
from decimal import Decimal

class ClearingAndPassthroughExecutor:
    def __init__(self):
        self.base_url = "http://localhost:8081/api"
    
    def get_orders_for_clearing(self):
        """获取可以进行资金流清分的订单"""
        try:
            # 获取所有订单
            response = requests.get(f"{self.base_url}/freight-orders?page=0&size=200")
            if response.status_code == 200:
                orders = response.json()
                # 过滤已完成分润计算的订单
                eligible_orders = [order for order in orders if order.get('orderStatus') == 'CONFIRMED']
                print(f"✅ 获取到 {len(eligible_orders)} 个可进行资金流清分的订单")
                return eligible_orders
            else:
                print(f"❌ 获取订单失败: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ 获取订单异常: {e}")
            return []
    
    def check_profit_sharing_status(self, order_id):
        """检查订单是否已完成管理账分润"""
        try:
            response = requests.get(f"{self.base_url}/api/profit-sharing/results/order/{order_id}")
            if response.status_code == 200:
                results = response.json()
                # 检查是否有管理账分润结果
                management_results = [r for r in results if r.get('calculationType') == 'MANAGEMENT_ACCOUNT']
                return len(management_results) > 0
            return False
        except Exception as e:
            print(f"❌ 检查分润状态异常: {e}")
            return False
    
    def execute_clearing(self, order_id):
        """执行资金流清分"""
        try:
            # 构建清分请求
            request_data = {
                "orderId": order_id,
                "clearingType": "FINANCIAL_FLOW",
                "settlementMode": "STAR",  # 星式结算
                "remarks": "自动资金流清分处理"
            }
            
            response = requests.post(
                f"{self.base_url}/api/clearing/execute",
                json=request_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                return True, result
            else:
                print(f"❌ 清分执行失败: {response.status_code} - {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ 清分执行异常: {e}")
            return False, None
    
    def execute_passthrough(self, order_id, clearing_result_id):
        """执行过账处理"""
        try:
            # 构建过账请求
            request_data = {
                "orderId": order_id,
                "clearingResultId": clearing_result_id,
                "passthroughType": "STANDARD",
                "routingRules": {
                    "retentionRatio": 0.1,  # 10%留存比例
                    "enableNetting": True,   # 启用轧差
                    "routingStrategy": "MINIMIZE_TRANSACTIONS"
                },
                "remarks": "自动过账处理"
            }
            
            response = requests.post(
                f"{self.base_url}/api/passthrough/execute",
                json=request_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                return True, result
            else:
                print(f"❌ 过账执行失败: {response.status_code} - {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ 过账执行异常: {e}")
            return False, None
    
    def process_order_clearing_and_passthrough(self, order):
        """处理单个订单的清分和过账"""
        order_id = order['orderId']
        order_no = order['orderNo']
        total_amount = order.get('totalAmount', 0)
        total_cost = order.get('totalCost', 0)
        
        print(f"📝 处理订单 {order_no}:")
        print(f"   💰 总收入: ¥{total_amount:,.2f}")
        print(f"   💸 总成本: ¥{total_cost:,.2f}")
        
        # 检查是否已完成管理账分润
        if not self.check_profit_sharing_status(order_id):
            print(f"   ⚠️ 跳过: 该订单尚未完成管理账分润计算")
            return False, False
        
        # 执行资金流清分
        print(f"   🔄 执行资金流清分...")
        clearing_success, clearing_result = self.execute_clearing(order_id)
        
        if not clearing_success:
            print(f"   ❌ 资金流清分失败")
            return False, False
        
        clearing_data = clearing_result.get('data', {})
        clearing_result_id = clearing_data.get('clearingResultId', 'Unknown')
        total_clearing_amount = clearing_data.get('totalClearingAmount', 0)
        transaction_count = clearing_data.get('transactionCount', 0)
        
        print(f"   ✅ 资金流清分成功:")
        print(f"      📊 清分金额: ¥{total_clearing_amount:,.2f}")
        print(f"      🔗 交易笔数: {transaction_count}")
        print(f"      📋 清分结果ID: {clearing_result_id}")
        
        # 执行过账处理
        print(f"   🔄 执行过账处理...")
        passthrough_success, passthrough_result = self.execute_passthrough(order_id, clearing_result_id)
        
        if not passthrough_success:
            print(f"   ❌ 过账处理失败")
            return True, False  # 清分成功，过账失败
        
        passthrough_data = passthrough_result.get('data', {})
        final_transaction_count = passthrough_data.get('finalTransactionCount', 0)
        total_passthrough_amount = passthrough_data.get('totalPassthroughAmount', 0)
        retention_amount = passthrough_data.get('retentionAmount', 0)
        
        print(f"   ✅ 过账处理成功:")
        print(f"      📊 过账金额: ¥{total_passthrough_amount:,.2f}")
        print(f"      💎 留存金额: ¥{retention_amount:,.2f}")
        print(f"      🔗 最终交易笔数: {final_transaction_count}")
        print(f"      📋 过账结果ID: {passthrough_data.get('passthroughResultId', 'Unknown')}")
        
        return True, True
    
    def execute_all_clearing_and_passthrough(self):
        """执行所有订单的清分和过账处理"""
        orders = self.get_orders_for_clearing()
        if not orders:
            print("❌ 无符合条件的订单")
            return
        
        print(f"🚀 开始为 {len(orders)} 个订单执行资金流清分+过账处理...")
        print("=" * 80)
        
        clearing_success_count = 0
        passthrough_success_count = 0
        failed_count = 0
        total_clearing_amount = 0
        total_passthrough_amount = 0
        
        for i, order in enumerate(orders, 1):
            clearing_success, passthrough_success = self.process_order_clearing_and_passthrough(order)
            
            if clearing_success:
                clearing_success_count += 1
                total_clearing_amount += (order.get('totalAmount', 0) - order.get('totalCost', 0))
                
                if passthrough_success:
                    passthrough_success_count += 1
                    total_passthrough_amount += (order.get('totalAmount', 0) - order.get('totalCost', 0)) * 0.9  # 90%过账，10%留存
            else:
                failed_count += 1
            
            # 每10个订单暂停一下
            if i % 10 == 0:
                print(f"⏸️ 已处理 {i} 个订单，暂停 1 秒...")
                time.sleep(1)
        
        print("=" * 80)
        print(f"📊 资金流清分+过账处理完成:")
        print(f"   🔄 资金流清分:")
        print(f"      ✅ 成功: {clearing_success_count}")
        print(f"      ❌ 失败: {failed_count}")
        print(f"      📈 成功率: {clearing_success_count/(clearing_success_count+failed_count)*100:.1f}%")
        print(f"      💎 累计清分金额: ¥{total_clearing_amount:,.2f}")
        print(f"   📋 过账处理:")
        print(f"      ✅ 成功: {passthrough_success_count}")
        print(f"      ❌ 失败: {clearing_success_count - passthrough_success_count}")
        print(f"      📈 成功率: {passthrough_success_count/clearing_success_count*100:.1f}%" if clearing_success_count > 0 else "      📈 成功率: 0.0%")
        print(f"      💎 累计过账金额: ¥{total_passthrough_amount:,.2f}")
        
        return clearing_success_count, passthrough_success_count, failed_count
    
    def check_clearing_results(self):
        """检查清分和过账结果"""
        try:
            # 查看清分结果
            response = requests.get(f"{self.base_url}/api/clearing/results?page=0&size=10")
            if response.status_code == 200:
                clearing_results = response.json()
                print(f"📋 最新清分结果（前5条）:")
                
                for result in clearing_results[:5]:
                    print(f"   📄 订单: {result.get('orderNo', 'Unknown')}")
                    print(f"      💰 清分金额: ¥{result.get('totalClearingAmount', 0):,.2f}")
                    print(f"      🔗 交易笔数: {result.get('transactionCount', 0)}")
                    print(f"      📅 清分时间: {result.get('clearingTime', 'Unknown')}")
                
            # 查看过账结果
            response = requests.get(f"{self.base_url}/api/passthrough/results?page=0&size=10")
            if response.status_code == 200:
                passthrough_results = response.json()
                print(f"📋 最新过账结果（前5条）:")
                
                for result in passthrough_results[:5]:
                    print(f"   📄 订单: {result.get('orderNo', 'Unknown')}")
                    print(f"      💰 过账金额: ¥{result.get('totalPassthroughAmount', 0):,.2f}")
                    print(f"      💎 留存金额: ¥{result.get('retentionAmount', 0):,.2f}")
                    print(f"      📅 过账时间: {result.get('passthroughTime', 'Unknown')}")
                
                return len(clearing_results), len(passthrough_results)
            else:
                print(f"❌ 获取结果失败: {response.status_code}")
                return 0, 0
        except Exception as e:
            print(f"❌ 获取结果异常: {e}")
            return 0, 0

if __name__ == "__main__":
    print("🎯 OneOrder 资金流清分+过账处理执行器")
    print("📝 为已完成管理账分润的订单执行资金流清分和过账处理")
    print("=" * 80)
    
    executor = ClearingAndPassthroughExecutor()
    
    # 执行清分和过账处理
    clearing_success, passthrough_success, failed = executor.execute_all_clearing_and_passthrough()
    
    if clearing_success > 0:
        print("\n🔍 检查清分和过账结果...")
        clearing_count, passthrough_count = executor.check_clearing_results()
        print(f"✅ 已生成 {clearing_count} 条清分记录, {passthrough_count} 条过账记录")
    
    print(f"\n🎉 资金流清分+过账处理完成:")
    print(f"   🔄 清分成功: {clearing_success}, 过账成功: {passthrough_success}, 失败: {failed}")
    print("🔗 访问系统查看: http://localhost:8081/api/system-overview.html")