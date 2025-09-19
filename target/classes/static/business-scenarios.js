/**
 * 真实业务场景数据生成器
 * 支持借抬头与过账规则测试的完整业务数据
 */

// 业务场景配置
const BUSINESS_SCENARIOS = {
    // 高价值海运场景
    'high-value-ocean': {
        name: '高价值海运场景',
        description: '华为深圳至荷兰阿姆斯特丹的高端设备海运业务',
        customer: {
            id: 'CUST_HUAWEI_001',
            name: '华为技术有限公司',
            type: 'PREMIUM_CUSTOMER',
            creditLevel: 'AAA',
            region: 'CN'
        },
        orders: [
            {
                orderId: 'HW2025010801',
                orderNo: 'HCBX-SHA-AMS-240108-001',
                businessType: 'OCEAN_FREIGHT',
                route: {
                    pol: 'CNSHA', // 上海港
                    pod: 'NLAMS', // 阿姆斯特丹港
                    via: 'SGSIN'  // 新加坡中转
                },
                cargo: {
                    description: '5G基站设备及配件',
                    weight: '28500 KGS',
                    volume: '856 CBM',
                    containers: '12 x 40HQ',
                    value: 'USD 2,850,000',
                    hsCode: '8517.62.00'
                },
                services: [
                    {
                        serviceType: 'OCEAN_FREIGHT',
                        serviceName: '海运主运费',
                        provider: 'COSCO_SHIPPING',
                        chargeAmount: 85000,
                        costAmount: 68000,
                        currency: 'CNY',
                        unitPrice: 7083.33,
                        quantity: 12,
                        unit: 'CNTR'
                    },
                    {
                        serviceType: 'THC_ORIGIN',
                        serviceName: '起运港码头操作费',
                        provider: 'SHANGHAI_PORT',
                        chargeAmount: 9600,
                        costAmount: 7200,
                        currency: 'CNY',
                        unitPrice: 800,
                        quantity: 12,
                        unit: 'CNTR'
                    },
                    {
                        serviceType: 'DOCUMENTATION',
                        serviceName: '单证服务费',
                        provider: 'INTERNAL',
                        chargeAmount: 3500,
                        costAmount: 800,
                        currency: 'CNY',
                        unitPrice: 3500,
                        quantity: 1,
                        unit: 'BILL'
                    },
                    {
                        serviceType: 'CUSTOMS_CLEARANCE',
                        serviceName: '出口报关费',
                        provider: 'CUSTOMS_AGENT_SH',
                        chargeAmount: 2800,
                        costAmount: 2000,
                        currency: 'CNY',
                        unitPrice: 2800,
                        quantity: 1,
                        unit: 'DECL'
                    },
                    {
                        serviceType: 'INSURANCE',
                        serviceName: '货运险',
                        provider: 'PICC_MARINE',
                        chargeAmount: 15200,
                        costAmount: 12800,
                        currency: 'CNY',
                        unitPrice: 15200,
                        quantity: 1,
                        unit: 'LOT'
                    }
                ],
                timeline: [
                    { event: '订舱确认', date: '2025-01-08', status: 'COMPLETED' },
                    { event: '货物装柜', date: '2025-01-12', status: 'COMPLETED' },
                    { event: '报关放行', date: '2025-01-14', status: 'COMPLETED' },
                    { event: '船舶开航', date: '2025-01-15', status: 'COMPLETED' },
                    { event: '新加坡中转', date: '2025-01-28', status: 'IN_PROGRESS' },
                    { event: '阿姆斯特丹到港', date: '2025-02-15', status: 'PENDING' }
                ],
                totalAmount: 116100,
                totalCost: 90800,
                currency: 'CNY',
                profitMargin: 21.8,
                transitEntity: {
                    type: 'RECEIVABLE_TRANSIT',
                    entityId: 'ENTITY_HK_001',
                    retentionRate: 0.03,
                    expectedRetention: 3483
                }
            }
        ]
    },

    // 跨境陆运场景
    'cross-border-truck': {
        name: '跨境陆运场景',
        description: '比亚迪深圳至曼谷的新能源汽车配件陆运业务',
        customer: {
            id: 'CUST_BYD_001',
            name: '比亚迪股份有限公司',
            type: 'CORPORATE_CUSTOMER',
            creditLevel: 'AA',
            region: 'CN'
        },
        orders: [
            {
                orderId: 'BYD2025010901',
                orderNo: 'BYDX-SZX-BKK-240109-001',
                businessType: 'TRUCK_FREIGHT',
                route: {
                    pol: 'CNSZX', // 深圳
                    pod: 'THBKK', // 曼谷
                    via: 'VNSGN'  // 胡志明市中转
                },
                cargo: {
                    description: '电动汽车电池组件',
                    weight: '15800 KGS',
                    volume: '128 CBM',
                    packages: '158 PLTS',
                    value: 'CNY 1,580,000',
                    hsCode: '8507.60.00'
                },
                services: [
                    {
                        serviceType: 'TRUCK_FREIGHT',
                        serviceName: '陆运主运费',
                        provider: 'CROSS_BORDER_LOGISTICS',
                        chargeAmount: 42000,
                        costAmount: 35000,
                        currency: 'CNY',
                        unitPrice: 265.82,
                        quantity: 158,
                        unit: 'PLT'
                    },
                    {
                        serviceType: 'BORDER_CLEARANCE',
                        serviceName: '口岸通关费',
                        provider: 'BORDER_AGENT_VN',
                        chargeAmount: 8500,
                        costAmount: 6800,
                        currency: 'CNY',
                        unitPrice: 8500,
                        quantity: 1,
                        unit: 'LOT'
                    },
                    {
                        serviceType: 'TRANSIT_HANDLING',
                        serviceName: '中转操作费',
                        provider: 'VIETNAM_WAREHOUSE',
                        chargeAmount: 4800,
                        costAmount: 3600,
                        currency: 'CNY',
                        unitPrice: 30.38,
                        quantity: 158,
                        unit: 'PLT'
                    },
                    {
                        serviceType: 'DOCUMENTATION',
                        serviceName: '跨境单证费',
                        provider: 'INTERNAL',
                        chargeAmount: 2200,
                        costAmount: 500,
                        currency: 'CNY',
                        unitPrice: 2200,
                        quantity: 1,
                        unit: 'SET'
                    }
                ],
                timeline: [
                    { event: '提货装车', date: '2025-01-09', status: 'COMPLETED' },
                    { event: '出境报关', date: '2025-01-10', status: 'COMPLETED' },
                    { event: '越南入境', date: '2025-01-11', status: 'COMPLETED' },
                    { event: '胡志明中转', date: '2025-01-12', status: 'IN_PROGRESS' },
                    { event: '泰国入境', date: '2025-01-14', status: 'PENDING' },
                    { event: '曼谷配送', date: '2025-01-15', status: 'PENDING' }
                ],
                totalAmount: 57500,
                totalCost: 45900,
                currency: 'CNY',
                profitMargin: 20.2,
                transitEntity: {
                    type: 'PAYABLE_TRANSIT',
                    entityId: 'ENTITY_SG_001',
                    retentionAmount: 1000,
                    expectedRetention: 1000
                }
            }
        ]
    },

    // 多币种空运场景
    'multi-currency-air': {
        name: '多币种空运场景',
        description: 'DJI深圳至洛杉矶的无人机产品空运业务',
        customer: {
            id: 'CUST_DJI_001',
            name: '深圳市大疆创新科技有限公司',
            type: 'PREMIUM_CUSTOMER',
            creditLevel: 'AAA',
            region: 'CN'
        },
        orders: [
            {
                orderId: 'DJI2025011001',
                orderNo: 'DJIX-SZX-LAX-240110-001',
                businessType: 'AIR_FREIGHT',
                route: {
                    pol: 'CNSZX', // 深圳
                    pod: 'USLAX', // 洛杉矶
                    via: 'HKHKG'  // 香港中转
                },
                cargo: {
                    description: '无人机及遥控设备',
                    weight: '3850 KGS',
                    volume: '28.5 CBM',
                    packages: '385 CTNs',
                    value: 'USD 875,000',
                    hsCode: '8806.10.00'
                },
                services: [
                    {
                        serviceType: 'AIR_FREIGHT',
                        serviceName: '航空运费',
                        provider: 'CATHAY_PACIFIC_CARGO',
                        chargeAmount: 32500,
                        costAmount: 26000,
                        currency: 'USD',
                        unitPrice: 8.44,
                        quantity: 3850,
                        unit: 'KG'
                    },
                    {
                        serviceType: 'FUEL_SURCHARGE',
                        serviceName: '燃油附加费',
                        provider: 'CATHAY_PACIFIC_CARGO',
                        chargeAmount: 4620,
                        costAmount: 3850,
                        currency: 'USD',
                        unitPrice: 1.2,
                        quantity: 3850,
                        unit: 'KG'
                    },
                    {
                        serviceType: 'AIRPORT_HANDLING',
                        serviceName: '机场操作费',
                        provider: 'HK_AIRPORT_CARGO',
                        chargeAmount: 2800,
                        costAmount: 2200,
                        currency: 'USD',
                        unitPrice: 7.27,
                        quantity: 385,
                        unit: 'CTN'
                    },
                    {
                        serviceType: 'CUSTOMS_CLEARANCE',
                        serviceName: '进口清关费',
                        provider: 'US_CUSTOMS_BROKER',
                        chargeAmount: 1850,
                        costAmount: 1200,
                        currency: 'USD',
                        unitPrice: 1850,
                        quantity: 1,
                        unit: 'ENTRY'
                    },
                    {
                        serviceType: 'DELIVERY',
                        serviceName: '目的地配送',
                        provider: 'FEDEX_GROUND',
                        chargeAmount: 1200,
                        costAmount: 900,
                        currency: 'USD',
                        unitPrice: 3.12,
                        quantity: 385,
                        unit: 'CTN'
                    }
                ],
                timeline: [
                    { event: '货物收取', date: '2025-01-10', status: 'COMPLETED' },
                    { event: '香港集拼', date: '2025-01-11', status: 'COMPLETED' },
                    { event: '航班起飞', date: '2025-01-12', status: 'COMPLETED' },
                    { event: '洛杉矶到达', date: '2025-01-12', status: 'COMPLETED' },
                    { event: '海关查验', date: '2025-01-13', status: 'IN_PROGRESS' },
                    { event: '清关放行', date: '2025-01-14', status: 'PENDING' }
                ],
                totalAmount: 42970,
                totalCost: 34150,
                currency: 'USD',
                profitMargin: 20.5,
                crossBorderFlow: {
                    type: 'SOUTHEAST_ASIA_FLOW',
                    payerRegion: 'CN',
                    transitRegion: 'SG',
                    receiverRegion: 'US',
                    retentionRate: 0.008,
                    expectedRetention: 344
                }
            }
        ]
    },

    // 批量清分场景
    'bulk-clearing': {
        name: '批量清分场景',
        description: '小米集团多条线路的手机配件综合物流业务',
        customer: {
            id: 'CUST_XIAOMI_001',
            name: '小米集团',
            type: 'CORPORATE_CUSTOMER',
            creditLevel: 'AA+',
            region: 'CN'
        },
        orders: [
            {
                orderId: 'MI2025011101',
                orderNo: 'MIXM-PEK-DEL-240111-001',
                businessType: 'AIR_FREIGHT',
                route: { pol: 'CNPEK', pod: 'INDEL', via: 'HKHKG' },
                cargo: {
                    description: '手机充电器及数据线',
                    weight: '2850 KGS',
                    value: 'USD 285,000'
                },
                services: [
                    { serviceType: 'AIR_FREIGHT', serviceName: '航空运费', chargeAmount: 18500, costAmount: 14800, currency: 'USD' },
                    { serviceType: 'CUSTOMS_CLEARANCE', serviceName: '进口清关', chargeAmount: 1200, costAmount: 800, currency: 'USD' }
                ],
                totalAmount: 19700, totalCost: 15600, currency: 'USD', profitMargin: 20.8
            },
            {
                orderId: 'MI2025011102',
                orderNo: 'MIXM-SHA-SYD-240111-002',
                businessType: 'OCEAN_FREIGHT',
                route: { pol: 'CNSHA', pod: 'AUSYD', via: 'SGSIN' },
                cargo: {
                    description: '手机保护壳及配件',
                    weight: '15600 KGS',
                    value: 'AUD 468,000'
                },
                services: [
                    { serviceType: 'OCEAN_FREIGHT', serviceName: '海运费', chargeAmount: 28500, costAmount: 22800, currency: 'CNY' },
                    { serviceType: 'THC_DESTINATION', serviceName: '目的港费用', chargeAmount: 6800, costAmount: 5200, currency: 'CNY' }
                ],
                totalAmount: 35300, totalCost: 28000, currency: 'CNY', profitMargin: 20.7
            },
            {
                orderId: 'MI2025011103',
                orderNo: 'MIXM-CAN-FRA-240111-003',
                businessType: 'RAIL_FREIGHT',
                route: { pol: 'CNCAN', pod: 'DEFRA', via: 'RUMOS' },
                cargo: {
                    description: '手机屏幕及主板',
                    weight: '8900 KGS',
                    value: 'EUR 890,000'
                },
                services: [
                    { serviceType: 'RAIL_FREIGHT', serviceName: '中欧班列运费', chargeAmount: 45800, costAmount: 38000, currency: 'CNY' },
                    { serviceType: 'BORDER_CLEARANCE', serviceName: '边境通关费', chargeAmount: 3200, costAmount: 2400, currency: 'CNY' }
                ],
                totalAmount: 49000, totalCost: 40400, currency: 'CNY', profitMargin: 17.6
            }
        ]
    }
};

// 法人实体配置
const LEGAL_ENTITIES = {
    // 客户实体
    'CUST_HUAWEI_001': { name: '华为技术有限公司', type: 'CUSTOMER', region: 'CN', taxId: '91440300708461136T' },
    'CUST_BYD_001': { name: '比亚迪股份有限公司', type: 'CUSTOMER', region: 'CN', taxId: '91440300192057211U' },
    'CUST_DJI_001': { name: '深圳市大疆创新科技有限公司', type: 'CUSTOMER', region: 'CN', taxId: '91440300699518898B' },
    'CUST_XIAOMI_001': { name: '小米集团', type: 'CUSTOMER', region: 'CN', taxId: '91110000MA000M4G4Y' },
    
    // 销售实体
    'ENTITY_CN_SALES': { name: '海程邦达供应链管理（上海）有限公司', type: 'SALES', region: 'CN' },
    'ENTITY_CN_SHENZHEN': { name: '海程邦达国际货运代理（深圳）有限公司', type: 'SALES', region: 'CN' },
    'ENTITY_CN_NINGBO': { name: '海程邦达物流（宁波）有限公司', type: 'SALES', region: 'CN' },
    
    // 中转实体
    'ENTITY_HK_001': { name: 'HCBD International (Hong Kong) Limited', type: 'TRANSIT', region: 'HK' },
    'ENTITY_SG_001': { name: 'HCBD Logistics (Singapore) Pte Ltd', type: 'TRANSIT', region: 'SG' },
    'ENTITY_HK_TRANSIT': { name: 'HCBD Transit (HK) Limited', type: 'TRANSIT', region: 'HK' },
    'ENTITY_SG_TRANSIT': { name: 'HCBD Transit (Singapore) Pte Ltd', type: 'TRANSIT', region: 'SG' },
    
    // 供应商实体
    'COSCO_SHIPPING': { name: '中远海运集装箱运输有限公司', type: 'SUPPLIER', region: 'CN' },
    'CATHAY_PACIFIC_CARGO': { name: 'Cathay Pacific Cargo', type: 'SUPPLIER', region: 'HK' },
    'CROSS_BORDER_LOGISTICS': { name: '跨境物流服务商', type: 'SUPPLIER', region: 'VN' }
};

// 服务费率配置
const SERVICE_RATES = {
    OCEAN_FREIGHT: { 
        baseRate: { min: 800, max: 1500, unit: 'CNY/CNTR' },
        profitMargin: { min: 15, max: 25 }
    },
    AIR_FREIGHT: { 
        baseRate: { min: 6.5, max: 12.0, unit: 'USD/KG' },
        profitMargin: { min: 18, max: 28 }
    },
    TRUCK_FREIGHT: { 
        baseRate: { min: 200, max: 400, unit: 'CNY/PLT' },
        profitMargin: { min: 12, max: 22 }
    },
    RAIL_FREIGHT: { 
        baseRate: { min: 3.5, max: 6.8, unit: 'CNY/KG' },
        profitMargin: { min: 14, max: 24 }
    }
};

/**
 * 获取业务场景数据
 * @param {string} scenarioKey - 场景键名
 * @returns {object} 场景数据
 */
function getBusinessScenario(scenarioKey) {
    return BUSINESS_SCENARIOS[scenarioKey] || null;
}

/**
 * 获取所有可用场景
 * @returns {object} 所有场景数据
 */
function getAllScenarios() {
    return BUSINESS_SCENARIOS;
}

/**
 * 根据场景生成清分测试数据
 * @param {string} scenarioKey - 场景键名
 * @returns {object} 清分测试数据
 */
function generateClearingTestData(scenarioKey) {
    const scenario = getBusinessScenario(scenarioKey);
    if (!scenario) return null;
    
    const order = scenario.orders[0];
    return {
        orderId: order.orderId,
        customerInfo: scenario.customer,
        orderInfo: {
            businessType: order.businessType,
            route: order.route,
            totalAmount: order.totalAmount,
            currency: order.currency,
            profitMargin: order.profitMargin
        },
        services: order.services,
        transitConfig: order.transitEntity || order.crossBorderFlow,
        expectedResults: {
            totalRevenue: order.totalAmount,
            totalCost: order.totalCost,
            grossProfit: order.totalAmount - order.totalCost,
            retentionAmount: order.transitEntity?.expectedRetention || order.crossBorderFlow?.expectedRetention || 0
        }
    };
}

/**
 * 生成详细的服务明细表
 * @param {array} services - 服务列表
 * @returns {string} HTML表格
 */
function generateServiceTable(services) {
    return `
        <div class="table-responsive">
            <table class="table table-sm table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th style="width: 15%;">服务类型</th>
                        <th style="width: 25%;">服务名称</th>
                        <th style="width: 20%;">供应商</th>
                        <th style="width: 12%;" class="text-end">收费</th>
                        <th style="width: 12%;" class="text-end">成本</th>
                        <th style="width: 12%;" class="text-end">毛利</th>
                        <th style="width: 4%;" class="text-center">率</th>
                    </tr>
                </thead>
                <tbody>
                    ${services.map(service => {
                        const profit = service.chargeAmount - service.costAmount;
                        const margin = ((profit / service.chargeAmount) * 100).toFixed(1);
                        return `
                        <tr>
                            <td><span class="badge bg-info" style="font-size: 10px;">${service.serviceType.replace('_', ' ')}</span></td>
                            <td><small><strong>${service.serviceName}</strong></small></td>
                            <td><small class="text-muted">${service.provider}</small></td>
                            <td class="text-end amount-display"><small>${service.currency} ${service.chargeAmount.toLocaleString()}</small></td>
                            <td class="text-end amount-display"><small>${service.currency} ${service.costAmount.toLocaleString()}</small></td>
                            <td class="text-end text-success amount-display"><small><strong>${service.currency} ${profit.toLocaleString()}</strong></small></td>
                            <td class="text-center"><small><span class="badge bg-success">${margin}%</span></small></td>
                        </tr>`
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.BusinessScenarios = {
        getBusinessScenario,
        getAllScenarios,
        generateClearingTestData,
        generateServiceTable,
        BUSINESS_SCENARIOS,
        LEGAL_ENTITIES,
        SERVICE_RATES
    };
}