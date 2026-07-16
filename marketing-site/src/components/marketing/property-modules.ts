export type DynField = {
  id: string;
  lbl: string;
  type: "number" | "text" | "select";
  def?: string;
  opts?: string[];
};

export type PropertyModule = {
  label: string;
  icon: string;
  rules: string;
  appetite: string;
  dynFields: DynField[];
  covs: string[];
  defCovs: string[];
  defaults: Record<string, string>;
};

export const PROPERTY_MODULES: Record<string, PropertyModule> = {
  apartment: {
    label: "Apartment",
    icon: "🏢",
    rules:
      "Unit count is primary rating base. Roof under 20 years required for most admitted markets. Vacancy over 30% triggers referral. Pool/gym/elevator add GL surcharge. Section 8 over 50% = surplus lines only.",
    appetite:
      "NATIONWIDE: Best 1–100 units. HARTFORD: Under 20 units, clean loss. MARKEL: 100+ units or losses. TRAVELERS: 50+ units, $5M+ TIV. COTERIE: Under 6 units only.",
    dynFields: [
      { id: "f_units", lbl: "Number of Units", type: "number", def: "24" },
      { id: "f_vac", lbl: "Vacancy Rate %", type: "number", def: "5" },
      {
        id: "f_amen",
        lbl: "Amenities",
        type: "select",
        opts: ["None", "Pool only", "Pool + Gym", "Pool + Gym + Elevator"],
      },
      { id: "f_s8", lbl: "Section 8 %", type: "number", def: "0" },
    ],
    covs: ["Building & Property", "General Liability", "Loss of Rents", "Crime", "Umbrella", "Flood"],
    defCovs: ["Building & Property", "General Liability", "Loss of Rents"],
    defaults: {
      f_addr: "1420 Riverside Blvd, Tampa, FL 33602",
      f_year: "1987",
      f_sqft: "22,400",
      f_tiv: "$2,400,000",
      f_roofyr: "2019",
    },
  },
  office: {
    label: "Office Building",
    icon: "🏛️",
    rules:
      "Office class A/B/C drives replacement cost. Medical tenants require referral. Occupancy below 70% triggers vacancy clause. Elevator requires liability endorsement. Triple-net leases affect business income calc.",
    appetite:
      "COTERIE: Class B/C under $3M TIV. HARTFORD: Strong office BOP. NATIONWIDE: Suburban office up to 6 stories. TRAVELERS: Class A high-rise $5M+. MARKEL: Older or high-vacancy.",
    dynFields: [
      { id: "f_class", lbl: "Office Class", type: "select", opts: ["Class A", "Class B", "Class C"] },
      { id: "f_stories", lbl: "Number of Stories", type: "number", def: "4" },
      { id: "f_occpct", lbl: "Occupancy %", type: "number", def: "92" },
      {
        id: "f_med",
        lbl: "Medical Tenants",
        type: "select",
        opts: ["None", "Under 25%", "25–50%", "Over 50%"],
      },
    ],
    covs: ["Building & Property", "General Liability", "Business Income", "Umbrella", "Cyber", "Crime"],
    defCovs: ["Building & Property", "General Liability", "Business Income"],
    defaults: {
      f_addr: "550 Commerce Pkwy, Atlanta, GA 30339",
      f_year: "2002",
      f_sqft: "38,000",
      f_tiv: "$5,800,000",
      f_roofyr: "2018",
    },
  },
  retail: {
    label: "Retail / Strip Center",
    icon: "🏪",
    rules:
      "Tenant mix is most critical factor. Cooking operations require UL-300 hood. Liquor sales trigger liquor liability. Foot traffic drives GL base. Food service over 30% of GLA = harder placement.",
    appetite:
      "COTERIE: Small retail no food under $2M. HARTFORD: Strip centers limited food. NATIONWIDE: Community retail. TRAVELERS: Large retail. MARKEL: Food-heavy or high vacancy.",
    dynFields: [
      { id: "f_gla", lbl: "Gross Leasable Area (sqft)", type: "text", def: "12,000" },
      { id: "f_foodpct", lbl: "Food Service % of GLA", type: "number", def: "0" },
      {
        id: "f_liq",
        lbl: "Liquor on Premises",
        type: "select",
        opts: ["No", "Yes — under 30%", "Yes — over 30%"],
      },
      {
        id: "f_anchor",
        lbl: "Anchor Tenant",
        type: "select",
        opts: ["None", "National brand", "Regional", "Local only"],
      },
    ],
    covs: ["Building & Property", "General Liability", "Business Income", "Umbrella", "Crime", "Liquor Liability"],
    defCovs: ["Building & Property", "General Liability", "Business Income"],
    defaults: {
      f_addr: "8900 University Blvd, Orlando, FL 32817",
      f_year: "1998",
      f_sqft: "14,500",
      f_tiv: "$2,100,000",
      f_roofyr: "2016",
    },
  },
  warehouse: {
    label: "Warehouse / Industrial",
    icon: "🏭",
    rules:
      "Occupancy type drives risk. Hazmat storage is hard question. Ceiling height above 30ft affects sprinkler rating. Cold storage needs equipment breakdown. UST requires environmental liability.",
    appetite:
      "COTERIE: Light warehouse clean under $3M. HARTFORD: Light industrial up to $8M. NATIONWIDE: General warehouse. TRAVELERS: Heavy industrial $10M+. MARKEL: Hazmat or older.",
    dynFields: [
      {
        id: "f_occtype",
        lbl: "Occupancy Type",
        type: "select",
        opts: ["General warehouse", "Light industrial", "Food/cold storage", "Manufacturing", "Distribution"],
      },
      { id: "f_ceiling", lbl: "Clear Height (ft)", type: "number", def: "24" },
      {
        id: "f_hazmat",
        lbl: "Hazardous Materials",
        type: "select",
        opts: ["None", "Minimal Class 1", "Moderate Class 2-3", "Significant Class 4+"],
      },
      { id: "f_dock", lbl: "Dock Doors", type: "number", def: "4" },
    ],
    covs: [
      "Building & Property",
      "General Liability",
      "Business Income",
      "Inland Marine",
      "Equipment Breakdown",
      "Umbrella",
    ],
    defCovs: ["Building & Property", "General Liability", "Business Income", "Equipment Breakdown"],
    defaults: {
      f_addr: "4200 Industrial Dr, Charlotte, NC 28206",
      f_year: "1994",
      f_sqft: "65,000",
      f_tiv: "$4,200,000",
      f_roofyr: "2020",
    },
  },
  mixed: {
    label: "Mixed-Use",
    icon: "🔀",
    rules:
      "Dominant occupancy rule applies. Residential above commercial creates unique fire separation. Business income must separate residential from commercial. Liquor in retail portion affects whole building GL rate.",
    appetite:
      "HARTFORD: Small mixed-use under $4M. NATIONWIDE: Up to 24 residential units above retail. TRAVELERS: Large mixed-use urban. MARKEL: Non-standard or food component.",
    dynFields: [
      { id: "f_respct", lbl: "Residential % of Building", type: "number", def: "60" },
      { id: "f_resunits", lbl: "Residential Units", type: "number", def: "12" },
      {
        id: "f_commtype",
        lbl: "Commercial Component",
        type: "select",
        opts: ["Retail/service", "Restaurant", "Office", "Retail + Restaurant"],
      },
      { id: "f_stories", lbl: "Total Stories", type: "number", def: "4" },
    ],
    covs: ["Building & Property", "General Liability", "Loss of Rents", "Business Income", "Umbrella", "Crime"],
    defCovs: ["Building & Property", "General Liability", "Loss of Rents", "Business Income"],
    defaults: {
      f_addr: "210 Main St, Nashville, TN 37201",
      f_year: "2008",
      f_sqft: "18,000",
      f_tiv: "$3,500,000",
      f_roofyr: "2021",
    },
  },
  hotel: {
    label: "Hotel / Hospitality",
    icon: "🏨",
    rules:
      "Room count is primary GL rating base. Franchise flag required for most admitted carriers. Liquor service requires dram shop. Pool/spa each add premises liability. ADA non-compliance = significant GL exposure.",
    appetite:
      "HARTFORD: Under 80 rooms franchise flags. TRAVELERS: 50–500 rooms franchise. MARKEL: Independent or older. LIBERTY MUTUAL: Mid-scale 80–200 rooms. SURPLUS: Large resorts or luxury.",
    dynFields: [
      { id: "f_rooms", lbl: "Number of Rooms", type: "number", def: "85" },
      {
        id: "f_flag",
        lbl: "Brand / Franchise",
        type: "select",
        opts: ["Independent", "Economy (Motel 6)", "Limited service (Hampton)", "Full service (Hilton)", "Luxury/boutique"],
      },
      {
        id: "f_fb",
        lbl: "Food & Beverage",
        type: "select",
        opts: ["Continental only", "Full restaurant", "Restaurant + Bar", "None"],
      },
      {
        id: "f_amenh",
        lbl: "Amenities",
        type: "select",
        opts: ["None", "Pool only", "Pool + Fitness", "Pool + Fitness + Spa"],
      },
    ],
    covs: ["Building & Property", "General Liability", "Business Income", "Liquor Liability", "Umbrella", "Crime"],
    defCovs: ["Building & Property", "General Liability", "Business Income", "Liquor Liability"],
    defaults: {
      f_addr: "701 Beach Blvd, Biloxi, MS 39530",
      f_year: "1995",
      f_sqft: "54,000",
      f_tiv: "$8,500,000",
      f_roofyr: "2017",
    },
  },
  contractor: {
    label: "Contractor Yard",
    icon: "🏗️",
    rules:
      "Equipment value and trade type drive appetite. Inland marine floater required for tools on/off premises. UST triggers environmental liability. Security system provides theft credit. Roofing = harder market.",
    appetite:
      "COTERIE: Small yards light trades. HARTFORD: General/electrical/plumbing up to $3M equipment. MARKEL: Specialty contractors roofing demo. TRAVELERS: Large GC $5M+ TIV.",
    dynFields: [
      {
        id: "f_trade",
        lbl: "Contractor Trade",
        type: "select",
        opts: ["General contractor", "Electrical", "Plumbing", "HVAC", "Roofing", "Excavation", "Demolition", "Landscaping"],
      },
      { id: "f_equip", lbl: "Equipment Value", type: "text", def: "$450,000" },
      {
        id: "f_ust",
        lbl: "Underground Storage Tanks",
        type: "select",
        opts: ["No", "Yes — compliant", "Yes — compliance uncertain"],
      },
      {
        id: "f_sec",
        lbl: "Security System",
        type: "select",
        opts: ["None", "Alarm only", "Monitored alarm", "Monitored + cameras"],
      },
    ],
    covs: [
      "Building & Property",
      "General Liability",
      "Inland Marine / Tools",
      "Business Income",
      "Umbrella",
      "Pollution Liability",
    ],
    defCovs: ["Building & Property", "General Liability", "Inland Marine / Tools"],
    defaults: {
      f_addr: "3100 Commerce Way, Jacksonville, FL 32218",
      f_year: "2000",
      f_sqft: "8,200",
      f_tiv: "$1,200,000",
      f_roofyr: "2015",
    },
  },
  restaurant: {
    label: "Restaurant",
    icon: "🍽️",
    rules:
      "Restaurant is highest-risk commercial property class. Hood must be UL-300 certified inspected within 6 months. Liquor over 50% revenue = hard market. Health dept violations = referral or decline. Late-night service adds crime exposure.",
    appetite:
      "HARTFORD: Limited — fast casual no liquor clean only. MARKEL: Full-service liquor late night specialty. TRAVELERS: Large franchise groups. SURPLUS: Independent bars nightclubs high-liquor.",
    dynFields: [
      {
        id: "f_rtype",
        lbl: "Restaurant Type",
        type: "select",
        opts: ["Quick service / fast food", "Fast casual", "Casual dining", "Fine dining", "Bar / nightclub", "Bakery / cafe"],
      },
      { id: "f_seats", lbl: "Seating Capacity", type: "number", def: "80" },
      { id: "f_liqpct", lbl: "Liquor % of Revenue", type: "number", def: "20" },
      {
        id: "f_hood",
        lbl: "Hood System Inspection",
        type: "select",
        opts: ["Within 6 months", "6–12 months ago", "Over 12 months / unknown"],
      },
    ],
    covs: ["Building & Property", "General Liability", "Liquor Liability", "Business Income", "Food Spoilage", "Umbrella"],
    defCovs: ["Building & Property", "General Liability", "Liquor Liability", "Business Income", "Food Spoilage"],
    defaults: {
      f_addr: "1220 Magazine St, New Orleans, LA 70130",
      f_year: "1978",
      f_sqft: "4,800",
      f_tiv: "$890,000",
      f_roofyr: "2014",
    },
  },
};

export const PROPERTY_TYPE_ORDER = [
  "apartment",
  "office",
  "retail",
  "warehouse",
  "mixed",
  "hotel",
  "contractor",
  "restaurant",
] as const;
