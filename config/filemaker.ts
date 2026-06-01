/**
 * Centralized mapping of FileMaker layouts used by the Data API.
 * 
 * Never expose this configuration file to the client browser.
 * These layout names correspond exactly to the layout names on the FileMaker Server.
 */

export const FILEMAKER_LAYOUTS = {
  vendors: "Web_Contacts",
  purchaseOrders: "Web_PO",
  lineItems: "Web_MLI",
  documents: "",
};
