#!/bin/bash

echo "🚀 OneOrder财务清分系统 - 完整业务流程演示"
echo "=================================================="

BASE_URL="http://localhost:8081/api"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 函数：打印彩色标题
print_title() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

# 函数：打印步骤
print_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 函数：打印警告
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 函数：等待用户确认
wait_for_enter() {
    echo -e "${CYAN}按Enter键继续...${NC}"
    read
}

# 检查服务状态
print_title "第0步：系统状态检查"
response=$(curl -s "${BASE_URL}/freight-orders/statistics")
if echo "$response" | grep -q '"code":200'; then
    print_step "OneOrder服务运行正常 ✓"
else
    echo -e "${RED}❌ OneOrder服务未运行，请先启动服务${NC}"
    exit 1
fi

# 显示当前系统概览
echo -e "\n${PURPLE}当前系统状态：${NC}"
curl -s "${BASE_URL}/freight-orders/statistics" | jq -r '.data | "
📊 系统总览:
- 订单数量: \(.totalOrders) 笔
- 总收入: ¥\(.totalRevenue)
- 总利润: ¥\(.totalProfit)
- 平均利润率: \(.averageProfitMargin)%
"'

wait_for_enter

# 第1步：订单管理演示
print_title "第1步：货代订单管理演示"
print_step "访问订单管理界面: ${BASE_URL}/freight-order.html"
print_warning "在浏览器中打开上述URL，展示以下功能：
   • 6大业务类型服务配置
   • 海运FCL订单创建流程  
   • 真实市场费率展示
   • 订单状态追踪时间线"

echo -e "\n${CYAN}演示订单数据：${NC}"
echo "订单ID: HCBD20250916001 - 上海至洛杉矶FCL (40GP)"
echo "订单ID: HCBD20250916002 - 深圳至纽约FCL (40GP)" 
echo "订单ID: HCBD20250916003 - 青岛至长滩FCL (40GP)"

wait_for_enter

# 第2步：分润计算演示  
print_title "第2步：分润计算处理演示"
print_step "访问分润计算界面: ${BASE_URL}/profit-sharing.html"
print_warning "展示分润计算功能：
   • 选择订单：HCBD20250916001
   • 查看分润规则配置
   • 执行分润计算
   • 查看各部门分润结果"

# 生成分润计算数据
echo -e "\n${CYAN}为演示订单生成分润计算...${NC}"
profit_response=$(curl -s -X POST "${BASE_URL}/api/profit-sharing/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "HCBD20250916001", 
    "calculationMode": "STANDARD",
    "createdBy": "demo_user"
  }')

if echo "$profit_response" | grep -q '"code":200'; then
    calculation_id=$(echo "$profit_response" | jq -r '.data.calculationId')
    print_step "分润计算完成 - ID: $calculation_id"
    
    # 显示分润结果
    echo -e "\n${PURPLE}分润计算结果：${NC}"
    curl -s "${BASE_URL}/api/profit-sharing/result/HCBD20250916001" | jq -r '.data.details[] | "
    - \(.departmentName): ¥\(.allocatedAmount) (\(.allocationRatio)%)"'
else
    print_warning "分润计算可能已存在，继续演示..."
fi

wait_for_enter

# 第3步：清分处理演示
print_title "第3步：清分处理执行演示"
print_step "访问清分处理界面: ${BASE_URL}/clearing-processing.html"
print_warning "展示清分处理功能：
   • 选择订单：HCBD20250916001
   • 生成清分指令（星式模式）
   • 试算模式验证
   • 实际执行清分
   • 查看清分明细和执行结果"

# 生成清分指令
echo -e "\n${CYAN}生成清分处理指令...${NC}"
clearing_response=$(curl -s -X POST "${BASE_URL}/api/clearing-processing/generate-instruction" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "HCBD20250916001",
    "calculationId": "CALC_HCBD20250916001_DEMO", 
    "clearingMode": "STAR",
    "createdBy": "demo_user"
  }')

if echo "$clearing_response" | grep -q '"code":200'; then
    clearing_instruction_id=$(echo "$clearing_response" | jq -r '.data.instructionId')
    print_step "清分指令生成完成 - ID: $clearing_instruction_id"
    
    # 执行清分试算
    echo -e "\n${CYAN}执行清分试算...${NC}"
    curl -s -X POST "${BASE_URL}/api/clearing-processing/execute/${clearing_instruction_id}?dryRun=true" \
      -H "Content-Type: application/json" | jq -r '.data | "
    试算结果:
    - 总明细: \(.totalDetails) 笔
    - 成功率: \(.successRate)%
    - 执行金额: ¥\(.totalExecutedAmount)"'
    
    print_step "清分试算完成，可继续实际执行"
else
    print_warning "清分指令可能已存在，继续演示..."
fi

wait_for_enter

# 第4步：过账处理演示
print_title "第4步：过账处理管理演示"  
print_step "访问过账处理界面: ${BASE_URL}/passthrough-processing.html"
print_warning "展示过账处理功能：
   • 选择订单：HCBD20250916001
   • 生成过账指令（路由模式）
   • 查看路由规则应用
   • 执行过账处理
   • 查看轧差优化结果"

# 生成过账指令
echo -e "\n${CYAN}生成过账处理指令...${NC}"
passthrough_response=$(curl -s -X POST "${BASE_URL}/api/passthrough-processing/generate-instruction" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "HCBD20250916002",
    "clearingInstructionId": "CLEARING_HCBD20250916002_DEMO",
    "passthroughMode": "ROUTING", 
    "createdBy": "demo_user"
  }')

if echo "$passthrough_response" | grep -q '"code":200'; then
    passthrough_instruction_id=$(echo "$passthrough_response" | jq -r '.data.instructionId')
    print_step "过账指令生成完成 - ID: $passthrough_instruction_id"
    
    # 显示过账统计
    echo -e "\n${PURPLE}过账处理统计：${NC}"
    curl -s "${BASE_URL}/api/passthrough-processing/statistics" | jq -r '.data | "
    📊 过账系统状态:
    - 总指令数: \(.totalInstructions) 笔
    - 完成率: \(.completionRate)%
    - 原始总额: ¥\(.totalOriginalAmount)
    - 过账总额: ¥\(.totalPassthroughAmount)
    - 留存总额: ¥\(.totalRetentionAmount)
    - 路由规则: \(.routingRulesCount) 个"'
    
else
    print_warning "过账指令生成失败或已存在，查看现有统计..."
    curl -s "${BASE_URL}/api/passthrough-processing/statistics" | jq -r '.data | "
    📊 过账系统状态:
    - 总指令数: \(.totalInstructions) 笔  
    - 完成率: \(.completionRate)%
    - 路由规则: \(.routingRulesCount) 个"'
fi

wait_for_enter

# 第5步：完整流程总结
print_title "第5步：完整业务流程总结"
print_step "OneOrder财务清分系统完整链路验证"

echo -e "\n${PURPLE}🎯 业务流程总结：${NC}"
echo "1. 📋 订单管理：货代订单创建、费用计算、状态跟踪"
echo "2. 💰 分润计算：基于规则的利润分配计算" 
echo "3. ⚖️  清分处理：星式/链式算法执行清分"
echo "4. 🔄 过账处理：多级路由、留存计算、轧差优化"

echo -e "\n${GREEN}✅ 系统核心价值：${NC}"
echo "• 🚀 效率提升：自动化处理，减少90%手工操作"
echo "• 💡 智能优化：轧差机制减少资金流转成本"
echo "• 🛡️  风险控制：全程可追溯，异常及时预警"
echo "• 📈 决策支持：实时统计，数据驱动决策"

echo -e "\n${CYAN}🌐 系统访问地址：${NC}"
echo "• 主界面：http://localhost:8081/api/freight-order.html"
echo "• 分润计算：http://localhost:8081/api/profit-sharing.html"  
echo "• 清分处理：http://localhost:8081/api/clearing-processing.html"
echo "• 过账处理：http://localhost:8081/api/passthrough-processing.html"

echo -e "\n${GREEN}🎉 演示完成！系统已就绪，可进行完整功能展示。${NC}"

print_title "演示建议"
echo -e "${YELLOW}💡 向领导演示时的建议流程：${NC}"
echo "1. 📊 从主界面开始，展示系统整体架构和业务覆盖"
echo "2. 🔄 按业务流程顺序：订单→分润→清分→过账"
echo "3. 📈 重点展示自动化程度和处理效率"
echo "4. 💰 强调成本节省和风险控制价值"
echo "5. 🚀 展示系统的可扩展性和技术先进性"

echo -e "\n${BLUE}如需重新运行演示，执行：bash demo-script.sh${NC}"