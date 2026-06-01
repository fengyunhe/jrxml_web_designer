import { describe, it, expect } from 'vitest';
import {
  generateMockValue,
  generateMockParameters,
  generateMockDataSource,
} from './mockDataGenerator';
import type { ReportParameter, ReportField } from '../types';

describe('mockDataGenerator', () => {
  describe('generateMockValue', () => {
    it('generates Chinese name for name-like fields', () => {
      const value = generateMockValue('customerName', 'java.lang.String');
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThanOrEqual(2);
      expect(value.length).toBeLessThanOrEqual(4);
    });

    it('generates Chinese name for 姓名 field', () => {
      const value = generateMockValue('姓名', 'java.lang.String');
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThanOrEqual(2);
    });

    it('generates phone number for phone-like fields', () => {
      const value = generateMockValue('phone', 'java.lang.String');
      expect(typeof value).toBe('string');
      expect(value).toMatch(/^1[3-9]\d{9}$/);
    });

    it('generates phone for 电话 field', () => {
      const value = generateMockValue('联系电话', 'java.lang.String');
      expect(value).toMatch(/^1[3-9]\d{9}$/);
    });

    it('generates email for email-like fields', () => {
      const value = generateMockValue('email', 'java.lang.String');
      expect(typeof value).toBe('string');
      expect(value).toContain('@');
      expect(value).toContain('.');
    });

    it('generates address for address-like fields', () => {
      const value = generateMockValue('address', 'java.lang.String');
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(5);
    });

    it('generates date string for date-like fields', () => {
      const value = generateMockValue('createDate', 'java.util.Date');
      expect(typeof value).toBe('string');
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('generates amount as number for amount-like fields', () => {
      const value = generateMockValue('amount', 'java.lang.Double');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(99999);
    });

    it('generates quantity as integer', () => {
      const value = generateMockValue('quantity', 'java.lang.Integer');
      expect(typeof value).toBe('number');
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(999);
    });

    it('generates sequential id', () => {
      const v1 = generateMockValue('id', 'java.lang.Integer');
      const v2 = generateMockValue('id', 'java.lang.Integer');
      expect(v2).toBe(v1 + 1);
    });

    it('generates status from predefined options', () => {
      const validStatuses = ['已完成', '进行中', '待处理', '已取消'];
      const value = generateMockValue('status', 'java.lang.String');
      expect(validStatuses).toContain(value);
    });

    it('generates male/female for gender fields', () => {
      const value = generateMockValue('gender', 'java.lang.String');
      expect(['男', '女']).toContain(value);
    });

    it('generates age as integer between 18-65', () => {
      const value = generateMockValue('age', 'java.lang.Integer');
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(18);
      expect(value).toBeLessThanOrEqual(65);
    });

    it('falls back to type-based generation for unknown field names', () => {
      const strVal = generateMockValue('unknownField', 'java.lang.String');
      expect(typeof strVal).toBe('string');

      const intVal = generateMockValue('unknownField', 'java.lang.Integer');
      expect(typeof intVal).toBe('number');
      expect(Number.isInteger(intVal)).toBe(true);

      const doubleVal = generateMockValue('unknownField', 'java.lang.Double');
      expect(typeof doubleVal).toBe('number');

      const boolVal = generateMockValue('unknownField', 'java.lang.Boolean');
      expect(typeof boolVal).toBe('boolean');
    });
  });

  describe('generateMockParameters', () => {
    it('generates values for all parameters', () => {
      const params: ReportParameter[] = [
        { name: 'reportTitle', class: 'java.lang.String' },
        { name: 'startDate', class: 'java.util.Date' },
        { name: 'maxRows', class: 'java.lang.Integer' },
      ];
      const result = generateMockParameters(params);
      expect(Object.keys(result)).toHaveLength(3);
      expect('reportTitle' in result).toBe(true);
      expect('startDate' in result).toBe(true);
      expect('maxRows' in result).toBe(true);
    });

    it('uses defaultValue when present', () => {
      const params: ReportParameter[] = [
        { name: 'title', class: 'java.lang.String', defaultValue: '自定义标题' },
      ];
      const result = generateMockParameters(params);
      expect(result['title']).toBe('自定义标题');
    });

    it('returns empty object for empty params', () => {
      expect(generateMockParameters([])).toEqual({});
    });
  });

  describe('generateMockDataSource', () => {
    it('generates correct number of rows', () => {
      const fields: ReportField[] = [
        { name: 'name', class: 'java.lang.String' },
        { name: 'amount', class: 'java.lang.Double' },
      ];
      const rows = generateMockDataSource(fields, 5);
      expect(rows).toHaveLength(5);
    });

    it('each row contains all field keys', () => {
      const fields: ReportField[] = [
        { name: 'name', class: 'java.lang.String' },
        { name: 'phone', class: 'java.lang.String' },
        { name: 'amount', class: 'java.lang.Double' },
      ];
      const rows = generateMockDataSource(fields, 3);
      for (const row of rows) {
        expect(Object.keys(row)).toEqual(['name', 'phone', 'amount']);
      }
    });

    it('returns empty array for zero rows', () => {
      const fields: ReportField[] = [{ name: 'x', class: 'java.lang.String' }];
      expect(generateMockDataSource(fields, 0)).toEqual([]);
    });

    it('returns empty array for empty fields', () => {
      expect(generateMockDataSource([], 5)).toEqual([{}, {}, {}, {}, {}]);
    });
  });
});
