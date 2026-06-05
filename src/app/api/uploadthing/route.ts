import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

export const runtime = "nodejs";

// Export GET and POST handlers for UploadThing API
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
