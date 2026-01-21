import { describe, it, expect, vi, beforeEach } from 'vitest';
import notification from './notification';

// Mock document object for testing
describe('notification', () => {
  // Reset DOM and notification state before each test
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
    
    // Reset nextId by reimporting the module
    vi.resetModules();
  });

  describe('showNotification', () => {
    it('should create notification container when it does not exist', () => {
      // Initially, container should not exist
      expect(document.getElementById('notification-container')).toBeNull();
      
      // Show a notification
      notification.show('Test notification');
      
      // Container should now exist
      expect(document.getElementById('notification-container')).not.toBeNull();
    });

    it('should reuse existing notification container', () => {
      // Create container manually
      const container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
      
      // Show a notification
      notification.show('Test notification');
      
      // Should still have only one container
      const containers = document.querySelectorAll('#notification-container');
      expect(containers.length).toBe(1);
    });

    it('should display success notification with correct styling', () => {
      notification.success('Success message');
      
      const notificationElement = document.querySelector('.notification-success') as HTMLElement;
      expect(notificationElement).not.toBeNull();
      expect(notificationElement?.textContent).toContain('Success message');
      expect(notificationElement?.classList.contains('notification-success')).toBe(true);
    });

    it('should display error notification with correct styling', () => {
      notification.error('Error message');
      
      const notificationElement = document.querySelector('.notification-error') as HTMLElement;
      expect(notificationElement).not.toBeNull();
      expect(notificationElement?.textContent).toContain('Error message');
      expect(notificationElement?.classList.contains('notification-error')).toBe(true);
    });

    it('should display info notification with correct styling', () => {
      notification.info('Info message');
      
      const notificationElement = document.querySelector('.notification-info') as HTMLElement;
      expect(notificationElement).not.toBeNull();
      expect(notificationElement?.textContent).toContain('Info message');
      expect(notificationElement?.classList.contains('notification-info')).toBe(true);
    });

    it('should return a unique ID for each notification', () => {
      const id1 = notification.show('Notification 1');
      const id2 = notification.show('Notification 2');
      const id3 = notification.show('Notification 3');
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id3).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should have close button that removes notification', () => {
      notification.show('Test notification with close');
      
      const notificationElement = document.querySelector('.notification') as HTMLElement;
      const closeButton = notificationElement?.querySelector('.notification-close') as HTMLElement;
      
      expect(closeButton).not.toBeNull();
      
      // Click close button
      closeButton?.click();
      
      // Notification should be removed
      expect(document.querySelector('.notification')).toBeNull();
    });

    it('should automatically close after specified duration', async () => {
      // Use a short duration for testing
      notification.show('Auto-close notification', 'info', 100);
      
      // Initially, notification should exist
      expect(document.querySelector('.notification')).not.toBeNull();
      
      // Wait for the notification to close
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Notification should be removed
      expect(document.querySelector('.notification')).toBeNull();
    });

    it('should not automatically close when duration is 0', async () => {
      // Use duration 0 to prevent auto-close
      notification.show('Persistent notification', 'info', 0);
      
      // Initially, notification should exist
      expect(document.querySelector('.notification')).not.toBeNull();
      
      // Wait for some time
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Notification should still exist
      expect(document.querySelector('.notification')).not.toBeNull();
      
      // Clean up
      document.body.innerHTML = '';
    });

    it('should handle manual close before auto-close without errors', async () => {
      // Create a notification with auto-close
      notification.show('Auto-close notification', 'info', 100);
      
      // Initially, notification should exist
      const notificationElement = document.querySelector('.notification') as HTMLElement;
      expect(notificationElement).not.toBeNull();
      
      // Manually close the notification before auto-close triggers
      const closeButton = notificationElement?.querySelector('.notification-close') as HTMLElement;
      closeButton?.click();
      
      // Notification should be removed immediately
      expect(document.querySelector('.notification')).toBeNull();
      
      // Wait for the auto-close timer to finish
      // This ensures the auto-close logic doesn't cause errors when the element is already removed
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // No errors should occur, and notification should still be gone
      expect(document.querySelector('.notification')).toBeNull();
    });

    it('should display multiple notifications correctly', () => {
      notification.success('Success 1');
      notification.error('Error 1');
      notification.info('Info 1');
      
      const notifications = document.querySelectorAll('.notification');
      expect(notifications.length).toBe(3);
      
      // Check that all notification types are present
      expect(document.querySelector('.notification-success')).not.toBeNull();
      expect(document.querySelector('.notification-error')).not.toBeNull();
      expect(document.querySelector('.notification-info')).not.toBeNull();
    });

    it('should position notifications in the top-right corner', () => {
      notification.show('Position test');
      
      const container = document.getElementById('notification-container') as HTMLElement;
      expect(container?.style.position).toBe('fixed');
      expect(container?.style.top).toBe('20px');
      expect(container?.style.right).toBe('20px');
      expect(container?.style.zIndex).toBe('9999');
    });
  });

  describe('notification type shortcuts', () => {
    it('should call showNotification with correct type for success', () => {
      notification.success('Test success');
      expect(document.querySelector('.notification-success')).not.toBeNull();
    });

    it('should call showNotification with correct type for error', () => {
      notification.error('Test error');
      expect(document.querySelector('.notification-error')).not.toBeNull();
    });

    it('should call showNotification with correct type for info', () => {
      notification.info('Test info');
      expect(document.querySelector('.notification-info')).not.toBeNull();
    });

    it('should pass custom duration to showNotification', async () => {
      notification.success('Custom duration', 50);
      
      expect(document.querySelector('.notification-success')).not.toBeNull();
      
      // Wait for notification to close
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(document.querySelector('.notification-success')).toBeNull();
    });
  });

  describe('notification styling', () => {
    it('should have correct CSS classes', () => {
      notification.show('Styled notification', 'success');
      
      const notificationElement = document.querySelector('.notification') as HTMLElement;
      expect(notificationElement?.classList.contains('notification')).toBe(true);
      expect(notificationElement?.classList.contains('notification-success')).toBe(true);
    });

    it('should have correct icon for each type', () => {
      // Test success icon
      notification.success('Success with icon');
      let notificationContent = document.querySelector('.notification-content');
      expect(notificationContent?.textContent).toContain('✓');
      
      // Clear and test error icon
      document.body.innerHTML = '';
      notification.error('Error with icon');
      notificationContent = document.querySelector('.notification-content');
      expect(notificationContent?.textContent).toContain('✕');
      
      // Clear and test info icon
      document.body.innerHTML = '';
      notification.info('Info with icon');
      notificationContent = document.querySelector('.notification-content');
      expect(notificationContent?.textContent).toContain('ℹ');
    });

    it('should have proper box-shadow and border-radius', () => {
      notification.show('Styled notification');
      
      const notificationElement = document.querySelector('.notification') as HTMLElement;
      expect(notificationElement?.style.boxShadow).not.toBe('');
      expect(notificationElement?.style.borderRadius).toBe('4px');
    });
  });
});
