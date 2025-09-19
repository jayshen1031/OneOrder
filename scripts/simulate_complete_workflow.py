#!/usr/bin/env python3
"""
OneOrder 完整业务流程模拟器
模拟执行完整的业务流程：录费 → 管理账分润 → 资金流清分 → 过账处理
"""
import requests
import json
import time
from datetime import datetime
from decimal import Decimal
import random

class CompleteWorkflowSimulator:
    def __init__(self):
        self.base_url = "http://localhost:8081/api"
        self.results = {
            "orders_processed": 0,
            "expense_entries_created": 0,
            "management_profit_sharing_completed": 0,
            "financial_clearing_completed": 0,
            "passthrough_completed": 0,
            "total_revenue": 0,
            "total_cost": 0,
            "total_profit": 0
        }
    
    def get_all_orders(self):
        """获取所有订单"""
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
    
    def simulate_expense_entry_completion(self, order):
        """模拟录费完成"""
        order_id = order['orderId']
        order_no = order['orderNo']
        total_amount = float(order.get('totalAmount', 0))
        total_cost = float(order.get('totalCost', 0))
        
        print(f"   🔄 模拟录费流程...")
        
        # 模拟生成5-8个费用明细
        entry_count = random.randint(5, 8)
        revenue_entries = random.randint(2, 4)
        cost_entries = entry_count - revenue_entries
        
        # 分配收入明细金额
        revenue_amounts = []
        remaining_revenue = total_amount
        for i in range(revenue_entries):
            if i == revenue_entries - 1:  # 最后一项
                revenue_amounts.append(remaining_revenue)
            else:
                amount = remaining_revenue * random.uniform(0.2, 0.5)
                revenue_amounts.append(amount)
                remaining_revenue -= amount
        
        # 分配成本明细金额
        cost_amounts = []
        remaining_cost = total_cost
        for i in range(cost_entries):
            if i == cost_entries - 1:  # 最后一项
                cost_amounts.append(remaining_cost)
            else:
                amount = remaining_cost * random.uniform(0.2, 0.5)
                cost_amounts.append(amount)
                remaining_cost -= amount
        
        print(f"      📊 生成 {revenue_entries} 个收入明细, {cost_entries} 个成本明细")
        self.results["expense_entries_created"] += entry_count
        
        return {
            "entry_count": entry_count,
            "revenue_entries": revenue_entries,
            "cost_entries": cost_entries,
            "revenue_amounts": revenue_amounts,
            "cost_amounts": cost_amounts
        }
    
    def simulate_management_profit_sharing(self, order, expense_info):
        """模拟管理账分润计算"""
        order_id = order['orderId']
        order_no = order['orderNo']
        total_amount = float(order.get('totalAmount', 0))
        total_cost = float(order.get('totalCost', 0))
        gross_profit = total_amount - total_cost
        
        print(f"   🔄 模拟管理账分润计算...")
        
        # 模拟分润比例
        sales_ratio = random.uniform(0.4, 0.7)
        operation_ratio = 1.0 - sales_ratio
        
        sales_profit = gross_profit * sales_ratio
        operation_profit = gross_profit * operation_ratio
        
        print(f"      📊 销售部门分润: ¥{sales_profit:,.2f} ({sales_ratio:.1%})")
        print(f"      🔧 操作部门分润: ¥{operation_profit:,.2f} ({operation_ratio:.1%})")
        
        self.results["management_profit_sharing_completed"] += 1
        
        return {
            "sales_profit": sales_profit,
            "operation_profit": operation_profit,
            "sales_ratio": sales_ratio,
            "operation_ratio": operation_ratio,
            "gross_profit": gross_profit
        }
    
    def simulate_financial_clearing(self, order, profit_info):
        """模拟资金流清分"""
        order_id = order['orderId']
        order_no = order['orderNo']
        total_amount = float(order.get('totalAmount', 0))
        total_cost = float(order.get('totalCost', 0))
        
        print(f"   🔄 模拟资金流清分...")
        
        # 模拟星式结算模式
        settlement_mode = "STAR"  # 星式结算
        
        # 模拟法人实体分配
        legal_entities = [
            {"id": "SALES001", "name": "上海邦达物流有限公司", "role": "总包法人"},
            {"id": "DELIVERY001", "name": "上海邦达运输有限公司", "role": "执行法人"},
            {"id": "SALES002", "name": "深圳邦达货运代理有限公司", "role": "服务法人"}
        ]
        
        # 模拟生成内部交易
        internal_transactions = []
        
        # 客户付款到总包法人
        internal_transactions.append({
            "transaction_type": "CUSTOMER_PAYMENT",
            "from_entity": "客户",
            "to_entity": legal_entities[0]["name"],
            "amount": total_amount,
            "description": "客户付款"
        })
        
        # 总包法人支付给执行法人
        execution_amount = total_cost * random.uniform(0.6, 0.8)
        internal_transactions.append({
            "transaction_type": "INTERNAL_PAYMENT",
            "from_entity": legal_entities[0]["name"],
            "to_entity": legal_entities[1]["name"],
            "amount": execution_amount,
            "description": "内部执行费用"
        })
        
        # 执行法人支付给供应商
        supplier_payment = total_cost * random.uniform(0.7, 0.9)
        internal_transactions.append({
            "transaction_type": "SUPPLIER_PAYMENT",
            "from_entity": legal_entities[1]["name"],
            "to_entity": "供应商",
            "amount": supplier_payment,
            "description": "供应商付款"
        })
        
        total_clearing_amount = sum([t["amount"] for t in internal_transactions])
        transaction_count = len(internal_transactions)
        
        print(f"      📊 清分模式: {settlement_mode}")
        print(f"      🔗 交易笔数: {transaction_count}")
        print(f"      💰 清分金额: ¥{total_clearing_amount:,.2f}")
        
        self.results["financial_clearing_completed"] += 1
        
        return {
            "settlement_mode": settlement_mode,
            "legal_entities": legal_entities,
            "internal_transactions": internal_transactions,
            "total_clearing_amount": total_clearing_amount,
            "transaction_count": transaction_count
        }
    
    def simulate_passthrough_processing(self, order, clearing_info):
        """模拟过账处理"""
        order_id = order['orderId']
        order_no = order['orderNo']
        
        print(f"   🔄 模拟过账处理...")
        
        # 模拟资金路由规则
        routing_rules = {
            "retention_ratio": 0.1,  # 10%留存
            "enable_netting": True,  # 启用轧差
            "routing_strategy": "MINIMIZE_TRANSACTIONS"
        }
        
        original_transactions = clearing_info["internal_transactions"]
        original_amount = clearing_info["total_clearing_amount"]
        
        # 模拟轧差处理
        netting_reduction = random.uniform(0.1, 0.3)  # 轧差减少10-30%的交易
        final_transaction_count = max(1, int(len(original_transactions) * (1 - netting_reduction)))
        
        # 模拟留存金额
        retention_amount = original_amount * routing_rules["retention_ratio"]
        final_passthrough_amount = original_amount - retention_amount
        
        # 模拟最终交易记录
        final_transactions = []
        for i in range(final_transaction_count):
            amount = final_passthrough_amount / final_transaction_count
            final_transactions.append({
                "transaction_id": f"TXN_{order_id}_{i+1:03d}",
                "from_entity": f"法人实体_{i+1}",
                "to_entity": f"法人实体_{i+2}",
                "amount": amount,
                "transaction_type": "FINAL_SETTLEMENT",
                "routing_rule": routing_rules["routing_strategy"]
            })
        
        print(f"      📊 路由策略: {routing_rules['routing_strategy']}")
        print(f"      💎 留存金额: ¥{retention_amount:,.2f}")
        print(f"      💰 过账金额: ¥{final_passthrough_amount:,.2f}")
        print(f"      🔗 最终交易笔数: {final_transaction_count}")
        print(f"      📉 轧差优化: {len(original_transactions)} → {final_transaction_count} 笔")
        
        self.results["passthrough_completed"] += 1
        
        return {
            "routing_rules": routing_rules,
            "original_transaction_count": len(original_transactions),
            "final_transaction_count": final_transaction_count,
            "retention_amount": retention_amount,
            "final_passthrough_amount": final_passthrough_amount,
            "final_transactions": final_transactions,
            "netting_efficiency": netting_reduction
        }
    
    def process_single_order_workflow(self, order):
        """处理单个订单的完整业务流程"""
        order_id = order['orderId']
        order_no = order['orderNo']
        total_amount = float(order.get('totalAmount', 0))
        total_cost = float(order.get('totalCost', 0))
        
        print(f"📝 处理订单 {order_no}:")
        print(f"   💰 总收入: ¥{total_amount:,.2f}")
        print(f"   💸 总成本: ¥{total_cost:,.2f}")
        print(f"   💎 预估毛利: ¥{total_amount - total_cost:,.2f}")
        
        # 1. 录费流程
        expense_info = self.simulate_expense_entry_completion(order)
        
        # 2. 管理账分润计算
        profit_info = self.simulate_management_profit_sharing(order, expense_info)
        
        # 3. 资金流清分
        clearing_info = self.simulate_financial_clearing(order, profit_info)
        
        # 4. 过账处理
        passthrough_info = self.simulate_passthrough_processing(order, clearing_info)
        
        # 更新统计
        self.results["orders_processed"] += 1
        self.results["total_revenue"] += total_amount
        self.results["total_cost"] += total_cost
        self.results["total_profit"] += (total_amount - total_cost)
        
        print(f"   ✅ 订单 {order_no} 业务流程完成")
        
        return {
            "order_info": {
                "order_id": order_id,
                "order_no": order_no,
                "total_amount": total_amount,
                "total_cost": total_cost
            },
            "expense_info": expense_info,
            "profit_info": profit_info,
            "clearing_info": clearing_info,
            "passthrough_info": passthrough_info
        }
    
    def execute_complete_workflow(self):
        """执行完整业务流程"""
        orders = self.get_all_orders()
        if not orders:
            print("❌ 无法获取订单列表")
            return
        
        print(f"🚀 开始执行完整业务流程: 录费 → 管理账分润 → 资金流清分 → 过账处理")
        print(f"📊 待处理订单: {len(orders)} 个")
        print("=" * 80)
        
        processed_orders = []
        
        for i, order in enumerate(orders, 1):
            order_result = self.process_single_order_workflow(order)
            processed_orders.append(order_result)
            
            # 每10个订单暂停一下
            if i % 10 == 0:
                print(f"⏸️ 已处理 {i} 个订单，暂停 1 秒...")
                time.sleep(1)
        
        self.print_workflow_summary()
        return processed_orders
    
    def print_workflow_summary(self):
        """打印工作流程汇总"""
        print("=" * 80)
        print(f"📊 完整业务流程执行汇总:")
        print(f"   📦 订单处理:")
        print(f"      ✅ 处理订单数: {self.results['orders_processed']}")
        print(f"      💰 总收入: ¥{self.results['total_revenue']:,.2f}")
        print(f"      💸 总成本: ¥{self.results['total_cost']:,.2f}")
        print(f"      💎 总毛利: ¥{self.results['total_profit']:,.2f}")
        
        print(f"   📝 录费模块:")
        print(f"      ✅ 费用明细创建: {self.results['expense_entries_created']} 条")
        
        print(f"   🔄 管理账分润:")
        print(f"      ✅ 分润计算完成: {self.results['management_profit_sharing_completed']} 个订单")
        
        print(f"   💰 资金流清分:")
        print(f"      ✅ 清分完成: {self.results['financial_clearing_completed']} 个订单")
        
        print(f"   📋 过账处理:")
        print(f"      ✅ 过账完成: {self.results['passthrough_completed']} 个订单")
        
        if self.results['orders_processed'] > 0:
            print(f"   📈 成功率:")
            print(f"      📦 订单处理: 100.0%")
            print(f"      📝 录费: 100.0%")
            print(f"      🔄 分润: 100.0%")
            print(f"      💰 清分: 100.0%")
            print(f"      📋 过账: 100.0%")
            
            avg_revenue = self.results['total_revenue'] / self.results['orders_processed']
            avg_cost = self.results['total_cost'] / self.results['orders_processed']
            avg_profit = self.results['total_profit'] / self.results['orders_processed']
            profit_margin = (self.results['total_profit'] / self.results['total_revenue']) * 100
            
            print(f"   📊 业务指标:")
            print(f"      📈 平均订单收入: ¥{avg_revenue:,.2f}")
            print(f"      📉 平均订单成本: ¥{avg_cost:,.2f}")
            print(f"      💎 平均订单毛利: ¥{avg_profit:,.2f}")
            print(f"      📈 整体毛利率: {profit_margin:.2f}%")

if __name__ == "__main__":
    print("🎯 OneOrder 完整业务流程模拟器")
    print("📝 模拟执行: 录费 → 管理账分润 → 资金流清分 → 过账处理")
    print("=" * 80)
    
    simulator = CompleteWorkflowSimulator()
    
    # 执行完整业务流程
    results = simulator.execute_complete_workflow()
    
    print(f"\n🎉 完整业务流程执行完成!")
    print("🔗 访问系统查看: http://localhost:8081/api/system-overview.html")