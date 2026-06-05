import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for our app, handling various file types including audio and general attachments.
export const ourFileRouter = {
  taskAttachment: f({
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    text: { maxFileSize: "16MB", maxFileCount: 10 },
    audio: { maxFileSize: "16MB", maxFileCount: 10 },
    video: { maxFileSize: "16MB", maxFileCount: 10 },
    blob: { maxFileSize: "16MB", maxFileCount: 10 },
  })
    .onUploadComplete(async ({ file }) => {
      console.log("UploadThing upload completed:", file.url);
      return { uploadedBy: "System" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
