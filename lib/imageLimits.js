import { PLANS } from './stripe';

export const checkImageUploadLimit = (currentImages, plan) => {
  const planDetails = PLANS[plan] || PLANS.free;
  
  // If plan allows unlimited images, return true
  if (planDetails.maxImages === Infinity) {
    return { canUpload: true, maxAllowed: 'unlimited' };
  }
  
  // Check if user can upload more images
  const canUpload = currentImages.length < planDetails.maxImages;
  
  return {
    canUpload,
    maxAllowed: planDetails.maxImages,
    currentCount: currentImages.length,
    remaining: Math.max(0, planDetails.maxImages - currentImages.length)
  };
};

export const getPlanLimits = (plan) => {
  return PLANS[plan] || PLANS.free;
};
