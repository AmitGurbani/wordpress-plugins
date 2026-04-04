export interface PopularProduct {
  product_id: number;
  name: string;
  slug: string;
  count: number;
}

export interface AnalyticsData {
  popular: PopularProduct[];
  total_users: number;
  total_items: number;
}
