const logger = require('../utils/logger');

const policyEngine = {
  /**
   * Evaluates if a request is authorized, denied, or requires MFA under the given policy rules.
   * 
   * @returns {Object} { decision: 'Allow' | 'Deny' | 'MFA_Required', reason: string, accessLevel: string }
   */
  evaluatePolicy: ({ user, resource, policy, riskScore, deviceInfo, locationInfo }) => {
    if (!user) {
      return { decision: 'Deny', reason: 'Unauthenticated session', accessLevel: 'None' };
    }

    // 1. Resource-Level Access Controls Configured by Administrator
    if (resource) {
      // Check if access has been revoked or disabled by admin
      if (resource.accessStatus === 'Revoked' || resource.accessStatus === 'Disabled') {
        return {
          decision: 'Deny',
          reason: 'Administrator has revoked/disabled access to this resource for all users.',
          accessLevel: 'None',
        };
      }

      if (resource.accessStatus === 'Restricted') {
        return {
          decision: 'Deny',
          reason: 'Resource is restricted by Administrator. Access request approval required.',
          accessLevel: 'None',
        };
      }

      // Check if user is explicitly blocked by admin
      if (resource.blockedUsers && resource.blockedUsers.some((uid) => (uid._id || uid).toString() === user._id.toString())) {
        return {
          decision: 'Deny',
          reason: 'User account is specifically blocked by an Administrator.',
          accessLevel: 'None',
        };
      }

      // Check Allowed Specific User Accounts
      // If admin selected specific allowed users on this resource, ONLY those user accounts can access!
      const hasSpecificAllowedUsers = resource.allowedUsers && resource.allowedUsers.length > 0;
      const isUserInAllowedUsersList = hasSpecificAllowedUsers && resource.allowedUsers.some(
        (uid) => (uid._id || uid).toString() === user._id.toString()
      );

      if (hasSpecificAllowedUsers && !isUserInAllowedUsersList) {
        return {
          decision: 'Deny',
          reason: 'Access restricted: Your user account is not in the authorized accounts list for this resource. Please submit an access request.',
          accessLevel: 'None',
        };
      }

      // Check allowed roles configured by admin
      if (resource.allowedRoles && resource.allowedRoles.length > 0 && !resource.allowedRoles.includes(user.role)) {
        return {
          decision: 'Deny',
          reason: `Access restricted to roles: ${resource.allowedRoles.join(', ')}.`,
          accessLevel: 'None',
        };
      }

      // Check allowed departments configured by admin (if not explicitly whitelisted via allowedUsers)
      if (!isUserInAllowedUsersList) {
        const hasNoDepartmentsAllowed =
          !resource.allowedDepartments ||
          resource.allowedDepartments.length === 0 ||
          resource.allowedDepartments.includes('None');

        const deptAllowed =
          !hasNoDepartmentsAllowed &&
          (resource.allowedDepartments.includes('All') ||
           resource.allowedDepartments.includes(user.department));

        if (!deptAllowed) {
          return {
            decision: 'Deny',
            reason: hasNoDepartmentsAllowed
              ? 'Administrator has disabled direct department access. Please submit an access request.'
              : `Access restricted to departments: ${resource.allowedDepartments.join(', ')}. Please submit an access request.`,
            accessLevel: 'None',
          };
        }
      }

      // Check admin MFA policy rule
      if (resource.mfaRequirement === 'Always Required') {
        return {
          decision: 'MFA_Required',
          reason: 'Administrator Policy: Resource access requires email OTP MFA verification.',
          accessLevel: 'Read Only',
        };
      } else if (resource.mfaRequirement === 'Disabled') {
        return {
          decision: 'Allow',
          reason: 'Resource policy permits direct access without MFA.',
          accessLevel: 'Read Only',
        };
      }
    }

    // 2. Admin role override for general assets
    if (user.role === 'admin') {
      if (riskScore >= 81) {
        return {
          decision: 'MFA_Required',
          reason: 'Admin access with critical risk level requires verification.',
          accessLevel: 'Admin',
        };
      }
      return {
        decision: 'Allow',
        reason: 'Administrator override',
        accessLevel: 'Admin',
      };
    }

    // 3. Fallback evaluation when no specific rule overrides
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
          decision: 'MFA_Required',
          reason: 'Zero-Trust Gate: Protected Cloud Asset requires email OTP MFA verification.',
          accessLevel: 'Read Only',
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
      const isDeviceTrusted = (user.trustedDevices || []).some(
        d => deviceInfo?.deviceId && d.deviceId === deviceInfo.deviceId && d.isTrusted
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
        loc => loc.toLowerCase() === locationInfo?.country?.toLowerCase()
      );
      if (!isLocationAllowed) {
        return {
          decision: 'Deny',
          reason: `Access blocked from location: ${locationInfo?.country || 'Unknown'}.`,
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
    if (riskScore >= mfaRiskThreshold && resource?.mfaRequirement !== 'Disabled') {
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
