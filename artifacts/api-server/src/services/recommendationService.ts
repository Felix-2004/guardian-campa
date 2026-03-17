const issueRecommendations: Record<string, Array<{ title: string; description: string; priority: "high" | "medium" | "low" }>> = {
  "night travel": [
    { title: "Enable Auto Night Alerts", description: "Automatically share location with contacts after 10 PM", priority: "high" },
    { title: "Set Up Check-In Schedule", description: "Create regular check-ins when traveling at night", priority: "high" },
    { title: "Prepare SOS Template", description: "Create a quick SOS message for emergency situations", priority: "medium" },
  ],
  "harassment": [
    { title: "Stealth Mode Ready", description: "Learn how to activate stealth mode to hide the app quickly", priority: "high" },
    { title: "Add Trusted Contacts", description: "Add people who can quickly come to your aid", priority: "high" },
    { title: "Enable Location Sharing", description: "Keep location sharing enabled with primary contacts", priority: "medium" },
  ],
  "health issues": [
    { title: "Add Medical Info", description: "Add health concerns to your profile for emergency responders", priority: "high" },
    { title: "Set Emergency Contacts", description: "Ensure medical contacts are in your emergency list", priority: "high" },
    { title: "Regular Check-Ins", description: "Enable automatic wellness check-ins", priority: "medium" },
  ],
  "elderly safety": [
    { title: "Enable Fall Detection", description: "Set up routine monitoring for unusual inactivity", priority: "high" },
    { title: "Family Dashboard Access", description: "Give family members access to the family dashboard", priority: "high" },
    { title: "Large Text Mode", description: "Enable accessibility large text mode for easier use", priority: "low" },
  ],
  "child safety": [
    { title: "Set Safe Zones", description: "Add home, school, and regular locations as safe zones", priority: "high" },
    { title: "Routine Monitoring", description: "Enable routine violation detection for expected arrivals", priority: "high" },
    { title: "Share Family Dashboard", description: "Set up family dashboard link for monitoring", priority: "medium" },
  ],
};

const generalRecommendations = [
  { title: "Keep App Updated", description: "Ensure Guardian Companion has all latest safety features", priority: "low" as const },
  { title: "Test Your SOS", description: "Practice the SOS button to ensure contacts receive alerts", priority: "medium" as const },
  { title: "Review Safe Zones", description: "Keep your saved locations up to date", priority: "low" as const },
];

export function getRecommendations(issues: string[]): Array<{
  id: string;
  category: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}> {
  const recs: typeof generalRecommendations = [];
  const seen = new Set<string>();

  for (const issue of issues) {
    const issueLower = issue.toLowerCase();
    for (const [key, items] of Object.entries(issueRecommendations)) {
      if (issueLower.includes(key) || key.includes(issueLower)) {
        for (const item of items) {
          if (!seen.has(item.title)) {
            seen.add(item.title);
            recs.push({ ...item, category: key });
          }
        }
      }
    }
  }

  for (const g of generalRecommendations) {
    if (!seen.has(g.title)) {
      recs.push({ ...g, category: "general" });
    }
  }

  return recs.slice(0, 6).map((r, i) => ({
    ...r,
    id: `rec-${i}`,
    category: (r as any).category || "general",
  }));
}

export function computeSafetyScore(params: {
  hasContacts: boolean;
  hasHomeLocation: boolean;
  recentAlerts: number;
  issues: string[];
  hour: number;
}): { score: number; riskLevel: "low" | "medium" | "high"; factors: string[] } {
  let score = 100;
  const factors: string[] = [];

  if (!params.hasContacts) {
    score -= 20;
    factors.push("No emergency contacts added");
  }
  if (!params.hasHomeLocation) {
    score -= 10;
    factors.push("Home location not set");
  }
  if (params.recentAlerts > 0) {
    score -= params.recentAlerts * 10;
    factors.push(`${params.recentAlerts} recent alert(s) triggered`);
  }
  if (params.hour >= 22 || params.hour < 6) {
    score -= 15;
    factors.push("Late night / early morning - higher risk period");
  }
  if (params.issues.length === 0) {
    score -= 5;
    factors.push("No issues configured for personalized recommendations");
  }

  score = Math.max(0, Math.min(100, score));

  let riskLevel: "low" | "medium" | "high" = "low";
  if (score < 50) riskLevel = "high";
  else if (score < 75) riskLevel = "medium";

  return { score, riskLevel, factors };
}
