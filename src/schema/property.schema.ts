import { z } from "zod";

const roomSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dimensions: z.string().nullable().optional(),
});

  


export const propertySchema =
z.object({

  for: z.string().nullable().default(null).describe("For field is required."),
  category: z.string().nullable().default(null).describe("Category is required."),
  propertyType: z.string().nullable().default(null).describe("Property type is required."),
  internalReference: z.string().nullable().default(null).describe("Internal reference is required."),
  price: z.string().nullable().default(null).describe("Price is required."),
  priceQualifier: z.string().nullable().default(null).describe("Price qualifier is required."),
  tenure: z.string().nullable().default(null).describe("Tenure is required."),
  contractType: z.string().nullable().default(null).describe("Contract type is required."),
  salesFee: z.string().nullable().default(null).describe("Sales fee is required."),
  postCode: z.string().nullable().default(null).describe("Postcode is required."),

  propertyNo: z.string().nullable().default(null).describe("Property number is required."),
  propertyName: z.string().nullable().default(null).describe("Property name is required."),
  addressLine1: z.string().nullable().default(null).describe("Address Line 1 is required."),
  addressLine2: z.string().nullable().default(null).describe("Address Line 2 is required."),
  town: z.string().nullable().default(null).describe("Town is required."),
  county: z.string().nullable().default(null).describe("County is required."),
  country: z.string({ required_error: "Country is required." }),
  latitude: z.any().nullable().describe("Latitude is required."),
  longitude: z.any().nullable().describe("Longitude is required."),
  development: z.string().nullable().default(null).describe("Development field is required."),
  yearOfBuild: z.string().nullable().default(null).describe("Year of build is required."),
  parking: z.string().nullable().default(null).describe("Parking information is required."),
  garden: z.string().nullable().default(null).describe("Garden information is required."),
  livingFloorSpace: z.string().nullable().default(null).describe("Living floor space is required."),
  meetingRooms: z.string().nullable().default(null).describe("Meeting rooms information is required."),
  workStation: z.string().nullable().default(null).describe("Workstation information is required."),
  landSize: z.string().nullable().default(null).describe("Land size is required."),
  outBuildings: z.string().nullable().default(null).describe("Outbuildings information is required."),
propertyFeature: z.array(z.string()).optional().or(z.string().transform(val => val ? [val] : [])).default([]),
  Tags: z.string().nullable().default(null).describe("Tags field is required."),
  shortSummary: z.string().nullable().default(null).describe("Short summary is required."),
  fullDescription: z.string().nullable().default(null).describe("Full description is required."),
  GuaranteedRentLandlord: z.string().nullable().default(null).describe("Guaranteed rent for landlord is required."),
  Branch: z.string().nullable().default(null).describe("Branch is required."),
  Negotiator: z.string().nullable().default(null).describe("Negotiator is required."),
  whodoesviewings: z.string().nullable().default(null).describe("Viewings information is required."),
  comments: z.string().nullable().default(null).describe("Comments are required."),
  sva: z.string().nullable().default(null).describe("SVA is required."),
  tenureA: z.string().nullable().default(null).describe("TenureA is required."),
  customGarden: z.string().nullable().default(null).describe("Custom garden information is required."),
  customParking: z.string().nullable().default(null).describe("Custom parking information is required."),
  pets: z.string().nullable().default(null).describe("Pets information is required."),
  train: z.string().nullable().default(null).describe("Train station proximity is required."),
  occupant: z.string().nullable().default(null).describe("Occupant name is required."),
  occupantEmail: z.string().nullable().default(null).describe("Occupant email is required."),
  occupantMobile: z.string().nullable().default(null).describe("Occupant mobile is required."),
  Solicitor:z.string().nullable(),
  council: z.string().nullable().default(null).describe("Council is required."),
  councilBrand: z.string().nullable().default(null).describe("Council brand is required."),
  freeholder: z.string().nullable().default(null).describe("Freeholder is required."),
  freeholderContract: z.string().nullable().default(null).describe("Freeholder contract is required."),
  freeholderAddress: z.string().nullable().default(null).describe("Freeholder address is required."),
  nonGasProperty: z.boolean().nullable().default(null).describe("Non-gas property field is required."),
  Insurer: z.string().nullable().default(null).describe("Insurer information is required."),

  photographs: z.array(
    z.string().regex(/^data:image\/[a-zA-Z+]+;base64,/, {
      message: "Only valid image files in Base64 format are allowed.",
    }),
    { required_error: "At least one photograph is required." }
  ),
  floorPlans: z.array(
    z.string().regex(/^data:image\/[a-zA-Z+]+;base64,/, {
      message: "Only valid floor plan images in Base64 format are allowed.",
    }),
    { required_error: "At least one floor plan is required." }
  ),

  epcChartOption: z.enum(["ratings", "upload"], {
    required_error: "EPC Chart Option is required.",
  }),
  currentEERating: z.string().optional(),
  potentialEERating: z.string().optional(),
  epcChartFile: z.any().optional(),

  epcReportOption: z.enum(["uploadReport", "urlReport"], {
    required_error: "EPC Report Option is required.",
  }),
  epcReportFile: z.any().optional(),
  epcReportURL: z.string().url().optional(),

  videoTourDescription: z.string().optional(),
  showOnWebsite: z.boolean({ required_error: "Show on website field is required." }),

  publishOnWeb: z.string().nullable().default(null).describe("Publish on web is required."),
  status: z.string().nullable().default(null).describe("Status is required."),
  detailPageUrl: z.string().nullable().default(null).describe("Detail page URL is required."),
  publishOnPortals: z.string().nullable().default(null).describe("Publish on portals field is required."),
  portalStatus: z.string().nullable().default(null).describe("Portal status is required."),
  forA: z.string().nullable().default(null).describe("ForA field is required."),
  propertyTypeA: z.string().nullable().default(null).describe("Property type A is required."),
  newHome: z.boolean().nullable().default(null).describe("New home field is required."),
  offPlan: z.boolean().nullable().default(null).describe("Off-plan field is required."),
  virtualTour: z.string().nullable().default(null).describe("Virtual tour is required."),
  enterUrl: z.string().nullable().default(null).describe("Enter URL for virtual tour is required."),
  virtualTour2: z.string().nullable().default(null).describe("Second virtual tour is required."),
  enterUrl2: z.string().nullable().default(null).describe("Enter URL for second virtual tour is required."),
  propertyBrochureUrl: z.string().nullable().default(null).describe("Property brochure URL is required."),
  AdminFee: z.string().nullable().default(null).describe("Admin fee is required."),
  ServiceCharges: z.string().nullable().default(null).describe("Service charges are required."),
  minimumTermForLet: z.string().nullable().default(null).describe("Minimum term for let is required."),
  annualGroundRent: z.string().nullable().default(null).describe("Annual ground rent is required."),
  lengthOfLease: z.string().nullable().default(null).describe("Length of lease is required."),
  shortSummaryForPortals: z.string().nullable().default(null).describe("Short summary for portals is required."),
  fullDescriptionforPortals: z.string().nullable().default(null).describe("Full description for portals is required."),
  sendToBoomin: z.boolean().nullable().default(false),
  sendToRightmoveNow: z.boolean().nullable().default(false),
  CustomDisplayAddress: z.string().nullable().default(null).describe("Custom display address is required."),
  transactionType: z.string().nullable().default(null).describe("Transaction type is required."),
  sendToOnTheMarket: z.boolean().nullable().default(false),
  newsAndExclusive: z.boolean().nullable().default(false),
  selectPortals: z.array(z.string()).optional().or(z.string().transform(val => val ? [val] : [])).default([]),
  vendor: z.string().nullable(),
  rooms: z.array(roomSchema).optional(),
  portalList: z.any(),
  attachments: z.array(
    z.string().regex(/^data:image\/[a-zA-Z+]+;base64,/, {
      message: "Only valid image files in Base64 format are allowed.",
    })
  ),
  propertyStatus: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT").optional(),
});

