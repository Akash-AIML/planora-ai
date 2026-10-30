import type { EventIdea, EventRequirements } from "./types";

interface IdeaTemplate {
  title: string;
  description: string;
  category: string;
  estimatedInr: number | null;
  matchTags?: string[];
}

const IDEAS_BY_TYPE: Record<string, IdeaTemplate[]> = {
  wedding: [
    {
      title: "Handcrafted Heritage Welcome Station",
      description: "Greet arriving guests with cool rose-vetiver coolers, jasmine gajras, and traditional live folk flute players at the archway.",
      category: "Guest Experience",
      estimatedInr: 25000,
      matchTags: ["heritage", "traditional", "luxury"],
    },
    {
      title: "Interactive Live Culinary Carts",
      description: "Live artisanal chaat counters, wood-fired thin-crust pizza stations, and nitrogen dessert bar tailored to vegetarian tastes.",
      category: "Catering",
      estimatedInr: 60000,
      matchTags: ["vegetarian", "grand", "luxury"],
    },
    {
      title: "Audio Guestbook & Polaroid Wall",
      description: "A vintage rotary phone where guests record voicemail messages for the couple, paired with a polaroid photo wall.",
      category: "Keepsake",
      estimatedInr: 18000,
      matchTags: ["modern", "intimate"],
    },
    {
      title: "Cold-Pyro & Fairylit Sunset Canopy",
      description: "Eco-friendly smoke-free cold sparklers timed with entry and warm fairy-light canopy illuminating the dinner lawn.",
      category: "Decor",
      estimatedInr: 45000,
      matchTags: ["outdoor", "evening", "grand"],
    },
    {
      title: "Zero-Food-Waste NGO Partnership",
      description: "Pre-arranged certified food rescue team to package unserved food for nearby shelters at the close of dinner.",
      category: "Sustainability",
      estimatedInr: 8000,
      matchTags: ["sustainable", "budget"],
    },
  ],
  birthday: [
    {
      title: "Themed Immersive Photo Booth",
      description: "Custom 3D prop backdrop featuring the guest of honor's favorite aesthetic, with instant photostrip printing.",
      category: "Entertainment",
      estimatedInr: 15000,
      matchTags: ["kids", "grand", "modern"],
    },
    {
      title: "Artisanal Mocktail & Bubble Bar",
      description: "Custom flavored boba teas, smoking mocktails, and fresh fruit fizzes named after funny personal milestones.",
      category: "Beverage",
      estimatedInr: 20000,
      matchTags: ["no alcohol", "kids", "evening"],
    },
    {
      title: "Interactive Workshop Corner",
      description: "Live pottery wheel, slime-making station, or mini succulent potting station that guests take home as favors.",
      category: "Activities",
      estimatedInr: 18000,
      matchTags: ["kids", "sustainable", "intimate"],
    },
    {
      title: "Retro Arcade & Board Game Lounge",
      description: "Cozy corner featuring vintage multiplayer video games and modern party tabletop games.",
      category: "Entertainment",
      estimatedInr: 12000,
      matchTags: ["indoor", "modern"],
    },
  ],
  anniversary: [
    {
      title: "Walk-Through Memory Gallery",
      description: "Framed milestone photos, love letters, and journey artifacts arranged chronologically along the entrance pathway.",
      category: "Decor",
      estimatedInr: 15000,
      matchTags: ["intimate", "traditional"],
    },
    {
      title: "Acoustic Sunset Serenade",
      description: "Live violinist or acoustic guitarist playing the couple's special decade songs during cocktail hour.",
      category: "Entertainment",
      estimatedInr: 22000,
      matchTags: ["live music", "outdoor", "evening"],
    },
    {
      title: "Customized Keepsake Video Documentary",
      description: "Pre-recorded heartwarming interviews with long-distance family and lifelong friends projected during dinner.",
      category: "Keepsake",
      estimatedInr: 20000,
      matchTags: ["intimate", "grand"],
    },
  ],
  corporate: [
    {
      title: "Digital Smart Badges & QR Scavenger Hunt",
      description: "NFC/QR-enabled networking badges that gamify sponsor booth visits and keynote interaction.",
      category: "Technology",
      estimatedInr: 35000,
      matchTags: ["corporate", "modern"],
    },
    {
      title: "Specialty Craft Coffee Barista Station",
      description: "On-demand specialty pour-overs, cold brews, and oat milk lattes with latte art of the company logo.",
      category: "Catering",
      estimatedInr: 30000,
      matchTags: ["corporate", "indoor"],
    },
    {
      title: "Wellness & Recharging Lounge",
      description: "Dedicated ergonomic seating nook with device charging lockers, quiet acoustic pods, and infused water.",
      category: "Facilities",
      estimatedInr: 25000,
      matchTags: ["accessible", "modern"],
    },
  ],
  community: [
    {
      title: "Local Makers & Farmers Showcase",
      description: "Booths reserved for neighborhood artisans, home bakers, and organic produce growers.",
      category: "Community",
      estimatedInr: 15000,
      matchTags: ["sustainable", "outdoor"],
    },
    {
      title: "Solar-Powered Acoustic Stage",
      description: "Low-noise, clean-energy sound stage showcasing local school choirs, youth bands, and folk performers.",
      category: "Entertainment",
      estimatedInr: 30000,
      matchTags: ["live music", "sustainable"],
    },
    {
      title: "Community Pledge & Tree-Planting Drive",
      description: "Interactive mural where attendees plant a native sapling or sign a neighborhood greenery pledge.",
      category: "Activity",
      estimatedInr: 12000,
      matchTags: ["sustainable", "kids"],
    },
  ],
};

export function generateIdeas(
  event: Pick<EventRequirements, "eventType" | "preferences">,
  eventId: string,
): EventIdea[] {
  const templates = IDEAS_BY_TYPE[event.eventType] ?? IDEAS_BY_TYPE.wedding;
  const userPrefs = (event.preferences ?? []).map((p) => p.toLowerCase());

  // Prioritize ideas that match user preferences
  const sorted = [...templates].sort((a, b) => {
    const aMatches = (a.matchTags ?? []).filter((tag) => userPrefs.includes(tag.toLowerCase())).length;
    const bMatches = (b.matchTags ?? []).filter((tag) => userPrefs.includes(tag.toLowerCase())).length;
    return bMatches - aMatches;
  });

  return sorted.slice(0, 4).map((template, index) => ({
    id: `idea-${eventId}-${index + 1}`,
    eventId,
    title: template.title,
    description: template.description,
    category: template.category,
    estimatedInr: template.estimatedInr,
    source: "template",
  }));
}
