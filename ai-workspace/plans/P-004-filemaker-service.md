# Implementation Plan: P-004-filemaker-service

Linked Ticket: T-004-filemaker-service

## Strategy
We will create a centralized abstraction layer in a new `services` directory. The file `services/filemakerService.ts` will encapsulate all logic needed to interact with the FileMaker 19+ Data API. 

The service must manage FileMaker data session tokens internally. It will request a token via basic authentication when necessary and **cache the token in memory** to avoid repeated authentication calls. It will only request a new token if the cached token expires or returns an unauthorized error during subsequent `find` requests. 

## Environment Configuration
The service will utilize non-hardcoded environment variables for server credentials:
- `FILEMAKER_HOST`
- `FILEMAKER_DATABASE`
- `FILEMAKER_API_USERNAME`
- `process.env.FILEMAKER_API_PASSWORD`

These will be documented in a new `.env.example` file.

Layout names will **not** be stored in `.env`. Instead, they will be mapped in a centralized code configuration file.

## Implementation Steps

1. **Establish Configuration**:
   - Create an `.env.example` file defining required connection variables.
   - Create `config/filemaker.ts` exporting a `FILEMAKER_LAYOUTS` constant object containing layout names (e.g., `vendors`, `purchaseOrders`).
2. **Establish File Structure**: Create the `services/` folder and `filemakerService.ts` file in the project root.
3. **Setup Types and Constants**: 
   - Define TypeScript interfaces bridging the expected FileMaker responses.
   - Load environment configurations safely, and import the `FILEMAKER_LAYOUTS` configuration.
3. **Core API Base Functions**:
   - Implement an internal `getAuthToken()` method to handle the FileMaker Data API session login `POST /fmi/data/vLatest/databases/{db}/sessions`.
   - Implement a mechanism to **cache the session token** within the `FileMakerService` instance (or at the module scope).
   - Implement an internal `fetchFM()` generic wrapper to automatically inject the cached bearer token and handle token expiration/retries (transparently calling `getAuthToken` if a 401 is encountered).
4. **Implement Required Business Methods**:
   - `findVendorByCredentials(email, password)`: Executes a `_find` payload against the vendor layout.
   - `getVendorDetails(vendorId)`: Executes a `_find` by Record ID or primary key.
   - `getVendorPOs(vendorId)`: Executes a `_find` on a related purchases layout (assuming a parameter layout exists, or will mock the structure).
5. **Prepare Tests**:
   - Draft `TEST-004` to document how unit tests or dry-run scripts can verify the service logic independently.

## Files Expected To Change
- `services/filemakerService.ts` (NEW)
- `config/filemaker.ts` (NEW)
- `.env.example` (NEW)
