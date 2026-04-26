export const STEP_LABELS = [
  "Standard Info",
  "Description",
  "More Info",
  "Photos/Floor/FPC Plan",
  "Attachments",
  "Publish",
] as const;

export const STEP_FIELDS: string[][] = [
  ['for','category','propertyType','internalReference','price','priceQualifier','tenure','contractType','salesFee','postCode','propertyNo','propertyName','addressLine1','addressLine2','town','county','country','latitude','longitude','development','yearOfBuild','parking','garden','livingFloorSpace','meetingRooms','workStation','landSize','outBuildings','propertyFeature','Tags'],
  ['shortSummary','fullDescription','rooms'],
  ['Solicitor','GuaranteedRentLandlord','Branch','Negotiator','whodoesviewings','comments','sva','tenureA','customGarden','customParking','pets','train','occupant','occupantEmail','occupantMobile','council','councilBrand','freeholder','freeholderContract','freeholderAddress','nonGasProperty','Insurer'],
  ['photographs','floorPlans','epcChartOption','currentEERating','potentialEERating','epcChartFile','epcReportOption','epcReportFile','epcReportURL','videoTourDescription','showOnWebsite'],
  ['attachments'],
  ['publishOnWeb','status','detailPageUrl','publishOnPortals','portalStatus','forA','propertyTypeA','newHome','offPlan','virtualTour','enterUrl','virtualTour2','propertyBrochureUrl','AdminFee','ServiceCharges','minimumTermForLet','annualGroundRent','lengthOfLease','shortSummaryForPortals','fullDescriptionforPortals','sendToBoomin','sendToRightmoveNow','CustomDisplayAddress','transactionType','sendToOnTheMarket','newsAndExclusive','selectPortals'],
];
