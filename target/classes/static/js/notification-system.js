/**
 * OneOrder 实时通知系统
 * 功能：派单通知、消息确认、实时推送
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.websocket = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 3000;
        
        this.initializeNotificationSystem();
        this.connectWebSocket();
        this.loadStoredNotifications();
    }

    // 初始化通知系统
    initializeNotificationSystem() {
        // 创建通知容器
        this.createNotificationContainer();
        
        // 绑定页面可见性变化事件
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.markPageAsVisible();
                this.updateNotificationBadge();
            }
        });

        // 请求浏览器通知权限
        this.requestNotificationPermission();
        
        console.log('通知系统初始化完成');
    }

    // 创建通知容器
    createNotificationContainer() {
        const notificationHTML = `
            <!-- 实时通知容器 -->
            <div id="notificationContainer" class="position-fixed" style="top: 80px; right: 20px; z-index: 9999; max-width: 400px;"></div>
            
            <!-- 通知中心模态框 -->
            <div class="modal fade" id="notificationCenterModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-bell me-2"></i>通知中心
                                <span class="badge bg-primary ms-2" id="notificationCenterCount">0</span>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" style="max-height: 500px; overflow-y: auto;">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="btn-group" role="group">
                                    <input type="radio" class="btn-check" name="notificationFilter" id="filterAll" value="all" checked>
                                    <label class="btn btn-outline-primary btn-sm" for="filterAll">全部</label>
                                    
                                    <input type="radio" class="btn-check" name="notificationFilter" id="filterUnread" value="unread">
                                    <label class="btn btn-outline-primary btn-sm" for="filterUnread">未读</label>
                                    
                                    <input type="radio" class="btn-check" name="notificationFilter" id="filterAssignment" value="assignment">
                                    <label class="btn btn-outline-primary btn-sm" for="filterAssignment">派单</label>
                                    
                                    <input type="radio" class="btn-check" name="notificationFilter" id="filterSystem" value="system">
                                    <label class="btn btn-outline-primary btn-sm" for="filterSystem">系统</label>
                                </div>
                                <div>
                                    <button class="btn btn-outline-success btn-sm" onclick="notificationSystem.markAllAsRead()">
                                        <i class="fas fa-check-double me-1"></i>全部已读
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="notificationSystem.clearAllNotifications()">
                                        <i class="fas fa-trash me-1"></i>清空通知
                                    </button>
                                </div>
                            </div>
                            <div id="notificationCenterList">
                                <div class="text-center py-5">
                                    <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                                    <p class="text-muted">暂无通知</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 将通知HTML添加到页面
        document.body.insertAdjacentHTML('beforeend', notificationHTML);
        
        // 绑定筛选事件
        document.querySelectorAll('input[name="notificationFilter"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.filterNotifications(radio.value);
            });
        });
    }

    // 连接WebSocket实时通知
    connectWebSocket() {
        try {
            // 使用相对路径连接WebSocket
            const wsUrl = `ws://${window.location.host}/api/ws/notifications`;
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                this.isConnected = true;
                this.retryCount = 0;
                console.log('WebSocket连接成功');
                // 技术性连接通知改为仅控制台记录，不显示用户通知
                // this.showSystemNotification('实时通知已连接', 'success', '连接状态');
            };
            
            this.websocket.onmessage = (event) => {
                try {
                    const notification = JSON.parse(event.data);
                    this.handleIncomingNotification(notification);
                } catch (error) {
                    console.error('解析通知消息失败:', error);
                }
            };
            
            this.websocket.onclose = () => {
                this.isConnected = false;
                console.log('WebSocket连接断开');
                this.retryConnection();
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket连接错误:', error);
                this.isConnected = false;
            };
            
        } catch (error) {
            console.warn('WebSocket不可用，将使用轮询方式获取通知');
            this.startPollingNotifications();
        }
    }

    // 重试连接
    retryConnection() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`尝试重新连接WebSocket (${this.retryCount}/${this.maxRetries})`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, this.retryDelay * this.retryCount);
        } else {
            console.log('WebSocket重连失败，切换到轮询模式');
            this.startPollingNotifications();
        }
    }

    // 开始轮询通知
    startPollingNotifications() {
        setInterval(() => {
            this.fetchNotifications();
        }, 30000); // 每30秒轮询一次
    }

    // 获取通知列表
    async fetchNotifications() {
        // 检查用户是否清空过通知
        try {
            const stored = localStorage.getItem('oneorder_notifications');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.userCleared) {
                    console.log('用户已清空通知，跳过获取历史通知');
                    return;
                }
            }
        } catch (error) {
            console.warn('检查清空状态失败:', error);
        }
        
        try {
            const response = await fetch('/api/notifications/recent');
            const data = await response.json();
            
            if (data.success && data.data) {
                data.data.forEach(notification => {
                    if (!this.notifications.find(n => n.id === notification.id)) {
                        this.handleIncomingNotification(notification);
                    }
                });
            }
        } catch (error) {
            console.warn('获取通知失败，使用模拟数据');
            this.generateMockNotifications();
        }
    }

    // 处理接收到的通知
    handleIncomingNotification(notification) {
        // 添加到通知列表
        this.addNotification(notification);
        
        // 显示实时通知
        this.showRealTimeNotification(notification);
        
        // 播放提示音
        this.playNotificationSound(notification.type);
        
        // 显示浏览器通知
        this.showBrowserNotification(notification);
        
        // 更新通知徽章
        this.updateNotificationBadge();
        
        // 保存到本地存储
        this.saveNotifications();
    }

    // 添加通知
    addNotification(notification) {
        // 确保通知有必要的字段
        const notificationData = {
            id: notification.id || `ntf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: notification.type || 'system',
            title: notification.title || '系统通知',
            message: notification.message || '',
            timestamp: notification.timestamp || new Date().toISOString(),
            isRead: notification.isRead || false,
            priority: notification.priority || 'normal',
            orderNo: notification.orderNo || null,
            serviceCode: notification.serviceCode || null,
            operatorId: notification.operatorId || null,
            actionUrl: notification.actionUrl || null,
            metadata: notification.metadata || {}
        };
        
        // 避免重复
        if (!this.notifications.find(n => n.id === notificationData.id)) {
            this.notifications.unshift(notificationData);
            if (!notificationData.isRead) {
                this.unreadCount++;
            }
            
            // 有新通知时，清除用户清空状态，允许正常保存新通知
            this.clearUserClearedFlag();
        }
        
        // 限制通知数量
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }
    }

    // 显示实时通知弹窗
    showRealTimeNotification(notification) {
        const notificationElement = document.createElement('div');
        notificationElement.className = `alert alert-${this.getNotificationAlertClass(notification.type)} alert-dismissible fade show notification-toast`;
        notificationElement.style.cssText = `
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 8px;
            animation: slideInRight 0.3s ease;
        `;
        
        const priorityIcon = this.getPriorityIcon(notification.priority);
        const typeIcon = this.getTypeIcon(notification.type);
        
        notificationElement.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="flex-shrink-0 me-3">
                    ${priorityIcon}
                    ${typeIcon}
                </div>
                <div class="flex-grow-1">
                    <h6 class="alert-heading mb-1">${notification.title}</h6>
                    <p class="mb-2">${notification.message}</p>
                    ${notification.orderNo ? `<small class="text-muted">订单号: ${notification.orderNo}</small>` : ''}
                    ${notification.actionUrl ? `
                        <div class="mt-2">
                            <a href="${notification.actionUrl}" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-external-link-alt me-1"></i>查看详情
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" onclick="notificationSystem.markAsRead('${notification.id}')"></button>
        `;
        
        document.getElementById('notificationContainer').appendChild(notificationElement);
        
        // 自动消失
        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.remove();
            }
        }, notification.priority === 'high' ? 8000 : 5000);
    }

    // 显示浏览器通知
    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id,
                requireInteraction: notification.priority === 'high'
            });
            
            browserNotification.onclick = () => {
                window.focus();
                if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                }
                browserNotification.close();
            };
            
            // 高优先级通知停留更长时间
            if (notification.priority !== 'high') {
                setTimeout(() => {
                    browserNotification.close();
                }, 5000);
            }
        }
    }

    // 播放提示音
    playNotificationSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 根据通知类型设置不同的音调
            const frequencies = {
                'assignment': [800, 1000, 800],
                'urgent': [1200, 1000, 1200, 1000],
                'system': [600, 800],
                'success': [800, 1200]
            };
            
            const freq = frequencies[type] || frequencies['system'];
            
            oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            freq.forEach((f, index) => {
                oscillator.frequency.setValueAtTime(f, audioContext.currentTime + index * 0.15);
            });
            
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + freq.length * 0.15);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + freq.length * 0.15);
            
        } catch (error) {
            console.warn('无法播放提示音:', error);
        }
    }

    // 请求浏览器通知权限
    async requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                console.log('浏览器通知权限:', permission);
            }
        }
    }

    // 标记通知为已读
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
            notification.isRead = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateNotificationBadge();
            this.saveNotifications();
            
            // 发送已读确认到服务器
            this.sendReadConfirmation(notificationId);
        }
    }

    // 标记所有通知为已读
    markAllAsRead() {
        this.notifications.forEach(notification => {
            if (!notification.isRead) {
                notification.isRead = true;
            }
        });
        this.unreadCount = 0;
        this.updateNotificationBadge();
        this.saveNotifications();
        this.displayNotificationCenter();
        
        // 批量发送已读确认
        const unreadIds = this.notifications.filter(n => !n.isRead).map(n => n.id);
        this.sendBatchReadConfirmation(unreadIds);
        
        this.showSystemNotification('所有通知已标记为已读', 'success');
    }

    // 清空所有通知
    clearAllNotifications() {
        if (confirm('确定要清空所有通知吗？此操作不可撤销。')) {
            this.notifications = [];
            this.unreadCount = 0;
            this.updateNotificationBadge();
            
            // 保存清空状态和时间戳，防止重新获取历史通知
            const clearData = {
                notifications: [],
                unreadCount: 0,
                lastClearTime: Date.now(),
                userCleared: true
            };
            localStorage.setItem('oneorder_notifications', JSON.stringify(clearData));
            
            this.displayNotificationCenter();
            this.showSystemNotification('所有通知已清空', 'info');
        }
    }

    // 清除用户清空标志
    clearUserClearedFlag() {
        try {
            const stored = localStorage.getItem('oneorder_notifications');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.userCleared) {
                    // 移除用户清空标志，允许正常的通知操作
                    delete data.userCleared;
                    delete data.lastClearTime;
                    localStorage.setItem('oneorder_notifications', JSON.stringify(data));
                }
            }
        } catch (error) {
            console.warn('清除用户清空标志失败:', error);
        }
    }

    // 发送已读确认到服务器
    async sendReadConfirmation(notificationId) {
        try {
            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notificationId: notificationId,
                    readTime: new Date().toISOString()
                })
            });
        } catch (error) {
            console.warn('发送已读确认失败:', error);
        }
    }

    // 批量发送已读确认
    async sendBatchReadConfirmation(notificationIds) {
        if (notificationIds.length === 0) return;
        
        try {
            await fetch('/api/notifications/batch-mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notificationIds: notificationIds,
                    readTime: new Date().toISOString()
                })
            });
        } catch (error) {
            console.warn('批量发送已读确认失败:', error);
        }
    }

    // 更新通知徽章
    updateNotificationBadge() {
        const badgeElement = document.getElementById('notificationCount');
        const centerBadgeElement = document.getElementById('notificationCenterCount');
        const myTasksBadgeElement = document.getElementById('myTasksCount');
        
        if (badgeElement) {
            badgeElement.textContent = this.unreadCount;
            badgeElement.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
        
        if (centerBadgeElement) {
            centerBadgeElement.textContent = this.notifications.length;
        }
        
        // 更新我的任务徽章（假设任务通知也算在内）
        if (myTasksBadgeElement) {
            const taskNotifications = this.notifications.filter(n => 
                n.type === 'assignment' && !n.isRead
            ).length;
            const currentTaskCount = parseInt(myTasksBadgeElement.textContent) || 0;
            myTasksBadgeElement.textContent = Math.max(currentTaskCount, taskNotifications);
        }
        
        // 更新页面标题
        this.updatePageTitle();
    }

    // 更新页面标题
    updatePageTitle() {
        const originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
        if (this.unreadCount > 0) {
            document.title = `(${this.unreadCount}) ${originalTitle}`;
        } else {
            document.title = originalTitle;
        }
    }

    // 显示通知中心
    displayNotificationCenter() {
        const modal = new bootstrap.Modal(document.getElementById('notificationCenterModal'));
        modal.show();
        this.filterNotifications('all');
    }

    // 筛选通知
    filterNotifications(filterType) {
        let filteredNotifications = [];
        
        switch (filterType) {
            case 'unread':
                filteredNotifications = this.notifications.filter(n => !n.isRead);
                break;
            case 'assignment':
                filteredNotifications = this.notifications.filter(n => n.type === 'assignment');
                break;
            case 'system':
                filteredNotifications = this.notifications.filter(n => n.type === 'system');
                break;
            default:
                filteredNotifications = this.notifications;
        }
        
        this.renderNotificationList(filteredNotifications);
    }

    // 渲染通知列表
    renderNotificationList(notifications) {
        const container = document.getElementById('notificationCenterList');
        
        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                    <p class="text-muted">暂无通知</p>
                </div>
            `;
            return;
        }
        
        const notificationsHTML = notifications.map(notification => {
            const typeIcon = this.getTypeIcon(notification.type);
            const priorityClass = this.getPriorityClass(notification.priority);
            const timeAgo = this.getTimeAgo(notification.timestamp);
            
            return `
                <div class="card mb-2 ${notification.isRead ? '' : 'border-primary'}" data-notification-id="${notification.id}">
                    <div class="card-body py-3">
                        <div class="d-flex align-items-start">
                            <div class="flex-shrink-0 me-3">
                                ${typeIcon}
                                ${notification.priority === 'high' ? '<i class="fas fa-exclamation-circle text-danger position-absolute" style="top: -5px; right: -5px; font-size: 0.8rem;"></i>' : ''}
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <h6 class="mb-1 ${notification.isRead ? 'text-muted' : ''}">${notification.title}</h6>
                                    <small class="text-muted">${timeAgo}</small>
                                </div>
                                <p class="mb-2 ${notification.isRead ? 'text-muted' : ''}">${notification.message}</p>
                                ${notification.orderNo ? `
                                    <div class="mb-2">
                                        <span class="badge bg-light text-dark">订单: ${notification.orderNo}</span>
                                        ${notification.serviceCode ? `<span class="badge bg-light text-dark ms-1">服务: ${notification.serviceCode}</span>` : ''}
                                    </div>
                                ` : ''}
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="badge ${priorityClass}">${this.getPriorityText(notification.priority)}</span>
                                        <span class="badge bg-secondary ms-1">${this.getTypeText(notification.type)}</span>
                                    </div>
                                    <div class="btn-group" role="group">
                                        ${!notification.isRead ? `
                                            <button class="btn btn-outline-primary btn-sm" onclick="notificationSystem.markAsRead('${notification.id}')">
                                                <i class="fas fa-check me-1"></i>已读
                                            </button>
                                        ` : ''}
                                        ${notification.actionUrl ? `
                                            <a href="${notification.actionUrl}" class="btn btn-primary btn-sm">
                                                <i class="fas fa-external-link-alt me-1"></i>查看
                                            </a>
                                        ` : ''}
                                        <button class="btn btn-outline-danger btn-sm" onclick="notificationSystem.deleteNotification('${notification.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = notificationsHTML;
    }

    // 删除通知
    deleteNotification(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            const notification = this.notifications[index];
            if (!notification.isRead) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
            this.notifications.splice(index, 1);
            this.updateNotificationBadge();
            this.saveNotifications();
            
            // 重新渲染当前筛选的通知
            const currentFilter = document.querySelector('input[name="notificationFilter"]:checked').value;
            this.filterNotifications(currentFilter);
        }
    }

    // 页面变为可见时的处理
    markPageAsVisible() {
        // 标记页面上显示的通知为已读
        const visibleNotifications = document.querySelectorAll('.notification-toast');
        visibleNotifications.forEach(element => {
            const notificationId = element.dataset.notificationId;
            if (notificationId) {
                this.markAsRead(notificationId);
            }
        });
    }

    // 生成模拟通知数据
    generateMockNotifications() {
        const mockNotifications = [
            {
                id: 'ntf_001',
                type: 'assignment',
                title: '新的派单任务',
                message: '您收到了新的MBL处理任务',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                priority: 'high',
                orderNo: 'HW-EXPORT-20240102-001',
                serviceCode: 'MBL_PROCESSING',
                actionUrl: '#mytasks'
            },
            {
                id: 'ntf_002',
                type: 'urgent',
                title: '紧急任务提醒',
                message: '内装任务即将到期，请尽快处理',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                priority: 'high',
                orderNo: 'SH-AUTO-20240101-001',
                serviceCode: 'CARGO_LOADING',
                actionUrl: '#mytasks'
            },
            {
                id: 'ntf_003',
                type: 'system',
                title: '系统更新通知',
                message: '订单管理系统已更新到最新版本',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                priority: 'normal'
            }
        ];
        
        mockNotifications.forEach(notification => {
            if (!this.notifications.find(n => n.id === notification.id)) {
                this.addNotification(notification);
            }
        });
        
        this.updateNotificationBadge();
    }

    // 发送派单通知
    sendAssignmentNotification(assignment) {
        const notification = {
            id: `assign_${assignment.serviceCode}_${Date.now()}`,
            type: 'assignment',
            title: '新的派单任务',
            message: `您收到了新的${assignment.serviceName}任务`,
            timestamp: new Date().toISOString(),
            priority: assignment.priority || 'normal',
            orderNo: assignment.orderNo,
            serviceCode: assignment.serviceCode,
            operatorId: assignment.operatorId,
            actionUrl: '#mytasks',
            metadata: {
                estimatedHours: assignment.estimatedHours,
                deadline: assignment.deadline,
                department: assignment.department
            }
        };
        
        // 发送到服务器
        this.sendNotificationToServer(notification);
        
        // 本地处理
        this.handleIncomingNotification(notification);
    }

    // 发送任务状态变更通知
    sendTaskStatusNotification(taskUpdate) {
        const notification = {
            id: `task_${taskUpdate.taskId}_${Date.now()}`,
            type: taskUpdate.status === 'COMPLETED' ? 'success' : 'assignment',
            title: '任务状态更新',
            message: `任务 ${taskUpdate.serviceName} 状态已更新为：${this.getTaskStatusText(taskUpdate.status)}`,
            timestamp: new Date().toISOString(),
            priority: 'normal',
            orderNo: taskUpdate.orderNo,
            serviceCode: taskUpdate.serviceCode,
            metadata: taskUpdate
        };
        
        this.sendNotificationToServer(notification);
        this.handleIncomingNotification(notification);
    }

    // 发送紧急通知
    sendUrgentNotification(message, orderNo = null, actionUrl = null) {
        const notification = {
            id: `urgent_${Date.now()}`,
            type: 'urgent',
            title: '紧急通知',
            message: message,
            timestamp: new Date().toISOString(),
            priority: 'high',
            orderNo: orderNo,
            actionUrl: actionUrl
        };
        
        this.sendNotificationToServer(notification);
        this.handleIncomingNotification(notification);
    }

    // 发送通知到服务器
    async sendNotificationToServer(notification) {
        try {
            if (this.isConnected && this.websocket) {
                this.websocket.send(JSON.stringify(notification));
            } else {
                // WebSocket不可用时，使用HTTP API
                await fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(notification)
                });
            }
        } catch (error) {
            console.warn('发送通知到服务器失败:', error);
        }
    }

    // 显示系统通知
    showSystemNotification(message, type = 'system', title = '系统消息') {
        const notification = {
            id: `sys_${Date.now()}`,
            type: type,
            title: title,
            message: message,
            timestamp: new Date().toISOString(),
            priority: 'normal',
            isRead: false
        };
        
        this.addNotification(notification);
        this.showRealTimeNotification(notification);
        this.updateNotificationBadge();
    }

    // 保存通知到本地存储
    saveNotifications() {
        try {
            localStorage.setItem('oneorder_notifications', JSON.stringify({
                notifications: this.notifications.slice(0, 50), // 只保存最新50条
                unreadCount: this.unreadCount,
                lastUpdate: new Date().toISOString()
            }));
        } catch (error) {
            console.warn('保存通知失败:', error);
        }
    }

    // 从本地存储加载通知
    loadStoredNotifications() {
        try {
            const stored = localStorage.getItem('oneorder_notifications');
            if (stored) {
                const data = JSON.parse(stored);
                
                // 如果用户已清空通知，则不加载历史通知
                if (data.userCleared) {
                    console.log('用户已清空通知，不加载历史通知');
                    this.notifications = [];
                    this.unreadCount = 0;
                } else {
                    this.notifications = data.notifications || [];
                    this.unreadCount = data.unreadCount || 0;
                }
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.warn('加载存储的通知失败:', error);
        }
    }

    // 工具函数
    getNotificationAlertClass(type) {
        const classMap = {
            'assignment': 'primary',
            'urgent': 'danger',
            'system': 'info',
            'success': 'success',
            'warning': 'warning'
        };
        return classMap[type] || 'info';
    }

    getTypeIcon(type) {
        const iconMap = {
            'assignment': '<i class="fas fa-user-plus text-primary"></i>',
            'urgent': '<i class="fas fa-exclamation-triangle text-danger"></i>',
            'system': '<i class="fas fa-cog text-info"></i>',
            'success': '<i class="fas fa-check-circle text-success"></i>',
            'warning': '<i class="fas fa-exclamation-circle text-warning"></i>'
        };
        return iconMap[type] || iconMap['system'];
    }

    getPriorityIcon(priority) {
        if (priority === 'high') {
            return '<i class="fas fa-star text-warning" title="高优先级"></i>';
        }
        return '';
    }

    getPriorityClass(priority) {
        const classMap = {
            'high': 'bg-danger',
            'normal': 'bg-secondary',
            'low': 'bg-success'
        };
        return classMap[priority] || 'bg-secondary';
    }

    getPriorityText(priority) {
        const textMap = {
            'high': '高优先级',
            'normal': '普通',
            'low': '低优先级'
        };
        return textMap[priority] || '普通';
    }

    getTypeText(type) {
        const textMap = {
            'assignment': '派单',
            'urgent': '紧急',
            'system': '系统',
            'success': '成功',
            'warning': '警告'
        };
        return textMap[type] || '系统';
    }

    getTaskStatusText(status) {
        const statusMap = {
            'PENDING': '待处理',
            'IN_PROGRESS': '进行中',
            'COMPLETED': '已完成',
            'BLOCKED': '遇到问题'
        };
        return statusMap[status] || status;
    }

    // 计算时间差
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMinutes < 1) return '刚刚';
        if (diffMinutes < 60) return `${diffMinutes}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        return time.toLocaleDateString('zh-CN');
    }

    // 清理过期通知
    cleanupExpiredNotifications() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const originalLength = this.notifications.length;
        this.notifications = this.notifications.filter(n => 
            new Date(n.timestamp) > sevenDaysAgo
        );
        
        if (this.notifications.length !== originalLength) {
            this.saveNotifications();
            console.log(`清理了 ${originalLength - this.notifications.length} 个过期通知`);
        }
    }

    // 获取通知统计信息
    getNotificationStats() {
        return {
            total: this.notifications.length,
            unread: this.unreadCount,
            assignment: this.notifications.filter(n => n.type === 'assignment').length,
            urgent: this.notifications.filter(n => n.type === 'urgent').length,
            system: this.notifications.filter(n => n.type === 'system').length,
            highPriority: this.notifications.filter(n => n.priority === 'high').length
        };
    }
}

// 全局通知系统实例
let notificationSystem;

// 页面加载完成后初始化通知系统
document.addEventListener('DOMContentLoaded', function() {
    notificationSystem = new NotificationSystem();
    
    // 绑定通知中心打开事件
    const notificationDropdown = document.querySelector('[data-bs-toggle="dropdown"]');
    if (notificationDropdown) {
        notificationDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            notificationSystem.displayNotificationCenter();
        });
    }
    
    // 模拟一些初始通知
    setTimeout(() => {
        notificationSystem.generateMockNotifications();
    }, 2000);
    
    // 定期清理过期通知
    setInterval(() => {
        notificationSystem.cleanupExpiredNotifications();
    }, 60 * 60 * 1000); // 每小时清理一次
});

// CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-toast {
        animation: slideInRight 0.3s ease;
    }
    
    .notification-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
    }
    
    .notification-badge {
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .card.border-primary {
        box-shadow: 0 0 10px rgba(0, 123, 255, 0.2);
    }
`;
document.head.appendChild(style);

// 导出供其他模块使用
window.NotificationSystem = NotificationSystem;