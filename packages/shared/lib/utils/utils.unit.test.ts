import { expect, describe, it } from 'vitest';
import * as utils from './utils.js';

describe('Proxy service Construct Header Tests', () => {
    it('Should correctly return true if the url is valid', () => {
        const isValid = utils.isValidHttpUrl('https://www.google.com');

        expect(isValid).toBe(true);

        expect(utils.isValidHttpUrl('https://samcarthelp.freshdesk.com/api/v2/tickets?per_page=100&include=requester,description&page=3')).toBe(true);

        expect(utils.isValidHttpUrl('/api/v2/tickets?per_page=100&include=requester,description&page=3')).toBe(false);
    });
});
describe('encodeParameters Function Tests', () => {
    it('should encode parameters correctly', () => {
        const params = {
            redirectUri: 'https://redirectme.com'
        };

        const expected = {
            redirectUri: 'https%3A%2F%2Fredirectme.com'
        };

        expect(utils.encodeParameters(params)).toEqual(expected);
    });

    it('should handle parameters with special characters', () => {
        const params = {
            redirectUri: 'https://redirectme.com?param=value&another=value'
        };

        const expected = {
            redirectUri: 'https%3A%2F%2Fredirectme.com%3Fparam%3Dvalue%26another%3Dvalue'
        };

        expect(utils.encodeParameters(params)).toEqual(expected);
    });
});