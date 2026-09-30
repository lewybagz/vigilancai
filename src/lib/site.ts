export const SITE = {
  name: "Vigilancai",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline:
    "Know what changed before it's on your next bid. Permit fees, material prices, and licensing rules, checked overnight and ranked by severity.",
  founder: {
    name: "Lewy",
    city: "Tucson",
    businesses: ["Better Binz", "BrighterOS"],
  },
  contactEmail: "hello@vigilancai.com",
} as const;
