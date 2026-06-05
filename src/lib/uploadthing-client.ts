import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/lib/uploadthing";

// Generates client-side upload helpers connected to our backend FileRouter
export const { uploadFiles } = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
});
