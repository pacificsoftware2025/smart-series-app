export const ROLES = {
  GUEST: 'guest',
  CUSTOMER: 'customer',
  RIDER: 'rider',
  OPERATOR: 'operator',
};

export const LAUNDRY_SERVICES = [
  { id: 'wash_only', label: 'Wash Only', basePrice: '₱40/kg', description: 'Machine wash only with standard spin' },
  { id: 'wash_dry', label: 'Wash & Dry', basePrice: '₱55/kg', description: 'Complete wash and hot air tumble dry' },
  { id: 'wash_dry_fold', label: 'Wash, Dry & Fold', basePrice: '₱65/kg', description: 'Full service: wash, dry, neatly folded in bag', recommended: true },
];

