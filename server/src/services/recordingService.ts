import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Pool } from 'pg';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

class RecordingService {
  private s3Client: S3Client;
  private db: Pool;
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private readonly RETENTION_DAYS = 30; // Default retention period

  constructor(db: Pool) {
    this.db = db;
    this.s3Client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!
      },
      forcePathStyle: true
    });

    // Start retention cleanup job
    this.startRetentionCleanup();
  }

  async storeRecording(
    sessionId: string,
    recordingData: Buffer,
    recordingType: 'video' | 'screen' | 'both',
    userId: string
  ): Promise<string> {
    // Generate encryption key and IV
    const key = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    const authTag = cipher.getAuthTag();

    // Encrypt recording
    const encryptedData = Buffer.concat([
      cipher.update(recordingData),
      cipher.final()
    ]);

    const filename = `${sessionId}/${Date.now()}_${recordingType}.webm.enc`;

    // Store encrypted recording
    await this.s3Client.send(new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: filename,
      Body: encryptedData,
      Metadata: {
        'x-amz-iv': iv.toString('hex'),
        'x-amz-key': key.toString('hex'),
        'x-amz-auth-tag': authTag.toString('hex'),
        'x-amz-type': recordingType
      }
    }));

    // Store recording metadata in database
    const query = `
      INSERT INTO recordings (
        session_id,
        storage_path,
        recording_type,
        file_size,
        encrypted
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await this.db.query(query, [
      sessionId,
      filename,
      recordingType,
      encryptedData.length,
      true
    ]);

    // Log access
    await this.logAccess(result.rows[0].id, userId, 'create');

    return filename;
  }

  async getRecording(
    recordingId: string,
    userId: string
  ): Promise<{ data: Buffer; mimeType: string }> {
    // Check access permission
    const hasAccess = await this.checkAccess(recordingId, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Get recording metadata
    const query = `
      SELECT storage_path, recording_type
      FROM recordings
      WHERE id = $1
    `;
    const result = await this.db.query(query, [recordingId]);
    if (result.rows.length === 0) {
      throw new Error('Recording not found');
    }

    const { storage_path: storagePath } = result.rows[0];

    // Get encrypted recording from S3
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: storagePath
    }));

    if (!response.Body) {
      throw new Error('Failed to retrieve recording');
    }

    // Get encryption metadata
    const iv = Buffer.from(response.Metadata!['x-amz-iv'], 'hex');
    const key = Buffer.from(response.Metadata!['x-amz-key'], 'hex');
    const authTag = Buffer.from(response.Metadata!['x-amz-auth-tag'], 'hex');

    // Create decipher
    const decipher = createDecipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Get the encrypted data as buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const encryptedData = Buffer.concat(chunks);

    // Decrypt the data
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    // Log access
    await this.logAccess(recordingId, userId, 'view');

    return {
      data: decryptedData,
      mimeType: 'video/webm'
    };
  }

  async deleteRecording(recordingId: string, userId: string): Promise<void> {
    // Check access permission
    const hasAccess = await this.checkAccess(recordingId, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Get storage path
    const query = `
      SELECT storage_path
      FROM recordings
      WHERE id = $1
    `;
    const result = await this.db.query(query, [recordingId]);
    if (result.rows.length === 0) {
      throw new Error('Recording not found');
    }

    const { storage_path: storagePath } = result.rows[0];

    // Delete from S3
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.MINIO_BUCKET_NAME,
      Key: storagePath
    }));

    // Delete from database
    await this.db.query('DELETE FROM recordings WHERE id = $1', [recordingId]);

    // Log deletion
    await this.logAccess(recordingId, userId, 'delete');
  }

  private async checkAccess(recordingId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT s.counselor_id, s.client_id
      FROM recordings r
      JOIN sessions s ON r.session_id = s.id
      WHERE r.id = $1
    `;
    const result = await this.db.query(query, [recordingId]);
    if (result.rows.length === 0) return false;

    const { counselor_id, client_id } = result.rows[0];
    return userId === counselor_id || userId === client_id;
  }

  private async logAccess(
    recordingId: string,
    userId: string,
    accessType: 'view' | 'create' | 'delete',
    ipAddress?: string
  ): Promise<void> {
    const query = `
      INSERT INTO recording_access_logs (
        recording_id,
        user_id,
        access_type,
        ip_address
      ) VALUES ($1, $2, $3, $4)
    `;
    await this.db.query(query, [recordingId, userId, accessType, ipAddress]);
  }

  private async startRetentionCleanup(): Promise<void> {
    setInterval(async () => {
      try {
        // Get recordings past retention period
        const query = `
          SELECT id, storage_path
          FROM recordings
          WHERE created_at < NOW() - INTERVAL '${this.RETENTION_DAYS} days'
        `;
        const result = await this.db.query(query);

        // Delete each recording
        for (const row of result.rows) {
          await this.s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.MINIO_BUCKET_NAME,
            Key: row.storage_path
          }));
          await this.db.query('DELETE FROM recordings WHERE id = $1', [row.id]);
        }
      } catch (error) {
        console.error('Error in retention cleanup:', error);
      }
    }, 24 * 60 * 60 * 1000); // Run daily
  }
}

export default RecordingService; 