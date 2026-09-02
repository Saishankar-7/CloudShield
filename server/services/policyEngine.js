const logger = require('../utils/logger');

const policyEngine = {
  /**
   * Evaluates if a request is authorized, denied, or requires MFA under the given policy rules.
   * 
   * @returns {Object} { decision: 'Allow' | 'Deny' | 'MFA_Required', reason: string, accessLevel: string }
   */
  evaluatePolicy: ({ user, resource, policy, riskScore, deviceInfo, locationInfo }) => {
    // 1. If user is an admin, they have global override rights unless risk score is Critical (e.g. >= 81)
    if (user.role === 'admin') {
      if (riskScore >= 81) {
        return {
          decision: 'MFA_Required',
          reason: 'Admin access with critical risk level requires verification.',
          accessLevel: 'Admin'
        };
      }
      return {
        decision: 'Allow',
        reason: 'Administrator override',
        accessLevel: 'Admin'
      };
    }

    // 2. If no policy exists for this resource, fallback to Zero Trust resource status & sensitivity gating
    if (!policy) {
      const isRestrictedOrProtected =
        resource &&
        (resource.status === 'Restricted' ||
          resource.status === 'Protected' ||
          resource.type === 'PDF Document' ||
          resource.cloudStorage?.isCloudPdf ||
          resource.sensitivity === 'Critical' ||
          resource.sensitivity === 'High');

      if (isRestrictedOrProtected) {
        return {
          decision: 'Deny',
          reason: 'Zero-Trust Gate: Protected Cloud Asset requires administrator access approval.',
          accessLevel: 'None',
        };
      }
      return {
        decision: 'Allow',
        reason: 'Default permit (Public resource)',
        accessLevel: 'Read Only',
      };
    }

    // 3. Check if policy applies to user role/department
    const roleApplies = policy.appliesTo?.roles?.includes(user.role);
    const deptApplies = policy.appliesTo?.departments?.length === 0 || 
                         policy.appliesTo?.departments?.includes(user.department);

    if (!roleApplies || !deptApplies) {
      return {
        decision: 'Deny',
        reason: `Policy ${policy.name} restricts access to specific roles/departments.`,
        accessLevel: 'None'
      };
    }

    const { conditions } = policy;

    // 4. Check absolute risk score cap
    const maxRisk = conditions.maxAllowedRiskScore ?? 60;
    if (riskScore >= maxRisk) {
      return {
        decision: 'Deny',
        reason: `Access blocked. Risk score (${riskScore}) exceeds allowed threshold (${maxRisk}).`,
        accessLevel: 'None'
      };
    }

    // 5. Check unrecognized device block
    if (conditions.blockUnrecognizedDevices) {
      const isDeviceTrusted = user.trustedDevices.some(
        d => d.deviceId === deviceInfo.deviceId && d.isTrusted
      );
      if (!isDeviceTrusted) {
        return {
          decision: 'Deny',
          reason: 'Access denied. Policy blocks unrecognized devices.',
          accessLevel: 'None'
        };
      }
    }

    // 6. Check location restriction
    if (conditions.allowedLocations && conditions.allowedLocations.length > 0) {
      const isLocationAllowed = conditions.allowedLocations.some(
        loc => loc.toLowerCase() === locationInfo.country?.toLowerCase()
      );
      if (!isLocationAllowed) {
        return {
          decision: 'Deny',
          reason: `Access blocked from location: ${locationInfo.country}.`,
          accessLevel: 'None'
        };
      }
    }

    // 7. Check office hours restrictions
    if (conditions.officeHoursOnly) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      
      const startStr = conditions.officeHoursStart || '09:00';
      const endStr = conditions.officeHoursEnd || '18:00';

      if (currentTimeStr < startStr || currentTimeStr > endStr) {
        return {
          decision: 'Deny',
          reason: `Access blocked outside office hours (${startStr} - ${endStr}).`,
          accessLevel: 'None'
        };
      }
    }

    // 8. Check if MFA challenge is triggered by elevated risk
    const mfaRiskThreshold = conditions.mfaRequiredAboveRiskScore ?? 30;
    if (riskScore >= mfaRiskThreshold) {
      return {
        decision: 'MFA_Required',
        reason: `Elevated risk score (${riskScore}) requires MFA challenge.`,
        accessLevel: policy.defaultAccessLevel || 'Read Only'
      };
    }

    // 9. Allow by default
    return {
      decision: 'Allow',
      reason: 'Policy conditions satisfied.',
      accessLevel: policy.defaultAccessLevel || 'Read Only'
    };
  }
};

module.exports = policyEngine;
