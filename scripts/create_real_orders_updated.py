#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OneOrder 真实订单创建器 (基于实际客户数据)
使用真实的客户、供应商和内部部门数据创建订单
"""

import requests
import json
import random
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8081"

class RealOrderCreatorUpdated:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # 真实客户数据 (外部收款法人)
        self.customers = [
            {"id": "CUST_001", "name": "CONG TY TNHH COCREATION GRASS CORPORATION VIET NAM"},
            {"id": "CUST_002", "name": "COCREATION GRASS CORPORATION (VIET NAM) CO., LTD"},
            {"id": "CUST_003", "name": "CONG TY TNHH CONG NGHIEP ZHANG LONG"},
            {"id": "CUST_004", "name": "CONG TY TNHH THOI TRANG G&G VIET NAM"},
            {"id": "CUST_005", "name": "VIETNAM FOUR SEASON MACHINERY MANUFACTORY COMPANY LIMITED"},
            {"id": "CUST_006", "name": "ALPHA AVIATION VIET NAM CO., LTD"},
            {"id": "CUST_007", "name": "BOE VISION ELECTRONIC TECHNOLOGY (VIET NAM) COMPANY LIMITED"},
            {"id": "CUST_008", "name": "CHI NHANH THANH PHO HAI PHONG CONG TY CO PHAN GIAO NHAN WIN WIN"},
            {"id": "CUST_009", "name": "CONG TY TNHH NINGBO CHANGYA PLASTIC (VIET NAM)"},
            {"id": "CUST_010", "name": "AN GIA GROUP COMPANY LIMITED"}
        ]
        
        # 真实供应商数据 (外部付款法人)
        self.suppliers = [
            {"id": "SUPPLIER_001", "name": "CONG TY TNHH OCEAN NETWORK EXPRESS (VIETNAM)"},
            {"id": "SUPPLIER_002", "name": "CONG TY CO PHAN CMA-CGM VIETNAM"},
            {"id": "SUPPLIER_003", "name": "CONG TY TNHH WAN HAI VIETNAM"},
            {"id": "SUPPLIER_004", "name": "CONG TY TNHH MAERSK VIETNAM"},
            {"id": "SUPPLIER_005", "name": "CONG TY TNHH DICH VU ZIM INTEGRATED SHIPPING VIETNAM"},
            {"id": "SUPPLIER_006", "name": "CÔNG TY TNHH DỊCH VỤ VẬN TẢI NHƯ Ý"},
            {"id": "SUPPLIER_007", "name": "NGUYEN LONG TRANSPORT FORWARDING SERVICE TRADING COMPANY LIMITED"},
            {"id": "SUPPLIER_008", "name": "YANG MING SHIPPING (VIET NAM) CO., LTD"},
            {"id": "SUPPLIER_009", "name": "ANH DUONG TRANSPORT SERVICES INVESTMENT COMPANY LIMITED"},
            {"id": "SUPPLIER_010", "name": "RUBY SKY CO., LTD"}
        ]
        
        # 内部关联交易法人 (公司内部法人实体)
        self.internal_entities = [
            {"id": "HCBD_GROUP", "name": "海程邦达国际物流有限公司"},
            {"id": "QINGDAO_SY", "name": "青岛顺圆物流有限公司"},
            {"id": "SITC_VIETNAM", "name": "SITC BONDEX VIETNAM LOGISTICS CO., LTD."},
            {"id": "HCBD_SCM", "name": "海程邦达供应链管理股份有限公司"},
            {"id": "SY_GROUP", "name": "顺圆弘通物流集团有限公司"},
            {"id": "SAFROUND_HK", "name": "SAFROUND LOGISTICS (HK) COMPANY LIMITED"},
            {"id": "HCBD_CHENGDU", "name": "海程邦达国际物流有限公司成都分公司"},
            {"id": "SHANGHAI_HL", "name": "上海海领供应链管理有限公司"},
            {"id": "SAFROUND_VN", "name": "SAFROUND LOGISTICS VIETNAM CO., LTD"},
            {"id": "YIWU_SY", "name": "义乌顺圆物流有限公司"}
        ]
        
        # 销售部门 (一级二级部门结构)
        self.sales_departments = [
            {"lev1": "上海海领供应链", "lev2": "销售部"},
            {"lev1": "空运事业部", "lev2": "空运南区"},
            {"lev1": "集团大客户部", "lev2": "半导体销售部"},
            {"lev1": "中国西区", "lev2": "大客户项目一部"},
            {"lev1": "中国西区", "lev2": "大客户项目三部"},
            {"lev1": "中国西区", "lev2": "成都分公司"},
            {"lev1": "中国南区", "lev2": "广西分公司"},
            {"lev1": "中国东区", "lev2": "上海途畅"},
            {"lev1": "空运事业部", "lev2": "空运海外部"},
            {"lev1": "半导体解决方案部", "lev2": "无锡站"},
            {"lev1": "中国东区", "lev2": "福建分公司"},
            {"lev1": "空运事业部", "lev2": "空运项目中心"},
            {"lev1": "半导体解决方案部", "lev2": "绍兴站"},
            {"lev1": "中国北区", "lev2": "青岛业务三部"},
            {"lev1": "中国北区", "lev2": "青岛业务一部"},
            {"lev1": "中国北区", "lev2": "烟威分公司"},
            {"lev1": "中国北区", "lev2": "青岛业务二部"},
            {"lev1": "集团大客户部", "lev2": "物流解决方案部"},
            {"lev1": "中国北区", "lev2": "郑州分公司"},
            {"lev1": "半导体解决方案部", "lev2": "南京站"}
        ]
        
        # 操作部门 (一级二级部门结构)
        self.operation_departments = [
            {"lev1": "上海海领供应链", "lev2": "Gateway"},
            {"lev1": "空运事业部", "lev2": "空运西区"},
            {"lev1": "中国南区", "lev2": "深圳分公司"},
            {"lev1": "中国东区", "lev2": "合肥分公司"},
            {"lev1": "中国西区", "lev2": "大客户项目三部"},
            {"lev1": "中国西区", "lev2": "成都分公司"},
            {"lev1": "半导体解决方案部", "lev2": "上海外高桥站"},
            {"lev1": "中国南区", "lev2": "广西分公司"},
            {"lev1": "中国东区", "lev2": "上海途畅"},
            {"lev1": "半导体解决方案部", "lev2": "无锡站"},
            {"lev1": "中国东区", "lev2": "福建分公司"},
            {"lev1": "半导体解决方案部", "lev2": "绍兴站"},
            {"lev1": "空运事业部", "lev2": "空运北区"},
            {"lev1": "中国北区", "lev2": "潍坊吉通"},
            {"lev1": "铁运事业部", "lev2": "铁运北区"},
            {"lev1": "中国北区", "lev2": "关务单证中心"},
            {"lev1": "半导体解决方案部", "lev2": "南京站"},
            {"lev1": "空运事业部", "lev2": "空运南区"},
            {"lev1": "中国东区", "lev2": "武汉分公司"},
            {"lev1": "中国北区", "lev2": "淄博分公司"}
        ]
        
        # 业务类型 (基于真实ie_flag)
        self.business_types = [
            {"code": "SEA_EXPORT", "name": "海运出口", "ie_flag": "海运出口"},
            {"code": "SEA_IMPORT", "name": "海运进口", "ie_flag": "海运进口"},
            {"code": "AIR_EXPORT", "name": "空运出口", "ie_flag": "空运出口"},
            {"code": "AIR_IMPORT", "name": "空运进口", "ie_flag": "空运进口"},
            {"code": "CUSTOMS", "name": "报关", "ie_flag": "报关"},
            {"code": "LAND_TRANSPORT", "name": "陆运", "ie_flag": "陆运"},
            {"code": "RAIL_EXPORT", "name": "铁运出口", "ie_flag": "铁运出口"},
            {"code": "WAREHOUSE", "name": "仓储", "ie_flag": "仓储"}
        ]
        
        # 港口信息
        self.ports = [
            {"code": "CNSHA", "name": "上海港"},
            {"code": "CNSHK", "name": "蛇口港"},
            {"code": "CNNGB", "name": "宁波港"},
            {"code": "CNQIN", "name": "青岛港"},
            {"code": "CNTAO", "name": "天津港"},
            {"code": "VNSGN", "name": "胡志明港"},
            {"code": "VNHPH", "name": "海防港"},
            {"code": "USNYC", "name": "纽约港"},
            {"code": "USLAX", "name": "洛杉矶港"},
            {"code": "DEHAM", "name": "汉堡港"},
            {"code": "NLRTM", "name": "鹿特丹港"}
        ]
        
        # 货物类型
        self.commodities = [
            "电子产品", "机械设备", "纺织品", "塑料制品", 
            "金属制品", "化工产品", "食品饮料", "家具用品",
            "汽车配件", "建材产品", "半导体器件", "光伏组件",
            "储能设备", "医疗器械", "服装鞋帽"
        ]
    
    def generate_order_number(self, index):
        """生成唯一的订单号"""
        timestamp = int(time.time())
        return f"REAL-{timestamp}-{str(index).zfill(3)}"
    
    def create_order_request(self, index):
        """创建订单请求数据"""
        customer = random.choice(self.customers)
        sales_dept = random.choice(self.sales_departments)
        op_dept = random.choice(self.operation_departments)
        business_type = random.choice(self.business_types)
        
        # 根据业务类型选择合适的法人实体
        if business_type["ie_flag"] in ["海运出口", "海运进口"]:
            legal_entity = random.choice([
                {"id": "HCBD_GROUP", "name": "海程邦达国际物流有限公司"},
                {"id": "QINGDAO_SY", "name": "青岛顺圆物流有限公司"}
            ])
        elif business_type["ie_flag"] in ["空运出口", "空运进口"]:
            legal_entity = random.choice([
                {"id": "SHANGHAI_HL", "name": "上海海领供应链管理有限公司"},
                {"id": "HCBD_SCM", "name": "海程邦达供应链管理股份有限公司"}
            ])
        else:
            legal_entity = random.choice(self.internal_entities)
        
        loading_port = random.choice(self.ports)
        discharge_port = random.choice([p for p in self.ports if p != loading_port])
        commodity = random.choice(self.commodities)
        
        containers = random.randint(1, 4)
        base_amount = random.randint(15000, 50000)
        
        # 生成订单项目
        order_items = []
        
        if business_type["ie_flag"] in ["海运出口", "海运进口"]:
            # 海运费用
            order_items.extend([
                {
                    "costType": "OCEAN_FREIGHT",
                    "description": "海运费",
                    "amount": base_amount * 0.6,
                    "currency": "CNY",
                    "supplier": random.choice(self.suppliers)["name"]
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
        elif business_type["ie_flag"] in ["空运出口", "空运进口"]:
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
        elif business_type["ie_flag"] == "报关":
            # 报关费用
            order_items.extend([
                {
                    "costType": "CUSTOMS_CLEARANCE",
                    "description": "报关费",
                    "amount": base_amount * 0.6,
                    "currency": "CNY",
                    "supplier": "报关行"
                },
                {
                    "costType": "INSPECTION_FEE",
                    "description": "查验费",
                    "amount": base_amount * 0.3,
                    "currency": "CNY",
                    "supplier": "海关"
                },
                {
                    "costType": "DOCUMENTATION",
                    "description": "单证费",
                    "amount": base_amount * 0.1,
                    "currency": "CNY",
                    "supplier": "货代"
                }
            ])
        else:
            # 其他业务类型
            order_items.extend([
                {
                    "costType": "SERVICE_FEE",
                    "description": f"{business_type['name']}服务费",
                    "amount": base_amount * 0.8,
                    "currency": "CNY",
                    "supplier": random.choice(self.suppliers)["name"]
                },
                {
                    "costType": "HANDLING",
                    "description": "操作费",
                    "amount": base_amount * 0.2,
                    "currency": "CNY",
                    "supplier": "货代"
                }
            ])
        
        # 创建请求数据 (只使用后端支持的字段)
        request_data = {
            "orderNo": self.generate_order_number(index),
            "customerId": customer["id"],
            "customerName": customer["name"],
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
            "remarks": f"标准{business_type['name']}服务 - 销售:{sales_dept['lev1']}-{sales_dept['lev2']} 操作:{op_dept['lev1']}-{op_dept['lev2']}"
        }
        
        return request_data
    
    def create_single_order(self, index):
        """创建单个订单"""
        try:
            order_data = self.create_order_request(index)
            
            print(f"📝 创建订单 {index}: {order_data['orderNo']}")
            print(f"   客户: {order_data['customerName'][:50]}...")
            print(f"   业务类型: {order_data['businessType']}")
            print(f"   销售部门: {order_data['salesDepartmentLev1']}-{order_data['salesDepartmentLev2']}")
            print(f"   操作部门: {order_data['operationDepartmentLev1']}-{order_data['operationDepartmentLev2']}")
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
    
    def create_batch_orders(self, count=50):
        """批量创建订单"""
        print(f"🚀 开始创建 {count} 个基于真实数据的订单...")
        print("📊 使用真实客户、供应商和内部部门数据")
        print("=" * 80)
        
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
            response = self.session.get(f"{BASE_URL}/api/freight-orders?page=0&size=200")
            if response.status_code == 200:
                orders = response.json()
                print(f"✅ 当前系统中共有 {len(orders)} 个订单")
                
                # 统计客户分布
                customer_stats = {}
                business_type_stats = {}
                
                for order in orders:
                    customer_name = order.get('customerName', 'Unknown')
                    business_type = order.get('businessType', 'Unknown')
                    
                    customer_stats[customer_name] = customer_stats.get(customer_name, 0) + 1
                    business_type_stats[business_type] = business_type_stats.get(business_type, 0) + 1
                
                print(f"📋 客户分布 (前10名):")
                sorted_customers = sorted(customer_stats.items(), key=lambda x: x[1], reverse=True)
                for customer, count in sorted_customers[:10]:
                    print(f"   - {customer[:50]}...: {count} 个订单")
                
                print(f"📊 业务类型分布:")
                for biz_type, count in sorted(business_type_stats.items()):
                    print(f"   - {biz_type}: {count} 个订单")
                
                return len(orders)
            else:
                print(f"❌ 获取订单列表失败: HTTP {response.status_code}")
                return 0
        except Exception as e:
            print(f"💥 验证异常: {str(e)}")
            return 0

def main():
    """主函数"""
    creator = RealOrderCreatorUpdated()
    
    print("🎯 OneOrder 真实订单创建器 (基于实际业务数据)")
    print("📝 使用真实客户、供应商和内部部门数据创建订单")
    print("=" * 80)
    
    # 创建订单前先查看当前数量
    print("📊 创建前状态:")
    initial_count = creator.verify_orders_created()
    
    # 创建订单
    created_orders = creator.create_batch_orders(count=50)
    
    # 验证创建结果
    final_count = creator.verify_orders_created()
    
    new_orders = final_count - initial_count
    print(f"\n🎉 本次新增 {new_orders} 个订单")
    print(f"🔗 访问系统查看: {BASE_URL}/api/freight-order.html")

if __name__ == "__main__":
    main()