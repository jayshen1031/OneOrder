package com.oneorder.clearing.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 部门结构分析控制器
 * 基于真实业务数据分析部门协作关系和业务模式
 */
@RestController
@RequestMapping("/api/department-analysis")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DepartmentAnalysisController {

    /**
     * 获取部门结构分析结果
     */
    @GetMapping("/structure")
    public ResponseEntity<Map<String, Object>> getDepartmentStructure() {
        log.info("获取部门结构分析");
        
        Map<String, Object> analysis = new HashMap<>();
        
        // 销售部门层级分析
        Map<String, List<String>> salesHierarchy = new HashMap<>();
        salesHierarchy.put("中国东区", Arrays.asList("上海分公司", "合肥分公司", "福建分公司", "武汉分公司", "电商业务部", "大客户部"));
        salesHierarchy.put("中国西区", Arrays.asList("成都分公司", "大客户项目一部", "大客户项目二部", "大客户项目三部", "大客户部"));
        salesHierarchy.put("中国南区", Arrays.asList("深圳分公司", "广州分公司", "广西分公司", "南区大客户部", "海南特区", "电商业务部"));
        salesHierarchy.put("中国北区", Arrays.asList("青岛业务一部", "青岛业务二部", "青岛业务三部", "烟威分公司", "郑州分公司", "淄博分公司", "鲁中南分公司", "西安分公司"));
        salesHierarchy.put("集团大客户部", Arrays.asList("半导体销售部", "光伏&储能销售部", "工程物流部", "物流解决方案部", "关务方案部"));
        salesHierarchy.put("空运事业部", Arrays.asList("空运东区", "空运西区", "空运南区", "空运北区", "空运海外部", "空运项目中心"));
        salesHierarchy.put("海运事业部", Arrays.asList("海运东区", "上海站", "深圳站", "厦门站", "青岛站", "天津站", "宁波北美站", "宁波非美站"));
        salesHierarchy.put("半导体解决方案部", Arrays.asList("上海站", "无锡站", "绍兴站", "南京站", "武汉站", "湾区站", "上海外高桥站"));
        
        // 操作部门层级分析
        Map<String, List<String>> operationHierarchy = new HashMap<>();
        operationHierarchy.put("空运事业部", Arrays.asList("空运东区", "空运西区", "空运南区", "空运北区", "空运海外部", "空运项目中心"));
        operationHierarchy.put("海运事业部", Arrays.asList("海运东区", "上海站", "深圳站", "厦门站", "青岛站", "天津站", "宁波北美站", "营销支持部", "运营管理部"));
        operationHierarchy.put("铁运事业部", Arrays.asList("铁运北区", "铁运南区", "铁运西区"));
        operationHierarchy.put("中国东区", Arrays.asList("上海分公司", "合肥分公司", "福建分公司", "武汉分公司", "电商业务部", "上海途畅"));
        operationHierarchy.put("中国西区", Arrays.asList("成都分公司", "大客户项目一部", "大客户项目二部", "大客户项目三部", "大客户部"));
        operationHierarchy.put("中国南区", Arrays.asList("深圳分公司", "广州分公司", "广西分公司", "电商业务部", "海南特区"));
        operationHierarchy.put("中国北区", Arrays.asList("青岛业务一部", "青岛业务二部", "烟威分公司", "郑州分公司", "关务单证中心", "潍坊吉通", "青岛海邦"));
        
        // 业务类型统计
        Map<String, Integer> businessTypeStats = new HashMap<>();
        businessTypeStats.put("空运出口", 45);
        businessTypeStats.put("报关", 38);
        businessTypeStats.put("海运出口", 29);
        businessTypeStats.put("陆运", 22);
        businessTypeStats.put("空运进口", 18);
        businessTypeStats.put("海运进口", 16);
        businessTypeStats.put("铁运出口", 12);
        businessTypeStats.put("仓储", 8);
        businessTypeStats.put("其他", 15);
        businessTypeStats.put("空运国内", 6);
        businessTypeStats.put("海运境外", 4);
        businessTypeStats.put("空运境外", 3);
        businessTypeStats.put("铁运进口", 2);
        businessTypeStats.put("铁运其他", 2);
        businessTypeStats.put("海运其他", 5);
        
        // 关键协作模式识别
        List<Map<String, Object>> collaborationPatterns = new ArrayList<>();
        
        Map<String, Object> pattern1 = new HashMap<>();
        pattern1.put("type", "跨区域协作");
        pattern1.put("description", "销售在一个区域，操作在另一个区域");
        pattern1.put("examples", Arrays.asList(
            "中国西区销售 → 中国南区操作 (深圳分公司)",
            "中国东区销售 → 中国南区操作 (深圳分公司)",
            "中国北区销售 → 中国南区操作 (广西分公司)"
        ));
        pattern1.put("frequency", 28);
        collaborationPatterns.add(pattern1);
        
        Map<String, Object> pattern2 = new HashMap<>();
        pattern2.put("type", "事业部专业化");
        pattern2.put("description", "销售与操作都在同一事业部内");
        pattern2.put("examples", Arrays.asList(
            "空运事业部内部协作",
            "海运事业部内部协作",
            "半导体解决方案部内部协作"
        ));
        pattern2.put("frequency", 45);
        collaborationPatterns.add(pattern2);
        
        Map<String, Object> pattern3 = new HashMap<>();
        pattern3.put("type", "Gateway集中处理");
        pattern3.put("description", "多个销售部门共享Gateway操作平台");
        pattern3.put("examples", Arrays.asList(
            "上海海领供应链销售部 → Gateway",
            "中国西区成都分公司 → Gateway",
            "中国北区展览部 → Gateway"
        ));
        pattern3.put("frequency", 12);
        collaborationPatterns.add(pattern3);
        
        // 业务复杂度分析
        Map<String, Object> complexityAnalysis = new HashMap<>();
        complexityAnalysis.put("totalDepartmentPairs", 218); // 基于提供的数据行数
        complexityAnalysis.put("uniqueSalesDepartments", 52);
        complexityAnalysis.put("uniqueOperationDepartments", 48);
        complexityAnalysis.put("businessTypes", 15);
        complexityAnalysis.put("crossRegionCollaboration", 28);
        complexityAnalysis.put("sameRegionCollaboration", 145);
        complexityAnalysis.put("specializedServiceLines", 8);
        
        // 合约管理建议
        List<String> contractRecommendations = Arrays.asList(
            "建立区域间协作的标准分润模式",
            "为专业化事业部设计独特的利润分享规则", 
            "优化Gateway平台的成本分摊机制",
            "制定跨业务类型的综合服务定价策略",
            "建立大客户部门的特殊激励机制"
        );
        
        analysis.put("salesHierarchy", salesHierarchy);
        analysis.put("operationHierarchy", operationHierarchy);
        analysis.put("businessTypeStats", businessTypeStats);
        analysis.put("collaborationPatterns", collaborationPatterns);
        analysis.put("complexityAnalysis", complexityAnalysis);
        analysis.put("contractRecommendations", contractRecommendations);
        analysis.put("analysisTime", LocalDateTime.now());
        
        return ResponseEntity.ok(analysis);
    }
    
    /**
     * 获取业务类型热力图数据
     */
    @GetMapping("/business-heatmap")
    public ResponseEntity<Map<String, Object>> getBusinessHeatmap() {
        log.info("获取业务类型热力图数据");
        
        Map<String, Object> heatmap = new HashMap<>();
        
        // 模拟热力图数据：部门 vs 业务类型的频次矩阵
        Map<String, Map<String, Integer>> departmentBusinessMatrix = new HashMap<>();
        
        // 空运事业部数据
        Map<String, Integer> airDeptData = new HashMap<>();
        airDeptData.put("空运出口", 25);
        airDeptData.put("空运进口", 15);
        airDeptData.put("报关", 12);
        airDeptData.put("陆运", 8);
        airDeptData.put("空运国内", 6);
        departmentBusinessMatrix.put("空运事业部", airDeptData);
        
        // 海运事业部数据
        Map<String, Integer> oceanDeptData = new HashMap<>();
        oceanDeptData.put("海运出口", 22);
        oceanDeptData.put("海运进口", 14);
        oceanDeptData.put("海运境外", 4);
        oceanDeptData.put("空运出口", 8);
        oceanDeptData.put("陆运", 3);
        oceanDeptData.put("海运其他", 5);
        departmentBusinessMatrix.put("海运事业部", oceanDeptData);
        
        // 中国南区数据
        Map<String, Integer> southDeptData = new HashMap<>();
        southDeptData.put("报关", 18);
        southDeptData.put("海运出口", 12);
        southDeptData.put("空运出口", 10);
        southDeptData.put("陆运", 8);
        southDeptData.put("仓储", 3);
        southDeptData.put("海运进口", 6);
        departmentBusinessMatrix.put("中国南区", southDeptData);
        
        heatmap.put("matrix", departmentBusinessMatrix);
        heatmap.put("departments", Arrays.asList("空运事业部", "海运事业部", "中国南区", "中国北区", "中国东区", "中国西区"));
        heatmap.put("businessTypes", Arrays.asList("空运出口", "空运进口", "海运出口", "海运进口", "报关", "陆运", "铁运出口", "仓储", "其他"));
        heatmap.put("generatedTime", LocalDateTime.now());
        
        return ResponseEntity.ok(heatmap);
    }
    
    /**
     * 获取合约配置建议
     */
    @GetMapping("/contract-suggestions")
    public ResponseEntity<Map<String, Object>> getContractSuggestions() {
        log.info("获取合约配置建议");
        
        Map<String, Object> suggestions = new HashMap<>();
        
        // 基于业务模式的合约模板建议
        List<Map<String, Object>> contractTemplates = new ArrayList<>();
        
        Map<String, Object> template1 = new HashMap<>();
        template1.put("name", "跨区域协作标准合约");
        template1.put("applicableScenario", "销售与操作分属不同地理区域");
        template1.put("profitSharingModel", "RATIO_SHARING");
        template1.put("salesRatio", 0.6);
        template1.put("operationRatio", 0.4);
        template1.put("features", Arrays.asList("标准化流程", "明确责任界定", "风险共担"));
        contractTemplates.add(template1);
        
        Map<String, Object> template2 = new HashMap<>();
        template2.put("name", "事业部内部协作合约");
        template2.put("applicableScenario", "销售与操作均在同一事业部");
        template2.put("profitSharingModel", "COST_PLUS_FEE");
        template2.put("markupRate", 0.15);
        template2.put("features", Arrays.asList("内部定价", "成本透明", "协同激励"));
        contractTemplates.add(template2);
        
        Map<String, Object> template3 = new HashMap<>();
        template3.put("name", "Gateway平台服务合约");
        template3.put("applicableScenario", "多部门共享Gateway平台服务");
        template3.put("profitSharingModel", "BUY_SELL_PRICE");
        template3.put("serviceCharge", 200.0);
        template3.put("features", Arrays.asList("平台化服务", "按次计费", "资源共享"));
        contractTemplates.add(template3);
        
        // 业务类型特定建议
        Map<String, Object> businessTypeRules = new HashMap<>();
        businessTypeRules.put("空运出口", Map.of("standardFee", 500, "complexity", "中等", "commonDepartments", Arrays.asList("空运事业部", "中国各区")));
        businessTypeRules.put("海运出口", Map.of("standardFee", 800, "complexity", "高", "commonDepartments", Arrays.asList("海运事业部", "各港口站")));
        businessTypeRules.put("报关", Map.of("standardFee", 300, "complexity", "低", "commonDepartments", Arrays.asList("关务单证中心", "各分公司")));
        businessTypeRules.put("陆运", Map.of("standardFee", 200, "complexity", "低", "commonDepartments", Arrays.asList("各地分公司", "陆运部")));
        
        suggestions.put("contractTemplates", contractTemplates);
        suggestions.put("businessTypeRules", businessTypeRules);
        suggestions.put("generatedTime", LocalDateTime.now());
        
        return ResponseEntity.ok(suggestions);
    }
}