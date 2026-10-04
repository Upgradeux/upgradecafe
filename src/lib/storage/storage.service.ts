import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "@/lib/errors/app-error";

export interface StorageConfig {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  publicUrl?: string;
}

const ALLOWED_CATEGORIES = ["logo", "cover", "menu", "files"] as const;
export type StorageCategory = (typeof ALLOWED_CATEGORIES)[number];

export class StorageService {
  private s3Client: S3Client | null = null;
  private readonly accountId: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(config: StorageConfig = {}) {
    this.accountId = config.accountId ?? process.env.R2_ACCOUNT_ID ?? "";
    this.accessKeyId = config.accessKeyId ?? process.env.R2_ACCESS_KEY_ID ?? "";
    this.secretAccessKey = config.secretAccessKey ?? process.env.R2_SECRET_ACCESS_KEY ?? "";
    this.bucketName = config.bucketName ?? process.env.R2_BUCKET_NAME ?? "";
    this.publicUrl = (config.publicUrl ?? process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  }

  public get isConfigured(): boolean {
    return Boolean(
      this.accountId &&
        this.accessKeyId &&
        this.secretAccessKey &&
        this.bucketName &&
        this.publicUrl
    );
  }

  public assertConfigured(): void {
    if (!this.isConfigured) {
      throw new AppError({
        code: "INTERNAL_ERROR",
        statusCode: 503,
        message: "Image storage is not configured. Set the Cloudflare R2 environment variables before uploading.",
      });
    }
  }

  private getClient(): S3Client {
    if (this.s3Client) return this.s3Client;
    if (!this.accountId || !this.accessKeyId || !this.secretAccessKey || !this.bucketName) {
      throw new Error(
        "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME."
      );
    }

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
    return this.s3Client;
  }

  public generateKey(
    cafeId: string,
    category: StorageCategory,
    fileExtension = "webp"
  ): string {
    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new Error("Unsupported storage category.");
    }
    const safeCafeId = cafeId.replace(/[^a-zA-Z0-9_-]/g, "");
    const safeExtension = fileExtension.replace(/^\./, "").toLowerCase();
    if (!safeCafeId || !/^[a-z0-9]{1,10}$/.test(safeExtension)) {
      throw new Error("Invalid storage key details.");
    }
    return `cafes/${safeCafeId}/${category}/${crypto.randomUUID()}.${safeExtension}`;
  }

  public async upload(
    key: string,
    body: Uint8Array,
    contentType: string
  ): Promise<{ key: string; publicUrl: string }> {
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return { key, publicUrl: this.getPublicUrl(key) };
  }

  public async createSignedUploadUrl(
    key: string,
    contentType = "image/webp",
    expiresInSeconds = 300
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const uploadUrl = await getSignedUrl(
      this.getClient(),
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: expiresInSeconds }
    );

    return { uploadUrl, key, publicUrl: this.getPublicUrl(key) };
  }

  public async createSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.getClient(),
      new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
      { expiresIn: expiresInSeconds }
    );
  }

  public getPublicUrl(key: string): string {
    if (!this.publicUrl) {
      throw new Error("Set R2_PUBLIC_URL to the public domain configured for your R2 bucket.");
    }
    return `${this.publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  public async delete(key: string): Promise<boolean> {
    await this.getClient().send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: key })
    );
    return true;
  }
}

export const storageService = new StorageService();
