# Build a Next.js Invoice Parser Frontend

### Background

This frontend project is built on top of an existing backend solution developed in a previous assignment.

The backend exposes a REST API for invoice parsing and data retrieval, including endpoints for:

- Uploading invoice files and extracting invoice data
- Retrieving invoice details by invoice ID
- Querying invoices by vendor name

Before starting the frontend implementation, the backend solution was fully implemented, tested, and validated.
The goal of this project is to create a user-friendly and well-designed frontend that consumes these existing endpoints
without modifying the backend logic.

## Project Overview

Build a modern, well-styled Next.js application that serves as a frontend for an Invoice Parser API.
The application should allow users to upload invoice documents, view extracted details, and browse invoices with a clean UI and great UX.

## API Endpoint

The backend API is available at: `http://localhost:8080`

Current available endpoints:

- POST `/extract` - Upload an invoice file (multipart/form-data) and extract invoice details
- GET `/invoice/{invoice_id}` – Get details of a specific invoice by invoice ID

- GET `/invoices/vendor/{vendor_name} ` - Get invoices filtered by vendor name

Note: There is no GET /invoices endpoint.
The /invoices page will be implemented using:

- Local history (saved invoice IDs + metadata in localStorage after upload)
- Vendor search via /invoices/vendor/{vendor_name}.

## Technical Requirements

### Framework & Setup

- Use **Next.js** with App Router
- Use **TypeScript** for type safety
- Use **Tailwind CSS** for styling
- Use some UI library for components
- Use .env.local for configuration:
  NEXT_PUBLIC_API_BASE=http://localhost:8080

### Pages & Navigation (Multi-Page Application)

Create the following pages with proper routing:

1. **Login Page** (`/login`)

   - Simple form with username and password fields
   - Dummy authentication: username: `admin`, password: `admin`
   - Store auth state in localStorage or session
   - Redirect to dashboard on successful login
   - **No real backend authentication needed** - this is just for UI testing demonstration
   - Show a clear error message on invalid login
   - Include a Logout button in the app layout

2. **Dashboard** (`/dashboard`)

   - Overview with statistics cards (based on local history):
     - total uploaded invoices
     - recent uploads (last 5)
     - unique vendor count
   - Quick actions section:
     - Upload invoice
     - View invoices
   - Navigation menu to other pages

3. **Upload Invoice Page** (`/upload`)

   - File upload area with drag-and-drop support
   - File format validation:
     - PDF + images (png/jpg/jpeg/webp)
     - Show UI error on invalid file type
   - Upload progress indicator with loading spinner (or loading state)
   - Success/error notifications (toast/alert)
   - After success:
     - Show extracted JSON result
     - Save invoice metadata to localStorage:
       - { id, vendor, fileName, uploadedAt }
   - Provide a button: Open Invoice Details (/invoice/[id])

4. **Invoices List Page** (`/invoices`)

   - Table/grid view of invoices
   - Data sources:
     - Local history (invoices stored in localStorage after upload)
     - Vendor-based search using `GET /invoices/vendor/{vendor_name}`
   - Displayed columns:
     - Invoice ID
     - Vendor name
     - File name
     - Uploaded date/time
     - Action: “View Details”
   - Filtering options:
     - Vendor name
   - Sorting capabilities:
     - Invoice ID
     - Vendor name
     - Uploaded date
   - Pagination or infinite scroll (client-side)
   - Clicking an invoice navigates to the invoice details page (`/invoice/[id]`)

5. **Invoice Details Page** (`/invoice/[id]`)

   - Fetch invoice details via GET /invoice/{invoice_id}
   - Display extracted invoice information in a clean layout
   - Editable fields with form validation (UI demo):
     - vendor name
     - invoice number
     - invoice date
     - invoice total (must be numeric)
   - Save button:
     - UI-only (no backend update endpoint provided)
     - Can save temporary edits in local state or localStorage
   - Download option:
     - Print view (window.print) OR download JSON
   - Back navigation to invoices list

### Styling Guidelines

- Clean and modern UI
- Centered container (`max-w-6xl mx-auto`)
- Card-based layout for main sections (Dashboard cards, Upload panel, Details panel)
- Consistent spacing (padding and margins) and clear typography hierarchy
- Styled tables with header background, row hover effects, and aligned columns

- Loading states:

  - Spinner or skeleton loaders

- Error and success states:

  - Red for errors
  - Green for success

- Responsive design:

  - Works well on desktop and mobile devices

- Optional enhancements:
  - Dark mode toggle
  - Toast notifications
  - Skeleton loaders
  - Empty state messages (e.g. “No invoices yet → Upload now”)
