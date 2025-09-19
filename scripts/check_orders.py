#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OneOrder 订单验证工具
检查订单创建和数据完整性
"""

import requests
import json
import time

BASE_URL = "http://localhost:8081"

def check_order_status():
    """检查订单状态"""
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    
    print("🔍 OneOrder 订单状态检查")
    print("=" * 50)
    
    # 1. 检查统计信息
    try:
        response = session.get(f"{BASE_URL}/api/freight-orders/statistics")
        if response.status_code == 200:
            stats = response.json()
            print(f"📊 统计信息:")
            print(f"   总订单数: {stats.get('totalOrders', 0)}")
            print(f"   总营收: ¥{stats.get('totalRevenue', 0):,}")
            print(f"   总成本: ¥{stats.get('totalCost', 0):,}")
            print(f"   总利润: ¥{stats.get('totalProfit', 0):,}")
            print(f"   利润率: {stats.get('profitMargin', 0)}%")
            
            if 'businessTypeStats' in stats:
                print(f"   业务类型分布:")
                for btype, count in stats['businessTypeStats'].items():
                    print(f"     - {btype}: {count}个")
        else:
            print(f"❌ 获取统计信息失败: HTTP {response.status_code}")
    except Exception as e:
        print(f"💥 统计信息异常: {str(e)}")
    
    print()
    
    # 2. 检查订单列表
    try:
        response = session.get(f"{BASE_URL}/api/freight-orders?page=0&size=50")
        if response.status_code == 200:
            orders = response.json()
            print(f"📋 订单列表信息:")
            print(f"   API返回订单数: {len(orders)}")
            
            if len(orders) > 0:
                print(f"   最新订单:")
                for i, order in enumerate(orders[:5]):
                    order_no = order.get('orderNo', 'N/A')
                    customer = order.get('customerName', 'N/A')
                    amount = order.get('totalAmount', 0)
                    print(f"     {i+1}. {order_no}: {customer if customer else 'N/A'} (¥{amount if amount else 0:,})")
        else:
            print(f"❌ 获取订单列表失败: HTTP {response.status_code}")
    except Exception as e:
        print(f"💥 订单列表异常: {str(e)}")
    
    print()
    
    # 3. 检查演示数据创建
    try:
        print("🎯 测试演示数据创建...")
        response = session.post(f"{BASE_URL}/api/freight-orders/demo/create-sample")
        if response.status_code == 200:
            demo_orders = response.json()
            print(f"   ✅ 演示数据创建成功: {len(demo_orders)}个订单")
            for order in demo_orders:
                print(f"     - {order['orderNo']}: {order['customerName']} (${order['totalAmount']})")
        else:
            print(f"   ❌ 演示数据创建失败: HTTP {response.status_code}")
    except Exception as e:
        print(f"   💥 演示数据异常: {str(e)}")
    
    print()
    
    # 4. 再次检查统计信息
    try:
        response = session.get(f"{BASE_URL}/api/freight-orders/statistics")
        if response.status_code == 200:
            stats = response.json()
            print(f"📊 更新后统计信息:")
            print(f"   总订单数: {stats.get('totalOrders', 0)}")
            print(f"   总营收: ¥{stats.get('totalRevenue', 0):,}")
        else:
            print(f"❌ 获取更新统计失败: HTTP {response.status_code}")
    except Exception as e:
        print(f"💥 更新统计异常: {str(e)}")
    
    print(f"\n🔗 访问网页查看详细信息: {BASE_URL}/api/freight-order.html")

if __name__ == "__main__":
    check_order_status()