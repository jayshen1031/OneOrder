#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OneOrder 真实订单创建器
使用正确的API创建会持久化到数据库的订单
"""

import requests
import json
import random
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8081"

class RealOrderCreator:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # 真实客户数据
        self.customers = [
            {"id": "CUST_001", "name": "CONG TY TNHH COCREATION GRASS CORPORATION VIET NAM"},
            {"id": "CUST_002", "name": "COCREATION GRASS CORPORATION (VIET NAM) CO., LTD"},
            {"id": "CUST_003", "name": "CONG TY TNHH CONG NGHIEP ZHANG LONG"},
            {"id": "CUST_004", "name": "CONG TY TNHH THOI TRANG G&G VIET NAM"},
            {"id": "CUST_005", "name": "VIETNAM FOUR SEASON MACHINERY MANUFACTORY COMPANY LIMITED"},
            {"id": "CUST_006", "name": "ALPHA AVIATION VIET NAM CO., LTD"},
            {"id": "CUST_007", "name": "BOE VISION ELECTRONIC TECHNOLOGY (VIET NAM) COMPANY LIMITED"},
            {"id": "CUST_008", "name": "AN GIA GROUP COMPANY LIMITED"}
        ]
        
        # 法人实体（使用数据库中实际的ID）
        self.legal_entities = [
            {"id": "SALES001", "name": "上海邦达物流有限公司"},
            {"id": "SALES002", "name": "深圳邦达货运代理有限公司"},
            {"id": "SALES003", "name": "宁波邦达物流有限公司"},
            {"id": "SALES004", "name": "天津邦达国际货运有限公司"},
            {"id": "DELIVERY001", "name": "上海邦达运输有限公司"},
            {"id": "DELIVERY002", "name": "深圳邦达仓储有限公司"}
        ]
        
        # 港口信息
        self.ports = [
            {"code": "CNSHA", "name": "上海港"},
            {"code": "CNSHK", "name": "蛇口港"},
            {"code": "CNNGB", "name": "宁波港"},
            {"code": "CNQIN", "name": "青岛港"},
            {"code": "VNSGN", "name": "胡志明港"},
            {"code": "VNHPH", "name": "海防港"},
            {"code": "USNYC", "name": "纽约港"},
            {"code": "USLAX", "name": "洛杉矶港"},
            {"code": "DEHAM", "name": "汉堡港"},
            {"code": "NLRTM", "name": "鹿特丹港"}
        ]
        
        # 业务类型
        self.business_types = [
            {"code": "SEA_EXPORT", "name": "海运出口"},
            {"code": "SEA_IMPORT", "name": "海运进口"},
            {"code": "AIR_EXPORT", "name": "空运出口"},
            {"code": "AIR_IMPORT", "name": "空运进口"}
        ]
        
        # 货物类型
        self.commodities = [
            "电子产品", "机械设备", "纺织品", "塑料制品", 
            "金属制品", "化工产品", "食品饮料", "家具用品",
            "汽车配件", "建材产品"
        ]
    
    def generate_order_number(self, index):
        """生成唯一的订单号"""
        timestamp = int(time.time())
        return f"REAL-{timestamp}-{str(index).zfill(3)}"
    
    def create_order_request(self, index):
        """创建订单请求数据"""
        customer = random.choice(self.customers)
        legal_entity = random.choice(self.legal_entities)
        loading_port = random.choice(self.ports)
        discharge_port = random.choice([p for p in self.ports if p != loading_port])
        business_type = random.choice(self.business_types)
        commodity = random.choice(self.commodities)
        
        containers = random.randint(1, 4)
        base_amount = random.randint(15000, 50000)
        
        # 生成订单项目
        order_items = []
        
        if business_type["code"] in ["SEA_EXPORT", "SEA_IMPORT"]:
            # 海运费用
            order_items.extend([
                {
                    "costType": "OCEAN_FREIGHT",
                    "description": "海运费",
                    "amount": base_amount * 0.6,
                    "currency": "CNY",
                    "supplier": "船公司"
                },
                {
                    "costType": "LOCAL_CHARGES", 
                    "description": "本地费用",
                    "amount": base_amount * 0.25,
                    "currency": "CNY", 
                    "supplier": "本地代理"
                },
                {
                    "costType": "DOCUMENTATION",
                    "description": "单证费",
                    "amount": base_amount * 0.1,
                    "currency": "CNY",
                    "supplier": "货代"
                },
                {
                    "costType": "HANDLING",
                    "description": "操作费", 
                    "amount": base_amount * 0.05,
                    "currency": "CNY",
                    "supplier": "货代"
                }
            ])
        else:
            # 空运费用
            order_items.extend([
                {
                    "costType": "AIR_FREIGHT",
                    "description": "空运费",
                    "amount": base_amount * 0.7,
                    "currency": "CNY",
                    "supplier": "航空公司"
                },
                {
                    "costType": "HANDLING",
                    "description": "操作费",
                    "amount": base_amount * 0.2,
                    "currency": "CNY",
                    "supplier": "机场"
                },
                {
                    "costType": "DOCUMENTATION",
                    "description": "单证费",
                    "amount": base_amount * 0.1,
                    "currency": "CNY",
                    "supplier": "货代"
                }
            ])
        
        # 创建请求数据
        request_data = {
            "orderNo": self.generate_order_number(index),
            "customerId": customer["id"],
            "customerName": customer["name"],
            "salesEntityId": legal_entity["id"], 
            "deliveryEntityId": legal_entity["id"],
            "paymentEntityId": legal_entity["id"],
            "portOfLoading": loading_port["name"],
            "portOfDischarge": discharge_port["name"],
            "commodityDescription": commodity,
            "weight": round(random.uniform(500, 2000), 2),
            "volume": round(random.uniform(30, 100), 2),
            "containers": containers,
            "tradeTerms": random.choice(["FOB", "CIF", "CFR", "EXW"]),
            "quotedAmount": base_amount,
            "currency": "CNY",
            "clearingMode": random.choice(["STAR", "CHAIN"]),
            "specialRequirements": f"标准{business_type['name']}服务",
            "orderItems": order_items
        }
        
        return request_data
    
    def create_single_order(self, index):
        """创建单个订单"""
        try:
            order_data = self.create_order_request(index)
            
            print(f"📝 创建订单 {index}: {order_data['orderNo']}")
            print(f"   客户: {order_data['customerName'][:50]}...")
            print(f"   航线: {order_data['portOfLoading']} → {order_data['portOfDischarge']}")
            print(f"   金额: ¥{order_data['quotedAmount']:,}")
            
            # 调用API创建订单
            response = self.session.post(f"{BASE_URL}/api/freight-orders", json=order_data)
            
            if response.status_code in [200, 201]:
                result = response.json()
                print(f"   ✅ 创建成功 - ID: {result.get('orderId', 'N/A')}")
                return True, result
            else:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_detail = response.json()
                    if 'message' in error_detail:
                        error_msg += f": {error_detail['message']}"
                except:
                    error_msg += f": {response.text[:100]}"
                print(f"   ❌ 创建失败 - {error_msg}")
                return False, error_msg
                
        except Exception as e:
            print(f"   💥 创建异常 - {str(e)}")
            return False, str(e)
    
    def create_batch_orders(self, count=20):
        """批量创建订单"""
        print(f"🚀 开始创建 {count} 个真实订单...")
        print("=" * 60)
        
        success_count = 0
        failed_count = 0
        created_orders = []
        
        for i in range(1, count + 1):
            success, result = self.create_single_order(i)
            
            if success:
                success_count += 1
                created_orders.append(result)
            else:
                failed_count += 1
            
            # 每5个订单暂停一下
            if i % 5 == 0:
                print(f"⏸️ 已处理 {i} 个订单，暂停 1 秒...")
                time.sleep(1)
        
        print(f"\n📊 创建完成:")
        print(f"   ✅ 成功: {success_count}")
        print(f"   ❌ 失败: {failed_count}")
        print(f"   📈 成功率: {(success_count/count*100):.1f}%")
        
        return created_orders
    
    def verify_orders_created(self):
        """验证订单是否成功创建"""
        print(f"\n🔍 验证订单创建结果...")
        
        try:
            response = self.session.get(f"{BASE_URL}/api/freight-orders?page=0&size=100")
            if response.status_code == 200:
                orders = response.json()
                print(f"✅ 当前系统中共有 {len(orders)} 个订单")
                
                # 显示最新的几个订单
                if len(orders) > 0:
                    print(f"📋 最新的订单:")
                    for order in orders[:5]:
                        order_no = order.get('orderNo', 'N/A')
                        customer = order.get('customerName', 'N/A')
                        amount = order.get('totalAmount', 0)
                        print(f"   - {order_no}: {customer[:30]}... (¥{amount:,})")
                
                return len(orders)
            else:
                print(f"❌ 获取订单列表失败: HTTP {response.status_code}")
                return 0
        except Exception as e:
            print(f"💥 验证异常: {str(e)}")
            return 0

def main():
    """主函数"""
    creator = RealOrderCreator()
    
    print("🎯 OneOrder 真实订单创建器")
    print("📝 将创建持久化到数据库的真实订单")
    print("=" * 60)
    
    # 创建订单前先查看当前数量
    print("📊 创建前状态:")
    initial_count = creator.verify_orders_created()
    
    # 创建订单
    created_orders = creator.create_batch_orders(count=100)
    
    # 验证创建结果
    final_count = creator.verify_orders_created()
    
    new_orders = final_count - initial_count
    print(f"\n🎉 本次新增 {new_orders} 个订单")
    print(f"🔗 访问系统查看: {BASE_URL}/api/freight-order.html")

if __name__ == "__main__":
    main()