/**
 * Validation utilities
 * Handles validation logic for various data structures
 */

import { ExpansionRegion } from '../types';

/**
 * Validation service
 */
export class ValidationUtil {
  /**
   * Validate expansion region percentages and constraints
   */
  static validateExpansionRegion(expansionRegion: ExpansionRegion): void {
    if (!expansionRegion) {
      return;
    }

    // Validate each field is between 0 and 1
    const fields: (keyof ExpansionRegion)[] = ['upPercent', 'downPercent', 'leftPercent', 'rightPercent'];
    for (const field of fields) {
      const value = expansionRegion[field];
      if (value !== undefined) {
        if (typeof value !== 'number' || value < 0 || value > 1) {
          throw new Error(`ExpansionRegion.${field} must be a number between 0 and 1, got: ${value}`);
        }
      }
    }

    // Validate that at most one direction is set
    const setDirections = [
      expansionRegion.upPercent !== undefined,
      expansionRegion.downPercent !== undefined,
      expansionRegion.leftPercent !== undefined,
      expansionRegion.rightPercent !== undefined
    ].filter(Boolean);

    if (setDirections.length > 1) {
      throw new Error('ExpansionRegion can have at most one direction set (upPercent, downPercent, leftPercent, or rightPercent)');
    }
  }
}