export type AnalyticsEventName =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'paywall_viewed'
  | 'paywall_cta_tapped'
  | 'trial_started'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'restore_purchases_tapped'
  | 'scan_started'
  | 'scan_completed'
  | 'scan_failed'
  | 'non_food_detected'
  | 'correction_applied'
  | 'meal_saved'
  | 'barcode_scan_started'
  | 'barcode_scan_completed'
  | 'label_scan_completed'
  | 'today_coach_viewed'
  | 'weekly_report_viewed';

export type AnalyticsPayload = Record<string, string | number | boolean | null>;
