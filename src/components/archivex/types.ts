export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  icon: string;
  color: string; // blueprint=purple, resiliency=teal, scale=amber, devops=blue, reveng=pink, prompts=green
  iconTint: string; // light-tinted hex or rgba for icon container
}

export interface Tab {
  id: string;
  label: string;
  icon: string;
}
