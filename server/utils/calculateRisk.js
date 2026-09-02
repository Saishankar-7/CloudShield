/**
 * Dynamic risk calculator for Zero Trust access control
 * Calculates a score between 0 and 100 based on user history, resource sensitivity, location, device status, and time.
 * 
 * @param {Object} context
 * @param {Object} context.user - User model object
 * @param {Object} context.resource - Resource model object (optional)
 * @param {Object} context.deviceInfo - Device information parsed from request (browser, os, ip, deviceId)
 * @param {Object} context.locationInfo - Location information parsed from request (country, city)
 * @param {Object} context.policy - Applicable security policy (optional)
 */
function calculateRisk({ user, resource, deviceInfo, locationInfo, policy }) {
  let score = 0;
  
  // 1. Resource sensitivity weight
  const sensitivityWeights = {
    'Low': 5,
    'Medium': 15,
    'High': 30,
    'Critical': 45
  };
  
  if (resource && resource.sensitivity) {
    score += sensitivityWeights[resource.sensitivity] || 5;
  }
  
  // 2. Unrecognized device
  const isDeviceTrusted = user.trustedDevices.some(
    d => d.deviceId === deviceInfo.deviceId && d.isTrusted
  );
  
  if (!isDeviceTrusted) {
    const deviceWeight = policy?.riskWeights?.unrecognizedDevice ?? 30;
    score += deviceWeight;
  }
  
  // 3. New/Unusual Location
  const hasSeenLocation = user.trustedDevices.some(
    d => d.location && d.location.toLowerCase().includes(locationInfo.country.toLowerCase())
  ) || (user.lastLoginIp && user.lastLoginIp === deviceInfo.ip);
  
  if (!hasSeenLocation && locationInfo.country !== 'India') { // default mock trusted location is India
    const locationWeight = policy?.riskWeights?.newLocation ?? 25;
    score += locationWeight;
  }
  
  // 4. Outside access window (office hours)
  const officeHoursOnly = policy?.conditions?.officeHoursOnly ?? false;
  if (officeHoursOnly) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    const startStr = policy.conditions.officeHoursStart || '09:00';
    const endStr = policy.conditions.officeHoursEnd || '18:00';
    
    if (currentTimeStr < startStr || currentTimeStr > endStr) {
      const windowWeight = policy?.riskWeights?.outsideAccessWindow ?? 15;
      score += windowWeight;
    }
  }
  
  // 5. Recent Failed Login Attempts
  const failedAttempts = user.security?.failedLoginAttempts || 0;
  if (failedAttempts > 0) {
    const failedWeight = (policy?.riskWeights?.recentFailedLogins ?? 5) * failedAttempts;
    score += Math.min(failedWeight, 20); // cap failed login impact at 20
  }
  
  // Ensure the score is within 0 and 100
  score = Math.max(0, Math.min(score, 100));
  
  let riskLevel = 'Low';
  if (score >= 81) {
    riskLevel = 'Critical';
  } else if (score >= 61) {
    riskLevel = 'High';
  } else if (score >= 31) {
    riskLevel = 'Medium';
  }
  
  return { score, riskLevel };
}

module.exports = calculateRisk;
