import { ref } from 'vue';

interface NotificationItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

const notifications = ref<NotificationItem[]>([]);
let nextId = 1;

// 创建通知容器
const createNotificationContainer = () => {
  // 检查是否已存在通知容器
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  return container;
};

// 创建通知元素
const createNotificationElement = (notification: NotificationItem) => {
  const container = createNotificationContainer();
  
  const notificationElement = document.createElement('div');
  notificationElement.className = `notification notification-${notification.type}`;
  notificationElement.style.cssText = `
    position: relative;
    margin-bottom: 10px;
    padding: 12px 16px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    background-color: #fff;
    min-width: 300px;
    max-width: 500px;
    animation: slideIn 0.3s ease-out;
    border-left: 4px solid ${notification.type === 'success' ? '#52c41a' : notification.type === 'error' ? '#ff4d4f' : '#1890ff'};
  `;
  
  const contentElement = document.createElement('div');
  contentElement.className = 'notification-content';
  contentElement.style.cssText = `
    display: flex;
    align-items: center;
  `;
  
  const iconElement = document.createElement('div');
  iconElement.className = 'notification-icon';
  iconElement.style.cssText = `
    margin-right: 8px;
    font-weight: bold;
    font-size: 16px;
    color: ${notification.type === 'success' ? '#52c41a' : notification.type === 'error' ? '#ff4d4f' : '#1890ff'};
  `;
  iconElement.textContent = notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ';
  
  const messageElement = document.createElement('div');
  messageElement.className = 'notification-message';
  messageElement.style.cssText = `
    flex: 1;
    font-size: 14px;
    color: #333;
  `;
  messageElement.textContent = notification.message;
  
  const closeElement = document.createElement('button');
  closeElement.className = 'notification-close';
  closeElement.style.cssText = `
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: #999;
    padding: 0;
    margin-left: 8px;
  `;
  closeElement.textContent = '×';
  closeElement.onclick = () => {
    container.removeChild(notificationElement);
    removeNotification(notification.id);
  };
  
  contentElement.appendChild(iconElement);
  contentElement.appendChild(messageElement);
  contentElement.appendChild(closeElement);
  notificationElement.appendChild(contentElement);
  
  container.appendChild(notificationElement);
  
  // 自动关闭
  if (notification.duration && notification.duration > 0) {
    setTimeout(() => {
      if (container.contains(notificationElement)) {
        container.removeChild(notificationElement);
        removeNotification(notification.id);
      }
    }, notification.duration);
  }
  
  return notificationElement;
};

// 移除通知
const removeNotification = (id: number) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
};

// 显示通知
const showNotification = (
  message: string, 
  type: 'success' | 'error' | 'info' = 'info',
  duration = 3000
) => {
  const notification: NotificationItem = {
    id: nextId++,
    message,
    type,
    duration
  };
  
  notifications.value.push(notification);
  createNotificationElement(notification);
  
  return notification.id;
};

// 成功通知
const success = (message: string, duration?: number) => {
  return showNotification(message, 'success', duration);
};

// 错误通知
const error = (message: string, duration?: number) => {
  return showNotification(message, 'error', duration);
};

// 信息通知
const info = (message: string, duration?: number) => {
  return showNotification(message, 'info', duration);
};

export default {
  show: showNotification,
  success,
  error,
  info
};