import { Tse, List, Options } from '../types';

describe('Types', () => {
  describe('Tse interface', () => {
    it('should have all required properties', () => {
      const tseSystem: Tse = {
        id: '1234',
        year: '2023',
        content: 'Test TSE System',
        manufacturer: 'Test Manufacturer',
        date_issuance: '01.01.2023'
      };

      expect(tseSystem.id).toBe('1234');
      expect(tseSystem.year).toBe('2023');
      expect(tseSystem.content).toBe('Test TSE System');
      expect(tseSystem.manufacturer).toBe('Test Manufacturer');
      expect(tseSystem.date_issuance).toBe('01.01.2023');
    });

    it('should allow string values for all properties', () => {
      const tseSystem: Tse = {
        id: '5678',
        year: '2024',
        content: 'Another TSE System',
        manufacturer: 'Another Manufacturer',
        date_issuance: '15.03.2024'
      };

      expect(typeof tseSystem.id).toBe('string');
      expect(typeof tseSystem.year).toBe('string');
      expect(typeof tseSystem.content).toBe('string');
      expect(typeof tseSystem.manufacturer).toBe('string');
      expect(typeof tseSystem.date_issuance).toBe('string');
    });
  });

  describe('List interface', () => {
    it('should allow string keys with Tse values', () => {
      const list: List = {
        '1234-2023': {
          id: '1234',
          year: '2023',
          content: 'Test TSE System',
          manufacturer: 'Test Manufacturer',
          date_issuance: '01.01.2023'
        },
        '5678-2024': {
          id: '5678',
          year: '2024',
          content: 'Another TSE System',
          manufacturer: 'Another Manufacturer',
          date_issuance: '15.03.2024'
        }
      };

      expect(Object.keys(list)).toHaveLength(2);
      expect(list['1234-2023']).toBeDefined();
      expect(list['5678-2024']).toBeDefined();
    });

    it('should allow empty object', () => {
      const list: List = {};
      expect(Object.keys(list)).toHaveLength(0);
    });
  });

  describe('Options interface', () => {
    it('should have required properties', () => {
      const options: Options = {
        url: 'https://example.com',
        timeout: 30000
      };

      expect(options.url).toBe('https://example.com');
      expect(options.timeout).toBe(30000);
      expect(options.pages).toBeUndefined();
    });

    it('should allow optional pages property', () => {
      const options: Options = {
        url: 'https://example.com',
        timeout: 30000,
        pages: 5
      };

      expect(options.pages).toBe(5);
    });

    it('should allow different timeout values', () => {
      const options1: Options = {
        url: 'https://example.com',
        timeout: 10000
      };

      const options2: Options = {
        url: 'https://example.com',
        timeout: 60000
      };

      expect(options1.timeout).toBe(10000);
      expect(options2.timeout).toBe(60000);
    });
  });
});