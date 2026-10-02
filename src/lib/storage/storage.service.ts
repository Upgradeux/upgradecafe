import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StorageConfig {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName: string;
  publicUrl?: string;
}

export class StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;

  constructor(config?: Partial<StorageConfig>) {
    const accountId = config?.accountId || process.env.R2_ACCOUNT_ID;
    const accessKeyId = config?.accessKeyId || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = config?.secretAccessKey || process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = config?.bucketName || process.env.R2_BUCKET_NAME || "upgradecafe-assets";
    this.publicUrl = config?.publicUrl || process.env.R2_PUBLIC_URL || "https://assets.upgradecafe.com";

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  /**
   * Generates a safe, tenant-isolated key
   */
  public generateKey(
    cafeId: string,
    category: "logo" | "cover" | "menu" | "files",
    fileExtension: string = "webp"
  ): string {
    const uuid = crypto.randomUUID();
    const cleanExt = fileExtension.replace(/^\./, "").toLowerCase();
    return `cafes/${cafeId}/${category}/${uuid}.${cleanExt}`;
  }

  /**
   * Creates a presigned PUT URL for direct browser-to-R2 upload
   */
  public async createSignedUploadUrl(
    key: string,
    contentType: string = "image/webp",
    expiresInSeconds: number = 300
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    if (!this.s3Client) {
      // Local fallback / mock response if credentials not configured yet
      return {
        uploadUrl: `http://localhost:3000/api/mock-upload?key=${encodeURIComponent(key)}`,
        key,
        publicUrl: `${this.publicUrl}/${key}`,
      };
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      uploadUrl,
      key,
      publicUrl: this.getPublicUrl(key),
    };
  }

  /**
   * Creates a signed GET URL for temporary private download
   */
  public async createSignedDownloadUrl(
    key: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
    if (!this.s3Client) {
      return `${this.publicUrl}/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  /**
   * Resolves the permanent public CDN URL for an asset
   */
  public getPublicUrl(key: string): string {
    return `${this.publicUrl.replace(/\/$/, "")}/${key}`;
  }

  /**
   * Deletes an asset from Cloudflare R2
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.s3Client) {
      return true;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (err) {
      console.error(`Failed to delete asset with key ${key}:`, err);
      return false;
    }
  }
}

export const storageService = new StorageService();
