import { NextResponse } from "next/server"
import { uploadImageToCloudinary } from "@/lib/server/cloudinary"

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const folder = formData.get("folder")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploaded = await uploadImageToCloudinary(buffer, {
      folder: typeof folder === "string" && folder.trim() ? folder : "pfe-csf",
    })

    return NextResponse.json(
      {
        imageUrl: uploaded.secureUrl,
        publicId: uploaded.publicId,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Cloudinary upload failed:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
